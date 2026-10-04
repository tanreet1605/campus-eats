import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";


// ==========================================
// Register new user
// ==========================================

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};


// ==========================================
// Login user
// ==========================================

export const loginUser = async (email, password) => {
  // Login with Firebase Authentication
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Get user's document from Firestore
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("User profile not found in Firestore.");
  }

  const userData = userSnapshot.data();

  return {
    user,
    role: userData.role,
  };
};


// ==========================================
// Logout user
// ==========================================

export const logoutUser = async () => {
  await signOut(auth);
};


// ==========================================
// Reset password
// ==========================================

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};