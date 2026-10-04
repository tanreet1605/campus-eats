import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getFoodItemById } from "../../services/foodService";
import { addToCart } from "../../services/cartService";

import {
  isFavorite,
  addToFavorites,
  removeFromFavorites,
} from "../../services/favoriteService";

const MAX_QUANTITY = 20;

function FoodDetails() {
  const { foodId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [isFoodFavorite, setIsFoodFavorite] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // LOAD FOOD DETAILS
  // ==================================================

  useEffect(() => {
    const loadFood = async () => {
      try {
        setLoading(true);
        setError("");

        const item = await getFoodItemById(foodId);

        if (!item) {
          setError("Food item not found.");
          return;
        }

        setFood(item);
      } catch (error) {
        console.error("Food details error:", error);

        setError("Unable to load food details.");
      } finally {
        setLoading(false);
      }
    };

    loadFood();
  }, [foodId]);

  // ==================================================
  // CHECK FAVORITE
  // ==================================================

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.uid || !foodId) {
        setIsFoodFavorite(false);
        return;
      }

      try {
        const favorite = await isFavorite(user.uid, foodId);

        setIsFoodFavorite(favorite);
      } catch (error) {
        console.error("Check favorite error:", error);
      }
    };

    checkFavorite();
  }, [user, foodId]);

  // ==================================================
  // QUANTITY
  // ==================================================

  const increaseQuantity = () => {
    setQuantity((current) =>
      current < MAX_QUANTITY ? current + 1 : current
    );

    setSuccess("");
    setError("");
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      current > 1 ? current - 1 : 1
    );

    setSuccess("");
    setError("");
  };

  // ==================================================
  // FAVORITE
  // ==================================================

  const handleFavorite = async () => {
    if (!user?.uid) {
      setError("Please login before using favorites.");
      return;
    }

    if (!food?.id) {
      setError("Food item information is missing.");
      return;
    }

    try {
      setFavoriteLoading(true);
      setError("");
      setSuccess("");

      if (isFoodFavorite) {
        await removeFromFavorites(user.uid, food.id);

        setIsFoodFavorite(false);

        setSuccess(`${food.name} removed from favorites.`);
      } else {
        await addToFavorites(user.uid, food);

        setIsFoodFavorite(true);

        setSuccess(`${food.name} added to favorites!`);
      }
    } catch (error) {
      console.error("Favorite error:", error);

      setError(
        error.message || "Unable to update favorites."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ==================================================
  // ADD TO CART
  // ==================================================

  const handleAddToCart = async () => {
    if (!user?.uid) {
      setError(
        "Please login before adding items to cart."
      );

      return;
    }

    if (!food?.available) {
      setError(
        "This food item is currently unavailable."
      );

      return;
    }

    if (
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      setError(
        `Quantity must be between 1 and ${MAX_QUANTITY}.`
      );

      return;
    }

    try {
      setAddingToCart(true);
      setError("");
      setSuccess("");

      await addToCart(user.uid, food, quantity);

      setSuccess(
        `${food.name} × ${quantity} added to your cart!`
      );
    } catch (error) {
      console.error("Add to cart error:", error);

      setError(
        error.message || "Unable to add item to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const totalPrice = food
    ? Number(food.price) * quantity
    : 0;

  // ==================================================
  // LOADING SCREEN
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">
        <div className="mx-auto max-w-2xl px-4 py-5">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-200" />

            <div className="h-6 w-28 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-200" />
          </div>

          {/* Image skeleton */}
          <div className="mt-5 h-72 animate-pulse rounded-[30px] bg-gray-200 sm:h-96" />

          {/* Content skeleton */}
          <div className="mt-6 space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-5 w-1/3 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-20 w-full animate-pulse rounded-2xl bg-gray-200" />

            <div className="h-28 w-full animate-pulse rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR / NOT FOUND
  // ==================================================

  if (error && !food) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
        <div className="w-full max-w-md rounded-[30px] border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
            🍽️
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-gray-900">
            {error}
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            We couldn't find the food item you're
            looking for.
          </p>

          <button
            type="button"
            onClick={() => navigate("/student")}
            className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div className="min-h-screen bg-[#fffaf5] pb-36">
      {/* ==================================================
          TOP HEADER
      ================================================== */}

      <header className="sticky top-0 z-40 border-b border-orange-100/70 bg-[#fffaf5]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 active:scale-95"
            aria-label="Go back"
          >
            ←
          </button>

          {/* TITLE */}

          <h1 className="text-sm font-extrabold text-gray-900 sm:text-base">
            Food Details
          </h1>

          {/* FAVORITE */}

          <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            aria-label={
              isFoodFavorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl shadow-sm transition active:scale-95 ${
              isFoodFavorite
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-gray-100 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {favoriteLoading ? (
              <span className="text-xs font-bold">
                ...
              </span>
            ) : (
              <span>
                {isFoodFavorite ? "♥" : "♡"}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="mx-auto max-w-2xl px-4 py-5">
        {/* ==================================================
            FOOD IMAGE
        ================================================== */}

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 shadow-sm">
          <div className="aspect-[4/3] w-full sm:aspect-[16/10]">
            {food.imageUrl ? (
              <img
                src={food.imageUrl}
                alt={food.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl">🍽️</div>

                  <p className="mt-3 text-xs font-semibold text-orange-500">
                    CampusEats
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Availability */}

          <div className="absolute left-4 top-4">
            <span
              className={`rounded-full px-3.5 py-2 text-xs font-bold shadow-sm backdrop-blur ${
                food.available
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {food.available
                ? "✓ Available"
                : "Sold Out"}
            </span>
          </div>

          {/* Category */}

          {food.category && (
            <div className="absolute bottom-4 left-4">
              <span className="rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-sm backdrop-blur">
                {food.category}
              </span>
            </div>
          )}
        </section>

        {/* ==================================================
            FOOD TITLE
        ================================================== */}

        <section className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
                {food.name}
              </h2>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm">🏪</span>

                <p className="truncate text-sm font-semibold text-gray-500">
                  {food.vendorName || "Campus Vendor"}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-orange-50 px-3 py-2 text-right">
              <p className="text-xs font-semibold text-orange-500">
                Price
              </p>

              <p className="text-xl font-extrabold text-orange-600">
                ₹{food.price}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            QUICK INFO
        ================================================== */}

        <section className="mt-5 grid grid-cols-3 gap-2.5">
          {/* Rating */}

          <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <div className="text-lg">⭐</div>

            <p className="mt-1 text-sm font-extrabold text-gray-900">
              {food.rating || "New"}
            </p>

            <p className="text-[10px] font-medium text-gray-400">
              Rating
            </p>
          </div>

          {/* Preparation */}

          <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <div className="text-lg">⏱️</div>

            <p className="mt-1 text-sm font-extrabold text-gray-900">
              {food.preparationTime || "--"} min
            </p>

            <p className="text-[10px] font-medium text-gray-400">
              Preparation
            </p>
          </div>

          {/* Category */}

          <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <div className="text-lg">🍴</div>

            <p className="mt-1 truncate text-sm font-extrabold text-gray-900">
              {food.category || "Other"}
            </p>

            <p className="text-[10px] font-medium text-gray-400">
              Category
            </p>
          </div>
        </section>

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {success && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-green-100 bg-green-50">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500 text-sm font-bold text-white">
                ✓
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-green-800">
                  Success
                </p>

                <p className="mt-0.5 text-xs leading-5 text-green-700">
                  {success}
                </p>
              </div>

              {success.includes(
                "added to your cart"
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/cart")
                  }
                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-green-700 shadow-sm transition hover:bg-green-100"
                >
                  View Cart
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-red-100 bg-red-50">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white">
                !
              </div>

              <div>
                <p className="text-sm font-bold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-0.5 text-xs leading-5 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <section className="mt-7 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
              📝
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                About this food
              </h3>

              <p className="text-xs text-gray-400">
                Food information
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            {food.description ||
              "No description available for this food item."}
          </p>
        </section>

        {/* ==================================================
            VENDOR INFORMATION
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
              🏪
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Sold by
              </h3>

              <p className="mt-0.5 text-sm font-semibold text-orange-600">
                {food.vendorName || "Campus Vendor"}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            FAVORITE
        ================================================== */}

        <section className="mt-4">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-bold transition active:scale-[0.99] ${
              isFoodFavorite
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="text-lg">
              {isFoodFavorite ? "♥" : "♡"}
            </span>

            {favoriteLoading
              ? "Updating..."
              : isFoodFavorite
              ? "Remove from Favorites"
              : "Add to Favorites"}
          </button>
        </section>

        {/* ==================================================
            QUANTITY
        ================================================== */}

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Quantity
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Maximum {MAX_QUANTITY} per item
              </p>
            </div>

            <p className="text-xs font-semibold text-gray-400">
              ₹{food.price} each
            </p>
          </div>

          <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Select quantity
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Adjust your order
              </p>
            </div>

            <div className="flex items-center rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span className="flex h-10 w-10 items-center justify-center text-sm font-extrabold text-gray-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={quantity >= MAX_QUANTITY}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {quantity >= MAX_QUANTITY && (
            <p className="mt-2 text-right text-xs font-semibold text-orange-600">
              Maximum quantity reached
            </p>
          )}
        </section>

        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}

        <section className="mt-7 rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                Order Summary
              </p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {food.name} × {quantity}
              </p>
            </div>

            <p className="text-xl font-extrabold text-orange-600">
              ₹{totalPrice}
            </p>
          </div>
        </section>

        <div className="h-4" />
      </main>

      {/* ==================================================
          STICKY BOTTOM CART BAR
      ================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-orange-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {/* TOTAL */}

          <div className="min-w-0 flex-1 pl-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Total
            </p>

            <p className="truncate text-xl font-extrabold text-gray-900">
              ₹{totalPrice}
            </p>
          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              !food.available || addingToCart
            }
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            {addingToCart ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Adding...
              </>
            ) : food.available ? (
              <>
                <span className="text-lg">🛒</span>

                Add to Cart
              </>
            ) : (
              "Sold Out"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodDetails;