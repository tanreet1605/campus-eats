import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/config";

// ==================================================
// GET CURRENT USER ROLE
// ==================================================

const getCurrentUserRole = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  const userRef = doc(
    db,
    "users",
    currentUser.uid
  );

  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("User profile not found.");
  }

  return {
    uid: currentUser.uid,
    role: userSnapshot.data().role || "student",
  };
};


// ==================================================
// CHECK FOOD MANAGEMENT PERMISSION
// ==================================================

const verifyFoodPermission = async (foodId) => {
  const { uid, role } = await getCurrentUserRole();

  // Admin can manage any food item
  if (role === "admin") {
    return {
      uid,
      role,
      food: null,
    };
  }

  // Only vendors can manage food
  if (role !== "vendor") {
    throw new Error(
      "You are not allowed to manage food items."
    );
  }

  const foodRef = doc(
    db,
    "foodItems",
    foodId
  );

  const foodSnapshot = await getDoc(foodRef);

  if (!foodSnapshot.exists()) {
    throw new Error("Food item not found.");
  }

  const foodData = foodSnapshot.data();

  // Vendor can manage only their own food
  if (foodData.vendorId !== uid) {
    throw new Error(
      "You are not allowed to manage this food item."
    );
  }

  return {
    uid,
    role,
    food: foodData,
  };
};


// ==================================================
// GET ALL AVAILABLE FOOD ITEMS
// ==================================================

export const getAvailableFoodItems = async () => {
  try {
    const foodRef = collection(
      db,
      "foodItems"
    );

    const foodQuery = query(
      foodRef,
      where("available", "==", true)
    );

    const snapshot = await getDocs(
      foodQuery
    );

    const foodItems = snapshot.docs.map(
      (foodDoc) => ({
        id: foodDoc.id,
        ...foodDoc.data(),
      })
    );

    return foodItems;

  } catch (error) {
    console.error(
      "Error fetching food items:",
      error
    );

    throw error;
  }
};


// ==================================================
// GET ONE FOOD ITEM
// ==================================================

export const getFoodItemById = async (
  foodId
) => {
  try {
    if (!foodId) {
      throw new Error(
        "Food ID is required."
      );
    }

    const foodRef = doc(
      db,
      "foodItems",
      foodId
    );

    const foodSnapshot = await getDoc(
      foodRef
    );

    if (!foodSnapshot.exists()) {
      return null;
    }

    return {
      id: foodSnapshot.id,
      ...foodSnapshot.data(),
    };

  } catch (error) {
    console.error(
      "Error fetching food item:",
      error
    );

    throw error;
  }
};


// ==================================================
// GET VENDOR FOOD ITEMS
// ==================================================

export const getVendorFoodItems = async (
  vendorId
) => {
  try {
    if (!vendorId) {
      throw new Error(
        "Vendor ID is required."
      );
    }

    const foodRef = collection(
      db,
      "foodItems"
    );

    const foodQuery = query(
      foodRef,
      where("vendorId", "==", vendorId)
    );

    const snapshot = await getDocs(
      foodQuery
    );

    const foodItems = snapshot.docs.map(
      (foodDoc) => ({
        id: foodDoc.id,
        ...foodDoc.data(),
      })
    );

    // Newest items first
    foodItems.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return foodItems;

  } catch (error) {
    console.error(
      "Error fetching vendor food items:",
      error
    );

    throw error;
  }
};


// ==================================================
// ADD FOOD ITEM
// ==================================================

