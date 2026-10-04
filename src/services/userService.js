import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

export const createUserProfile = async (user, additionalData = {}) => {
  try {
    const userRef = doc(db, "users", user.uid);

    const userData = {
      uid: user.uid,
      name: additionalData.name || "",
      email: user.email || "",
      phone: additionalData.phone || "",
      role: "student",
      profileImage: "",
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);

    return userData;
  } catch (error) {
    console.error("Firestore profile error:", error);

    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);

    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      return snapshot.data();
    }

    return null;
  } catch (error) {
    console.error("Get user profile error:", error);

    throw error;
  }
};