import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const snapshot = await getDocs(
          collection(db, "orders")
        );

        const orderData = snapshot.docs.map(
          (orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          })
        );

        // Newest orders first
        orderData.sort((a, b) => {
          const dateA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : 0;

          const dateB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : 0;

          return dateB - dateA;
        });

        setOrders(orderData);
      } catch (err) {
        console.error(
          "Admin orders error:",
          err
        );

        setError(
          err.message ||
            "Unable to load orders. Please check Firebase permissions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // =====================================================
  // HELPERS
  // =====================================================

  const getOrderType = (order) => {
    return order.orderType || "Delivery";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "Accepted":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "Preparing":
        return "bg-orange-100 text-orange-700 border-orange-200";

      case "Ready":
      case "Ready for Pickup":
        return "bg-purple-100 text-purple-700 border-purple-200";

      case "Out for Delivery":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";

      case "Delivered":
      case "Picked Up":
        return "bg-green-100 text-green-700 border-green-200";

      case "Rejected":
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";

      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "Failed":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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

  const getLocation = (order) => {
    if (getOrderType(order) === "Pickup") {
      return "Pickup from vendor";
    }

    return (
      order.deliveryLocation ||
      order.deliveryAddress ||
      "Location not provided"
    );
  };

  // =====================================================
  // FILTER ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchText ||
        order.id
          ?.toLowerCase()
          .includes(searchText) ||
        order.userId
          ?.toLowerCase()
          .includes(searchText) ||
        order.userName
          ?.toLowerCase()
          .includes(searchText) ||
        order.customerName
          ?.toLowerCase()
          .includes(searchText) ||
        order.vendorName
          ?.toLowerCase()
          .includes(searchText) ||
        order.deliveryLocation
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        getOrderType(order) === typeFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        (order.paymentStatus || "Pending") ===
          paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    typeFilter,
    paymentFilter,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const activeOrders = orders.filter(
    (order) =>
      order.status === "Accepted" ||
      order.status === "Preparing" ||
      order.status === "Ready" ||
      order.status === "Ready for Pickup" ||
      order.status === "Out for Delivery"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      order.status === "Delivered" ||
      order.status === "Picked Up"
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      order.status === "Rejected" ||
      order.status === "Cancelled"
  ).length;

  const totalRevenue = orders
    .filter(
      (order) =>
        order.status === "Delivered" ||
        order.status === "Picked Up"
    )
    .reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );

  const deliveryOrders = orders.filter(
    (order) =>
      getOrderType(order) === "Delivery"
  ).length;

  const pickupOrders = orders.filter(
    (order) =>
      getOrderType(order) === "Pickup"
  ).length;

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPaymentFilter("all");
  };

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    paymentFilter !== "all";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
              📦
            </div>

            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

            <h2 className="font-bold text-gray-900">
              Loading orders
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Fetching the latest CampusEats orders.
            </p>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin")
                }
                className="mb-3 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-gray-500 transition hover:text-orange-600"
              >
                <span>←</span>
                <span>
                  Admin Dashboard
                </span>
              </button>

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl shadow-sm">
                  📦
                </div>

                <div className="min-w-0">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    CampusEats Admin
                  </p>

                  <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                    Orders Management
                  </h1>

                </div>

              </div>

              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                Monitor campus food orders, delivery activity, payments and order performance.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {refreshing
                  ? "⏳"
                  : "↻"}
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}
            </button>

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
          <div className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">

            <div className="flex items-start gap-4 border-l-4 border-red-500 bg-red-50 p-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">

                <p className="font-bold text-red-800">
                  Unable to load orders
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-100"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <div className="mb-4 flex items-center justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
              Order Overview
            </p>

            <h2 className="mt-1 text-xl font-black text-gray-900">
              Orders & Revenue
            </h2>
          </div>

          <div className="hidden rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm sm:block">
            Live from Firebase
          </div>

        </div>

        {/* =================================================
            PRIMARY SUMMARY
        ================================================= */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Total Orders
                  </p>

                  <p className="mt-2 text-3xl font-black text-gray-900">
                    {orders.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  📦
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                All campus orders
              </div>

            </div>

          </div>

          {/* PENDING */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Pending
                  </p>

                  <p className="mt-2 text-3xl font-black text-yellow-600">
                    {pendingOrders}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                  ⏳
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                Waiting for processing
              </div>

            </div>

          </div>

          {/* ACTIVE */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Active Orders
                  </p>

                  <p className="mt-2 text-3xl font-black text-blue-600">
                    {activeOrders}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  🚚
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Currently processing
              </div>

            </div>

          </div>

          {/* REVENUE */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Completed Revenue
                  </p>

                  <p className="mt-2 text-2xl font-black text-green-600">
                    ₹{totalRevenue.toFixed(2)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                  💰
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Delivered & picked up
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            ORDER BREAKDOWN
        ================================================= */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Delivery Orders
                </p>

                <p className="mt-2 text-2xl font-black text-orange-600">
                  {deliveryOrders}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Campus delivery
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-lg">
                🛵
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Pickup Orders
                </p>

                <p className="mt-2 text-2xl font-black text-blue-600">
                  {pickupOrders}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Vendor pickup
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg">
                🏃
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-black text-green-600">
                  {completedOrders}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Delivered / Picked Up
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-lg">
                ✅
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Cancelled / Rejected
                </p>

                <p className="mt-2 text-2xl font-black text-red-600">
                  {cancelledOrders}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Uncompleted orders
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-lg">
                ✕
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-bold text-gray-900">
                  Find Orders
                </h2>

                <p className="text-xs text-gray-500">
                  Search and filter campus orders
                </p>

              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-fit rounded-lg px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-50"
                >
                  Clear all filters
                </button>
              )}

            </div>

          </div>

          <div className="p-5">

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">

              {/* SEARCH */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Search Orders
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Order ID, customer, vendor or location..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                >

                  <option value="all">
                    All Statuses
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Accepted">
                    Accepted
                  </option>

                  <option value="Preparing">
                    Preparing
                  </option>

                  <option value="Ready">
                    Ready
                  </option>

                  <option value="Ready for Pickup">
                    Ready for Pickup
                  </option>

                  <option value="Out for Delivery">
                    Out for Delivery
                  </option>

                  <option value="Delivered">
                    Delivered
                  </option>

                  <option value="Picked Up">
                    Picked Up
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

              {/* TYPE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Order Type
                </label>

                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                >

                  <option value="all">
                    All Types
                  </option>

                  <option value="Delivery">
                    Delivery
                  </option>

                  <option value="Pickup">
                    Pickup
                  </option>

                </select>

              </div>

              {/* PAYMENT */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Payment
                </label>

                <select
                  value={paymentFilter}
                  onChange={(e) =>
                    setPaymentFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                >

                  <option value="all">
                    All Payments
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Paid">
                    Paid
                  </option>

                  <option value="Failed">
                    Failed
                  </option>

                </select>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RESULTS HEADER
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-black text-gray-900">
                All Orders
              </h2>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {filteredOrders.length}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {orders.length}
              </span>{" "}
              orders
            </p>

          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">

            <span className="h-2 w-2 rounded-full bg-orange-500" />

            Order Monitoring

          </div>

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-gray-200 bg-gray-50/80">

                <tr>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                        📦
                      </div>

                      <p className="font-bold text-gray-900">
                        No orders found
                      </p>

                      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                        Try changing your search terms or filters.
                      </p>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          Clear Filters
                        </button>
                      )}

                    </td>

                  </tr>

                ) : (

                  filteredOrders.map(
                    (order) => {

                      const orderType =
                        getOrderType(order);

                      return (
                        <tr
                          key={order.id}
                          className="group transition hover:bg-orange-50/30"
                        >

                          {/* ORDER */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg transition group-hover:bg-orange-100">
                                📦
                              </div>

                              <div className="min-w-0">

                                <p className="font-bold text-gray-900">
                                  #{order.id.slice(
                                    0,
                                    8
                                  )}
                                </p>

                                <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-gray-400">
                                  {order.id}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-5">

                            <p className="max-w-[160px] truncate text-sm font-bold text-gray-900">
                              {order.userName ||
                                order.customerName ||
                                "Student"}
                            </p>

                            <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-gray-400">
                              {order.userId ||
                                "N/A"}
                            </p>

                          </td>

                          {/* VENDOR */}

                          <td className="px-5 py-5">

                            <p className="max-w-[150px] truncate text-sm font-semibold text-gray-700">
                              {order.vendorName ||
                                "Unknown Vendor"}
                            </p>

                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
                                orderType ===
                                "Pickup"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-orange-200 bg-orange-50 text-orange-700"
                              }`}
                            >

                              <span>
                                {orderType ===
                                "Pickup"
                                  ? "🏃"
                                  : "🛵"}
                              </span>

                              {orderType}

                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                                order.status
                              )}`}
                            >
                              {order.status ||
                                "Unknown"}
                            </span>

                          </td>

                          {/* PAYMENT */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${getPaymentStyle(
                                order.paymentStatus
                              )}`}
                            >
                              {order.paymentStatus ||
                                "Pending"}
                            </span>

                            <p className="mt-1 max-w-[100px] truncate text-[10px] text-gray-400">
                              {order.paymentMethod ||
                                "N/A"}
                            </p>

                          </td>

                          {/* TOTAL */}

                          <td className="px-5 py-5">

                            <p className="font-black text-gray-900">
                              ₹
                              {Number(
                                order.total || 0
                              ).toFixed(2)}
                            </p>

                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-5">

                            <p className="text-xs font-medium text-gray-600">
                              {formatDate(
                                order.createdAt
                              )}
                            </p>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="space-y-4 md:hidden">

          {filteredOrders.length === 0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                📦
              </div>

              <p className="font-bold text-gray-900">
                No orders found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white"
                >
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            filteredOrders.map(
              (order) => {

                const orderType =
                  getOrderType(order);

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >

                    {/* CARD HEADER */}

                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                            📦
                          </div>

                          <div className="min-w-0">

                            <p className="font-black text-gray-900">
                              #{order.id.slice(
                                0,
                                8
                              )}
                            </p>

                            <p className="mt-1 break-all font-mono text-[10px] text-gray-400">
                              {order.id}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          {order.status ||
                            "Unknown"}
                        </span>

                      </div>

                    </div>

                    <div className="p-5">

                      {/* VENDOR */}

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Vendor
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {order.vendorName ||
                            "Unknown Vendor"}
                        </p>

                      </div>

                      {/* CUSTOMER */}

                      <div className="mt-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 break-all text-sm font-medium text-gray-700">
                          {order.userName ||
                            order.customerName ||
                            order.userId ||
                            "Student"}
                        </p>

                      </div>

                      {/* TYPE + PAYMENT */}

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Order Type
                          </p>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              orderType ===
                              "Pickup"
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {orderType ===
                            "Pickup"
                              ? "🏃 Pickup"
                              : "🛵 Delivery"}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Payment
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-700">
                            {order.paymentStatus ||
                              "Pending"}
                          </p>

                        </div>

                      </div>

                      {/* LOCATION */}

                      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Location
                        </p>

                        <p className="mt-1 text-sm leading-5 text-gray-700">
                          📍 {getLocation(order)}
                        </p>

                      </div>

                      {/* TOTAL + DATE */}

                      <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Order Total
                          </p>

                          <p className="mt-1 text-xl font-black text-gray-900">
                            ₹
                            {Number(
                              order.total || 0
                            ).toFixed(2)}
                          </p>

                        </div>

                        <div className="max-w-[150px] text-right">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Date
                          </p>

                          <p className="mt-1 text-[11px] font-semibold leading-4 text-gray-600">
                            {formatDate(
                              order.createdAt
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

      </main>

    </div>
  );
}

export default AdminOrders;