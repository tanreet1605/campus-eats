import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";


// ============================================================
// CREATE REVIEW
// ============================================================

export const createReview = async ({
  userId,
  orderId,
  foodId,
  foodName,
  vendorId,
  rating,
  comment,
}) => {

  try {

    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------

    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    if (!foodId) {
      throw new Error("Food ID is required.");
    }

    if (!foodName) {
      throw new Error("Food name is required.");
    }

    if (!vendorId) {
      throw new Error("Vendor ID is required.");
    }

    if (!rating) {
      throw new Error("Please select a rating.");
    }

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5."
      );
    }


    // --------------------------------------------------------
    // Check for duplicate review
    // --------------------------------------------------------

    const reviewsRef =
      collection(db, "reviews");

    const duplicateQuery =
      query(
        reviewsRef,

        where(
          "userId",
          "==",
          userId
        ),

        where(
          "orderId",
          "==",
          orderId
        ),

        where(
          "foodId",
          "==",
          foodId
        )
      );


    const duplicateSnapshot =
      await getDocs(
        duplicateQuery
      );


    if (!duplicateSnapshot.empty) {

      throw new Error(
        "You have already reviewed this item."
      );
    }


    // --------------------------------------------------------
    // Review data
    // --------------------------------------------------------

    const reviewData = {

      userId,

      orderId,

      foodId,

      foodName,

      vendorId,

      rating:
        numericRating,

      comment:
        comment?.trim() || "",

      createdAt:
        serverTimestamp(),
    };


    // --------------------------------------------------------
    // Save review
    // --------------------------------------------------------

    const reviewReference =
      await addDoc(
        reviewsRef,
        reviewData
      );


    // --------------------------------------------------------
    // IMPORTANT
    // --------------------------------------------------------
    //
    // Do NOT update foodItems here.
    //
    // Students are not allowed to modify foodItems
    // under the production Firestore security rules.
    //
    // The review itself has already been successfully
    // stored in Firestore at this point.
    //
    // Rating aggregation can later be handled by a
    // trusted backend / Cloud Function.
    // --------------------------------------------------------


    // --------------------------------------------------------
    // Return created review
    // --------------------------------------------------------

    return {

      id:
        reviewReference.id,

      ...reviewData,

    };

  } catch (error) {

    console.error(
      "Create review error:",
      error
    );

    throw error;
  }
};


// ============================================================
// CHECK IF ITEM HAS ALREADY BEEN REVIEWED
// ============================================================

export const hasReviewedItem = async ({
  userId,
  orderId,
  foodId,
}) => {

  try {

    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }

    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }

    if (!foodId) {
      throw new Error(
        "Food ID is required."
      );
    }


    const reviewsRef =
      collection(db, "reviews");


    const reviewQuery =
      query(
        reviewsRef,

        where(
          "userId",
          "==",
          userId
        ),

        where(
          "orderId",
          "==",
          orderId
        ),

        where(
          "foodId",
          "==",
          foodId
        )
      );


    const snapshot =
      await getDocs(
        reviewQuery
      );


    return !snapshot.empty;

  } catch (error) {

    console.error(
      "Check reviewed item error:",
      error
    );

    throw error;
  }
};


// ============================================================
// GET REVIEWS FOR AN ORDER
// ============================================================

export const getOrderReviews = async (
  orderId
) => {

  try {

    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }


    const reviewsRef =
      collection(db, "reviews");


    const reviewQuery =
      query(
        reviewsRef,

        where(
          "orderId",
          "==",
          orderId
        )
      );


    const snapshot =
      await getDocs(
        reviewQuery
      );


    const reviews =
      snapshot.docs.map(
        (reviewDoc) => ({
          id:
            reviewDoc.id,

          ...reviewDoc.data(),
        })
      );


    return reviews;

  } catch (error) {

    console.error(
      "Get order reviews error:",
      error
    );

    throw error;
  }
};


// ============================================================
// GET FOOD RATING
// ============================================================

export const getFoodRating = async (
  foodId
) => {

  try {

    if (!foodId) {

      return {
        rating: 0,
        ratingCount: 0,
      };
    }


    const reviewsRef =
      collection(db, "reviews");


    const reviewQuery =
      query(
        reviewsRef,

        where(
          "foodId",
          "==",
          foodId
        )
      );


    const snapshot =
      await getDocs(
        reviewQuery
      );


    if (snapshot.empty) {

      return {
        rating: 0,
        ratingCount: 0,
      };
    }


    let totalRating = 0;


    snapshot.docs.forEach(
      (reviewDoc) => {

        const review =
          reviewDoc.data();


        totalRating +=
          Number(
            review.rating || 0
          );
      }
    );


    const ratingCount =
      snapshot.docs.length;


    const averageRating =
      totalRating /
      ratingCount;


    return {

      rating:
        Number(
          averageRating.toFixed(1)
        ),

      ratingCount,

    };

  } catch (error) {

    console.error(
      "Get food rating error:",
      error
    );


    return {

      rating: 0,

      ratingCount: 0,

    };
  }
};