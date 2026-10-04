import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getVendorSalesData } from "../../services/vendorOrderService";

function VendorSales() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All Time");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // LOAD SALES
  // ==================================================

  const loadSales = useCallback(
    async (showRefreshLoader = false) => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const vendorOrders = await getVendorSalesData(user.uid);

        setOrders(vendorOrders);
      } catch (error) {
        console.error("Load vendor sales error:", error);

        setError(
          "Unable to load sales data. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // ==================================================
  // DATE HELPERS
  // ==================================================

  const getOrderDate = (order) => {
    if (order.createdAt?.toDate) {
      return order.createdAt.toDate();
    }

    if (order.createdAt?.toMillis) {
      return new Date(order.createdAt.toMillis());
    }

    if (order.createdAt) {
      const date = new Date(order.createdAt);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  };

  const isSameDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  // ==================================================
  // FILTER ORDERS
  // ==================================================

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) {
        return false;
      }

      if (filter === "All Time") {
        return true;
      }

      if (filter === "Today") {
        return isSameDay(orderDate, now);
      }

      if (filter === "This Week") {
        const startOfWeek = new Date(now);

        const day = startOfWeek.getDay();

        const difference = day === 0 ? 6 : day - 1;

        startOfWeek.setDate(
          startOfWeek.getDate() - difference
        );

        startOfWeek.setHours(0, 0, 0, 0);

        return orderDate >= startOfWeek;
      }

      if (filter === "This Month") {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [orders, filter]);

  // ==================================================
  // ORDER STATUS GROUPS
  // ==================================================

  const completedOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) =>
        order.status === "Delivered" ||
        order.status === "Picked Up"
    );
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) =>
        ![
          "Delivered",
          "Picked Up",
          "Rejected",
          "Cancelled",
        ].includes(order.status)
    );
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) =>
        order.status === "Rejected" ||
        order.status === "Cancelled"
    );
  }, [filteredOrders]);

  // ==================================================
  // SALES CALCULATION
  // ==================================================

  const totalSales = useMemo(() => {
    return completedOrders.reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );
  }, [completedOrders]);

  // ==================================================
  // TOTAL ORDERS
  // ==================================================

  const totalOrders = filteredOrders.length;

  // ==================================================
  // TOTAL ITEMS SOLD
  // ==================================================

  const totalItemsSold = useMemo(() => {
    return completedOrders.reduce((total, order) => {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      return (
        total +
        items.reduce(
          (itemTotal, item) =>
            itemTotal + Number(item.quantity || 0),
          0
        )
      );
    }, 0);
  }, [completedOrders]);

  // ==================================================
  // BEST SELLING ITEMS
  // ==================================================

  const bestSellingItems = useMemo(() => {
    const itemMap = {};

    completedOrders.forEach((order) => {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      items.forEach((item) => {
        const itemId =
          item.id ||
          item.foodId ||
          item.name;

        if (!itemMap[itemId]) {
          itemMap[itemId] = {
            id: itemId,
            name:
              item.name ||
              "Unknown Item",
            quantity: 0,
            revenue: 0,
          };
        }

        const quantity = Number(
          item.quantity || 0
        );

        const price = Number(
          item.price || 0
        );

        itemMap[itemId].quantity += quantity;

        itemMap[itemId].revenue +=
          price * quantity;
      });
    });

    return Object.values(itemMap).sort(
      (a, b) => b.quantity - a.quantity
    );
  }, [completedOrders]);

  const topSellingItem =
    bestSellingItems[0] || null;

  // ==================================================
  // AVERAGE ORDER
  // ==================================================

  const averageOrder =
    completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0;

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (order) => {
    const date = getOrderDate(order);

    if (!date) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==================================================
  // FORMAT TIME
  // ==================================================

  const formatTime = (order) => {
    const date = getOrderDate(order);

    if (!date) {
      return "";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==================================================
  // STATUS STYLE
  // ==================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";

      case "Picked Up":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";

      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 ring-1 ring-red-100";

      case "Out for Delivery":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-100";

      case "Ready":
      case "Ready for Pickup":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";

      case "Preparing":
        return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";

      case "Accepted":
        return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-80 rounded bg-slate-200" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6 h-48 animate-pulse rounded-3xl bg-white shadow-sm" />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // DASHBOARD
  // ==================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-12">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="overflow-hidden bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() => navigate("/vendor")}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            ← Vendor Dashboard
          </button>

          <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-5 text-white shadow-lg sm:p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  📊 Vendor Analytics
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Sales & Earnings
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-orange-50 sm:text-base">
                  Track your sales, completed orders,
                  revenue and best-selling food items.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadSales(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-md transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing..."
                  : "Refresh Sales"}
              </button>

            </div>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>

              <div>
                <p className="font-bold">
                  Unable to load sales
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadSales(true)}
              className="rounded-lg bg-white px-4 py-2 font-bold text-red-700 shadow-sm transition hover:bg-red-100"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ==================================================
            FILTER / PERIOD
        ================================================== */}

        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Performance
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your performance for the selected period.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">

              <span className="hidden px-2 text-sm text-slate-400 sm:block">
                Period
              </span>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                className="rounded-lg border-0 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="Today">
                  Today
                </option>

                <option value="This Week">
                  This Week
                </option>

                <option value="This Month">
                  This Month
                </option>

                <option value="All Time">
                  All Time
                </option>
              </select>

            </div>
          </div>

          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {/* SALES */}

            <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  💰
                </div>

                <span className="text-xs font-semibold text-emerald-600">
                  Revenue
                </span>

              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Total Sales
              </p>

              <p className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
                ₹{totalSales.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Completed orders
              </p>

            </div>

            {/* ORDERS */}

            <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  📦
                </div>

                <span className="text-xs font-semibold text-blue-600">
                  Orders
                </span>

              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Total Orders
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                {totalOrders}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Orders received
              </p>

            </div>

            {/* COMPLETED */}

            <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  ✅
                </div>

                <span className="text-xs font-semibold text-emerald-600">
                  Success
                </span>

              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Completed
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                {completedOrders.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Delivered / Picked Up
              </p>

            </div>

            {/* AVERAGE */}

            <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                  📊
                </div>

                <span className="text-xs font-semibold text-purple-600">
                  Average
                </span>

              </div>

              <p className="mt-4 text-xs font-medium text-slate-500">
                Average Order
              </p>

              <p className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
                ₹{averageOrder.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Per completed order
              </p>

            </div>

          </div>

          {/* ==================================================
              BUSINESS INSIGHTS
          ================================================== */}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* ACTIVE */}

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 transition hover:shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-bold text-orange-800">
                    Active Orders
                  </p>

                  <p className="mt-1 text-xs text-orange-600">
                    Currently processing
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  🔥
                </div>

              </div>

              <p className="mt-4 text-3xl font-bold text-orange-900">
                {activeOrders.length}
              </p>

            </div>

            {/* ITEMS SOLD */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 transition hover:shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-bold text-blue-800">
                    Items Sold
                  </p>

                  <p className="mt-1 text-xs text-blue-600">
                    From completed orders
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  🍽️
                </div>

              </div>

              <p className="mt-4 text-3xl font-bold text-blue-900">
                {totalItemsSold}
              </p>

            </div>

            {/* CANCELLED */}

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 transition hover:shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-bold text-red-800">
                    Cancelled / Rejected
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Not included in sales
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  ❌
                </div>

              </div>

              <p className="mt-4 text-3xl font-bold text-red-900">
                {cancelledOrders.length}
              </p>

            </div>

          </div>
        </section>

        {/* ==================================================
            TOP SELLING ITEM
        ================================================== */}

        {topSellingItem && (
          <section className="mt-8">

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white shadow-lg sm:p-6">

              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 right-20 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                    ⭐ Top Selling Item
                  </div>

                  <h2 className="mt-3 text-xl font-bold sm:text-2xl">
                    {topSellingItem.name}
                  </h2>

                  <p className="mt-1 text-sm text-orange-50">
                    {topSellingItem.quantity} units sold
                  </p>

                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur sm:min-w-[160px] sm:text-right">

                  <p className="text-xs font-medium text-orange-50">
                    Item Revenue
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    ₹
                    {topSellingItem.revenue.toFixed(2)}
                  </p>

                </div>

              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            RECENT SALES
        ================================================== */}

        <section className="mt-8">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Transactions
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Recent Sales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Completed orders from the selected period.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {completedOrders.length} Completed
            </span>

          </div>

          {completedOrders.length === 0 ? (

            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                💰
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No completed sales
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Completed orders will appear here once
                customers receive or pick up their orders.
              </p>

            </div>

          ) : (

            <div className="mt-4 space-y-3">

              {completedOrders
                .slice(0, 10)
                .map((order) => {

                  const isPickup =
                    order.orderType === "Pickup";

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                    >

                      {/* ORDER HEADER */}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <div className="flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm">
                              📦
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Order #
                                {order.id.slice(-6)}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {formatDate(order)}
                                {" • "}
                                {formatTime(order)}
                              </p>
                            </div>

                          </div>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              isPickup
                                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                                : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"
                            }`}
                          >
                            {isPickup
                              ? "🥡 Pickup"
                              : "🛵 Delivery"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            ✓ {order.status}
                          </span>

                        </div>

                      </div>

                      {/* ITEMS */}

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">

                        <div className="space-y-2">

                          {order.items?.map(
                            (item, index) => (
                              <div
                                key={
                                  item.id ||
                                  `${item.name}-${index}`
                                }
                                className="flex items-center justify-between gap-3 text-sm"
                              >

                                <span className="min-w-0 truncate text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    {item.quantity}×
                                  </span>{" "}
                                  {item.name}
                                </span>

                                <span className="shrink-0 font-bold text-slate-800">
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

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-sm font-medium text-slate-500">
                          Order Total
                        </span>

                        <span className="text-lg font-bold text-slate-900">
                          ₹
                          {Number(
                            order.total || 0
                          ).toFixed(2)}
                        </span>

                      </div>

                    </div>
                  );
                })}

            </div>
          )}

        </section>

        {/* ==================================================
            BEST SELLING ITEMS
        ================================================== */}

        <section className="mt-8">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Product Performance
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Best Selling Items
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Items with the highest quantity sold.
            </p>
          </div>

          {bestSellingItems.length === 0 ? (

            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                🍔
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No item sales yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Best-selling items will appear after
                completed orders.
              </p>

            </div>

          ) : (

            <div className="mt-4 grid gap-3 md:grid-cols-2">

              {bestSellingItems
                .slice(0, 10)
                .map((item, index) => (

                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                            index === 0
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {index === 0
                            ? "🏆"
                            : index + 1}
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.quantity}{" "}
                            unit
                            {item.quantity === 1
                              ? ""
                              : "s"}{" "}
                            sold
                          </p>

                        </div>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="font-bold text-slate-900">
                          ₹
                          {item.revenue.toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Revenue
                        </p>

                      </div>

                    </div>

                    {/* SIMPLE SALES BAR */}

                    <div className="mt-4">

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-orange-500 transition-all"
                          style={{
                            width: `${Math.max(
                              8,
                              (item.quantity /
                                (topSellingItem?.quantity ||
                                  1)) *
                                100
                            )}%`,
                          }}
                        />

                      </div>

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

export default VendorSales;