import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getFavorites,
  removeFromFavorites,
} from "../../services/favoriteService";

import { addToCart } from "../../services/cartService";

function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);

  const [removingItem, setRemovingItem] =
    useState("");

  const [addingToCart, setAddingToCart] =
    useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  /*
    Load favorites from Firebase
  */
  const loadFavorites = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const favoriteData =
        await getFavorites(user.uid);

      setFavorites(
        favoriteData.items || []
      );
    } catch (error) {
      console.error(
        "Load favorites error:",
        error
      );

      setError(
        "Unable to load your favorites."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    Load when page opens
  */
  useEffect(() => {
    loadFavorites();
  }, [user?.uid]);

  /*
    Remove favorite
  */
  const handleRemoveFavorite =
    async (foodId) => {
      try {
        setRemovingItem(foodId);

        setError("");
        setSuccess("");

        const updatedFavorites =
          await removeFromFavorites(
            user.uid,
            foodId
          );

        setFavorites(
          updatedFavorites.items || []
        );

        setSuccess(
          "Removed from favorites."
        );
      } catch (error) {
        console.error(
          "Remove favorite error:",
          error
        );

        setError(
          error.message ||
            "Unable to remove favorite."
        );
      } finally {
        setRemovingItem("");
      }
    };

  /*
    Add favorite item to cart
  */
  const handleAddToCart =
    async (item) => {
      try {
        setAddingToCart(
          item.foodId
        );

        setError("");
        setSuccess("");

        await addToCart(
          user.uid,
          {
            id: item.foodId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            vendorId: item.vendorId,
            vendorName:
              item.vendorName,
            category:
              item.category,
            rating: item.rating,
            preparationTime:
              item.preparationTime,
            available:
              item.available,
          },
          1
        );

        setSuccess(
          `${item.name} added to your cart!`
        );
      } catch (error) {
        console.error(
          "Add favorite to cart error:",
          error
        );

        setError(
          error.message ||
            "Unable to add item to cart."
        );
      } finally {
        setAddingToCart("");
      }
    };

  /*
    Loading
  */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-gray-900">
              Loading your favorites
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Finding your saved food...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-28">

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 active:scale-95"
              aria-label="Go back"
            >
              ←
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                CampusEats
              </p>

              <h1 className="mt-0.5 text-xl font-black tracking-tight text-gray-900">
                My Favorites ❤️
              </h1>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">
              ♥
            </div>

          </div>

          {/* Saved count */}

          <div className="mt-4 flex items-center gap-2">

            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
              {favorites.length}{" "}
              {favorites.length === 1
                ? "saved item"
                : "saved items"}
            </span>

            {favorites.length > 0 && (
              <span className="text-xs text-gray-400">
                Your favorite picks
              </span>
            )}

          </div>

        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5">

        {/* ================= SUCCESS ================= */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-green-100 bg-green-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-green-600">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-green-700">
                Success
              </p>

              <p className="mt-1 text-xs leading-5 text-green-600">
                {success}
              </p>
            </div>

            {success.includes(
              "added to your cart"
            ) && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student/cart"
                  )
                }
                className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-green-700 shadow-sm transition hover:bg-green-100 active:scale-95"
              >
                View Cart
              </button>
            )}

          </div>
        )}

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-red-600">
              !
            </div>

            <div>
              <p className="text-sm font-extrabold text-red-700">
                Something went wrong
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* ================= EMPTY ================= */}

        {favorites.length === 0 && (
          <div className="rounded-3xl border border-gray-100 bg-white px-7 py-12 text-center shadow-sm">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50 text-5xl">
              ❤️
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-wider text-orange-500">
              Your saved food
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
              No favorites yet
            </h2>

            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-500">
              Save the food you love and access your favorite campus meals quickly from here.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="mt-7 w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Browse Food
            </button>

          </div>
        )}

        {/* ================= FAVORITES ================= */}

        {favorites.length > 0 && (
          <div className="space-y-4">

            {favorites.map((item) => (

              <article
                key={item.foodId}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >

                <div className="p-4">

                  {/* ================= FOOD HEADER ================= */}

                  <div className="flex gap-4">

                    {/* IMAGE */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/student/food/${item.foodId}`
                        )
                      }
                      className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100"
                    >

                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}

                      {/* Favorite badge */}

                      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-sm text-red-500 shadow-sm">
                        ♥
                      </div>

                    </button>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/student/food/${item.foodId}`
                            )
                          }
                          className="min-w-0 text-left"
                        >

                          <h3 className="truncate text-base font-black text-gray-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 truncate text-xs font-medium text-gray-500">
                            {item.vendorName ||
                              "Campus Vendor"}
                          </p>

                        </button>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveFavorite(
                              item.foodId
                            )
                          }
                          disabled={
                            removingItem ===
                            item.foodId
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Remove favorite"
                        >
                          {removingItem ===
                          item.foodId ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                          ) : (
                            "♥"
                          )}
                        </button>

                      </div>

                      {/* INFO */}

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-orange-600">
                          ₹{item.price}
                        </span>

                        <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700">
                          ⭐{" "}
                          {item.rating ||
                            "New"}
                        </span>

                        {item.preparationTime && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                            ⏱{" "}
                            {item.preparationTime}{" "}
                            min
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* ================= AVAILABILITY ================= */}

                  <div className="mt-4">

                    {item.available === false ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-3">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />

                        <span className="text-xs font-bold text-gray-500">
                          Currently unavailable
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-3.5 py-3">
                        <span className="h-2 w-2 rounded-full bg-green-500" />

                        <span className="text-xs font-bold text-green-700">
                          Available to order
                        </span>
                      </div>
                    )}

                  </div>

                  {/* ================= ACTIONS ================= */}

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/student/food/${item.foodId}`
                        )
                      }
                      className="rounded-2xl border border-gray-200 bg-white py-3 text-xs font-extrabold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(
                          item
                        )
                      }
                      disabled={
                        addingToCart ===
                          item.foodId ||
                        item.available ===
                          false
                      }
                      className="rounded-2xl bg-orange-500 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {addingToCart ===
                      item.foodId ? (
                        <span className="flex items-center justify-center gap-2">

                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                          Adding...

                        </span>
                      ) : item.available ===
                        false ? (
                        "Unavailable"
                      ) : (
                        "🛒 Add to Cart"
                      )}
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>
        )}

      </main>
    </div>
  );
}

export default Favorites;