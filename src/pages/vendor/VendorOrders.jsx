import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  getVendorOrders,
  updateOrderStatus,
} from "../../services/vendorOrderService";

import { createNotification } from "../../services/notificationService";


// ==========================================
// FORMAT DATE
// ==========================================

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


// ==========================================
// STATUS COLORS
// ==========================================

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Accepted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Preparing":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "Ready":
    case "Ready for Pickup":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Picked Up":
      return "bg-teal-50 text-teal-700 border-teal-200";

    case "Out for Delivery":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "Delivered":
      return "bg-green-50 text-green-700 border-green-200";

    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "Cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}


// ==========================================
// STATUS ICON
// ==========================================

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

    case "Ready for Pickup":
      return "🥡";

    case "Picked Up":
      return "✓";

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


// ==========================================
// STATUS NOTIFICATION CONTENT
// ==========================================

function getStatusNotification(status, orderType) {
  const isPickup = orderType === "Pickup";

  switch (status) {
    case "Accepted":
      return {
        title: "Order Accepted ✅",
        message: isPickup
          ? "Your pickup order has been accepted by the vendor."
          : "Your order has been accepted by the vendor.",
      };

    case "Preparing":
      return {
        title: "Order Being Prepared 👨‍🍳",
        message: isPickup
          ? "Your pickup order is now being prepared."
          : "Your order is now being prepared by the vendor.",
      };

    case "Ready":
      return {
        title: "Order Ready 🍽️",
        message:
          "Your order is ready and waiting for delivery.",
      };

    case "Ready for Pickup":
      return {
        title: "Order Ready for Pickup 🥡",
        message:
          "Your order is ready. You can now pick it up from the vendor.",
      };

    case "Picked Up":
      return {
        title: "Order Picked Up 🎉",
        message:
          "Your pickup order has been picked up successfully. Enjoy your meal!",
      };

    case "Rejected":
      return {
        title: "Order Rejected ❌",
        message:
          "Unfortunately, your order has been rejected by the vendor.",
      };

    default:
      return null;
  }
}


// ==========================================
// GET NEXT ACTION
// ==========================================

function getNextAction(order) {
  const isPickup = order.orderType === "Pickup";

  switch (order.status) {
    case "Pending":
      return {
        label: "Accept Order",
        nextStatus: "Accepted",
        className: "bg-blue-600 hover:bg-blue-700",
      };

    case "Accepted":
      return {
        label: "Start Preparing",
        nextStatus: "Preparing",
        className: "bg-purple-600 hover:bg-purple-700",
      };

    case "Preparing":
      if (isPickup) {
        return {
          label: "Ready for Pickup",
          nextStatus: "Ready for Pickup",
          className: "bg-emerald-600 hover:bg-emerald-700",
        };
      }

      return {
        label: "Mark Ready",
        nextStatus: "Ready",
        className: "bg-emerald-600 hover:bg-emerald-700",
      };

    case "Ready for Pickup":
      if (isPickup) {
        return {
          label: "Mark as Picked Up",
          nextStatus: "Picked Up",
          className: "bg-teal-600 hover:bg-teal-700",
        };
      }

      return null;

    default:
      return null;
  }
}


// ==========================================
// VENDOR ORDERS
// ==========================================

function VendorOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);


  // ==========================================
  // LOAD VENDOR ORDERS
  // ==========================================

  const loadOrders = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getVendorOrders(user.uid);

      setOrders(data);
    } catch (error) {
      console.error("Vendor orders error:", error);

      setError("Unable to load vendor orders.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOAD ORDERS
  // ==========================================

  useEffect(() => {
    loadOrders();
  }, [user?.uid]);


  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrder(orderId);
      setError("");

      const currentOrder = orders.find(
        (order) => order.id === orderId
      );

      if (!currentOrder) {
        throw new Error("Order not found.");
      }

      await updateOrderStatus(
        orderId,
        newStatus
      );

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      const notification =
        getStatusNotification(
          newStatus,
          currentOrder.orderType
        );

      if (
        notification &&
        currentOrder.userId
      ) {
        try {
          await createNotification({
            userId: currentOrder.userId,
            title: notification.title,
            message: notification.message,
            type: "order",
            orderId: orderId,
          });

          console.log(
            "Customer notification created successfully."
          );
        } catch (notificationError) {
          console.error(
            "Customer notification error:",
            notificationError
          );
        }
      }
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        "Unable to update order status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };


  // ==========================================
  // REJECT ORDER
  // ==========================================

  const handleRejectOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this order?"
    );

    if (!confirmed) {
      return;
    }

    await handleStatusChange(
      orderId,
      "Rejected"
    );
  };


  // ==========================================
  // SUMMARY
  // ==========================================

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const activeCount = orders.filter(
    (order) =>
      ["Accepted", "Preparing"].includes(
        order.status
      )
  ).length;

  const readyCount = orders.filter(
    (order) =>
      ["Ready", "Ready for Pickup"].includes(
        order.status
      )
  ).length;

  const completedCount = orders.filter(
    (order) =>
      ["Delivered", "Picked Up"].includes(
        order.status
      )
  ).length;


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-100 shadow-sm p-8 text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

          <h2 className="mt-5 text-base font-bold text-gray-900">
            Loading orders
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Fetching your latest customer orders...
          </p>

        </div>
      </div>
    );
  }


  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-10">

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">


        {/* ======================================
            HEADER
        ======================================= */}

        <header className="mb-6 rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-sm">
                    🧾
                  </span>

                  <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                    Vendor Portal
                  </span>

                </div>

                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  Customer Orders
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage orders and update their progress.
                </p>

              </div>


              <button
                type="button"
                onClick={loadOrders}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                ↻ Refresh
              </button>

            </div>

          </div>


          {/* SUMMARY BAR */}

          <div className="grid grid-cols-2 border-t border-gray-100 sm:grid-cols-4">

            <div className="border-r border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Pending
              </p>

              <p className="mt-1 text-xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="border-r border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Active
              </p>

              <p className="mt-1 text-xl font-bold text-blue-600">
                {activeCount}
              </p>
            </div>

            <div className="border-r border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Ready
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-600">
                {readyCount}
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-400">
                Completed
              </p>

              <p className="mt-1 text-xl font-bold text-green-600">
                {completedCount}
              </p>
            </div>

          </div>

        </header>


        {/* ======================================
            ERROR
        ======================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              ⚠️
            </div>

            <div>
              <p className="text-sm font-bold text-red-700">
                Unable to load orders
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            </div>

          </div>
        )}


        {/* ======================================
            EMPTY STATE
        ======================================= */}

        {!error && orders.length === 0 && (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
              📦
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              New customer orders will automatically appear here when students place orders.
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Refresh Orders
            </button>

          </div>
        )}


        {/* ======================================
            ORDERS
        ======================================= */}

        <div className="space-y-5">

          {orders.map((order) => {

            const isPickup =
              order.orderType === "Pickup";

            const nextAction =
              getNextAction(order);

            const itemCount =
              order.vendorItems?.reduce(
                (total, item) =>
                  total +
                  Number(item.quantity || 0),
                0
              ) || 0;


            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >


                {/* =================================
                    ORDER TOP
                ================================== */}

                <div className="border-b border-gray-100 p-5 sm:p-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-700">
                          #{order.id.slice(0, 8)}
                        </span>

                        <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                          {itemCount} item
                          {itemCount !== 1
                            ? "s"
                            : ""}
                        </span>

                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>

                    </div>


                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
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

                </div>


                {/* =================================
                    ORDER TYPE
                ================================== */}

                <div className="p-5 sm:p-6">

                  <div
                    className={`rounded-2xl border p-4 ${
                      isPickup
                        ? "border-blue-100 bg-blue-50/70"
                        : "border-orange-100 bg-orange-50/70"
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                          isPickup
                            ? "bg-blue-100"
                            : "bg-orange-100"
                        }`}
                      >
                        {isPickup
                          ? "🥡"
                          : "🛵"}
                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <div>

                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              Order Type
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-900">
                              {isPickup
                                ? "Self Pickup"
                                : "Campus Delivery"}
                            </p>

                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              isPickup
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {isPickup
                              ? "PICKUP"
                              : "DELIVERY"}
                          </span>

                        </div>


                        {!isPickup &&
                          order.deliveryLocation && (
                            <div className="mt-3 flex items-start gap-2">

                              <span className="text-sm">
                                📍
                              </span>

                              <p className="text-xs leading-5 text-gray-600">
                                {order.deliveryLocation}
                              </p>

                            </div>
                          )}


                        {isPickup && (
                          <div className="mt-3 rounded-xl bg-white/70 p-3">

                            <p className="text-xs font-bold text-blue-700">
                              Pickup instructions
                            </p>

                            <p className="mt-1 text-xs leading-5 text-blue-600">
                              Customer will collect the order directly from the vendor.
                            </p>

                          </div>
                        )}

                      </div>

                    </div>

                  </div>


                  {/* =================================
                      ITEMS
                  ================================== */}

                  <div className="mt-6">

                    <div className="flex items-center justify-between">

                      <h3 className="text-sm font-bold text-gray-900">
                        Ordered Items
                      </h3>

                      <span className="text-xs text-gray-400">
                        {itemCount} item
                        {itemCount !== 1
                          ? "s"
                          : ""}
                      </span>

                    </div>


                    <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">

                      {order.vendorItems?.map(
                        (item) => (

                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 p-4"
                          >

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-gray-900">
                                {item.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                ₹{item.price} ×{" "}
                                {item.quantity}
                              </p>

                            </div>

                            <p className="shrink-0 text-sm font-bold text-gray-900">
                              ₹
                              {Number(
                                item.price
                              ) *
                                Number(
                                  item.quantity
                                )}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>


                  {/* =================================
                      SPECIAL INSTRUCTIONS
                  ================================== */}

                  {order.specialInstructions && (
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">

                      <div className="flex gap-3">

                        <span className="text-base">
                          📝
                        </span>

                        <div>

                          <p className="text-xs font-bold text-amber-700">
                            Special Instructions
                          </p>

                          <p className="mt-1 text-sm leading-5 text-amber-800">
                            {order.specialInstructions}
                          </p>

                        </div>

                      </div>

                    </div>
                  )}


                  {/* =================================
                      PAYMENT / TOTAL
                  ================================== */}

                  <div className="mt-6 rounded-2xl bg-gray-50 p-4">

                    <div className="flex items-end justify-between gap-4">

                      <div>

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Customer Total
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          ₹{order.total}
                        </p>

                      </div>


                      <div className="text-right">

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-700">
                          {order.paymentMethod ||
                            "Not specified"}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* =================================
                      ORDER PROGRESS
                  ================================== */}

                  <div className="mt-6">

                    <div className="flex items-center justify-between">

                      <h3 className="text-sm font-bold text-gray-900">
                        Order Progress
                      </h3>

                      <span className="text-[11px] text-gray-400">
                        {isPickup
                          ? "Pickup flow"
                          : "Delivery flow"}
                      </span>

                    </div>


                    <div className="mt-3 flex flex-wrap gap-2">

                      {(isPickup
                        ? [
                            "Pending",
                            "Accepted",
                            "Preparing",
                            "Ready for Pickup",
                            "Picked Up",
                          ]
                        : [
                            "Pending",
                            "Accepted",
                            "Preparing",
                            "Ready",
                            "Out for Delivery",
                            "Delivered",
                          ]
                      ).map(
                        (status) => {

                          const active =
                            order.status ===
                            status;

                          return (
                            <span
                              key={status}
                              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                                active
                                  ? getStatusClass(
                                      status
                                    )
                                  : "border-gray-100 bg-gray-50 text-gray-400"
                              }`}
                            >
                              {active
                                ? "● "
                                : ""}
                              {status}
                            </span>
                          );
                        }
                      )}

                    </div>

                  </div>


                  {/* =================================
                      ACTIONS
                  ================================== */}

                  {nextAction && (
                    <div className="mt-6">

                      <button
                        type="button"
                        disabled={
                          updatingOrder ===
                          order.id
                        }
                        onClick={() =>
                          handleStatusChange(
                            order.id,
                            nextAction.nextStatus
                          )
                        }
                        className={`w-full rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${nextAction.className}`}
                      >

                        {updatingOrder ===
                        order.id ? (
                          <span className="flex items-center justify-center gap-2">

                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                            Updating order...

                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {nextAction.label}
                            <span>→</span>
                          </span>
                        )}

                      </button>

                    </div>
                  )}


                  {/* =================================
                      REJECT
                  ================================== */}

                  {order.status ===
                    "Pending" && (
                    <button
                      type="button"
                      disabled={
                        updatingOrder ===
                        order.id
                      }
                      onClick={() =>
                        handleRejectOrder(
                          order.id
                        )
                      }
                      className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject Order
                    </button>
                  )}


                  {/* =================================
                      COMPLETED
                  ================================== */}

                  {order.status ===
                    "Delivered" && (
                    <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        ✓
                      </div>

                      <p className="mt-2 text-sm font-bold text-green-700">
                        Order Delivered
                      </p>

                      <p className="mt-1 text-xs text-green-600">
                        This delivery has been completed successfully.
                      </p>

                    </div>
                  )}


                  {order.status ===
                    "Picked Up" && (
                    <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        ✓
                      </div>

                      <p className="mt-2 text-sm font-bold text-teal-700">
                        Order Picked Up
                      </p>

                      <p className="mt-1 text-xs text-teal-600">
                        Customer has collected this order successfully.
                      </p>

                    </div>
                  )}

                </div>

              </article>
            );
          })}

        </div>

      </main>

    </div>
  );
}


export default VendorOrders;