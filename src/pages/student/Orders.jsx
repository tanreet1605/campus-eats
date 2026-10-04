import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getUserOrders } from "../../services/orderService";
import { addToCart } from "../../services/cartService";

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

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-100";

    case "Accepted":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "Preparing":
      return "bg-purple-50 text-purple-700 border-purple-100";

    case "Ready":
      return "bg-green-50 text-green-700 border-green-100";

    case "Out for Delivery":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "Delivered":
      return "bg-green-50 text-green-700 border-green-100";

    case "Rejected":
      return "bg-red-50 text-red-700 border-red-100";

    case "Cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Pending":
      return "⏳";

    case "Accepted":
      return "✓";

    case "Preparing":
      return "👨‍🍳";

    case "Ready":
      return "🍽️";

    case "Out for Delivery":
      return "🛵";

    case "Delivered":
      return "✓";

    case "Rejected":
      return "✕";

    case "Cancelled":
      return "—";

    default:
      return "•";
  }
}

function Orders() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [reorderingOrderId, setReorderingOrderId] =
    useState(null);

  const [reorderMessage, setReorderMessage] =
    useState("");

  /*
    Load student's orders
  */
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        setLoading(true);

        setError("");

        const data =
          await getUserOrders(
            user.uid
          );

        setOrders(data);

      } catch (error) {
        console.error(
          "Orders loading error:",
          error
        );

        setError(
          "Unable to load your orders."
        );

      } finally {
        setLoading(false);
      }
    };

    loadOrders();

  }, [user?.uid]);

  /*
    REORDER

    Existing functionality preserved.
  */
  const handleReorder = async (order) => {
    if (!user?.uid) {
      return;
    }

    if (
      !order?.items ||
      order.items.length === 0
    ) {
      setError(
        "This order does not contain any items."
      );

      return;
    }

    try {
      setReorderingOrderId(order.id);

      setError("");

      setReorderMessage("");

      for (const item of order.items) {
        await addToCart(
          user.uid,
          {
            id: item.id,
            name: item.name || "",
            price: Number(item.price || 0),
            imageUrl: item.imageUrl || "",
            vendorId: item.vendorId || "",
            vendorName:
              item.vendorName ||
              "Campus Vendor",
            available:
              item.available !== false,
          },
          Number(item.quantity || 1)
        );
      }

      setReorderMessage(
        "Items added to your cart successfully!"
      );

      setTimeout(() => {
        navigate("/student/cart");
      }, 800);

    } catch (error) {
      console.error(
        "Reorder error:",
        error
      );

      setError(
        error?.message ||
          "Unable to reorder this order. Please try again."
      );

    } finally {
      setReorderingOrderId(null);
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
              Loading your orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Fetching your CampusEats history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-28">

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-5 py-5 backdrop-blur">
        <div className="mx-auto max-w-md">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                CampusEats
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                My Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Track and manage your food orders
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
              📦
            </div>

          </div>

          {/* Order count */}

          {orders.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
                {orders.length}{" "}
                {orders.length === 1
                  ? "Order"
                  : "Orders"}
              </span>

              <span className="text-xs text-gray-400">
                Your recent CampusEats activity
              </span>
            </div>
          )}

        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5">

        {/* ================= SUCCESS ================= */}

        {reorderMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-green-100 bg-green-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
              ✓
            </div>

            <div>
              <p className="text-sm font-extrabold text-green-700">
                Added to cart
              </p>

              <p className="mt-1 text-xs leading-5 text-green-600">
                {reorderMessage}
              </p>
            </div>

          </div>
        )}

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
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

        {!error &&
          orders.length === 0 && (
            <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
                🍽️
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-orange-500">
                CampusEats
              </p>

              <h2 className="mt-2 text-xl font-black text-gray-900">
                No orders yet
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Your food orders will appear here once you place your first order.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/student")
                }
                className="mt-6 w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.98]"
              >
                Start Ordering
              </button>

            </div>
          )}

        {/* ================= ORDERS ================= */}

        <div className="space-y-4">

          {orders.map((order) => (

            <div
              key={order.id}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >

              {/* Clickable order area */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/student/orders/${order.id}`
                  )
                }
                className="w-full text-left"
              >

                <div className="p-5">

                  {/* TOP */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                          {order.orderType === "Pickup"
                            ? "🥡"
                            : "🛵"}
                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Order
                          </p>

                          <p className="mt-0.5 text-sm font-black text-gray-900">
                            #{order.id.slice(0, 8)}
                          </p>

                        </div>

                      </div>

                    </div>

                    <span
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusClass(
                        order.status
                      )}`}
                    >
                      <span>
                        {getStatusIcon(
                          order.status
                        )}
                      </span>

                      {order.status}
                    </span>

                  </div>

                  {/* VENDOR */}

                  <div className="mt-4 rounded-2xl bg-gray-50 p-3.5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm shadow-sm">
                        🏪
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Vendor
                        </p>

                        <p className="mt-0.5 truncate text-sm font-bold text-gray-800">
                          {order.vendorName ||
                            "Campus Vendor"}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* ITEMS */}

                  <div className="mt-5 space-y-3">

                    {order.items
                      ?.slice(0, 3)
                      .map((item) => (

                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">
                                  🍽️
                                </span>
                              )}

                            </div>

                            <span className="truncate text-sm text-gray-600">
                              {item.name} ×{" "}
                              {item.quantity}
                            </span>

                          </div>

                          <span className="shrink-0 text-sm font-bold text-gray-900">
                            ₹
                            {Number(item.price) *
                              Number(
                                item.quantity
                              )}
                          </span>

                        </div>

                      ))}

                    {order.items?.length > 3 && (
                      <div className="rounded-xl bg-gray-50 px-3 py-2">
                        <p className="text-xs font-semibold text-gray-500">
                          +{" "}
                          {order.items.length - 3}{" "}
                          more item(s)
                        </p>
                      </div>
                    )}

                  </div>

                  {/* DIVIDER */}

                  <div className="my-5 border-t border-gray-100" />

                  {/* BOTTOM */}

                  <div className="flex items-end justify-between gap-4">

                    <div className="min-w-0">

                      <p className="text-xs text-gray-400">
                        {formatDate(
                          order.createdAt
                        )}
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                          {order.orderType}
                        </span>

                        <span className="text-[10px] font-medium text-gray-400">
                          Tap to view
                        </span>

                      </div>

                    </div>

                    <div className="shrink-0 text-right">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Total
                      </p>

                      <p className="mt-0.5 text-xl font-black text-orange-500">
                        ₹{order.total}
                      </p>

                    </div>

                  </div>

                </div>

              </button>

              {/* ================= DELIVERED ACTIONS ================= */}

              {order.status === "Delivered" && (

                <div className="border-t border-gray-100 bg-gray-50/70 p-4">

                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Order Actions
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                    {/* RATE */}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        navigate(
                          `/student/orders/${order.id}/review`
                        );
                      }}
                      className="rounded-2xl border border-orange-200 bg-orange-50 px-3 py-3.5 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100 active:scale-[0.98]"
                    >
                      ⭐ Rate Order
                    </button>

                    {/* REORDER */}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        handleReorder(order);
                      }}
                      disabled={
                        reorderingOrderId ===
                        order.id
                      }
                      className="rounded-2xl bg-orange-500 px-3 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {reorderingOrderId ===
                      order.id ? (

                        <span className="flex items-center justify-center gap-2">

                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                          Adding...

                        </span>

                      ) : (
                        "🔄 Reorder"
                      )}

                    </button>

                  </div>

                </div>

              )}

            </div>

          ))}

        </div>

      </main>
    </div>
  );
}

export default Orders;