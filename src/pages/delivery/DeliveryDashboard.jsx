import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";

import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";

import {
  getAvailableDeliveries,
  getMyActiveDeliveries,
  getDeliveryHistory,
  getDeliveryStats,
  acceptDelivery,
  markDeliveryAsDelivered,
} from "../../services/deliveryService";

import { createNotification } from "../../services/notificationService";

function DeliveryDashboard() {
  const { user, loading: authLoading } = useAuth();

  /* =====================================================
     STATE
  ===================================================== */

  const [deliveries, setDeliveries] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);

  const [stats, setStats] = useState({
    activeDeliveries: 0,
    todaysDeliveries: 0,
    completedDeliveries: 0,
    totalDeliveredValue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);

      setError("Unable to logout. Please try again.");
    }
  };

  /* =====================================================
     LOAD ALL DELIVERY DATA
  ===================================================== */

  const loadDeliveries = async (showRefreshLoader = false) => {
    if (!user?.uid) {
      return;
    }

    try {
      setError("");

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setActiveLoading(true);
        setHistoryLoading(true);
        setStatsLoading(true);
      }

      const [
        availableData,
        activeData,
        historyData,
        statsData,
      ] = await Promise.all([
        getAvailableDeliveries(),
        getMyActiveDeliveries(user.uid),
        getDeliveryHistory(user.uid),
        getDeliveryStats(user.uid),
      ]);

      setDeliveries(availableData);
      setActiveDeliveries(activeData);
      setDeliveryHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error(
        "Error loading delivery dashboard:",
        error
      );

      setError(
        error.message || "Unable to load delivery data."
      );
    } finally {
      setLoading(false);
      setActiveLoading(false);
      setHistoryLoading(false);
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  /* =====================================================
     LOAD WHEN USER AVAILABLE
  ===================================================== */

  useEffect(() => {
    if (!authLoading && user?.uid) {
      loadDeliveries();
    }
  }, [authLoading, user?.uid]);

  /* =====================================================
     ACCEPT DELIVERY
  ===================================================== */

  const handleAcceptDelivery = async (orderId) => {
    if (!user?.uid) {
      return;
    }

    try {
      setAcceptingOrderId(orderId);
      setError("");

      await acceptDelivery(orderId, user.uid);

      await loadDeliveries(true);
    } catch (error) {
      console.error(
        "Error accepting delivery:",
        error
      );

      setError(
        error.message || "Unable to accept delivery."
      );
    } finally {
      setAcceptingOrderId(null);
    }
  };

  /* =====================================================
     MARK AS DELIVERED
  ===================================================== */

  const handleMarkAsDelivered = async (orderId) => {
    if (!user?.uid) {
      return;
    }

    try {
      setDeliveringOrderId(orderId);
      setError("");

      const deliveredOrder =
        await markDeliveryAsDelivered(
          orderId,
          user.uid
        );

      /* Notify Student */

      try {
        await createNotification({
          userId: deliveredOrder.userId,
          title: "🎉 Order Delivered",
          message:
            "Your CampusEats order has been delivered successfully.",
          type: "delivery",
          orderId: deliveredOrder.id,
        });
      } catch (notificationError) {
        console.error(
          "Delivery notification failed:",
          notificationError
        );
      }

      await loadDeliveries(true);
    } catch (error) {
      console.error(
        "Error marking delivery:",
        error
      );

      setError(
        error.message ||
          "Unable to mark order as delivered."
      );
    } finally {
      setDeliveringOrderId(null);
    }
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "N/A";
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
      return "N/A";
    }
  };

  /* =====================================================
     GET ITEM COUNT
  ===================================================== */

  const getItemCount = (order) => {
    return (
      order.foodItems?.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ) || 0
    );
  };

  /* =====================================================
     AUTH LOADING
  ===================================================== */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
            🛵
          </div>

          <div className="mx-auto mt-5 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <h2 className="mt-5 text-lg font-bold text-gray-900">
            Loading Delivery Panel
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Preparing your delivery dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl shadow-sm">
                🛵
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  CampusEats
                </p>

                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Delivery Dashboard
                </h1>

                <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                  Manage your campus deliveries
                </p>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  loadDeliveries(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                    Refreshing
                  </>
                ) : (
                  <>
                    🔄
                    Refresh
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-[0.98]"
              >
                🚪
                Logout
              </button>

              <div className="hidden rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                  Delivery Staff
                </p>

                <p className="mt-0.5 max-w-[180px] truncate text-sm font-semibold text-gray-900">
                  {user?.email || "Delivery Staff"}
                </p>
              </div>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm leading-5 text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 p-6 text-white shadow-lg sm:p-8">

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-24 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="max-w-2xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-orange-50">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                Delivery panel active
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Ready for your next delivery?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-orange-50 sm:text-base">
                Accept ready orders, deliver them to campus
                locations, and keep track of your delivery
                performance from one place.
              </p>

            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-3xl bg-white/10 text-6xl shadow-inner sm:flex">
              🛵
            </div>

          </div>

        </section>

        {/* =================================================
            DELIVERY OVERVIEW
        ================================================= */}

        <section>

          <div className="mb-4 flex items-end justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Performance
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-900">
                Delivery Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your delivery activity at a glance
              </p>
            </div>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* ACTIVE */}

            <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  🛵
                </div>

                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                  Active
                </span>

              </div>

              <p className="mt-5 text-3xl font-extrabold text-gray-900">
                {statsLoading
                  ? "..."
                  : stats.activeDeliveries}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Active Deliveries
              </p>

            </div>

            {/* TODAY */}

            <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  📅
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Today
                </span>

              </div>

              <p className="mt-5 text-3xl font-extrabold text-gray-900">
                {statsLoading
                  ? "..."
                  : stats.todaysDeliveries}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Today's Deliveries
              </p>

            </div>

            {/* COMPLETED */}

            <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                  ✅
                </div>

                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                  Total
                </span>

              </div>

              <p className="mt-5 text-3xl font-extrabold text-gray-900">
                {statsLoading
                  ? "..."
                  : stats.completedDeliveries}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Completed Deliveries
              </p>

            </div>

            {/* VALUE */}

            <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl">
                  💰
                </div>

                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-600">
                  Value
                </span>

              </div>

              <p className="mt-5 text-2xl font-extrabold text-gray-900">
                ₹
                {statsLoading
                  ? "..."
                  : Number(
                      stats.totalDeliveredValue || 0
                    ).toFixed(2)}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Delivered Order Value
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            AVAILABLE DELIVERIES
        ================================================= */}

        <section className="mt-10">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <h2 className="text-xl font-bold text-gray-900">
                  Available Deliveries
                </h2>

                {deliveries.length > 0 && (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                    {deliveries.length}
                  </span>
                )}

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Orders ready to be picked up for delivery
              </p>

            </div>

          </div>

          {loading ? (

            <div className="grid gap-5 lg:grid-cols-2">

              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="h-5 w-40 rounded bg-gray-200" />

                  <div className="mt-3 h-4 w-28 rounded bg-gray-200" />

                  <div className="mt-5 h-20 rounded-2xl bg-gray-200" />

                  <div className="mt-5 h-20 rounded-xl bg-gray-200" />

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="h-11 rounded-xl bg-gray-200" />
                    <div className="h-11 rounded-xl bg-gray-200" />
                  </div>
                </div>
              ))}

            </div>

          ) : deliveries.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-4xl">
                ✓
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No Deliveries Available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                You're all caught up. New ready orders
                will appear here when they become
                available.
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDeliveries(true)
                }
                disabled={refreshing}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                🔄
                {refreshing
                  ? "Checking..."
                  : "Check Again"}
              </button>

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {deliveries.map((order) => (

                <div
                  key={order.id}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* TOP */}

                  <div className="border-b border-gray-100 p-5 sm:p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                            🏪
                          </span>

                          <div className="min-w-0">

                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Order #
                              {order.id
                                ?.slice(-8)
                                .toUpperCase()}
                            </p>

                            <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                              {order.vendorName ||
                                "Campus Vendor"}
                            </h3>

                          </div>

                        </div>

                        <p className="mt-3 text-xs text-gray-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                        ● Ready
                      </span>

                    </div>

                  </div>

                  <div className="p-5 sm:p-6">

                    {/* LOCATION */}

                    <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                          📍
                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                            Deliver To
                          </p>

                          <p className="mt-1 font-semibold leading-5 text-gray-900">
                            {order.deliveryLocation ||
                              "Location not available"}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="mt-6">

                      <div className="flex items-center justify-between">

                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Order Items
                        </p>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                          {getItemCount(order)} items
                        </span>

                      </div>

                      <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">

                        {order.foodItems?.map(
                          (item, index) => (

                            <div
                              key={`${
                                item.foodId ||
                                item.name
                              }-${index}`}
                              className="flex items-center justify-between gap-4 px-4 py-3"
                            >

                              <div className="min-w-0">

                                <p className="truncate text-sm font-medium text-gray-700">
                                  {item.name}
                                </p>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  Quantity: {item.quantity}
                                </p>

                              </div>

                              <span className="shrink-0 text-sm font-bold text-gray-900">
                                ₹
                                {(
                                  Number(
                                    item.price || 0
                                  ) *
                                  Number(
                                    item.quantity || 0
                                  )
                                ).toFixed(2)}
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                    {/* PAYMENT */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-2xl bg-gray-50 p-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                          {order.paymentMethod ||
                            "Not available"}
                        </p>

                      </div>

                      <div className="rounded-2xl bg-orange-50 p-4 text-right">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-orange-600">
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </p>

                      </div>

                    </div>

                    {/* SPECIAL INSTRUCTIONS */}

                    {order.specialInstructions && (
                      <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

                        <p className="text-xs font-bold text-yellow-800">
                          📝 Special Instructions
                        </p>

                        <p className="mt-1 text-sm leading-5 text-yellow-700">
                          {order.specialInstructions}
                        </p>

                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                      <Link
                        to={`/delivery/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                      >
                        👁️ View Details
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleAcceptDelivery(
                            order.id
                          )
                        }
                        disabled={
                          acceptingOrderId ===
                          order.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {acceptingOrderId ===
                        order.id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Starting...
                          </>
                        ) : (
                          <>
                            🛵
                            Accept Delivery
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =================================================
            ACTIVE DELIVERIES
        ================================================= */}

        <section className="mt-10">

          <div className="mb-5">

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-bold text-gray-900">
                My Active Deliveries
              </h2>

              {activeDeliveries.length > 0 && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                  {activeDeliveries.length}
                </span>
              )}

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Orders currently assigned to you
            </p>

          </div>

          {activeLoading ? (

            <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading active deliveries...
              </p>

            </div>

          ) : activeDeliveries.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
                🛵
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No Active Deliveries
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Accepted deliveries will appear here.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {activeDeliveries.map((order) => (

                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm"
                >

                  {/* ACTIVE HEADER */}

                  <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-5 sm:p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Order #
                          {order.id
                            ?.slice(-8)
                            .toUpperCase()}
                        </p>

                        <h3 className="mt-1 truncate text-lg font-bold text-gray-900">
                          {order.vendorName ||
                            "Campus Vendor"}
                        </h3>

                      </div>

                      <span className="shrink-0 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700">
                        🛵 Out for Delivery
                      </span>

                    </div>

                  </div>

                  <div className="p-5 sm:p-6">

                    {/* DESTINATION */}

                    <div className="rounded-2xl bg-gray-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                          📍
                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Delivery Destination
                          </p>

                          <p className="mt-1 font-semibold leading-5 text-gray-900">
                            {order.deliveryLocation ||
                              "Location not available"}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="mt-6">

                      <div className="flex items-center justify-between">

                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Items
                        </p>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                          {getItemCount(order)} items
                        </span>

                      </div>

                      <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">

                        {order.foodItems?.map(
                          (item, index) => (

                            <div
                              key={`${
                                item.foodId ||
                                item.name
                              }-${index}`}
                              className="flex items-center justify-between gap-4 px-4 py-3"
                            >

                              <div className="min-w-0">

                                <p className="truncate text-sm font-medium text-gray-700">
                                  {item.name}
                                </p>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  Quantity: {item.quantity}
                                </p>

                              </div>

                              <span className="shrink-0 text-sm font-bold text-gray-900">
                                ₹
                                {(
                                  Number(
                                    item.price || 0
                                  ) *
                                  Number(
                                    item.quantity || 0
                                  )
                                ).toFixed(2)}
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                    {/* TOTAL */}

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 p-4">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {order.paymentMethod ||
                            "Not available"}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-orange-600">
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </p>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                      <Link
                        to={`/delivery/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                      >
                        👁️ View Details
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsDelivered(
                            order.id
                          )
                        }
                        disabled={
                          deliveringOrderId ===
                          order.id
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deliveringOrderId ===
                        order.id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Completing...
                          </>
                        ) : (
                          <>
                            ✅
                            Mark Delivered
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =================================================
            DELIVERY HISTORY
        ================================================= */}

        <section className="mt-10 pb-10">

          <div className="mb-5">

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-bold text-gray-900">
                Delivery History
              </h2>

              {deliveryHistory.length > 0 && (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                  {deliveryHistory.length}
                </span>
              )}

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Your completed delivery orders
            </p>

          </div>

          {historyLoading ? (

            <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading delivery history...
              </p>

            </div>

          ) : deliveryHistory.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 text-4xl">
                📋
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No Delivery History
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Completed deliveries will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {deliveryHistory.map((order) => (

                <div
                  key={order.id}
                  className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-lg">
                          ✓
                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Order #
                            {order.id
                              ?.slice(-8)
                              .toUpperCase()}
                          </p>

                          <h3 className="truncate text-base font-bold text-gray-900">
                            {order.vendorName ||
                              "Campus Vendor"}
                          </h3>

                        </div>

                      </div>

                      <p className="mt-3 text-sm text-gray-500">
                        📍{" "}
                        {order.deliveryLocation ||
                          "Location not available"}
                      </p>

                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">

                      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                        ✓ Delivered
                      </span>

                      <span className="text-xs text-gray-400">
                        {formatDate(
                          order.deliveredAt ||
                            order.updatedAt
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">

                    <div className="rounded-2xl border border-gray-100">

                      {order.foodItems?.map(
                        (item, index) => (

                          <div
                            key={`${
                              item.foodId ||
                              item.name
                            }-${index}`}
                            className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
                          >

                            <div className="min-w-0">

                              <p className="truncate text-sm font-medium text-gray-700">
                                {item.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                Quantity: {item.quantity}
                              </p>

                            </div>

                            <span className="shrink-0 text-sm font-bold text-gray-900">
                              ₹
                              {(
                                Number(
                                  item.price || 0
                                ) *
                                Number(
                                  item.quantity || 0
                                )
                              ).toFixed(2)}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                    <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {order.paymentMethod ||
                            "Not available"}
                        </p>

                      </div>

                      <div className="sm:text-right">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-green-600">
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </p>

                      </div>

                    </div>

                    <Link
                      to={`/delivery/orders/${order.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                    >
                      👁️ View Delivery Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default DeliveryDashboard;