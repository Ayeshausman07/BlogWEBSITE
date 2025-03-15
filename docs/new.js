import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// ✅ Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbk_u3KmsTa_et45ZhPhOZgqlqrzYE0y4",
    authDomain: "blogsweb-ec131.firebaseapp.com",
    projectId: "blogsweb-ec131",
    storageBucket: "blogsweb-ec131.appspot.com",
    messagingSenderId: "370936332298",
    appId: "1:370936332298:web:8ca8aa499bb34afbc59ff3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let editingBlogId = null;

// ✅ User Login Check
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ User logged in:", user.email);
        document.getElementById('userEmailDisplay').textContent = user.email;
        renderBlogs(); // Login hone ke baad blogs show karna
    } else {
        console.warn("❌ No user logged in!");
        currentUser = null;
        document.getElementById('userEmailDisplay').textContent = "Not logged in";
    }
});

// ✅ Blog Form Submit Handler
// document.getElementById('blogForm').addEventListener('submit', async (e) => {
//     e.preventDefault();

//     if (!currentUser) {
//         alert("⚠️ Please login to add a blog.");
//         return;
//     }

//     const title = document.getElementById('blogTitle').value.trim() || 'Untitled Blog';
//     const author = document.getElementById('blogAuthor').value.trim() || 'Anonymous';
//     const content = document.getElementById('blogContent').value.trim() || 'No content provided.';
//     const tags = document.getElementById('blogTags')?.value.trim() || 'General';
//     const publishDate = document.getElementById('publishDate')?.value || new Date().toISOString().split('T')[0];

//     const imageFile = document.getElementById('blogImage').files[0];
//     if (!imageFile) {
//         alert("⚠️ Please upload an image!");
//         return;
//     }

//     try {
//         // ✅ Upload Image to Cloudinary
//         const formData = new FormData();
//         formData.append('file', imageFile);
//         formData.append('upload_preset', 'recipe_app');

//         const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/doaeeevvi/image/upload', formData);
//         const imageUrl = uploadRes.data.secure_url || 'default-image.jpg';

//         const blogData = {
//             title,
//             author,
//             content,
//             imageUrl,
//             authorId: currentUser.uid,
//             createdAt: new Date().toISOString(),
//             tags,
//             publishDate,
//             readTime: calculateReadTime(content),
//             views: 0,
//             likes: 0,
//             comments: []
//         };

//         if (editingBlogId) {
//             await updateDoc(doc(db, 'blogs', editingBlogId), blogData);
//             editingBlogId = null;
//             alert("✅ Blog updated successfully!");
//         } else {
//             await addDoc(collection(db, 'blogs'), blogData);
//             alert("🎉 Blog added successfully!");
//         }

//         renderBlogs(); // Blogs ko refresh karna
//         document.getElementById('blogForm').reset();
//     } catch (error) {
//         console.error('❌ Error:', error);
//         alert("⚠️ An error occurred while adding the blog.");
//     }
// });

// ✅ Blog Form Submit Handler
document.getElementById('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("⚠️ Please login to add a blog.");
        return;
    }

    const title = document.getElementById('blogTitle').value.trim();
    const author = document.getElementById('blogAuthor').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const tags = document.getElementById('blogTags').value.trim();
    const publishDate = document.getElementById('publishDate').value;
    const slug = title.toLowerCase().replace(/\s+/g, '-');

    const imageFile = document.getElementById('blogImage').files[0];
    if (!imageFile) {
        alert("⚠️ Please upload an image!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'recipe_app');
        const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/doaeeevvi/image/upload', formData);
        const imageUrl = uploadRes.data.secure_url;

        const blogData = {
            title,
            author,
            content,
            imageUrl,
            authorId: currentUser.uid,
            createdAt: new Date().toISOString(),
            tags,
            publishDate,
            slug,
            readTime: calculateReadTime(content),
            views: 0,
            likes: 0,
            comments: []
        };

        if (editingBlogId) {
            await updateDoc(doc(db, 'blogs', editingBlogId), blogData);
            editingBlogId = null;
            alert("✅ Blog updated successfully!");
        } else {
            await addDoc(collection(db, 'blogs'), blogData);
            alert("🎉 Blog added successfully!");
        }

        renderBlogs();
        document.getElementById('blogForm').reset();
    } catch (error) {
        alert("⚠️ Error while adding the blog.");
    }
});


// ✅ Blogs ko Firestore se Fetch karna aur Render karna
async function renderBlogs() {
    if (!currentUser) return;

    const querySnapshot = await getDocs(collection(db, 'blogs'));
    const blogContainer = document.getElementById('blogContainer');
    blogContainer.innerHTML = '';

    querySnapshot.forEach(docSnap => {
        const blogData = docSnap.data();
        if (!blogData) {
            console.error("❌ Error: Blog data is undefined for doc:", docSnap.id);
            return;
        }

        const blog = { id: docSnap.id, ...blogData };
        renderBlog(blog);
    });
}

/// ✅ Blog Card Render Function
function renderBlog(blog) {
    if (!blog.id) {
        console.error("❌ Error: Blog ID is missing", blog);
        return;
    }

    const card = document.createElement('div');
    card.className = 'col-md-6';
    card.innerHTML = `
    <div class="card blog-card h-100 shadow-lg border-0 rounded-4 p-3 blog-hover" data-id="${blog.id}">
      <img src="${blog.imageUrl || 'default-image.jpg'}" class="card-img-top blog-img">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${blog.title}</h5>
        <p class="text-muted">By ${blog.author || 'Unknown'}</p>
        <p class="small text-secondary">${blog.publishDate || new Date().toLocaleDateString()}</p>
        <span class="badge bg-success">${blog.readTime || '2 min read'}</span>
        <p class="small text-dark mt-2">✨ Discover the secrets of deliciousness! ✨</p>
        <button class="btn btn-outline-info mt-2" onclick="showBlogDetails('${blog.id}')">
          <i class="fas fa-eye me-2"></i>View Details
        </button>
      </div>
    </div>
    `;

    document.getElementById('blogContainer').appendChild(card);
}

// ✅ Blog Details Modal
window.showBlogDetails = async (blogId) => {
    const blogRef = doc(db, 'blogs', blogId);
    const blogSnap = await getDoc(blogRef);

    if (!blogSnap.exists()) {
        alert("⚠️ Blog not found!");
        return;
    }

    const blog = blogSnap.data();
    document.getElementById('modalBlogTitle').textContent = blog.title || 'Untitled Blog';
    document.getElementById('modalBlogImage').src = blog.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image';
    document.getElementById('modalShortDescription').textContent = blog.content ? blog.content.substring(0, 200) + '...' : 'No description available.';
    
    // 🔥 Fixed Syntax Here
    document.getElementById('modalAuthor').textContent = `By ${blog.author || 'Anonymous'}`;
    document.getElementById('modalDate').textContent = `Published on: ${blog.publishDate || new Date().toDateString()}`;

    const modal = new bootstrap.Modal(document.getElementById('blogModal'));
    modal.show();
};

// ✅ Function to calculate read time
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute); 
}