export const addFoodItem = async ({
  vendorId,
  vendorName,
  name,
  description,
  price,
  category,
  imageUrl = "",
  available = true,
  prepTime,
}) => {
  try {
    if (!vendorId) {
      throw new Error(
        "Vendor ID is required."
      );
    }

    // -----------------------------------------------
    // AUTHORIZATION
    // -----------------------------------------------

    const { uid, role } =
      await getCurrentUserRole();

    if (
      role !== "admin" &&
      role !== "vendor"
    ) {
      throw new Error(
        "You are not allowed to add food items."
      );
    }

    // Vendor cannot create food for another vendor
    if (
      role === "vendor" &&
      vendorId !== uid
    ) {
      throw new Error(
        "You can only add food to your own menu."
      );
    }

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name?.trim()) {
      throw new Error(
        "Food name is required."
      );
    }

    if (!description?.trim()) {
      throw new Error(
        "Food description is required."
      );
    }

    if (!category?.trim()) {
      throw new Error(
        "Food category is required."
      );
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      throw new Error(
        "Food price must be greater than 0."
      );
    }

    const numericPrepTime =
      Number(prepTime);

    if (
      !Number.isFinite(numericPrepTime) ||
      numericPrepTime <= 0
    ) {
      throw new Error(
        "Preparation time must be greater than 0 minutes."
      );
    }

    // -----------------------------------------------
    // CREATE FOOD
    // -----------------------------------------------

    const foodData = {
      vendorId,

      vendorName:
        vendorName || "Vendor",

      name:
        name.trim(),

      description:
        description.trim(),

      price:
        numericPrice,

      category:
        category.trim(),

      imageUrl:
        imageUrl?.trim() || "",

      available:
        Boolean(available),

      prepTime:
        numericPrepTime,

      rating: 0,

      ratingCount: 0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };

    const foodRef = await addDoc(
      collection(db, "foodItems"),
      foodData
    );

    return {
      id: foodRef.id,
      ...foodData,
    };

  } catch (error) {
    console.error(
      "Error adding food item:",
      error
    );

    throw error;
  }
};


// ==================================================
// UPDATE FOOD ITEM
// ==================================================

export const updateFoodItem = async (
  foodId,
  {
    name,
    description,
    price,
    category,
    imageUrl = "",
    available,
    prepTime,
  }
) => {
  try {
    if (!foodId) {
      throw new Error(
        "Food ID is required."
      );
    }

    // -----------------------------------------------
    // AUTHORIZATION
    // -----------------------------------------------

    await verifyFoodPermission(
      foodId
    );

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name?.trim()) {
      throw new Error(
        "Food name is required."
      );
    }

    if (!description?.trim()) {
      throw new Error(
        "Food description is required."
      );
    }

    if (!category?.trim()) {
      throw new Error(
        "Food category is required."
      );
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      throw new Error(
        "Food price must be greater than 0."
      );
    }

    const numericPrepTime =
      Number(prepTime);

    if (
      !Number.isFinite(numericPrepTime) ||
      numericPrepTime <= 0
    ) {
      throw new Error(
        "Preparation time must be greater than 0 minutes."
      );
    }

    // -----------------------------------------------
    // UPDATE FIRESTORE
    // -----------------------------------------------

    const foodRef = doc(
      db,
      "foodItems",
      foodId
    );

    await updateDoc(foodRef, {
      name:
        name.trim(),

      description:
        description.trim(),

      price:
        numericPrice,

      category:
        category.trim(),

      imageUrl:
        imageUrl?.trim() || "",

      available:
        Boolean(available),

      prepTime:
        numericPrepTime,

      updatedAt:
        serverTimestamp(),
    });

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "Error updating food item:",
      error
    );

    throw error;
  }
};


// ==================================================
// DELETE FOOD ITEM
// ==================================================

export const deleteFoodItem = async (
  foodId
) => {
  try {
    if (!foodId) {
      throw new Error(
        "Food ID is required."
      );
    }

    // -----------------------------------------------
    // AUTHORIZATION
    // -----------------------------------------------

    await verifyFoodPermission(
      foodId
    );

    // -----------------------------------------------
    // DELETE
    // -----------------------------------------------

    const foodRef = doc(
      db,
      "foodItems",
      foodId
    );

    await deleteDoc(foodRef);

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "Error deleting food:",
      error
    );

    throw error;
  }
};


// ==================================================
// TOGGLE FOOD AVAILABILITY
// ==================================================

export const toggleFoodAvailability = async (
  foodId,
  available
) => {
  try {
    if (!foodId) {
      throw new Error(
        "Food ID is required."
      );
    }

    // -----------------------------------------------
    // AUTHORIZATION
    // -----------------------------------------------

    await verifyFoodPermission(
      foodId
    );

    // -----------------------------------------------
    // UPDATE AVAILABILITY
    // -----------------------------------------------

    const foodRef = doc(
      db,
      "foodItems",
      foodId
    );

    await updateDoc(foodRef, {
      available:
        Boolean(available),

      updatedAt:
        serverTimestamp(),
    });

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "Error updating food availability:",
      error
    );

    throw error;
  }
};