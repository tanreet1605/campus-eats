import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getVendorReviews,
  calculateReviewStats,
} from "../../services/vendorReviewService";


function VendorReviews() {
  const { user, loading: authLoading } = useAuth();

  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);

  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [ratingFilter, setRatingFilter] =
    useState("All");


  // ==================================================
  // LOAD REVIEWS
  // ==================================================

  const loadReviews = useCallback(
    async (showRefreshLoader = false) => {
      if (!user?.uid) {
        setError(
          "Vendor is not logged in."
        );

        setLoading(false);

        return;
      }

      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const vendorReviews =
          await getVendorReviews(
            user.uid
          );

        setReviews(vendorReviews);

        setStats(
          calculateReviewStats(
            vendorReviews
          )
        );

      } catch (err) {
        console.error(
          "Load vendor reviews error:",
          err
        );

        setError(
          err.message ||
            "Failed to load reviews."
        );

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid]
  );


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadReviews();

  }, [authLoading, loadReviews]);


  // ==================================================
  // FILTER REVIEWS
  // ==================================================

  const filteredReviews = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return reviews.filter(
      (review) => {
        const rating =
          Number(review.rating) || 0;

        const studentName =
          (
            review.userName ||
            review.studentName ||
            "Student"
          ).toLowerCase();

        const foodName =
          (
            review.foodName ||
            ""
          ).toLowerCase();

        const comment =
          (
            review.comment ||
            ""
          ).toLowerCase();

        // Rating filter
        if (
          ratingFilter !== "All" &&
          rating !== Number(ratingFilter)
        ) {
          return false;
        }

        // Search
        if (!searchText) {
          return true;
        }

        return (
          studentName.includes(
            searchText
          ) ||
          foodName.includes(
            searchText
          ) ||
          comment.includes(
            searchText
          )
        );
      }
    );
  }, [
    reviews,
    search,
    ratingFilter,
  ]);


  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatReviewDate = (
    review
  ) => {
    let date = null;

    if (review.createdAt?.toDate) {
      date =
        review.createdAt.toDate();
    } else if (
      review.createdAt?.toMillis
    ) {
      date = new Date(
        review.createdAt.toMillis()
      );
    } else if (
      review.createdAt
    ) {
      const parsed =
        new Date(
          review.createdAt
        );

      if (
        !Number.isNaN(
          parsed.getTime()
        )
      ) {
        date = parsed;
      }
    }

    if (!date) {
      return "Recently";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ==================================================
  // RATING STARS
  // ==================================================

  const renderStars = (
    rating
  ) => {
    const safeRating = Math.min(
      5,
      Math.max(
        0,
        Number(rating) || 0
      )
    );

    return (
      <>
        {"★".repeat(
          safeRating
        )}

        {"☆".repeat(
          5 - safeRating
        )}
      </>
    );
  };


  // ==================================================
  // LOADING
  // ==================================================

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">

        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500">
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Loading reviews...
          </p>

        </div>

      </div>
    );
  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">

        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={() =>
              navigate("/vendor")
            }
            className="mb-5 text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            ← Vendor Dashboard
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-semibold text-red-700">
              Unable to Load Reviews
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadReviews(true)
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // RATING BAR
  // ==================================================

  const RatingBar = ({
    rating,
  }) => {
    const count =
      stats.ratingDistribution[
        rating
      ] || 0;

    const percentage =
      stats.totalReviews > 0
        ? (
            count /
            stats.totalReviews
          ) * 100
        : 0;

    return (
      <div className="mb-3 flex items-center gap-3">

        <div className="w-12 text-sm font-medium text-gray-700">
          {rating} ⭐
        </div>

        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

        <div className="w-10 text-right text-xs text-gray-500">
          {count}
        </div>

        <div className="w-12 text-right text-xs text-gray-400">
          {percentage.toFixed(0)}%
        </div>

      </div>
    );
  };


  // ==================================================
  // 5 STAR PERCENTAGE
  // ==================================================

  const fiveStarPercentage =
    stats.totalReviews > 0
      ? (
          (stats.ratingDistribution[5] /
            stats.totalReviews) *
          100
        ).toFixed(0)
      : 0;


  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="min-h-screen bg-gray-50 pb-10">


      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="bg-white px-5 py-6 shadow-sm">

        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() =>
              navigate("/vendor")
            }
            className="mb-3 text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            ← Vendor Dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm text-gray-500">
                CampusEats
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
                Reviews & Ratings
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                See what students think about your food and service.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                loadReviews(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Reviews"}

            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-6xl px-5 pt-6">


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


          {/* AVERAGE RATING */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Average Rating
            </p>

            <div className="mt-3 flex items-center gap-3">

              <span className="text-4xl font-bold text-gray-900">
                {Number(
                  stats.averageRating || 0
                ).toFixed(1)}
              </span>

              <div>

                <div className="text-xl text-yellow-500">
                  {renderStars(
                    Math.round(
                      stats.averageRating ||
                        0
                    )
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  out of 5
                </p>

              </div>

            </div>

          </div>


          {/* TOTAL REVIEWS */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Reviews
            </p>

            <p className="mt-3 text-4xl font-bold text-gray-900">
              {stats.totalReviews}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Student reviews
            </p>

          </div>


          {/* FIVE STAR */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              5-Star Reviews
            </p>

            <p className="mt-3 text-4xl font-bold text-gray-900">
              {stats.ratingDistribution[5]}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {fiveStarPercentage}% of all reviews
            </p>

          </div>

        </div>


        {/* ==================================================
            RATING DISTRIBUTION
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-gray-900">
              Rating Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Understand how students are rating your service.
            </p>

          </div>


          {[5, 4, 3, 2, 1].map(
            (rating) => (
              <RatingBar
                key={rating}
                rating={rating}
              />
            )
          )}

        </section>


        {/* ==================================================
            REVIEW FILTERS
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="font-semibold text-gray-900">
                Student Feedback
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search and filter your reviews.
              </p>

            </div>


            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search reviews..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 sm:w-64"
              />


              <select
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >

                <option value="All">
                  All Ratings
                </option>

                <option value="5">
                  ⭐ 5 Stars
                </option>

                <option value="4">
                  ⭐ 4 Stars
                </option>

                <option value="3">
                  ⭐ 3 Stars
                </option>

                <option value="2">
                  ⭐ 2 Stars
                </option>

                <option value="1">
                  ⭐ 1 Star
                </option>

              </select>

            </div>

          </div>

        </section>


        {/* ==================================================
            RECENT REVIEWS
        ================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center justify-between gap-3">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Reviews
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest feedback from students
                </p>

              </div>

              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                {filteredReviews.length} Reviews
              </span>

            </div>

          </div>


          {/* EMPTY */}

          {filteredReviews.length === 0 ? (

            <div className="p-10 text-center">

              <div className="text-5xl">
                {reviews.length === 0
                  ? "⭐"
                  : "🔍"}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {reviews.length === 0
                  ? "No reviews yet"
                  : "No matching reviews"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">

                {reviews.length === 0
                  ? "Student reviews will appear here after completed orders are rated."
                  : "Try changing your search or rating filter."}

              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {filteredReviews.map(
                (review) => {

                  const rating =
                    Math.min(
                      5,
                      Math.max(
                        0,
                        Number(
                          review.rating
                        ) || 0
                      )
                    );

                  const studentName =
                    review.userName ||
                    review.studentName ||
                    "Student";

                  return (
                    <div
                      key={review.id}
                      className="p-6 transition hover:bg-gray-50"
                    >

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                        <div className="min-w-0">

                          {/* RATING */}

                          <div className="text-lg text-yellow-500">
                            {renderStars(
                              rating
                            )}
                          </div>


                          {/* STUDENT */}

                          <p className="mt-2 font-semibold text-gray-900">
                            {studentName}
                          </p>


                          {/* FOOD */}

                          {review.foodName && (
                            <p className="mt-1 text-sm text-gray-500">
                              🍽️{" "}
                              {review.foodName}
                            </p>
                          )}

                        </div>


                        {/* DATE */}

                        <div className="shrink-0 text-sm text-gray-400">
                          {formatReviewDate(
                            review
                          )}
                        </div>

                      </div>


                      {/* COMMENT */}

                      {review.comment ? (

                        <div className="mt-4 rounded-xl bg-gray-50 p-4">

                          <p className="text-sm leading-6 text-gray-700">
                            “
                            {review.comment}
                            ”
                          </p>

                        </div>

                      ) : (

                        <p className="mt-4 text-sm italic text-gray-400">
                          No written comment.
                        </p>

                      )}


                      {/* ORDER */}

                      {review.orderId && (
                        <p className="mt-3 text-xs text-gray-400">
                          Order ID:{" "}
                          {review.orderId}
                        </p>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default VendorReviews;