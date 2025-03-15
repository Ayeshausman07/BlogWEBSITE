  
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
getAuth,
onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
getFirestore,
doc,
getDoc,
deleteDoc,
onSnapshot,
collection,
addDoc,
query,
where,
getDocs,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
// ✅ Initialize Firebase Firestore
const db = getFirestore(app);

// ✅ Extract Blog ID from URL
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get("id") || urlParams.get("blogId"); // Ensure correct key is used

// ✅ Debugging: Check If Blog ID is Extracted Correctly
console.log("Current URL:", window.location.href);
console.log("Extracted Blog ID:", blogId);

// ✅ Ensure Blog ID is Present
if (!blogId) {
    alert("⚠️ Blog ID is missing in the URL!");
    throw new Error("Blog ID is missing. Check URL format.");
}

let currentUser = null;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user; // Set the current user
        console.log("✅ Logged-in user:", currentUser.uid);
        fetchBlog(); // Fetch blog only AFTER user is set
    } else {
        alert("⚠️ You must be logged in to view this page.");
        window.location.href = "index.html";
    }
});

// ✅ Fetch Blog Function (Modified to Check User First)
async function fetchBlog() {
    try {
        console.log("🔍 Fetching blog with ID:", blogId);

        const blogRef = doc(db, "blogs", blogId);
        const blogSnap = await getDoc(blogRef);

        if (!blogSnap.exists()) {
            console.error(`❌ Blog with ID ${blogId} does not exist in Firestore!`);
            alert("⚠️ Blog not found!");
            return;
        }

        const blog = blogSnap.data();
        console.log("✅ Blog found:", blog);

        // ✅ Populate Blog Details in HTML
        document.getElementById("blogTitle").textContent = blog.title || "Untitled Blog";
        document.getElementById("blogImage").src = blog.imageUrl || "https://via.placeholder.com/800x400?text=No+Image";
        document.getElementById("blogAuthor").textContent = blog.author || "Anonymous";
        document.getElementById("blogContent").innerHTML = blog.content || "No content available.";
        document.getElementById("blogDate").textContent = `📅 Published on: ${blog.publishDate || new Date().toDateString()}`;
        document.getElementById("blogReadTime").textContent = `⏳ Read Time: ${blog.readTime || "2 min"} mins`;
        document.getElementById("blogCategory").textContent = `📌 ${blog.category || "Uncategorized"}`;

        // ✅ Tags Handling
        const tagsArray = typeof blog.tags === "string"
            ? blog.tags.split(',').map(tag => tag.trim())
            : Array.isArray(blog.tags)
                ? blog.tags
                : [];

        document.getElementById("blogTags").innerHTML = tagsArray.length
            ? tagsArray.map(tag => `<span class="badge bg-success p-2 mx-1">${tag}</span>`).join(" ")
            : '<span class="badge bg-secondary">No Tags</span>';

        // ✅ Ensure `currentUser` is set before checking blog ownership
        if (currentUser) {
            console.log("Blog Author ID:", blog.authorId);
            console.log("Current User ID:", currentUser.uid);

            if (blog.authorId === currentUser.uid) {
                console.log("✅ Current user is the author. Showing Delete button.");
                document.getElementById("deleteBlog").classList.remove("d-none");
            } else {
                console.log("❌ Current user is NOT the author. Hiding Delete button.");
                document.getElementById("deleteBlog").classList.add("d-none");
            }
        }
    } catch (error) {
        console.error("❌ Error fetching blog:", error);
        alert("⚠️ Failed to load blog details.");
    }
}


// ✅ Delete Blog Function
async function deleteBlog() {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
        await deleteDoc(doc(db, "blogs", blogId));
        alert("✅ Blog deleted successfully.");
        window.location.href = "addblog.html"; // Redirect after deletion
    } catch (error) {
        console.error("❌ Error deleting blog:", error);
        alert("⚠️ Failed to delete blog.");
    }
}

// Attach event listener to Delete button
document.getElementById("deleteBlog")?.addEventListener("click", deleteBlog);



// Post Comment
document.getElementById("postComment").addEventListener("click", addComment);



// Add Comment
async function addComment() {
    const commentInput = document.getElementById("commentInput");
    const commentText = commentInput.value.trim();

    if (!commentText) {
        alert("⚠️ Please write a comment before posting.");
        return;
    }
    if (!currentUser) {
        alert("⚠️ You must be logged in to comment.");
        return;
    }

    try {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const fullName = userDoc.exists() ? userDoc.data().fullName : "Anonymous"; // Use "fullName" field

        await addDoc(collection(db, "comments"), {
            blogId: blogId,
            userId: currentUser.uid,
            userName: fullName, // Use the fullName from Firestore
            text: commentText,
            timestamp: new Date()
        });

        commentInput.value = ""; // Clear input after posting
    } catch (error) {
        console.error("❌ Error adding comment:", error);
        alert("⚠️ Failed to post comment.");
    }
}


// Load Comments
async function loadComments() {
    const commentsContainer = document.getElementById("commentsList");
    commentsContainer.innerHTML = "<p>Loading comments...</p>";

    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("blogId", "==", blogId));

    // Real-time listener for comments
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        commentsContainer.innerHTML = ""; // Clear previous comments

        if (snapshot.empty) {
            commentsContainer.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
            return;
        }

        // Fetch all comments and their associated user data
        for (const commentDoc of snapshot.docs) { // ✅ Renamed loop variable
            const comment = commentDoc.data();
            const userRef = doc(db, "users", comment.userId); // ✅ Use 'doc' correctly
            const userDoc = await getDoc(userRef); // ✅ Fetch user data correctly
            const fullName = userDoc.exists() ? userDoc.data().fullName : "Anonymous"; 

            // Log user data to the console
            console.log("User Data:", userDoc.data());

            const commentElement = document.createElement("div");
            commentElement.classList.add("comment", "p-2", "mb-2", "border", "rounded");

            commentElement.innerHTML = `
                <strong>${fullName}</strong>
                <p>${comment.text}</p>
                <small class="text-muted">${new Date(comment.timestamp?.toDate()).toLocaleString()}</small>
                ${currentUser && comment.userId === currentUser.uid ? 
                    `<button class="btn btn-sm btn-danger deleteComment" data-id="${commentDoc.id}">Delete</button>` 
                    : ""}
            `;

            commentsContainer.appendChild(commentElement);
        }

        // Attach event listeners to delete buttons
        document.querySelectorAll(".deleteComment").forEach(button => {
            button.addEventListener("click", (e) => {
                const commentId = e.target.getAttribute("data-id");
                deleteComment(commentId);
            });
        });
    }, (error) => {
        console.error("❌ Error loading comments:", error);
        commentsContainer.innerHTML = "<p class='text-danger'>Failed to load comments. Please try again later.</p>";
    });
}

loadComments()

// Delete Comment
async function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        await deleteDoc(doc(db, "comments", commentId));
    } catch (error) {
        console.error("❌ Error deleting comment:", error);
        alert("⚠️ Failed to delete comment.");
    }
}
// ✅ Attach Event Listeners
document.getElementById("deleteBlog")?.addEventListener("click", deleteBlog);
// document.getElementById("addToFavorites")?.addEventListener("click", toggleFavorite);


// commenst 
