import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getCart,
  clearCart,
} from "../../services/cartService";

import { createOrder } from "../../services/orderService";

import {
  getOfferByCouponCode,
  calculateOfferDiscount,
} from "../../services/offerService";

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

function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* =========================================================
     CART
  ========================================================= */

  const [cart, setCart] = useState(null);

  /* =========================================================
     ORDER
  ========================================================= */

  const [orderType, setOrderType] = useState("Delivery");

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    return (
      localStorage.getItem("campusEatsDeliveryLocation") || ""
    );
  });

  const [customLocation, setCustomLocation] = useState("");

  const [specialInstructions, setSpecialInstructions] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  /* =========================================================
     COUPON / OFFER
  ========================================================= */

  const [couponCode, setCouponCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");

  /* =========================================================
     LOADING
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD CART
  ========================================================= */

  useEffect(() => {
    const loadCart = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const cartData = await getCart(user.uid);

        if (!cartData?.items?.length) {
          navigate("/student/cart");
          return;
        }

        setCart(cartData);
      } catch (error) {
        console.error("Checkout cart error:", error);
        setError("Unable to load your cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user?.uid, navigate]);

  /* =========================================================
     CALCULATE SUBTOTAL
  ========================================================= */

  const subtotal =
    cart?.items?.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    ) || 0;

  /* =========================================================
     DELIVERY FEE
  ========================================================= */

  const deliveryFee = orderType === "Delivery" ? 20 : 0;

  /* =========================================================
     FINAL TOTAL
  ========================================================= */

  const finalTotal = Math.max(
    0,
    subtotal + deliveryFee - discount
  );

  /* =========================================================
     APPLY COUPON
  ========================================================= */

  const handleApplyCoupon = async () => {
    try {
      setCouponError("");
      setCouponMessage("");
      setAppliedOffer(null);
      setDiscount(0);

      const code = couponCode.trim().toUpperCase();

      if (!code) {
        setCouponError("Please enter a coupon code.");
        return;
      }

      if (subtotal <= 0) {
        setCouponError("Your cart is empty.");
        return;
      }

      setCouponLoading(true);

      console.log("Applying coupon:", code);

      const offer = await getOfferByCouponCode(code);

      console.log("Offer found:", offer);

      if (!offer) {
        throw new Error(
          "Invalid or inactive coupon code."
        );
      }

      const minimumOrder = Number(
        offer.minimumOrder || 0
      );

      if (subtotal < minimumOrder) {
        throw new Error(
          `Minimum order of ₹${minimumOrder} is required for this coupon.`
        );
      }

      const calculatedDiscount =
        calculateOfferDiscount(
          offer,
          subtotal
        );

      console.log(
        "Calculated discount:",
        calculatedDiscount
      );

      if (
        !calculatedDiscount ||
        calculatedDiscount <= 0
      ) {
        throw new Error(
          "This coupon does not provide a discount for this order."
        );
      }

      setAppliedOffer(offer);
      setDiscount(calculatedDiscount);

      setCouponMessage(
        `Coupon applied! You saved ₹${calculatedDiscount}.`
      );
    } catch (error) {
      console.error(
        "Apply coupon error:",
        error
      );

      setAppliedOffer(null);
      setDiscount(0);

      setCouponError(
        error.message ||
          "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  /* =========================================================
     REMOVE COUPON
  ========================================================= */

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setDiscount(0);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  const handlePlaceOrder = async () => {
    try {
      setError("");

      if (!cart?.items?.length) {
        setError("Your cart is empty.");
        return;
      }

      if (
        orderType === "Delivery" &&
        !deliveryLocation
      ) {
        setError(
          "Please select a delivery location."
        );
        return;
      }

      let finalLocation = deliveryLocation;

      if (
        deliveryLocation ===
        "Other / Custom Location"
      ) {
        finalLocation =
          customLocation.trim();

        if (!finalLocation) {
          setError(
            "Please enter your custom location."
          );
          return;
        }
      }

      setPlacingOrder(true);

      const order = await createOrder({
        userId: user.uid,
        cart,
        orderType,
        deliveryLocation: finalLocation,
        specialInstructions,
        paymentMethod,
        couponCode: appliedOffer
          ? couponCode.trim().toUpperCase()
          : "",
        offerId: appliedOffer?.id || "",
      });

      await clearCart(user.uid);

      navigate(
        `/student/order-confirmation/${order.id}`
      );
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      setError(
        error.message ||
          "Unable to place your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              Preparing checkout
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Loading your cart...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-36">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">

          <button
            type="button"
            onClick={() =>
              navigate("/student/cart")
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg text-gray-700 transition hover:bg-gray-200 active:scale-95"
            aria-label="Back to cart"
          >
            ←
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-gray-900">
                Checkout
              </h1>

              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                Secure
              </span>
            </div>

            <p className="mt-0.5 text-xs text-gray-500">
              Complete your CampusEats order
            </p>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-md space-y-4 px-5 pt-5">

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm">
              !
            </div>

            <div>
              <p className="text-sm font-bold text-red-700">
                Something went wrong
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            ORDER TYPE
        =================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Step 1
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-gray-900">
              How do you want your food?
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose delivery or pickup.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">

            {/* DELIVERY */}

            <button
              type="button"
              onClick={() =>
                setOrderType("Delivery")
              }
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                orderType === "Delivery"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              {orderType === "Delivery" && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  ✓
                </div>
              )}

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${
                  orderType === "Delivery"
                    ? "bg-white"
                    : "bg-white"
                }`}
              >
                🛵
              </div>

              <p className="mt-3 text-sm font-extrabold text-gray-900">
                Delivery
              </p>

              <p className="mt-1 text-xs text-gray-500">
                ₹20 delivery fee
              </p>
            </button>

            {/* PICKUP */}

            <button
              type="button"
              onClick={() =>
                setOrderType("Pickup")
              }
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                orderType === "Pickup"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              {orderType === "Pickup" && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  ✓
                </div>
              )}

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl">
                🥡
              </div>

              <p className="mt-3 text-sm font-extrabold text-gray-900">
                Pickup
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No delivery fee
              </p>
            </button>
          </div>
        </section>

        {/* ===================================================
            DELIVERY LOCATION
        =================================================== */}

        {orderType === "Delivery" && (
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                📍
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Delivery
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                  Where should we deliver?
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select your campus location.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">

              {CAMPUS_LOCATIONS.map(
                (location) => (
                  <label
                    key={location}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${
                      deliveryLocation === location
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >

                    <input
                      type="radio"
                      name="deliveryLocation"
                      value={location}
                      checked={
                        deliveryLocation ===
                        location
                      }
                      onChange={(event) => {
                        const selectedLocation =
                          event.target.value;

                        setDeliveryLocation(
                          selectedLocation
                        );

                        localStorage.setItem(
                          "campusEatsDeliveryLocation",
                          selectedLocation
                        );
                      }}
                      className="h-4 w-4 accent-orange-500"
                    />

                    <span
                      className={`text-sm ${
                        deliveryLocation ===
                        location
                          ? "font-bold text-gray-900"
                          : "font-medium text-gray-700"
                      }`}
                    >
                      {location}
                    </span>

                    {deliveryLocation ===
                      location && (
                      <span className="ml-auto text-sm font-bold text-orange-500">
                        ✓
                      </span>
                    )}
                  </label>
                )
              )}
            </div>

            {/* CUSTOM LOCATION */}

            {deliveryLocation ===
              "Other / Custom Location" && (
              <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">

                <label className="text-sm font-bold text-gray-800">
                  Enter your location
                </label>

                <textarea
                  value={customLocation}
                  onChange={(event) =>
                    setCustomLocation(
                      event.target.value
                    )
                  }
                  placeholder="Example: Near Computer Lab, 2nd Floor"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Give a clear landmark so the delivery staff can find you.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ===================================================
            SPECIAL INSTRUCTIONS
        =================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
              📝
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Special Instructions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Optional · Tell the canteen anything important.
              </p>
            </div>
          </div>

          <textarea
            value={specialInstructions}
            onChange={(event) =>
              setSpecialInstructions(
                event.target.value
              )
            }
            placeholder="Example: Less spicy, no onions..."
            rows={3}
            maxLength={250}
            className="mt-4 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />

          <div className="mt-2 flex justify-between">
            <p className="text-xs text-gray-400">
              Your request will be shared with the vendor.
            </p>

            <p className="text-xs font-medium text-gray-400">
              {specialInstructions.length}/250
            </p>
          </div>
        </section>

        {/* ===================================================
            OFFERS & COUPONS
        =================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              🎁
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Offers & Coupons
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Apply a coupon and save on your order.
              </p>
            </div>
          </div>

          {/* APPLIED OFFER */}

          {appliedOffer ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-green-200 bg-green-50">

              <div className="flex items-start gap-3 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-lg">
                  ✓
                </div>

                <div className="min-w-0 flex-1">

                  <p className="font-extrabold text-green-700">
                    {appliedOffer.offerName}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-green-700">
                      {appliedOffer.couponCode}
                    </span>

                    <span className="text-xs text-green-600">
                      Coupon applied
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-green-700">
                    You saved ₹{discount}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleRemoveCoupon
                  }
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-100 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 flex gap-2">

                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(
                      event.target.value.toUpperCase()
                    );

                    setCouponError("");
                    setCouponMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleApplyCoupon();
                    }
                  }}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-gray-800 outline-none transition placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={
                    handleApplyCoupon
                  }
                  disabled={couponLoading}
                  className="rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {couponLoading
                    ? "..."
                    : "Apply"}
                </button>
              </div>

              {couponError && (
                <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm font-medium text-red-600">
                  {couponError}
                </div>
              )}

              {couponMessage && (
                <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-3.5 text-sm font-medium text-green-700">
                  {couponMessage}
                </div>
              )}
            </>
          )}
        </section>

        {/* ===================================================
            PAYMENT METHOD
        =================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-xl">
              💳
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Payment Method
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose how you'll pay for your order.
              </p>
            </div>
          </div>

          {/* COD */}

          <div className="mt-5 rounded-2xl border-2 border-orange-500 bg-orange-50 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                💵
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-gray-900">
                    Cash on Delivery
                  </p>

                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-orange-600">
                    Available
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Pay when your food arrives.
                </p>
              </div>

              <input
                type="radio"
                checked={
                  paymentMethod ===
                  "Cash on Delivery"
                }
                onChange={() =>
                  setPaymentMethod(
                    "Cash on Delivery"
                  )
                }
                className="h-5 w-5 accent-orange-500"
              />
            </div>
          </div>

          {/* ONLINE PAYMENT */}

          <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 opacity-75">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                💳
              </div>

              <div className="min-w-0 flex-1">

                <p className="font-bold text-gray-500">
                  Online Payment
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Online payments will be available soon.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-gray-500">
                Soon
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================
            ORDER SUMMARY
        =================================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Final review
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-gray-900">
                Order Summary
              </h2>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
              {cart.items.length}{" "}
              {cart.items.length === 1
                ? "item"
                : "items"}
            </span>
          </div>

          {/* ITEMS */}

          <div className="mt-5 space-y-3">

            {cart.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3"
                >

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                    🍽️
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-bold text-gray-800">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.quantity} × ₹
                      {item.price}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-extrabold text-gray-900">
                    ₹
                    {Number(item.price) *
                      Number(item.quantity)}
                  </p>
                </div>
              )
            )}
          </div>

          {/* BILL */}

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-5 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-800">
                ₹{subtotal}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-green-600">
                  Discount
                </span>

                <span className="font-bold text-green-600">
                  -₹{discount}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-500">
                Delivery Fee
              </span>

              <span className="font-semibold text-gray-800">
                ₹{deliveryFee}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">

              <div>
                <p className="text-base font-extrabold text-gray-900">
                  Total
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                  Inclusive of applicable charges
                </p>
              </div>

              <p className="text-2xl font-black text-orange-500">
                ₹{finalTotal}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* =====================================================
          STICKY PLACE ORDER BAR
      ===================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 px-5 py-3 backdrop-blur">

        <div className="mx-auto flex max-w-md items-center gap-3">

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total payable
            </p>

            <p className="text-lg font-black text-gray-900">
              ₹{finalTotal}
            </p>
          </div>

          <button
            type="button"
            disabled={placingOrder}
            onClick={handlePlaceOrder}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            {placingOrder ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Placing Order...
              </>
            ) : (
              <>
                Place Order
                <span className="text-orange-200">
                  •
                </span>
                ₹{finalTotal}
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

export default Checkout;