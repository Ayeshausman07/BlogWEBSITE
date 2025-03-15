import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

const placeholderTexts = [
    "Dive into this exciting read and explore new ideas!",
    "A fascinating take on this topic—don’t miss out!",
    "Get inspired with insights and stories from experts.",
    "An informative and engaging blog just for you!",
    "Explore something new today with this amazing article!",
    "Click to uncover valuable tips and expert opinions!"
];

// Ensure skeleton exists
function getLoadingSkeleton() {
    return `
        <div class="col">
            <div class="card h-100">
                <div class="card-img-top bg-light placeholder-glow" style="height: 200px;"></div>
                <div class="card-body">
                    <h5 class="card-title placeholder-glow">
                        <span class="placeholder col-6"></span>
                    </h5>
                    <p class="card-text placeholder-glow">
                        <span class="placeholder col-4"></span>
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button class="btn btn-link p-0 disabled placeholder col-3"></button>
                        <button class="btn btn-primary disabled placeholder col-4"></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// Fetch All Blogs
async function fetchAllBlogs() {
    const blogGrid = document.getElementById('blogGrid');

    if (!blogGrid) {
        console.error("❌ Error: #blogGrid not found in DOM!");
        return;
    }

    // ✅ Add skeleton loader dynamically
    blogGrid.innerHTML = getLoadingSkeleton().repeat(3);

    try {
        const blogsRef = collection(db, 'blogs');
        const blogsSnap = await getDocs(blogsRef);

        // ✅ Remove skeleton loaders
        blogGrid.innerHTML = "";

        blogsSnap.forEach(async (docSnap) => {
            const blog = docSnap.data();
            const blogId = docSnap.id;

            // ✅ Get random placeholder text if excerpt is missing
            const randomPlaceholder = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)];
            const blogDescription = blog.excerpt || randomPlaceholder;

            const blogCard = document.createElement('div');
            blogCard.className = "col";
            blogCard.innerHTML = `
                <div class="card blog-card h-100 shadow-lg border-0 rounded-4">
                    <div class="blog-image-container overflow-hidden">
                        <img src="${blog.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image'}" class="card-img-top rounded-top-4 blog-img transition" alt="${blog.title}">
                    </div>
                    <div class="card-body p-4">
                        <h5 class="card-title fw-bold text-dark">${blog.title || "Untitled Blog"}</h5>
                        <p class="card-text text-muted"><strong>By:</strong> ${blog.author || "Anonymous"}</p>
                        <span class="badge bg-peach">${blog.category || "Uncategorized"}</span>
                        <p class="card-text text-secondary mt-2">${blogDescription}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <a href="blog-details.html?id=${blogId}" class="btn btn-peach transition">📖 Read More</a>
                        </div>
                    </div>
                </div>
            `;

            blogGrid.appendChild(blogCard);
        });

    } catch (error) {
        console.error("❌ Error fetching blogs:", error);
        blogGrid.innerHTML = `<p class="text-center text-danger">Failed to load blogs.</p>`;
    }
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    fetchAllBlogs();
});

