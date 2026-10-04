import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
} from "../../services/cartService";

function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [error, setError] = useState("");

  // ==================================================
  // LOAD CART
  // ==================================================

  useEffect(() => {
    const loadCart = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const cartData = await getCart(user.uid);

        setCart(cartData);
      } catch (error) {
        console.error("Cart loading error:", error);

        setError("Unable to load your cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user?.uid]);

  // ==================================================
  // INCREASE QUANTITY
  // ==================================================

  const handleIncrease = async (item) => {
    try {
      setUpdatingItem(item.id);
      setError("");

      const updatedCart =
        await updateCartItemQuantity(
          user.uid,
          item.id,
          item.quantity + 1
        );

      setCart(updatedCart);
    } catch (error) {
      console.error(error);

      setError("Unable to update quantity.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ==================================================
  // DECREASE QUANTITY
  // ==================================================

  const handleDecrease = async (item) => {
    try {
      setUpdatingItem(item.id);
      setError("");

      const newQuantity = item.quantity - 1;

      if (newQuantity <= 0) {
        const updatedCart =
          await removeFromCart(
            user.uid,
            item.id
          );

        setCart(updatedCart);

        return;
      }

      const updatedCart =
        await updateCartItemQuantity(
          user.uid,
          item.id,
          newQuantity
        );

      setCart(updatedCart);
    } catch (error) {
      console.error(error);

      setError("Unable to update quantity.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ==================================================
  // REMOVE ITEM
  // ==================================================

  const handleRemove = async (itemId) => {
    try {
      setUpdatingItem(itemId);
      setError("");

      const updatedCart =
        await removeFromCart(
          user.uid,
          itemId
        );

      setCart(updatedCart);
    } catch (error) {
      console.error(error);

      setError("Unable to remove item.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">
        <header className="border-b border-orange-100/70 bg-[#fffaf5] px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-200" />

            <div className="h-6 w-24 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-11 w-20 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </header>

        <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-200" />

                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />

                  <div className="h-9 w-28 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            </div>
          ))}

          <div className="h-48 animate-pulse rounded-3xl bg-gray-200" />
        </main>
      </div>
    );
  }

  // ==================================================
  // EMPTY CART
  // ==================================================

  if (!cart.items?.length) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">
        {/* Header */}

        <header className="sticky top-0 z-40 border-b border-orange-100/70 bg-[#fffaf5]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl text-gray-700 shadow-sm transition hover:bg-orange-50 active:scale-95"
                aria-label="Back to home"
              >
                ←
              </button>

              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  My Cart
                </h1>

                <p className="text-xs font-medium text-gray-400">
                  Your campus food basket
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State */}

        <main className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="w-full max-w-md text-center">
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] bg-orange-50">
              <span className="text-6xl">🛒</span>

              <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm text-white shadow-sm">
                +
              </div>
            </div>

            <h2 className="mt-7 text-2xl font-extrabold tracking-tight text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
              Looks like you haven't added any
              delicious campus food yet.
            </p>

            <button
              type="button"
              onClick={() => navigate("/student")}
              className="mt-7 rounded-2xl bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-95"
            >
              Browse Food →
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==================================================
  // MAIN CART
  // ==================================================

  return (
    <div className="min-h-screen bg-[#fffaf5] pb-40">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-40 border-b border-orange-100/70 bg-[#fffaf5]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Back */}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 active:scale-95"
              aria-label="Go back"
            >
              ←
            </button>

            {/* Title */}

            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                My Cart 🛒
              </h1>

              <p className="mt-0.5 text-xs font-medium text-gray-400">
                {cart.items.length}{" "}
                {cart.items.length === 1
                  ? "item"
                  : "items"}{" "}
                in your basket
              </p>
            </div>

            {/* Add More */}

            <button
              type="button"
              onClick={() => navigate("/student")}
              className="shrink-0 rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-100 active:scale-95"
            >
              + Add
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 font-bold text-white">
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
            CART ITEMS
        ================================================== */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Your selection
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                Cart Items
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm">
              {cart.items.length} items
            </span>
          </div>

          <div className="space-y-3">
            {cart.items.map((item) => {
              const itemTotal =
                Number(item.price) *
                Number(item.quantity);

              const isUpdating =
                updatingItem === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition ${
                    isUpdating
                      ? "opacity-70"
                      : "hover:shadow-md"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* IMAGE */}

                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-extrabold text-gray-900">
                            {item.name}
                          </h3>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-xs">
                              🏪
                            </span>

                            <p className="truncate text-xs font-semibold text-gray-500">
                              {item.vendorName ||
                                "Campus Vendor"}
                            </p>
                          </div>

                          <p className="mt-2 text-sm font-bold text-orange-600">
                            ₹{item.price}
                            <span className="ml-1 text-[11px] font-medium text-gray-400">
                              each
                            </span>
                          </p>
                        </div>

                        {/* ITEM TOTAL */}

                        <p className="shrink-0 text-base font-extrabold text-gray-900">
                          ₹{itemTotal}
                        </p>
                      </div>

                      {/* CONTROLS */}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-2xl bg-gray-100 p-1">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleDecrease(item)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                            aria-label={`Decrease ${item.name}`}
                          >
                            −
                          </button>

                          <span className="flex h-9 w-9 items-center justify-center text-sm font-extrabold text-gray-900">
                            {isUpdating ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                            ) : (
                              item.quantity
                            )}
                          </span>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleIncrease(item)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleRemove(item.id)
                          }
                          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>🗑️</span>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==================================================
            DELIVERY INFORMATION
        ================================================== */}

        <section className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              📍
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Delivery
              </p>

              <h3 className="mt-1 text-sm font-extrabold text-gray-900">
                Campus delivery available
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                Choose your delivery or pickup option
                during checkout.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            BILL DETAILS
        ================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
              🧾
            </div>

            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                Bill Details
              </h2>

              <p className="text-xs text-gray-400">
                Your current order summary
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* SUBTOTAL */}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Item Subtotal
              </span>

              <span className="font-semibold text-gray-900">
                ₹{cart.subtotal}
              </span>
            </div>

            {/* DELIVERY */}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  Delivery Fee
                </span>

                {Number(cart.deliveryFee) === 0 && (
                  <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                    FREE
                  </span>
                )}
              </div>

              <span className="font-semibold text-gray-900">
                ₹{cart.deliveryFee}
              </span>
            </div>

            {/* DIVIDER */}

            <div className="border-t border-dashed border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-extrabold text-gray-900">
                    Total
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Inclusive of current charges
                  </p>
                </div>

                <p className="text-2xl font-extrabold text-orange-600">
                  ₹{cart.total}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="h-2" />
      </main>

      {/* ==================================================
          STICKY CHECKOUT BAR
      ================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-orange-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {/* TOTAL */}

          <div className="min-w-0 flex-1 pl-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total
            </p>

            <p className="text-xl font-extrabold text-gray-900">
              ₹{cart.total}
            </p>
          </div>

          {/* CHECKOUT */}

          <button
            type="button"
            onClick={() =>
              navigate("/student/checkout")
            }
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-[0.98]"
          >
            Proceed to Checkout
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;