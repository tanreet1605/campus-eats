import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getDeliveryOrderById,
} from "../../services/deliveryService";


function DeliveryOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  /* =====================================================
     LOAD ORDER
  ===================================================== */

  const loadOrder = useCallback(
    async (showRefreshLoader = false) => {
      if (!user?.uid || !orderId) {
        return;
      }

      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const orderData = await getDeliveryOrderById(
          orderId,
          user.uid
        );

        setOrder(orderData);
      } catch (error) {
        console.error(
          "Error loading delivery order:",
          error
        );

        setError(
          error.message ||
            "Unable to load order details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid, orderId]
  );


  useEffect(() => {
    if (!authLoading && user?.uid && orderId) {
      loadOrder();
    }
  }, [
    authLoading,
    user?.uid,
    orderId,
    loadOrder,
  ]);


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Not available";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not available";
    }
  };


  /* =====================================================
     ITEM COUNT
  ===================================================== */

  const getItemCount = () => {
    return (
      order?.foodItems?.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ) || 0
    );
  };


  /* =====================================================
     STATUS HELPERS
  ===================================================== */

  const getStatusStyle = (status) => {
    switch (status) {
      case "Ready":
        return "bg-green-100 text-green-700";

      case "Out for Delivery":
        return "bg-orange-100 text-orange-700";

      case "Delivered":
        return "bg-emerald-100 text-emerald-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  const getStatusLabel = (status) => {
    switch (status) {
      case "Ready":
        return "🟢 Ready for Delivery";

      case "Out for Delivery":
        return "🛵 Out for Delivery";

      case "Delivered":
        return "✅ Delivered";

      default:
        return status || "Unknown";
    }
  };


  const isReady =
    ["Ready", "Out for Delivery", "Delivered"].includes(
      order?.status
    );

  const isOutForDelivery =
    ["Out for Delivery", "Delivered"].includes(
      order?.status
    );

  const isDelivered =
    order?.status === "Delivered";


  /* =====================================================
     AUTH LOADING
  ===================================================== */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="text-sm text-gray-500">
            Loading delivery panel...
          </p>
        </div>
      </div>
    );
  }


  /* =====================================================
     PAGE LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

          <div className="animate-pulse space-y-5">

            <div className="h-8 w-56 rounded bg-gray-200" />

            <div className="h-32 rounded-2xl bg-gray-200" />

            <div className="h-64 rounded-2xl bg-gray-200" />

            <div className="h-48 rounded-2xl bg-gray-200" />

          </div>

        </div>
      </div>
    );
  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-2xl px-4 py-12">

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
              ⚠️
            </div>

            <h2 className="text-xl font-bold text-red-900">
              Unable to Load Order
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
              {error}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() => loadOrder()}
                className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                🔄 Try Again
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/delivery")
                }
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                ← Dashboard
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     ORDER NOT FOUND
  ===================================================== */

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-2xl px-4 py-12">

          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              📦
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              Order Not Found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              This delivery order could not be found
              or is no longer available to you.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/delivery")
              }
              className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              ← Back to Dashboard
            </button>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     PRICE VALUES
  ===================================================== */

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || 0);


  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <Link
                to="/delivery"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-orange-600"
              >
                ← Delivery Dashboard
              </Link>

              <div className="mt-2">

                <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                  CampusEats Delivery
                </p>

                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                  Order Details
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Order #
                  {order.id
                    ?.slice(-8)
                    .toUpperCase()}
                </p>

              </div>

            </div>


            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() => loadOrder(true)}
                disabled={refreshing}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing
                  ? "Refreshing..."
                  : "🔄 Refresh"}
              </button>

              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${getStatusStyle(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* =================================================
            DELIVERY DESTINATION HERO
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-orange-100">
                Delivery Destination
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                📍 {order.deliveryLocation || "Location not available"}
              </h2>

              <p className="mt-2 text-sm text-orange-100">
                Campus delivery order
              </p>

            </div>

            <div className="hidden text-7xl sm:block">
              🛵
            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ORDER SUMMARY
        ================================================= */}

        <section className="mt-5 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Vendor
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {order.vendorName || "Campus Vendor"}
            </p>

          </div>


          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Items
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {getItemCount()} items
            </p>

          </div>


          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Order Total
            </p>

            <p className="mt-2 text-xl font-bold text-orange-600">
              ₹{total.toFixed(2)}
            </p>

          </div>

        </section>


        {/* =================================================
            STATUS TIMELINE
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Delivery Status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track the order through the delivery process
              </p>

            </div>

            <span className="hidden rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:block">
              {order.status}
            </span>

          </div>


          <div className="mt-7">

            {/* READY */}

            <div className="flex gap-4">

              <div className="flex flex-col items-center">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    isReady
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  ✓
                </div>

                <div
                  className={`h-12 w-1 ${
                    isOutForDelivery
                      ? "bg-orange-400"
                      : "bg-gray-200"
                  }`}
                />

              </div>

              <div className="pb-6">

                <p className="font-bold text-gray-900">
                  Order Ready
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Vendor has prepared the order
                  and it is ready for delivery.
                </p>

              </div>

            </div>


            {/* OUT FOR DELIVERY */}

            <div className="flex gap-4">

              <div className="flex flex-col items-center">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isOutForDelivery
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  🛵
                </div>

                <div
                  className={`h-12 w-1 ${
                    isDelivered
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />

              </div>

              <div className="pb-6">

                <p className="font-bold text-gray-900">
                  Out for Delivery
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Delivery staff is taking the
                  order to the customer.
                </p>

              </div>

            </div>


            {/* DELIVERED */}

            <div className="flex gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isDelivered
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  ✓
                </div>

              </div>

              <div>

                <p className="font-bold text-gray-900">
                  Delivered
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {isDelivered
                    ? "Order successfully delivered to the customer."
                    : "Waiting for successful delivery."}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            ORDER ITEMS
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Order Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {getItemCount()} total items
              </p>

            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
              {order.foodItems?.length || 0} products
            </span>

          </div>


          <div className="mt-5 divide-y">

            {order.foodItems?.map(
              (item, index) => {

                const itemTotal =
                  Number(item.price || 0) *
                  Number(item.quantity || 0);

                return (
                  <div
                    key={`${
                      item.foodId ||
                      item.name
                    }-${index}`}
                    className="flex items-center justify-between gap-4 py-4"
                  >

                    <div className="min-w-0">

                      <p className="font-semibold text-gray-900">
                        {item.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                        {" "}×{" "}
                        {item.quantity}
                      </p>

                    </div>

                    <p className="shrink-0 font-bold text-gray-900">
                      ₹{itemTotal.toFixed(2)}
                    </p>

                  </div>
                );
              }
            )}

          </div>

        </section>


        {/* =================================================
            PAYMENT SUMMARY
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-lg font-bold text-gray-900">
            Payment Summary
          </h2>

          <div className="mt-5 space-y-3">

            <div className="flex justify-between text-sm">

              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-900">
                ₹{subtotal.toFixed(2)}
              </span>

            </div>


            <div className="flex justify-between text-sm">

              <span className="text-gray-500">
                Delivery Fee
              </span>

              <span className="font-semibold text-gray-900">
                ₹{deliveryFee.toFixed(2)}
              </span>

            </div>


            {discount > 0 && (
              <div className="flex justify-between text-sm">

                <span className="text-green-600">
                  Discount
                </span>

                <span className="font-semibold text-green-600">
                  -₹{discount.toFixed(2)}
                </span>

              </div>
            )}


            <div className="mt-4 rounded-xl bg-orange-50 p-4">

              <div className="flex items-center justify-between">

                <span className="font-bold text-gray-900">
                  Total Amount
                </span>

                <span className="text-2xl font-bold text-orange-600">
                  ₹{total.toFixed(2)}
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            PAYMENT DETAILS
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-lg font-bold text-gray-900">
            Payment Details
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Payment Method
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {order.paymentMethod ||
                  "Not available"}
              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Payment Status
              </p>

              <p
                className={`mt-2 font-semibold ${
                  order.paymentStatus === "Paid"
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {order.paymentStatus ||
                  "Pending"}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            SPECIAL INSTRUCTIONS
        ================================================= */}

        {order.specialInstructions && (
          <section className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 sm:p-6">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                📝
              </div>

              <div>

                <h2 className="font-bold text-yellow-900">
                  Special Instructions
                </h2>

                <p className="mt-1 text-sm leading-6 text-yellow-800">
                  {order.specialInstructions}
                </p>

              </div>

            </div>

          </section>
        )}


        {/* =================================================
            ORDER INFORMATION
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-lg font-bold text-gray-900">
            Order Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Order Type
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {order.orderType || "Delivery"}
              </p>
            </div>


            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Current Status
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {order.status}
              </p>
            </div>


            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Order Placed
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>


            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Last Updated
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formatDate(order.updatedAt)}
              </p>
            </div>


            {order.deliveredAt && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Delivered At
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {formatDate(order.deliveredAt)}
                </p>
              </div>
            )}

          </div>

        </section>


        {/* =================================================
            DELIVERY STAFF
        ================================================= */}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
              🛵
            </div>

            <div className="min-w-0">

              <h2 className="font-bold text-gray-900">
                Delivery Assignment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current delivery assignment information
              </p>

              <p className="mt-3 text-sm font-semibold text-gray-800">
                {order.assignedDeliveryStaff
                  ? "Assigned to delivery staff"
                  : "Not assigned"}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            FOOTER ACTIONS
        ================================================= */}

        <div className="mt-6 flex flex-col gap-3 pb-10 sm:flex-row">

          <button
            type="button"
            onClick={() => navigate("/delivery")}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => loadOrder(true)}
            disabled={refreshing}
            className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "🔄 Refresh Order"}
          </button>

        </div>

      </main>

    </div>
  );
}

export default DeliveryOrderDetails;