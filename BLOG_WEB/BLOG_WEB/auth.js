// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
   signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);


// Show message function
function showMessage(message, divId, isSuccess = false) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.className = isSuccess ? "alert alert-primary" : "alert alert-danger";
  setTimeout(() => { messageDiv.style.display = "none"; }, 5000);
}

// Fetch user data from Firestore
async function fetchUserData(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// LOGIN FUNCTION
// LOGIN FUNCTION
document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage("Email and Password are required.", "signInMessage");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Clear form fields after login
    emailInput.value = "";
    passwordInput.value = "";

    // Fetch user data
    const userData = await fetchUserData(user.uid);
    
    if (userData) {
      localStorage.setItem("userFullName", userData.fullName);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userProfilePic", userData.profilePic || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png");

      showMessage("Login successful!", "signInMessage", true);
      window.location.href = userData.email === "uayesha8322@gmail.com" ? "dashboard.html" : "homepage.html";
    } else {
      showMessage("User data not found in Firestore!", "signInMessage");
    }
  } catch (error) {
    showMessage(`Login failed: ${error.message}`, "signInMessage");
  }
});


// SIGNUP FUNCTION
// SIGNUP FUNCTION
document.getElementById("signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!fullName || !email || !password) {
    showMessage("⚠️ All fields are required.", "signUpMessage");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      email,
      profilePic: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
      createdAt: new Date().toISOString()
    });

    // Clear form fields after signup
    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";

    showMessage("🎉 Signup successful! Please log in.", "signUpMessage", true);
  } catch (error) {
    showMessage(`❌ Signup failed: ${error.message}`, "signUpMessage");
  }
});


// FORGOT PASSWORD FUNCTION
document.getElementById("forgot-password").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    showMessage("Please enter your email to reset password.", "signInMessage");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent!", "signInMessage", true);
  } catch (error) {
    showMessage("Failed to send reset email. Try again.", "signInMessage");
  }
});

// GOOGLE SIGN-IN FUNCTION
document.getElementById("google-login").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userData = await fetchUserData(user.uid);

    if (!userData) {
      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName,
        email: user.email,
        profilePic: user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
      });
    }

    showMessage("Google sign-in successful!", "signInMessage", true);
    window.location.href = "homepage.html";
  } catch (error) {
    showMessage("Google sign-in failed.", "signInMessage");
  }
});

// AUTH STATE CHANGE (Check if user is logged in)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
  } else {
    console.log("No user is logged in.");
  }
});


// forget password handler (sendPasswordResetEmail)
// Forget Password Handler
document.addEventListener("DOMContentLoaded", () => {
  const forgetPasswordButton = document.getElementById("forgot-password");

  if (forgetPasswordButton) {
    forgetPasswordButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const emailInput = document.getElementById("login-email"); // Ensure this ID matches your input field
      const email = emailInput.value.trim();

      if (!email) {
        alert("⚠️ Please enter your email to reset the password.");
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ Password reset email sent! Please check your inbox.");
        emailInput.value = ""; // Clear the input field after sending
      } catch (error) {
        alert(`❌ Error sending password reset email: ${error.message}`);
      }
    });
  }
});

// Google Auth Provider
// Google Auth Provider
document.getElementById("googleLoginButton").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Default profile picture if none is provided
    const defaultProfilePic = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: user.displayName,
      profilePic: user.photoURL || defaultProfilePic  // Fix applied here
    }, { merge: true });

    alert("Google login successful!");
    window.location.href = "homepage.html";
  } catch (error) {
    console.error("Error with Google Login:", error);
  }
});

