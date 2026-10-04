import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { subscribeToOrder } from "../../services/orderService";

import {
  createReview,
  hasReviewedItem,
} from "../../services/reviewService";

function ReviewOrder() {
  const { orderId } = useParams();

  const { user } = useAuth();

  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
    Temporary rating/comment state
    for each food item.
  */
  const [reviews, setReviews] = useState({});

  /*
    Food item currently being submitted.
  */
  const [submittingFoodId, setSubmittingFoodId] =
    useState("");

  /*
    Food items that already have a review
    in Firebase.
  */
  const [submittedFoodIds, setSubmittedFoodIds] =
    useState([]);

  /*
    Food items that the user has submitted
    during the CURRENT page/session.

    This is important because an existing Firebase
    review should NOT automatically trigger the
    "Thank you for your feedback" message.
  */
  const [submittedThisSession, setSubmittedThisSession] =
    useState([]);

  // ============================================================
  // LOAD ORDER
  // ============================================================

  useEffect(() => {
    if (!user?.uid || !orderId) {
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = subscribeToOrder(
      orderId,

      (data) => {
        if (!data) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        /*
          Security check:
          Student can only review their own order.
        */
        if (data.userId !== user.uid) {
          setError(
            "You are not allowed to review this order."
          );

          setLoading(false);
          return;
        }

        /*
          Only Delivered orders can be reviewed.
        */
        if (data.status !== "Delivered") {
          setError(
            "Only delivered orders can be reviewed."
          );

          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);
      },

      () => {
        setError("Unable to load this order.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, orderId]);

  // ============================================================
  // CHECK EXISTING REVIEWS
  // ============================================================

  useEffect(() => {
    const checkExistingReviews = async () => {
      if (!user?.uid || !order?.items?.length) {
        return;
      }

      try {
        const alreadyReviewed = [];

        for (const item of order.items) {
          const reviewed = await hasReviewedItem({
            userId: user.uid,
            orderId: order.id,
            foodId: item.id,
          });

          if (reviewed) {
            alreadyReviewed.push(item.id);
          }
        }

        /*
          These are reviews that already existed
          BEFORE the current session.
        */
        setSubmittedFoodIds(alreadyReviewed);
      } catch (error) {
        console.error(
          "Check existing reviews error:",
          error
        );
      }
    };

    checkExistingReviews();
  }, [user?.uid, order]);

  // ============================================================
  // RATING CHANGE
  // ============================================================

  const handleRatingChange = (
    foodId,
    rating
  ) => {
    setReviews((previousReviews) => ({
      ...previousReviews,

      [foodId]: {
        ...previousReviews[foodId],
        rating,
      },
    }));
  };

  // ============================================================
  // COMMENT CHANGE
  // ============================================================

  const handleCommentChange = (
    foodId,
    comment
  ) => {
    setReviews((previousReviews) => ({
      ...previousReviews,

      [foodId]: {
        ...previousReviews[foodId],
        comment,
      },
    }));
  };

  // ============================================================
  // MARK ITEM AS REVIEWED
  // ============================================================

  const markItemAsReviewed = (foodId) => {
    /*
      Mark the item as reviewed in the normal
      submitted list.
    */
    setSubmittedFoodIds((previousIds) => {
      if (previousIds.includes(foodId)) {
        return previousIds;
      }

      return [
        ...previousIds,
        foodId,
      ];
    });

    /*
      IMPORTANT:
      Also remember that this item was reviewed
      during THIS session.
    */
    setSubmittedThisSession((previousIds) => {
      if (previousIds.includes(foodId)) {
        return previousIds;
      }

      return [
        ...previousIds,
        foodId,
      ];
    });

    /*
      Remove temporary rating/comment state.
    */
    setReviews((previousReviews) => {
      const updated = {
        ...previousReviews,
      };

      delete updated[foodId];

      return updated;
    });
  };

  // ============================================================
  // SUBMIT REVIEW
  // ============================================================

  const handleSubmitReview = async (item) => {
    const currentReview =
      reviews[item.id];

    /*
      Rating is required.
    */
    if (!currentReview?.rating) {
      setError(
        `Please select a rating for ${item.name}.`
      );

      return;
    }

    try {
      setError("");

      setSubmittingFoodId(item.id);

      await createReview({
        userId: user.uid,

        orderId: order.id,

        foodId: item.id,

        foodName: item.name,

        vendorId:
          item.vendorId ||
          order.vendorId,

        rating:
          currentReview.rating,

        comment:
          currentReview.comment ||
          "",
      });

      /*
        Review successfully created.
      */
      markItemAsReviewed(item.id);

      setError("");

    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      const errorMessage =
        error?.message || "";

      /*
        If the review already exists,
        treat the item as reviewed instead
        of showing a duplicate error.
      */
      if (
        errorMessage
          .toLowerCase()
          .includes("already reviewed")
      ) {
        markItemAsReviewed(item.id);

        setError("");

        return;
      }

      setError(
        errorMessage ||
          "Unable to submit review. Please try again."
      );
    } finally {
      setSubmittingFoodId("");
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

          <p className="mt-3 text-sm text-gray-500">
            Loading order...
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR WITHOUT ORDER
  // ============================================================

  if (error && !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5">

        <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">

          <div className="text-4xl">
            ⚠️
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            {error}
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/orders"
              )
            }
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white"
          >
            Back to Orders
          </button>

        </div>

      </div>
    );
  }

  if (!order) {
    return null;
  }

  // ============================================================
  // CHECK REVIEW STATUS
  // ============================================================

  /*
    All items are reviewed according to Firebase.
  */
  const allReviewed =
    order.items?.length > 0 &&
    order.items.every(
      (item) =>
        submittedFoodIds.includes(
          item.id
        )
    );

  /*
    All items were reviewed during THIS session.
  */
  const allReviewedThisSession =
    order.items?.length > 0 &&
    order.items.every(
      (item) =>
        submittedThisSession.includes(
          item.id
        )
    );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex items-center gap-4 bg-white px-5 py-5">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/student/orders"
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg"
        >
          ←
        </button>

        <div>

          <h1 className="text-xl font-bold text-gray-900">
            Rate Your Order
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            #{order.id.slice(0, 8)}
          </p>

        </div>

      </header>


      <main className="mx-auto max-w-md space-y-5 px-5 pt-5">

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="rounded-2xl bg-white p-5 text-center shadow-sm">

          <div className="text-4xl">
            ⭐
          </div>

          <h2 className="mt-3 text-lg font-bold text-gray-900">
            How was your food?
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Share your experience with each item.
          </p>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        )}


        {/* =================================================
            SUCCESS MESSAGE
            ONLY AFTER USER SUBMITS ALL ITEMS
            DURING CURRENT SESSION
        ================================================= */}

        {allReviewedThisSession && (

          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">

            <div className="text-4xl">
              🎉
            </div>

            <h2 className="mt-3 text-lg font-bold text-green-800">
              Thank you for your feedback!
            </h2>

            <p className="mt-2 text-sm text-green-700">
              You have reviewed all the items in this order.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/orders"
                )
              }
              className="mt-5 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white"
            >
              Back to Orders
            </button>

          </section>

        )}


        {/* =================================================
            FOOD ITEMS
        ================================================= */}

        {!allReviewedThisSession && (

          <div className="space-y-4">

            {order.items?.map(
              (item) => {

                const alreadyReviewed =
                  submittedFoodIds.includes(
                    item.id
                  );

                const reviewedThisSession =
                  submittedThisSession.includes(
                    item.id
                  );

                const currentReview =
                  reviews[item.id] || {};


                return (

                  <section
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >

                    {/* ======================================
                        FOOD INFORMATION
                    ====================================== */}

                    <div className="flex items-center gap-3">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                        {item.imageUrl ? (

                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <span className="text-2xl">
                            🍽️
                          </span>

                        )}

                      </div>


                      <div className="min-w-0">

                        <h2 className="truncate text-base font-bold text-gray-900">
                          {item.name}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          ₹{item.price} ×{" "}
                          {item.quantity}
                        </p>

                      </div>

                    </div>


                    {/* ======================================
                        ALREADY REVIEWED
                    ====================================== */}

                    {alreadyReviewed &&
                    !reviewedThisSession ? (

                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">

                        <div className="text-2xl">
                          ✅
                        </div>

                        <p className="mt-1 text-sm font-semibold text-blue-700">
                          You have already reviewed this item.
                        </p>

                        <p className="mt-1 text-xs text-blue-600">
                          This item has already received your feedback.
                        </p>

                      </div>

                    ) : reviewedThisSession ? (

                      /* ====================================
                         REVIEW SUBMITTED THIS SESSION
                      ==================================== */

                      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-center">

                        <div className="text-2xl">
                          ✅
                        </div>

                        <p className="mt-1 text-sm font-semibold text-green-700">
                          Review submitted successfully!
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          Thank you for sharing your feedback.
                        </p>

                      </div>

                    ) : (

                      /* ====================================
                         REVIEW FORM
                      ==================================== */

                      <>

                        {/* Rating */}

                        <div className="mt-5">

                          <p className="mb-2 text-sm font-semibold text-gray-700">
                            Your rating
                          </p>

                          <div className="flex gap-2">

                            {[1, 2, 3, 4, 5].map(
                              (star) => (

                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    handleRatingChange(
                                      item.id,
                                      star
                                    )
                                  }
                                  className={`text-3xl transition ${
                                    star <=
                                    (
                                      currentReview.rating ||
                                      0
                                    )
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  } hover:scale-110`}
                                  aria-label={`Rate ${star} star${
                                    star > 1
                                      ? "s"
                                      : ""
                                  }`}
                                >
                                  ★
                                </button>

                              )
                            )}

                          </div>

                        </div>


                        {/* Comment */}

                        <div className="mt-5">

                          <label
                            htmlFor={`comment-${item.id}`}
                            className="mb-2 block text-sm font-semibold text-gray-700"
                          >
                            Your review

                            <span className="font-normal text-gray-400">
                              {" "}
                              (optional)
                            </span>

                          </label>


                          <textarea
                            id={`comment-${item.id}`}
                            value={
                              currentReview.comment ||
                              ""
                            }
                            onChange={(event) =>
                              handleCommentChange(
                                item.id,
                                event.target.value
                              )
                            }
                            rows={4}
                            maxLength={500}
                            placeholder="Tell us what you liked or what could be improved..."
                            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          />


                          <p className="mt-1 text-right text-xs text-gray-400">

                            {
                              (
                                currentReview.comment ||
                                ""
                              ).length
                            }

                            /500

                          </p>

                        </div>


                        {/* Submit */}

                        <button
                          type="button"
                          disabled={
                            submittingFoodId ===
                            item.id
                          }
                          onClick={() =>
                            handleSubmitReview(
                              item
                            )
                          }
                          className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {submittingFoodId ===
                          item.id
                            ? "Submitting..."
                            : "Submit Review"}

                        </button>

                      </>

                    )}

                  </section>

                );
              }
            )}

          </div>

        )}


        {/* =================================================
            BACK TO ORDER
        ================================================= */}

        {!allReviewedThisSession && (

          <button
            type="button"
            onClick={() =>
              navigate(
                `/student/orders/${order.id}`
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Order
          </button>

        )}

      </main>

    </div>
  );
}

export default ReviewOrder;