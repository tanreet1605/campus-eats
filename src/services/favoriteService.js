import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

/*
  Get the user's favorites
*/
export const getFavorites = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const favoritesRef = doc(
      db,
      "favorites",
      userId
    );

    const favoritesSnapshot =
      await getDoc(favoritesRef);

    if (!favoritesSnapshot.exists()) {
      return {
        userId,
        items: [],
      };
    }

    return {
      id: favoritesSnapshot.id,
      ...favoritesSnapshot.data(),
    };
  } catch (error) {
    console.error(
      "Get favorites error:",
      error
    );

    throw error;
  }
};


/*
  Check whether a food item is already favorite
*/
export const isFavorite = async (
  userId,
  foodId
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!foodId) {
      throw new Error("Food ID is required.");
    }

    const favorites =
      await getFavorites(userId);

    return favorites.items.some(
      (item) => item.foodId === foodId
    );
  } catch (error) {
    console.error(
      "Check favorite error:",
      error
    );

    throw error;
  }
};


/*
  Add food item to favorites
*/
export const addToFavorites = async (
  userId,
  foodItem
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!foodItem?.id) {
      throw new Error("Food item ID is missing.");
    }

    const favoritesRef = doc(
      db,
      "favorites",
      userId
    );

    const favoritesSnapshot =
      await getDoc(favoritesRef);

    let items = [];

    if (favoritesSnapshot.exists()) {
      items =
        favoritesSnapshot.data().items || [];
    }

    /*
      Prevent duplicate favorites
    */
    const alreadyFavorite =
      items.some(
        (item) =>
          item.foodId === foodItem.id
      );

    if (alreadyFavorite) {
      return {
        userId,
        items,
      };
    }

    const favoriteItem = {
      foodId: foodItem.id,
      name: foodItem.name || "",
      price: Number(foodItem.price) || 0,
      imageUrl: foodItem.imageUrl || "",
      vendorId: foodItem.vendorId || "",
      vendorName:
        foodItem.vendorName ||
        "Campus Vendor",
      category:
        foodItem.category || "Other",
      rating: foodItem.rating || "",
      preparationTime:
        foodItem.preparationTime || "",
      available:
        foodItem.available !== false,
      addedAt: new Date(),
    };

    items.push(favoriteItem);

    await setDoc(
      favoritesRef,
      {
        userId,
        items,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      userId,
      items,
    };
  } catch (error) {
    console.error(
      "Add to favorites error:",
      error
    );

    throw error;
  }
};


/*
  Remove food item from favorites
*/
export const removeFromFavorites = async (
  userId,
  foodId
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!foodId) {
      throw new Error("Food ID is required.");
    }

    const favoritesRef = doc(
      db,
      "favorites",
      userId
    );

    const favoritesSnapshot =
      await getDoc(favoritesRef);

    if (!favoritesSnapshot.exists()) {
      return {
        userId,
        items: [],
      };
    }

    const items =
      favoritesSnapshot.data().items || [];

    const updatedItems = items.filter(
      (item) =>
        item.foodId !== foodId
    );

    await setDoc(
      favoritesRef,
      {
        userId,
        items: updatedItems,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      userId,
      items: updatedItems,
    };
  } catch (error) {
    console.error(
      "Remove from favorites error:",
      error
    );

    throw error;
  }
};