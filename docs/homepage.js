
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
        import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

    
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbk_u3KmsTa_et45ZhPhOZgqlqrzYE0y4",
    authDomain: "blogsweb-ec131.firebaseapp.com",
    projectId: "blogsweb-ec131",
    storageBucket: "blogsweb-ec131.appspot.com",
    messagingSenderId: "370936332298",
    appId: "1:370936332298:web:8ca8aa499bb34afbc59ff3"
  };
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth();
        const db = getFirestore();

        // Detect Authentication State
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User is logged in:", user.uid);
                
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        console.log("User Data from Firestore:", userData);

                        // Fetch user name from Firestore or Google sign-in
                        const fullName = user.displayName || userData?.fullName || "User";
                        const email = user.email || "";

                        // Set the name and email in the UI
                        // document.getElementById('loggedUserFName').innerText = fullName;
                        // document.getElementById('loggedUserEmail').innerText = email;
                    } else {
                        console.error("No document found matching user ID in Firestore.");
                    }
                } catch (error) {
                    console.error("Error fetching document:", error);
                }
            } else {
                console.log("No user is logged in. Redirecting...");
                window.location.href = "index.html"; // Redirect to login page if no user is found
            }
        });

        // Logout Handler
        document.addEventListener('DOMContentLoaded', () => {
            const logoutButton = document.getElementById('logout');
            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    try {
                        await signOut(auth);
                        console.log("User signed out successfully.");
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                });
            } else {
                console.error("Logout button not found!");
            }
        });