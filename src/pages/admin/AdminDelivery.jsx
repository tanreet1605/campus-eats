import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

function AdminDelivery() {
  const navigate = useNavigate();

  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  // =====================================================
  // LOAD DELIVERY DATA
  // =====================================================

  const loadDeliveryData = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          usersSnapshot,
          ordersSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")),
        ]);

        const staffData = usersSnapshot.docs
          .map((userDoc) => ({
            id: userDoc.id,
            ...userDoc.data(),
          }))
          .filter(
            (user) =>
              user.role?.toLowerCase() ===
              "delivery"
          );

        const orderData =
          ordersSnapshot.docs.map(
            (orderDoc) => ({
              id: orderDoc.id,
              ...orderDoc.data(),
            })
          );

        setDeliveryStaff(staffData);
        setOrders(orderData);
      } catch (err) {
        console.error(
          "Admin delivery error:",
          err
        );

        setError(
          err.message ||
            "Unable to load delivery staff information. Please check Firebase permissions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDeliveryData();
  }, [loadDeliveryData]);

  // =====================================================
  // ORDER HELPERS
  // =====================================================

  const getAssignedOrders = useCallback(
    (staffId) => {
      return orders.filter(
        (order) =>
          order.assignedDeliveryStaff ===
          staffId
      );
    },
    [orders]
  );

  const getCompletedOrders = useCallback(
    (staffId) => {
      return orders.filter(
        (order) =>
          order.assignedDeliveryStaff ===
            staffId &&
          order.orderType === "Delivery" &&
          order.status === "Delivered"
      );
    },
    [orders]
  );

  const getActiveOrders = useCallback(
    (staffId) => {
      const activeStatuses = [
        "Out for Delivery",
      ];

      return orders.filter(
        (order) =>
          order.assignedDeliveryStaff ===
            staffId &&
          order.orderType === "Delivery" &&
          activeStatuses.includes(
            order.status
          )
      );
    },
    [orders]
  );

  const getStaffStatus = useCallback(
    (staffId) => {
      const activeOrders =
        getActiveOrders(staffId);

      if (activeOrders.length > 0) {
        return "On Delivery";
      }

      return "Available";
    },
    [getActiveOrders]
  );

  const isStaffActive = useCallback(
    (staff) => {
      return (
        staff.active !== false &&
        staff.status !== "inactive"
      );
    },
    []
  );

  // =====================================================
  // FILTER STAFF
  // =====================================================

  const filteredStaff = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return deliveryStaff.filter((staff) => {
      const matchesSearch =
        !searchText ||
        staff.name
          ?.toLowerCase()
          .includes(searchText) ||
        staff.email
          ?.toLowerCase()
          .includes(searchText) ||
        staff.id
          ?.toLowerCase()
          .includes(searchText) ||
        String(staff.phone || "")
          .toLowerCase()
          .includes(searchText);

      const staffStatus =
        getStaffStatus(staff.id);

      const matchesStatus =
        statusFilter === "all" ||
        staffStatus === statusFilter;

      const active =
        isStaffActive(staff);

      const matchesAccount =
        accountFilter === "all" ||
        (accountFilter === "active" &&
          active) ||
        (accountFilter === "inactive" &&
          !active);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAccount
      );
    });
  }, [
    deliveryStaff,
    search,
    statusFilter,
    accountFilter,
    getStaffStatus,
    isStaffActive,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalStaff =
    deliveryStaff.length;

  const activeStaff =
    deliveryStaff.filter((staff) =>
      isStaffActive(staff)
    ).length;

  const inactiveStaff =
    totalStaff - activeStaff;

  const assignedOrders = orders.filter(
    (order) =>
      order.orderType === "Delivery" &&
      order.assignedDeliveryStaff
  );

  const activeDeliveries =
    assignedOrders.filter(
      (order) =>
        order.status === "Out for Delivery"
    );

  const completedDeliveries =
    assignedOrders.filter(
      (order) =>
        order.status === "Delivered"
    );

  const availableStaff =
    deliveryStaff.filter(
      (staff) =>
        isStaffActive(staff) &&
        getStaffStatus(staff.id) ===
          "Available"
    ).length;

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setAccountFilter("all");
  };

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    accountFilter !== "all";

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
              🛵
            </div>

            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

            <h2 className="font-bold text-gray-900">
              Loading delivery staff
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while we load the delivery dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
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
                  🛵
                </div>

                <div className="min-w-0">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    CampusEats Admin
                  </p>

                  <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                    Delivery Management
                  </h1>

                </div>

              </div>

              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                Monitor delivery staff, assigned orders and campus delivery activity from one place.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadDeliveryData(true)
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
                  Unable to load delivery data
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
            OVERVIEW LABEL
        ================================================= */}

        <div className="mb-4 flex items-center justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
              Delivery Overview
            </p>

            <h2 className="mt-1 text-xl font-black text-gray-900">
              Workforce & Activity
            </h2>
          </div>

          <div className="hidden rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm sm:block">
            Live from Firebase
          </div>

        </div>

        {/* =================================================
            PRIMARY STATS
        ================================================= */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Total Staff
                  </p>

                  <p className="mt-2 text-3xl font-black text-gray-900">
                    {totalStaff}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  🛵
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Registered delivery accounts
              </div>

            </div>

          </div>

          {/* ACTIVE */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Active Staff
                  </p>

                  <p className="mt-2 text-3xl font-black text-green-600">
                    {activeStaff}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                  🟢
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active delivery accounts
              </div>

            </div>

          </div>

          {/* ACTIVE DELIVERIES */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    On Delivery
                  </p>

                  <p className="mt-2 text-3xl font-black text-orange-600">
                    {activeDeliveries.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  🚴
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                Currently out for delivery
              </div>

            </div>

          </div>

          {/* COMPLETED */}

          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 transition group-hover:scale-110" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Completed
                  </p>

                  <p className="mt-2 text-3xl font-black text-blue-600">
                    {completedDeliveries.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  ✅
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Successfully delivered
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            SECONDARY STATS
        ================================================= */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Available Staff
                </p>

                <p className="mt-2 text-2xl font-black text-green-600">
                  {availableStaff}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Active and currently available
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-lg">
                🟢
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Inactive Staff
                </p>

                <p className="mt-2 text-2xl font-black text-red-600">
                  {inactiveStaff}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Inactive delivery accounts
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-lg">
                ⛔
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Assigned Deliveries
                </p>

                <p className="mt-2 text-2xl font-black text-purple-600">
                  {assignedOrders.length}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Total delivery orders assigned
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-lg">
                📦
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FILTER PANEL
        ================================================= */}

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-gray-900">
                  Find Delivery Staff
                </h2>

                <p className="text-xs text-gray-500">
                  Search and filter delivery accounts
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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">

              {/* SEARCH */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Search Staff
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
                    placeholder="Name, email, phone or staff ID..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Current Status
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

                  <option value="Available">
                    Available
                  </option>

                  <option value="On Delivery">
                    On Delivery
                  </option>
                </select>

              </div>

              {/* ACCOUNT */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Account Status
                </label>

                <select
                  value={accountFilter}
                  onChange={(e) =>
                    setAccountFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                >
                  <option value="all">
                    All Accounts
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
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
                Delivery Staff
              </h2>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {filteredStaff.length}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredStaff.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {deliveryStaff.length}
              </span>{" "}
              staff members
            </p>

          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Delivery Monitoring
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
                    Delivery Staff
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Assigned
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Completed
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Current Status
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Account
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Joined
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredStaff.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                        🛵
                      </div>

                      <p className="font-bold text-gray-900">
                        No delivery staff found
                      </p>

                      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                        Try changing your search terms or filters to find delivery staff.
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

                  filteredStaff.map(
                    (staff) => {
                      const assigned =
                        getAssignedOrders(
                          staff.id
                        );

                      const completed =
                        getCompletedOrders(
                          staff.id
                        );

                      const status =
                        getStaffStatus(
                          staff.id
                        );

                      const active =
                        isStaffActive(
                          staff
                        );

                      return (
                        <tr
                          key={staff.id}
                          className="group transition hover:bg-orange-50/30"
                        >

                          {/* STAFF */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl transition group-hover:bg-green-100">
                                🛵
                              </div>

                              <div className="min-w-0">

                                <p className="font-bold text-gray-900">
                                  {staff.name ||
                                    "Unnamed Staff"}
                                </p>

                                <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-gray-400">
                                  {staff.id}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td className="px-5 py-5">

                            <p className="max-w-[220px] truncate text-sm font-medium text-gray-700">
                              {staff.email ||
                                "No email"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {staff.phone ||
                                "No phone"}
                            </p>

                          </td>

                          {/* ASSIGNED */}

                          <td className="px-5 py-5 text-center">

                            <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1.5 font-black text-gray-800">
                              {assigned.length}
                            </span>

                          </td>

                          {/* COMPLETED */}

                          <td className="px-5 py-5 text-center">

                            <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-1.5 font-black text-blue-600">
                              {completed.length}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                                status ===
                                "On Delivery"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >

                              <span>
                                {status ===
                                "On Delivery"
                                  ? "🚴"
                                  : "●"}
                              </span>

                              {status}

                            </span>

                          </td>

                          {/* ACCOUNT */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                                active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >

                              <span className="h-1.5 w-1.5 rounded-full bg-current" />

                              {active
                                ? "Active"
                                : "Inactive"}

                            </span>

                          </td>

                          {/* JOINED */}

                          <td className="whitespace-nowrap px-5 py-5">

                            <p className="text-sm font-medium text-gray-600">
                              {formatDate(
                                staff.createdAt
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

          {filteredStaff.length ===
          0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🛵
              </div>

              <p className="font-bold text-gray-900">
                No delivery staff found
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

            filteredStaff.map(
              (staff) => {
                const assigned =
                  getAssignedOrders(
                    staff.id
                  );

                const completed =
                  getCompletedOrders(
                    staff.id
                  );

                const status =
                  getStaffStatus(
                    staff.id
                  );

                const active =
                  isStaffActive(
                    staff
                  );

                return (
                  <div
                    key={staff.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >

                    {/* CARD HEADER */}

                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                            🛵
                          </div>

                          <div className="min-w-0">

                            <h3 className="truncate font-black text-gray-900">
                              {staff.name ||
                                "Unnamed Staff"}
                            </h3>

                            <p className="mt-1 truncate text-xs text-gray-500">
                              {staff.email ||
                                "No email"}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                            active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                    </div>

                    <div className="p-5">

                      {/* ID */}

                      <div className="rounded-xl bg-gray-50 p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Staff ID
                        </p>

                        <p className="mt-1 break-all font-mono text-[11px] text-gray-600">
                          {staff.id}
                        </p>

                      </div>

                      {/* CONTACT */}

                      <div className="mt-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Phone
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {staff.phone ||
                            "No phone"}
                        </p>

                      </div>

                      {/* STATS */}

                      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-gray-100">

                        <div className="border-r border-gray-100 bg-gray-50 p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            Assigned
                          </p>

                          <p className="mt-1 text-lg font-black text-gray-900">
                            {assigned.length}
                          </p>

                        </div>

                        <div className="border-r border-gray-100 bg-gray-50 p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            Completed
                          </p>

                          <p className="mt-1 text-lg font-black text-blue-600">
                            {completed.length}
                          </p>

                        </div>

                        <div className="bg-gray-50 p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            Status
                          </p>

                          <p
                            className={`mt-1 truncate text-xs font-black ${
                              status ===
                              "On Delivery"
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {status}
                          </p>

                        </div>

                      </div>

                      {/* FOOTER */}

                      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Joined
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-700">
                            {formatDate(
                              staff.createdAt
                            )}
                          </p>

                        </div>

                        <div
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            status ===
                            "On Delivery"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {status ===
                          "On Delivery"
                            ? "🚴 Active Run"
                            : "✓ Available"}
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

export default AdminDelivery;