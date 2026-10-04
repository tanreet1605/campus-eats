import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";

/* =========================================================
   GET REVIEWS FOR A VENDOR
   ========================================================= */

export const getVendorReviews = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error("Vendor ID is required.");
    }

    const reviewsRef = collection(db, "reviews");

    const reviewsQuery = query(
      reviewsRef,
      where("vendorId", "==", vendorId)
    );

    const snapshot = await getDocs(reviewsQuery);

    const reviews = snapshot.docs.map((reviewDoc) => ({
      id: reviewDoc.id,
      ...reviewDoc.data(),
    }));

    // Newest reviews first
    reviews.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return reviews;
  } catch (error) {
    console.error("Get vendor reviews error:", error);
    throw error;
  }
};


/* =========================================================
   CALCULATE REVIEW STATISTICS
   ========================================================= */

export const calculateReviewStats = (reviews = []) => {
  if (!reviews.length) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let totalRating = 0;

  reviews.forEach((review) => {
    const rating = Number(review.rating);

    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
      totalRating += rating;
    }
  });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? totalRating / totalReviews
      : 0;

  return {
    totalReviews,
    averageRating: Number(averageRating.toFixed(1)),
    ratingDistribution,
  };
};