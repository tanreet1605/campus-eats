import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

function AdminFood() {
  const navigate = useNavigate();

  const [foodItems, setFoodItems] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("all");

  // =====================================================
  // LOAD FOOD + REVIEWS
  // =====================================================

  const loadFoodItems = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          foodSnapshot,
          reviewSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "foodItems")),
          getDocs(collection(db, "reviews")),
        ]);

        const items = foodSnapshot.docs.map(
          (foodDoc) => ({
            id: foodDoc.id,
            ...foodDoc.data(),
          })
        );

        const reviewData =
          reviewSnapshot.docs.map(
            (reviewDoc) => ({
              id: reviewDoc.id,
              ...reviewDoc.data(),
            })
          );

        setFoodItems(items);
        setReviews(reviewData);
      } catch (err) {
        console.error(
          "Admin food error:",
          err
        );

        setError(
          err.message ||
            "Unable to load food items or reviews. Please check Firebase permissions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFoodItems();
  }, [loadFoodItems]);

  // =====================================================
  // UNIQUE CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    return [
      ...new Set(
        foodItems
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [foodItems]);

  // =====================================================
  // UNIQUE VENDORS
  // =====================================================

  const vendors = useMemo(() => {
    return [
      ...new Set(
        foodItems
          .map((item) => item.vendorName)
          .filter(Boolean)
      ),
    ].sort();
  }, [foodItems]);

  // =====================================================
  // AVAILABILITY
  // =====================================================

  const isAvailable = useCallback((item) => {
    return (
      item.available === true ||
      item.availabilityStatus ===
        "Available"
    );
  }, []);

  const getAvailabilityText = useCallback(
    (item) => {
      return isAvailable(item)
        ? "Available"
        : "Sold Out";
    },
    [isAvailable]
  );

  const getAvailabilityStyle = useCallback(
    (item) => {
      return isAvailable(item)
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
    },
    [isAvailable]
  );

  // =====================================================
  // RATING MAP
  // =====================================================

  const ratingMap = useMemo(() => {
    const map = {};

    reviews.forEach((review) => {
      const foodId = review.foodId;

      if (!foodId) {
        return;
      }

      if (!map[foodId]) {
        map[foodId] = {
          total: 0,
          count: 0,
        };
      }

      map[foodId].total += Number(
        review.rating || 0
      );

      map[foodId].count += 1;
    });

    return map;
  }, [reviews]);

  const getRatingDisplay = useCallback(
    (item) => {
      const ratingData =
        ratingMap[item.id];

      if (
        !ratingData ||
        ratingData.count === 0
      ) {
        return {
          text: "No ratings",
          className: "text-gray-400",
        };
      }

      const average =
        ratingData.total /
        ratingData.count;

      return {
        text: `⭐ ${average.toFixed(
          1
        )} (${ratingData.count})`,
        className:
          "font-semibold text-gray-700",
      };
    },
    [ratingMap]
  );

  // =====================================================
  // FILTER FOOD ITEMS
  // =====================================================

  const filteredFoodItems = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return foodItems.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.name
          ?.toLowerCase()
          .includes(searchText) ||
        item.description
          ?.toLowerCase()
          .includes(searchText) ||
        item.vendorName
          ?.toLowerCase()
          .includes(searchText) ||
        item.id
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        categoryFilter === "all" ||
        item.category === categoryFilter;

      const matchesVendor =
        vendorFilter === "all" ||
        item.vendorName === vendorFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter ===
          "available" &&
          isAvailable(item)) ||
        (availabilityFilter ===
          "unavailable" &&
          !isAvailable(item));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVendor &&
        matchesAvailability
      );
    });
  }, [
    foodItems,
    search,
    categoryFilter,
    vendorFilter,
    availabilityFilter,
    isAvailable,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const availableCount = foodItems.filter(
    (item) => isAvailable(item)
  ).length;

  const unavailableCount =
    foodItems.length - availableCount;

  const categoryCount =
    categories.length;

  const vendorCount =
    vendors.length;

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setVendorFilter("all");
    setAvailabilityFilter("all");
  };

  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    vendorFilter !== "all" ||
    availabilityFilter !== "all";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-gray-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Loading Food Menu
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching food items and reviews...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/40">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin")
                }
                className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
              >
                <span>←</span>
                Back to Admin Dashboard
              </button>

              <div className="flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm">
                  🍔
                </span>

                <p className="text-sm font-bold text-orange-600">
                  CampusEats Admin
                </p>

              </div>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Food Menu Management
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Monitor food items, availability,
                categories, vendors and ratings.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadFoodItems(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                🔄
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Menu"}
            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm">

            <div className="flex items-start gap-3 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">

                <p className="font-bold text-red-800">
                  Unable to load food menu
                </p>

                <p className="mt-1 break-words text-sm text-red-700">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-100"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Food Items
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-900">
                  {foodItems.length}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl transition group-hover:scale-110">
                🍔
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-full rounded-full bg-orange-400" />
            </div>

          </div>

          {/* AVAILABLE */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Available
                </p>

                <h2 className="mt-2 text-3xl font-black text-emerald-600">
                  {availableCount}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl transition group-hover:scale-110">
                🟢
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width:
                    foodItems.length > 0
                      ? `${Math.min(
                          100,
                          (availableCount /
                            foodItems.length) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>

          </div>

          {/* SOLD OUT */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Sold Out
                </p>

                <h2 className="mt-2 text-3xl font-black text-red-600">
                  {unavailableCount}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl transition group-hover:scale-110">
                🔴
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-red-100">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width:
                    foodItems.length > 0
                      ? `${Math.min(
                          100,
                          (unavailableCount /
                            foodItems.length) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>

          </div>

          {/* VENDORS */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Vendors
                </p>

                <h2 className="mt-2 text-3xl font-black text-orange-600">
                  {vendorCount}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl transition group-hover:scale-110">
                🏪
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-full rounded-full bg-orange-400" />
            </div>

          </div>

        </section>

        {/* =================================================
            MENU STATISTICS
        ================================================= */}

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Categories
                </p>

                <p className="mt-2 text-2xl font-black text-blue-600">
                  {categoryCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
                🗂️
              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Active food categories
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Filtered Items
                </p>

                <p className="mt-2 text-2xl font-black text-purple-600">
                  {filteredFoodItems.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg">
                🔎
              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Matching current filters
            </p>

          </div>

          <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md lg:col-span-1">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Reviews
                </p>

                <p className="mt-2 text-2xl font-black text-orange-600">
                  {reviews.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                ⭐
              </div>

            </div>

            <p className="mt-3 text-xs text-gray-500">
              Food reviews in Firebase
            </p>

          </div>

        </section>

        {/* =================================================
            SEARCH + FILTERS
        ================================================= */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50/70 to-white px-5 py-4">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-bold text-gray-900">
                  Search & Filters
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Narrow down the campus food menu
                </p>

              </div>

              {hasActiveFilters && (
                <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  Filters Active
                </span>
              )}

            </div>

          </div>

          <div className="p-5">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* SEARCH */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Search Food
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Food, vendor or ID..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

              </div>

              {/* CATEGORY */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* VENDOR */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Vendor
                </label>

                <select
                  value={vendorFilter}
                  onChange={(e) =>
                    setVendorFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="all">
                    All Vendors
                  </option>

                  {vendors.map(
                    (vendor) => (
                      <option
                        key={vendor}
                        value={vendor}
                      >
                        {vendor}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* AVAILABILITY */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Availability
                </label>

                <select
                  value={availabilityFilter}
                  onChange={(e) =>
                    setAvailabilityFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="all">
                    All Items
                  </option>

                  <option value="available">
                    Available
                  </option>

                  <option value="unavailable">
                    Sold Out
                  </option>
                </select>

              </div>

            </div>

            {hasActiveFilters && (
              <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  ✕
                  Clear Filters
                </button>

              </div>
            )}

          </div>

        </section>

        {/* =================================================
            RESULTS HEADER
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-black text-gray-900">
                Food Items
              </h2>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {filteredFoodItems.length}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredFoodItems.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {foodItems.length}
              </span>{" "}
              items
            </p>

          </div>

          <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
            🍔 Menu Monitoring
          </span>

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-gray-200 bg-gray-50/90">

                <tr>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Food Item
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Price
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Rating
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Availability
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredFoodItems.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                        🍔
                      </div>

                      <p className="font-bold text-gray-900">
                        No food items found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search
                        or filters.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredFoodItems.map(
                    (item) => {
                      const rating =
                        getRatingDisplay(
                          item
                        );

                      return (
                        <tr
                          key={item.id}
                          className="group transition hover:bg-orange-50/40"
                        >

                          {/* FOOD */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl transition group-hover:scale-105">
                                🍔
                              </div>

                              <div className="min-w-0">

                                <p className="font-bold text-gray-900">
                                  {item.name ||
                                    "Unnamed Item"}
                                </p>

                                <p className="mt-1 max-w-xs truncate text-xs text-gray-400">
                                  {item.description ||
                                    "No description"}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* VENDOR */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-bold text-gray-900">
                              {item.vendorName ||
                                "Unknown Vendor"}
                            </p>

                            <p className="mt-1 max-w-[160px] truncate font-mono text-[11px] text-gray-400">
                              {item.vendorId ||
                                "N/A"}
                            </p>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <span className="inline-flex whitespace-nowrap rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-100">
                              {item.category ||
                                "Uncategorized"}
                            </span>

                          </td>

                          {/* PRICE */}

                          <td className="px-5 py-4">

                            <p className="font-black text-gray-900">
                              ₹
                              {Number(
                                item.price || 0
                              ).toFixed(2)}
                            </p>

                            {item.preparationTime && (
                              <p className="mt-1 text-xs text-gray-400">
                                ⏱{" "}
                                {
                                  item.preparationTime
                                }{" "}
                                min
                              </p>
                            )}

                          </td>

                          {/* RATING */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs ${rating.className}`}
                            >
                              {rating.text}
                            </span>

                          </td>

                          {/* AVAILABILITY */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${getAvailabilityStyle(
                                item
                              )}`}
                            >
                              {getAvailabilityText(
                                item
                              )}
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="space-y-4 md:hidden">

          {filteredFoodItems.length ===
          0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                🍔
              </div>

              <p className="font-bold text-gray-900">
                No food items found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or
                filters.
              </p>

            </div>

          ) : (

            filteredFoodItems.map(
              (item) => {
                const rating =
                  getRatingDisplay(
                    item
                  );

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >

                    {/* TOP */}

                    <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50/70 to-white p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                            🍔
                          </div>

                          <div className="min-w-0">

                            <h3 className="truncate font-black text-gray-900">
                              {item.name ||
                                "Unnamed Item"}
                            </h3>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {item.vendorName ||
                                "Unknown Vendor"}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${getAvailabilityStyle(
                            item
                          )}`}
                        >
                          {getAvailabilityText(
                            item
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="p-5">

                      {/* DESCRIPTION */}

                      <p className="text-sm leading-6 text-gray-500">
                        {item.description ||
                          "No description available."}
                      </p>

                      {/* DETAILS */}

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Category
                          </p>

                          <p className="mt-1 truncate text-sm font-bold text-gray-700">
                            {item.category ||
                              "N/A"}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Price
                          </p>

                          <p className="mt-1 text-sm font-black text-gray-900">
                            ₹
                            {Number(
                              item.price || 0
                            ).toFixed(2)}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Rating
                          </p>

                          <p
                            className={`mt-1 truncate text-sm ${rating.className}`}
                          >
                            {rating.text}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Preparation
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-700">
                            {item.preparationTime
                              ? `⏱ ${item.preparationTime} min`
                              : "N/A"}
                          </p>

                        </div>

                      </div>

                      {/* VENDOR ID */}

                      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Vendor ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-gray-500">
                          {item.vendorId ||
                            "N/A"}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

      </main>

    </div>
  );
}

export default AdminFood;