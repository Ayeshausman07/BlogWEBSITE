import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, getDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
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


// 🚀 **Form Submission for Blog**
const blogForm = document.getElementById('blogForm');
if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert("⚠️ Please login to add a blog.");
            return;
        }

        const formData = new FormData();
        const imageFile = document.getElementById('blogImage').files[0];
        formData.append('file', imageFile);
        formData.append('upload_preset', 'recipe_app');

        try {
            const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/doaeeevvi/image/upload', formData);

            
            const tagsInput = document.getElementById('blogTags').value; // Assuming input field ID is 'blogTags'
            const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
           
            const blogData = {
                title: document.getElementById('blogTitle').value,
                author: document.getElementById('blogAuthor').value,
                content: document.getElementById('blogContent').value,
                imageUrl: uploadRes.data.secure_url,
                authorId: currentUser.uid,
                createdAt: new Date(),
                category: document.getElementById('customCategoryInput').value.trim() || document.getElementById('blogCategory').value,
                tags: tagsArray
            };

            if (editingBlogId) {
                const blogRef = doc(db, 'blogs', editingBlogId);
                const blogSnap = await getDoc(blogRef);

                if (blogSnap.exists() && blogSnap.data().authorId === currentUser.uid) {
                    await updateDoc(blogRef, blogData);
                    alert("✅ Blog updated successfully!");
                } else {
                    alert("❌ You can only edit your own blogs!");
                }

                editingBlogId = null;
            } else {
                await addDoc(collection(db, 'blogs'), blogData);
                alert("✅ Blog added successfully!");
            }

            renderBlogs();
            blogForm.reset();
        } catch (error) {
            console.error('❌ Error:', error);
            alert("⚠️ An error occurred while adding the blog.");
        }
    });
}

// 🚀 **Fetch and Render Only User's Blogs**
async function renderBlogs() {
    if (!currentUser) return;

    const userBlogsQuery = query(collection(db, 'blogs'), where("authorId", "==", currentUser.uid));
    const querySnapshot = await getDocs(userBlogsQuery);

    const blogContainer = document.getElementById('blogContainer');
    if (blogContainer) {
        blogContainer.innerHTML = '';

        querySnapshot.forEach(docSnap => {
            const blog = { id: docSnap.id, ...docSnap.data() };
            renderBlog(blog);
        });
    }
}

