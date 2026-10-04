import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { subscribeToOrder } from "../../services/orderService";

const ORDER_STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
];

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return "Recently";
  }

  return timestamp.toDate().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (data.userId !== user.uid) {
          setError("You are not allowed to view this order.");
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

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-gray-900">
              Loading your order
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Getting the latest order status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              ⚠️
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-gray-900">
              Order Not Found
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error || "Unable to load this order."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/student/orders")}
              className="mt-6 w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- STATUS ---------------- */

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.status);

  const isRejected = order.status === "Rejected";
  const isCancelled = order.status === "Cancelled";
  const isDelivered = order.status === "Delivered";

  const isPickup = order.orderType === "Pickup";

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-28">
      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/student/orders")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 active:scale-95"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-gray-900">
              Order Details
            </h1>

            <p className="mt-0.5 truncate text-xs font-medium text-gray-400">
              #{order.id.slice(0, 8)}
            </p>
          </div>

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isPickup ? "bg-blue-50" : "bg-orange-50"
            }`}
          >
            {isPickup ? "🥡" : "🛵"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-5 pt-5">
        {/* ================= LIVE STATUS HERO ================= */}

        <section
          className={`overflow-hidden rounded-3xl border p-5 shadow-sm ${
            isRejected
              ? "border-red-100 bg-red-50"
              : isCancelled
                ? "border-gray-200 bg-gray-100"
                : isDelivered
                  ? "border-green-100 bg-green-50"
                  : "border-orange-100 bg-orange-50"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isRejected
                      ? "bg-red-500"
                      : isCancelled
                        ? "bg-gray-500"
                        : isDelivered
                          ? "bg-green-500"
                          : "bg-orange-500 animate-pulse"
                  }`}
                />

                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Live Order Status
                </p>
              </div>

              <h2
                className={`mt-2 text-2xl font-black ${
                  isRejected
                    ? "text-red-600"
                    : isCancelled
                      ? "text-gray-700"
                      : isDelivered
                        ? "text-green-600"
                        : "text-orange-600"
                }`}
              >
                {order.status}
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {isRejected
                  ? "This order was rejected by the vendor."
                  : isCancelled
                    ? "This order has been cancelled."
                    : isDelivered
                      ? "Your order has been completed successfully."
                      : "Your order status updates automatically."}
              </p>
            </div>

            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm`}
            >
              {isRejected
                ? "❌"
                : isCancelled
                  ? "🚫"
                  : isDelivered
                    ? "✅"
                    : "🛵"}
            </div>
          </div>

          {/* Special status message */}

          {isRejected && (
            <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm font-medium text-red-600">
              This order was rejected by the vendor.
            </div>
          )}

          {isCancelled && (
            <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm font-medium text-gray-600">
              This order has been cancelled.
            </div>
          )}

          {/* ================= PROGRESS ================= */}

          {!isRejected && !isCancelled && (
            <div className="mt-6 rounded-2xl bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Order Progress
                </p>

                <p className="text-xs font-bold text-orange-500">
                  {currentStatusIndex >= 0
                    ? `${currentStatusIndex + 1}/${ORDER_STATUSES.length}`
                    : "1/6"}
                </p>
              </div>

              <div className="mt-4 flex items-center">
                {ORDER_STATUSES.map((status, index) => {
                  const completed = index <= currentStatusIndex;
                  const active = index === currentStatusIndex;

                  return (
                    <div
                      key={status}
                      className="flex flex-1 items-center"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                          completed
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        } ${
                          active
                            ? "ring-4 ring-orange-100"
                            : ""
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      {index !== ORDER_STATUSES.length - 1 && (
                        <div
                          className={`h-1 flex-1 ${
                            index < currentStatusIndex
                              ? "bg-orange-500"
                              : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <p className="text-sm font-extrabold text-gray-900">
                  {order.status}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {order.status === "Pending" &&
                    "Your order is waiting for vendor confirmation."}

                  {order.status === "Accepted" &&
                    "The vendor has accepted your order."}

                  {order.status === "Preparing" &&
                    "Your food is being prepared."}

                  {order.status === "Ready" &&
                    (isPickup
                      ? "Your order is ready for pickup."
                      : "Your order is ready for delivery.")}

                  {order.status === "Out for Delivery" &&
                    "Your order is on the way to you."}

                  {order.status === "Delivered" &&
                    "Your order has been delivered successfully."}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ================= ORDER TYPE ================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                isPickup ? "bg-blue-50" : "bg-orange-50"
              }`}
            >
              {isPickup ? "🥡" : "🛵"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Order Type
              </p>

              <p className="mt-1 text-base font-extrabold text-gray-900">
                {isPickup ? "Self Pickup" : "Campus Delivery"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {isPickup
                  ? "Collect your order from the vendor."
                  : "Your food will be delivered on campus."}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl p-4 ${
              isPickup ? "bg-blue-50" : "bg-orange-50"
            }`}
          >
            <p className="text-xs font-medium leading-5 text-gray-600">
              {isPickup
                ? `Pickup from ${order.vendorName || "your selected vendor"}.`
                : `Delivering to ${order.deliveryLocation || "your selected campus location"}.`}
            </p>
          </div>
        </section>

        {/* ================= ORDER ITEMS ================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Your Order
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Ordered Items
              </h2>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
              {order.items?.length || 0}{" "}
              {order.items?.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-5 divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-gray-900">
                    {item.name}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      ₹{item.price}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-gray-300" />

                    <span className="text-xs font-semibold text-gray-500">
                      Qty {item.quantity}
                    </span>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-extrabold text-gray-900">
                  ₹
                  {Number(item.price) *
                    Number(item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= DELIVERY / PICKUP INFORMATION ================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              {isPickup ? "🏪" : "📍"}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {isPickup ? "Pickup Information" : "Delivery Information"}
              </p>

              <h2 className="mt-1 text-lg font-black text-gray-900">
                {isPickup ? "Pickup Details" : "Delivery Details"}
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Vendor */}

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Vendor
              </p>

              <p className="mt-1 text-sm font-extrabold text-gray-900">
                {order.vendorName || "Campus Vendor"}
              </p>
            </div>

            {/* Location */}

            {order.orderType === "Delivery" && (
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                  Deliver To
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  📍 {order.deliveryLocation}
                </p>
              </div>
            )}

            {/* Pickup */}

            {isPickup && (
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                  Pickup From
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  🏪 {order.vendorName || "Campus Vendor"}
                </p>
              </div>
            )}

            {/* Payment */}

            <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Payment
                </p>

                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {order.paymentMethod}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase ${
                  order.paymentStatus === "Paid"
                    ? "bg-green-50 text-green-600"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {order.paymentStatus || "Pending"}
              </span>
            </div>

            {/* Special Instructions */}

            {order.specialInstructions && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Special Instructions
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {order.specialInstructions}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================= BILL DETAILS ================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Payment Summary
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Bill Details
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-xl">
              💵
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-800">
                ₹{order.subtotal}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Delivery Fee
              </span>

              <span className="font-semibold text-gray-800">
                ₹{order.deliveryFee}
              </span>
            </div>

            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-600">
                  Discount
                </span>

                <span className="font-bold text-green-600">
                  -₹{order.discount}
                </span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {order.paymentStatus === "Paid"
                      ? "Payment completed"
                      : "Payment pending"}
                  </p>
                </div>

                <p className="text-2xl font-black text-orange-500">
                  ₹{order.total}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ORDER TIME ================= */}

        <div className="pb-3 pt-1 text-center">
          <p className="text-xs font-medium text-gray-400">
            Order placed on
          </p>

          <p className="mt-1 text-xs font-bold text-gray-500">
            {formatDate(order.createdAt)}
          </p>

          <p className="mt-2 text-[10px] font-medium text-gray-300">
            Order ID: {order.id}
          </p>
        </div>
      </main>
    </div>
  );
}

export default OrderDetails;