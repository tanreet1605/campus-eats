import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { getAvailableFoodItems } from "../../services/foodService";
import { addToCart } from "../../services/cartService";

import { listenToUnreadNotificationCount } from "../../services/notificationService";
import { getFoodRating } from "../../services/reviewService";

import CategoryCard from "../../components/student/CategoryCard";
import FoodCard from "../../components/student/FoodCard";
import BottomNavigation from "../../components/student/BottomNavigation";

// ============================================================
// CAMPUS LOCATIONS
// ============================================================

const CAMPUS_LOCATIONS = [
  "Hostel 1",
  "Hostel 2",
  "Girls Hostel",
  "Boys Hostel",
  "New Hostel",
  "Library",
  "Main Academic Block",
  "Computer Science Block",
  "Administration Block",
  "Faculty Block",
  "Sports Complex",
  "Medical Centre",
  "Cafeteria",
  "Main Gate",
  "Other / Custom Location",
];

// ============================================================
// HOME
// ============================================================

function Home() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // FOOD
  // ============================================================

  const [foodItems, setFoodItems] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodError, setFoodError] = useState("");

  // ============================================================
  // RATINGS
  // ============================================================

  const [foodRatings, setFoodRatings] = useState({});

  // ============================================================
  // SEARCH / CATEGORY
  // ============================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  // ============================================================
  // BUDGET FILTER
  // ============================================================

  const [budgetFilter, setBudgetFilter] = useState(null);

  // ============================================================
  // CART
  // ============================================================

  const [addingToCart, setAddingToCart] = useState("");

  // ============================================================
  // LOCATION
  // ============================================================

  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [showLocationModal, setShowLocationModal] =
    useState(false);

  const [locationSearch, setLocationSearch] =
    useState("");

  const [customLocation, setCustomLocation] =
    useState("");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const [
    unreadNotificationCount,
    setUnreadNotificationCount,
  ] = useState(0);

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = [
    {
      icon: "🍳",
      name: "Breakfast",
    },
    {
      icon: "🍛",
      name: "Main Course",
    },
    {
      icon: "🍟",
      name: "Snacks",
    },
    {
      icon: "🍔",
      name: "Fast Food",
    },
    {
      icon: "🥤",
      name: "Beverages",
    },
    {
      icon: "🍰",
      name: "Desserts",
    },
    {
      icon: "🥗",
      name: "Healthy Food",
    },
    {
      icon: "🍱",
      name: "Combos",
    },
  ];

  // ============================================================
  // NOTIFICATION LISTENER
  // ============================================================

  useEffect(() => {
    if (!user?.uid) {
      setUnreadNotificationCount(0);
      return;
    }

    const unsubscribe =
      listenToUnreadNotificationCount(
        user.uid,
        (count) => {
          setUnreadNotificationCount(count);
        }
      );

    return () => unsubscribe();
  }, [user?.uid]);

  // ============================================================
  // LOAD SAVED LOCATION
  // ============================================================

  useEffect(() => {
    const savedLocation = localStorage.getItem(
      "campusEatsDeliveryLocation"
    );

    if (savedLocation) {
      setSelectedLocation(savedLocation);
    }
  }, []);

  // ============================================================
  // LOAD FOOD ITEMS
  // ============================================================

  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        setFoodLoading(true);
        setFoodError("");

        const items = await getAvailableFoodItems();

        setFoodItems(items);

        const ratings = {};

        await Promise.all(
          items.map(async (item) => {
            try {
              const ratingData = await getFoodRating(
                item.id
              );

              ratings[item.id] = ratingData;
            } catch (error) {
              console.error(
                `Unable to load rating for ${item.name}:`,
                error
              );

              ratings[item.id] = {
                rating: 0,
                ratingCount: 0,
              };
            }
          })
        );

        setFoodRatings(ratings);
      } catch (error) {
        console.error(
          "Unable to load food items:",
          error
        );

        setFoodError(
          "Unable to load food items."
        );
      } finally {
        setFoodLoading(false);
      }
    };

    loadFoodItems();
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await logoutUser();

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = async (foodItem) => {
    try {
      if (!user?.uid) {
        alert("Please login first.");
        return;
      }

      if (!foodItem?.available) {
        alert(
          "This food item is currently unavailable."
        );
        return;
      }

      setAddingToCart(foodItem.id);

      await addToCart(
        user.uid,
        foodItem,
        1
      );

      alert(
        `${foodItem.name} added to cart!`
      );
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      alert(
        error.message ||
          "Unable to add item to cart."
      );
    } finally {
      setAddingToCart("");
    }
  };

  // ============================================================
  // LOCATION
  // ============================================================

  const handleSelectLocation = (location) => {
    if (
      location ===
      "Other / Custom Location"
    ) {
      setCustomLocation("");
      return;
    }

    localStorage.setItem(
      "campusEatsDeliveryLocation",
      location
    );

    setSelectedLocation(location);
    setShowLocationModal(false);
    setLocationSearch("");
  };

  // ============================================================
  // SAVE CUSTOM LOCATION
  // ============================================================

  const handleSaveCustomLocation = () => {
    const trimmedLocation =
      customLocation.trim();

    if (!trimmedLocation) {
      alert(
        "Please enter your campus location."
      );
      return;
    }

    localStorage.setItem(
      "campusEatsDeliveryLocation",
      trimmedLocation
    );

    setSelectedLocation(trimmedLocation);
    setCustomLocation("");
    setShowLocationModal(false);
    setLocationSearch("");
  };

  // ============================================================
  // FILTER FOOD
  // ============================================================

  const filteredFoodItems = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return foodItems.filter((item) => {
      // Search filter
      const matchesSearch =
        search === "" ||
        item.name
          ?.toLowerCase()
          .includes(search) ||
        item.category
          ?.toLowerCase()
          .includes(search) ||
        item.vendorName
          ?.toLowerCase()
          .includes(search);

      // Category filter
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      // Budget filter
      const matchesBudget =
        budgetFilter === null ||
        Number(item.price) <= budgetFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBudget
      );
    });
  }, [
    foodItems,
    searchTerm,
    selectedCategory,
    budgetFilter,
  ]);

  // ============================================================
  // FILTER LOCATIONS
  // ============================================================

  const filteredLocations =
    CAMPUS_LOCATIONS.filter((location) =>
      location
        .toLowerCase()
        .includes(
          locationSearch
            .trim()
            .toLowerCase()
        )
    );

  // ============================================================
  // CLEAR ALL FILTERS
  // ============================================================

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setBudgetFilter(null);
  };

  // ============================================================
  // OPEN UNDER ₹100
  // ============================================================

  const handleBudgetFilter = () => {
    setBudgetFilter(100);
    setSearchTerm("");
    setSelectedCategory("All");

    setTimeout(() => {
      document
        .getElementById("popular-food")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-24">

      <div className="mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#f7f7f5]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="bg-white px-5 pb-5 pt-5">

          {/* TOP BAR */}

          <div className="flex items-center justify-between">

            <button
              type="button"
              onClick={() =>
                setShowLocationModal(true)
              }
              className="flex min-w-0 items-center gap-2.5 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg">
                📍
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  Deliver to
                </p>

                <div className="mt-0.5 flex max-w-[210px] items-center gap-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {selectedLocation ||
                      "Select campus location"}
                  </p>

                  <span className="text-[9px] text-gray-400">
                    ▼
                  </span>
                </div>
              </div>
            </button>

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/notifications"
                )
              }
              aria-label="Open notifications"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-lg shadow-sm transition hover:bg-gray-100 active:scale-95"
            >
              🔔

              {unreadNotificationCount >
                0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotificationCount >
                  99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>

          {/* GREETING */}

          <div className="mt-7">
            <p className="text-sm font-medium text-gray-500">
              Good to see you 👋
            </p>

            <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-gray-950">
              Hi,{" "}
              {userProfile?.name ||
                "Student"}!
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Hungry? Let's find something
              delicious.
            </p>
          </div>

          {/* SEARCH */}

          <div className="mt-5 flex h-14 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 shadow-sm transition focus-within:border-orange-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">

            <span className="text-lg text-gray-400">
              🔍
            </span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(
                  event.target.value
                );

                // Remove budget mode
                // when user starts a new search.
                if (
                  event.target.value.trim()
                ) {
                  setBudgetFilter(null);
                }
              }}
              placeholder="Search food, dishes or canteens"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="space-y-8 px-5 pt-5">

          {/* ==================================================
              HERO
          ================================================== */}

          {!searchTerm &&
            selectedCategory === "All" &&
            budgetFilter === null && (
              <section>
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ff7a18] via-[#ff6a00] to-[#ff9f43] p-5 text-white shadow-lg shadow-orange-100">

                  {/* DECORATION */}

                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />

                  <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10" />

                  <div className="absolute right-6 top-8 text-5xl opacity-20">
                    🍔
                  </div>

                  <div className="absolute bottom-5 right-10 text-4xl opacity-20">
                    🥤
                  </div>

                  <div className="relative">

                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                      CampusEats
                    </span>

                    <h2 className="mt-4 max-w-[250px] text-[25px] font-extrabold leading-tight">
                      Good food.
                      <br />
                      Right on campus.
                    </h2>

                    <p className="mt-3 max-w-[250px] text-xs leading-5 text-orange-50">
                      Discover food from your
                      campus kitchens, canteens
                      and cafés.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById(
                            "popular-food"
                          )
                          ?.scrollIntoView({
                            behavior: "smooth",
                          });
                      }}
                      className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 active:scale-95"
                    >
                      Explore Food →
                    </button>
                  </div>
                </div>
              </section>
            )}

          {/* ==================================================
              QUICK CATEGORIES
          ================================================== */}

          <section>

            <div className="mb-4 flex items-end justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">
                  Explore
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-gray-950">
                  What are you craving?
                </h2>
              </div>

              {(selectedCategory !== "All" ||
                budgetFilter !== null ||
                searchTerm) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {/* ALL */}

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setBudgetFilter(null);
                }}
                className={`flex min-w-[74px] shrink-0 flex-col items-center gap-2 rounded-2xl border p-2.5 transition active:scale-95 ${
                  selectedCategory === "All" &&
                  budgetFilter === null
                    ? "border-orange-200 bg-orange-50 shadow-sm"
                    : "border-transparent bg-white"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    selectedCategory === "All" &&
                    budgetFilter === null
                      ? "bg-orange-500"
                      : "bg-gray-50"
                  }`}
                >
                  🍽️
                </span>

                <span className="text-[10px] font-bold text-gray-700">
                  All
                </span>
              </button>

              {/* CATEGORIES */}

              {categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  icon={category.icon}
                  name={category.name}
                  selected={
                    selectedCategory ===
                      category.name &&
                    budgetFilter === null
                  }
                  onClick={() => {
                    setSelectedCategory(
                      category.name
                    );

                    setBudgetFilter(null);
                  }}
                />
              ))}
            </div>
          </section>

          {/* ==================================================
              ACTIVE BUDGET FILTER
          ================================================== */}

          {budgetFilter !== null && (
            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                  💰
                </span>

                <div>
                  <p className="text-xs font-bold text-orange-700">
                    Budget Filter
                  </p>

                  <p className="text-sm font-extrabold text-gray-900">
                    Items under ₹
                    {budgetFilter}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBudgetFilter(null)
                }
                className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm"
              >
                Remove
              </button>
            </div>
          )}

          {/* ==================================================
              FOOD
          ================================================== */}

          <section id="popular-food">

            <div className="mb-4 flex items-end justify-between gap-3">

              <div className="min-w-0">

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">
                  Fresh & tasty
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-gray-950">

                  {budgetFilter !== null
                    ? `Food Under ₹${budgetFilter}`
                    : searchTerm
                    ? "Search Results"
                    : selectedCategory !==
                      "All"
                    ? selectedCategory
                    : "Popular Near You 🔥"}

                </h2>

                <p className="mt-1 text-xs text-gray-500">

                  {budgetFilter !== null
                    ? "Delicious options within your budget"
                    : searchTerm
                    ? `Results for "${searchTerm}"`
                    : selectedCategory !==
                      "All"
                    ? "Available food items"
                    : "Food available on campus"}

                </p>
              </div>

              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm">
                {filteredFoodItems.length}{" "}
                {filteredFoodItems.length ===
                1
                  ? "item"
                  : "items"}
              </span>
            </div>

            {/* ==================================================
                LOADING
            ================================================== */}

            {foodLoading && (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                  <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-500" />
                </div>

                <p className="mt-4 text-sm font-bold text-gray-800">
                  Finding delicious food...
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Loading today's campus menu
                </p>
              </div>
            )}

            {/* ==================================================
                ERROR
            ================================================== */}

            {foodError && (
              <div className="rounded-3xl bg-white p-7 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                  ⚠️
                </div>

                <h3 className="mt-4 text-sm font-bold text-gray-900">
                  Menu unavailable
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {foodError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="mt-5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ==================================================
                EMPTY
            ================================================== */}

            {!foodLoading &&
              !foodError &&
              filteredFoodItems.length ===
                0 && (
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-3xl">
                    {budgetFilter !== null
                      ? "💰"
                      : "🔍"}
                  </div>

                  <h3 className="mt-4 text-base font-bold text-gray-900">

                    {budgetFilter !== null
                      ? `No food found under ₹${budgetFilter}`
                      : "No food found"}

                  </h3>

                  <p className="mx-auto mt-1 max-w-[250px] text-xs leading-5 text-gray-500">

                    {budgetFilter !== null
                      ? "Try increasing your budget or explore the complete menu."
                      : "Try another dish, canteen or category."}

                  </p>

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Explore All Food
                  </button>
                </div>
              )}

            {/* ==================================================
                FOOD CARDS
            ================================================== */}

            {!foodLoading &&
              !foodError &&
              filteredFoodItems.length >
                0 && (
                <div className="space-y-4">

                  {filteredFoodItems.map(
                    (item) => (
                      <FoodCard
                        key={item.id}
                        image={item.imageUrl}
                        name={item.name}
                        price={item.price}
                        rating={
                          foodRatings[item.id]
                            ?.rating || 0
                        }
                        time={item.prepTime}
                        available={
                          item.available
                        }
                        onViewDetails={() =>
                          navigate(
                            `/student/food/${item.id}`
                          )
                        }
                        onAddToCart={() =>
                          handleAddToCart(
                            item
                          )
                        }
                        addingToCart={
                          addingToCart ===
                          item.id
                        }
                      />
                    )
                  )}

                </div>
              )}
          </section>

          {/* ==================================================
              BUDGET FINDER
          ================================================== */}

          {!searchTerm &&
            selectedCategory === "All" &&
            budgetFilter === null && (
              <section>

                <div className="relative overflow-hidden rounded-3xl bg-[#fff4e8] p-5">

                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-100" />

                  <div className="relative flex items-center justify-between gap-4">

                    <div>

                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">
                        Smart feature
                      </span>

                      <h2 className="mt-2 text-lg font-extrabold text-gray-950">
                        Food under ₹100
                      </h2>

                      <p className="mt-1 max-w-[220px] text-xs leading-5 text-gray-500">
                        Find tasty meals that fit
                        your student budget.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleBudgetFilter
                        }
                        className="mt-4 font-bold text-orange-600 transition hover:text-orange-700 active:scale-95"
                      >
                        Find Food →
                      </button>
                    </div>

                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                      💰
                    </div>

                  </div>
                </div>
              </section>
            )}

          {/* ==================================================
                ACCOUNT / LOGOUT
              ================================================== */}

              <section>
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                        👤
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400">
                          Logged in as
                        </p>

                        <p className="mt-0.5 truncate text-sm font-bold text-gray-900">
                          {user?.email || "Student"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="shrink-0 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                    >
                      Logout
                    </button>

                  </div>
                </div>
              </section>

      {/* BOTTOM SPACING */}
      
      <div className="h-2" />

        </main>
      </div>

      {/* ======================================================
          LOCATION MODAL
      ====================================================== */}

      {showLocationModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:px-4"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowLocationModal(false);
              setLocationSearch("");
              setCustomLocation("");
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-[30px] bg-white shadow-2xl sm:rounded-[30px]">

            {/* MODAL HEADER */}

            <div className="border-b border-gray-100 px-5 pb-5 pt-5">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                      📍
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-500">
                      Delivery Location
                    </span>

                  </div>

                  <h2 className="mt-3 text-xl font-extrabold text-gray-950">
                    Where should we deliver?
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Select your campus destination.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    setLocationSearch("");
                    setCustomLocation("");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500"
                >
                  ✕
                </button>

              </div>

              {/* LOCATION SEARCH */}

              <div className="mt-5 flex h-12 items-center gap-3 rounded-xl bg-gray-50 px-4 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">

                <span className="text-gray-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={locationSearch}
                  onChange={(event) =>
                    setLocationSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search campus location..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />

                {locationSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setLocationSearch("")
                    }
                    className="text-xs text-gray-400"
                  >
                    ✕
                  </button>
                )}

              </div>
            </div>

            {/* LOCATION LIST */}

            <div className="max-h-[58vh] overflow-y-auto px-5 pb-5">

              {/* CURRENT LOCATION */}

              {selectedLocation && (
                <div className="mt-4 rounded-2xl bg-orange-50 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">
                    Current location
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span>📍</span>

                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">
                      {selectedLocation}
                    </p>

                    <span className="text-sm font-bold text-orange-500">
                      ✓
                    </span>

                  </div>
                </div>
              )}

              <div className="mt-4">

                {filteredLocations.map(
                  (location) => {

                    const isSelected =
                      selectedLocation ===
                      location;

                    // CUSTOM LOCATION
                    if (
                      location ===
                      "Other / Custom Location"
                    ) {
                      return (
                        <div
                          key={location}
                          className="mt-4 border-t border-gray-100 pt-5"
                        >

                          <p className="text-sm font-bold text-gray-900">
                            Other / Custom Location
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Enter another campus destination.
                          </p>

                          <div className="mt-3 flex gap-2">

                            <input
                              type="text"
                              value={
                                customLocation
                              }
                              onChange={(
                                event
                              ) =>
                                setCustomLocation(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Enter location"
                              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                            />

                            <button
                              type="button"
                              onClick={
                                handleSaveCustomLocation
                              }
                              className="rounded-xl bg-orange-500 px-4 text-sm font-bold text-white"
                            >
                              Save
                            </button>

                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={location}
                        type="button"
                        onClick={() =>
                          handleSelectLocation(
                            location
                          )
                        }
                        className={`mb-2.5 flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] ${
                          isSelected
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                        }`}
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isSelected
                                ? "bg-orange-100"
                                : "bg-gray-50"
                            }`}
                          >
                            📍
                          </span>

                          <span
                            className={`truncate text-sm ${
                              isSelected
                                ? "font-bold text-gray-900"
                                : "font-medium text-gray-700"
                            }`}
                          >
                            {location}
                          </span>

                        </div>

                        {isSelected && (
                          <span className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            ✓
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

                {/* NO LOCATION */}

                {filteredLocations.length ===
                  0 && (
                  <div className="py-10 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-2xl">
                      📍
                    </div>

                    <p className="mt-3 text-sm font-bold text-gray-800">
                      No location found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Try another campus location.
                    </p>

                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BOTTOM NAVIGATION
      ====================================================== */}

      <BottomNavigation />

    </div>
  );
}

export default Home;