// 🚀 **Display a Blog in UI**
function renderBlog(blog) {
    const blogContainer = document.getElementById('blogContainer');
    if (!blogContainer) return;

    const card = document.createElement('div');
    card.className = 'col-md-6';
    card.innerHTML = `
    <div class="card blog-card h-100 shadow-lg border-0 rounded-4 p-3 blog-hover " data-id="${blog.id}">
      <img src="${blog.imageUrl || 'default-image.jpg'}" class="card-img-top blog-img">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${blog.title}</h5>
        <p class="text-muted">By ${blog.author || 'Unknown'}</p>
        <p class="small text-secondary">${blog.publishDate || new Date().toLocaleDateString()}</p>
        <span class="badge bg-success">${blog.readTime || '2 min read'}</span>
        <div class="mt-2">
          ${
            Array.isArray(blog.tags)
              ? blog.tags.map(tag => `<span class="badge bg-warning text-dark me-1">#${tag.trim()}</span>`).join(' ')
              : typeof blog.tags === 'string'
              ? blog.tags.split(',').map(tag => `<span class="badge bg-warning text-dark me-1">#${tag.trim()}</span>`).join(' ')
              : ''
          }
        </div>
        <p class="small text-dark mt-2">✨ Discover the secrets of deliciousness! ✨</p>
        <button class="btn btn-outline-info mt-2" onclick="showBlogDetails('${blog.id}')">
          <i class="fas fa-eye me-2"></i>View Details
        </button>
        ${blog.authorId === currentUser.uid ? `
          <button class="btn edit-btn mt-2" onclick="editBlog('${blog.id}')">
            <i class="fas fa-edit me-2"></i>Edit Blog
          </button>
          <button class="btn btn-danger mt-2" onclick="deleteBlog('${blog.id}')">
            <i class="fas fa-trash me-2"></i>Delete
          </button>
        ` : ''}
      </div>
    </div>
  `;

    blogContainer.appendChild(card);
}

// 🚀 **Edit Blog**
window.editBlog = async (blogId) => {
    const blogRef = doc(db, 'blogs', blogId);
    const blogDoc = await getDoc(blogRef);

    if (blogDoc.exists() && blogDoc.data().authorId === currentUser.uid) {
        const blog = blogDoc.data();
        document.getElementById('blogTitle').value = blog.title;
        document.getElementById('blogAuthor').value = blog.author;
        document.getElementById('blogContent').value = blog.content;
        editingBlogId = blogId;
    } else {
        alert("❌ You can only edit your own blogs!");
    }
};

// 🚀 **Delete Blog**
window.deleteBlog = async (blogId) => {
    const blogRef = doc(db, 'blogs', blogId);
    const blogDoc = await getDoc(blogRef);

    if (blogDoc.exists() && blogDoc.data().authorId === currentUser.uid) {
        if (confirm("🗑️ Are you sure you want to delete this blog?")) {
            await deleteDoc(blogRef);
            alert("✅ Blog deleted successfully!");
            renderBlogs();
        }
    } else {
        alert("❌ You can only delete your own blogs!");
    }
};

// 🚀 **Auth State Listener**
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ Logged in as:", user.email);
        renderBlogs();
    } else {
        console.log("❌ No user logged in.");
        currentUser = null;
        const blogContainer = document.getElementById('blogContainer');
        if (blogContainer) {
            blogContainer.innerHTML = `<p class="text-center text-danger">⚠️ Please login to view your blogs.</p>`;
        }
    }
});

// 🚀 **Show Blog Details**
window.showBlogDetails = async (blogId) => {
    try {
        console.log("🔍 Fetching Blog Details for ID:", blogId);

        if (!blogId) {
            console.error("❌ Invalid Blog ID:", blogId);
            alert("⚠️ Invalid Blog ID!");
            return;
        }

        const blogRef = doc(db, "blogs", blogId);
        const blogSnap = await getDoc(blogRef);

        console.log("📄 Firestore Document Snapshot:", blogSnap);

        if (!blogSnap.exists()) {
            console.warn("⚠️ Blog not found in Firestore for ID:", blogId);
            alert("⚠️ Blog not found!");
            return;
        }

        const blog = blogSnap.data();
        console.log("📌 Blog Data:", blog);

        const modalBlogTitle = document.getElementById("modalBlogTitle");
        const modalBlogImage = document.getElementById("modalBlogImage");
        const modalAuthor = document.getElementById("modalAuthor");
        const modalDate = document.getElementById("modalDate");
        const modalShortDescription = document.getElementById("modalShortDescription");
        const modalReadTime = document.getElementById("modalReadTime");
        const readMoreBtn = document.getElementById("readMoreBtn");

        if (modalBlogTitle) modalBlogTitle.textContent = blog.title || "Untitled Blog";
        if (modalBlogImage) modalBlogImage.src = blog.imageUrl || "https://via.placeholder.com/800x400?text=No+Image";
        if (modalAuthor) modalAuthor.textContent = `By ${blog.author || "Anonymous"}`;
        if (modalDate) modalDate.textContent = `Published on: ${blog.publishDate || new Date().toDateString()}`;
        if (modalShortDescription) modalShortDescription.textContent = blog.content ? blog.content.substring(0, 200) + "..." : "No description available.";
        if (modalReadTime) modalReadTime.textContent = `📖 Read Time: ${blog.readTime || "2 min"} mins`;
        if (readMoreBtn) readMoreBtn.href = `blog-details.html?blogId=${blogId}`;

        const modal = new bootstrap.Modal(document.getElementById("blogModal"));
        modal.show();

    } catch (error) {
        console.error("❌ Error loading blog details:", error);
        alert("⚠️ Error loading blog details.");
    }
};

// 🚀 **Preview Blog Function**
function previewBlog() {
    console.log('Previewing blog...');
    // Add your preview logic here
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Fully Loaded! Ready to run JavaScript.");
});



