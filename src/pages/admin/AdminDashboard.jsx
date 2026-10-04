import { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    deliveryStaff: 0,
    students: 0,
    orders: 0,
    foodItems: 0,
    reviews: 0,
    offers: 0,
    revenue: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const loadAdminStats = useCallback(
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
          foodSnapshot,
          reviewsSnapshot,
          offersSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "foodItems")),
          getDocs(collection(db, "reviews")),
          getDocs(collection(db, "offers")),
        ]);

        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const orders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const students = users.filter(
          (user) =>
            user.role === "student" ||
            user.role === "user"
        ).length;

        const vendors = users.filter(
          (user) => user.role === "vendor"
        ).length;

        const deliveryStaff = users.filter(
          (user) => user.role === "delivery"
        ).length;

        const completedOrders = orders.filter(
          (order) =>
            order.status === "Delivered" ||
            order.status === "Picked Up"
        );

        const pendingOrders = orders.filter(
          (order) => order.status === "Pending"
        );

        const activeOrders = orders.filter((order) =>
          [
            "Accepted",
            "Preparing",
            "Ready",
            "Ready for Pickup",
            "Out for Delivery",
          ].includes(order.status)
        );

        const revenue = completedOrders.reduce(
          (total, order) =>
            total + Number(order.total || 0),
          0
        );

        const sortedOrders = [...orders].sort(
          (a, b) => {
            const timeA = a.createdAt?.toMillis
              ? a.createdAt.toMillis()
              : 0;

            const timeB = b.createdAt?.toMillis
              ? b.createdAt.toMillis()
              : 0;

            return timeB - timeA;
          }
        );

        setRecentOrders(sortedOrders.slice(0, 6));

        setStats({
          users: users.length,
          vendors,
          deliveryStaff,
          students,
          orders: orders.length,
          foodItems: foodSnapshot.size,
          reviews: reviewsSnapshot.size,
          offers: offersSnapshot.size,
          revenue,
          pendingOrders: pendingOrders.length,
          activeOrders: activeOrders.length,
          completedOrders: completedOrders.length,
        });
      } catch (err) {
        console.error(
          "Admin dashboard error:",
          err
        );

        setError(
          err.message ||
            "Unable to load admin dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAdminStats();
  }, [loadAdminStats]);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut(auth);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      setLoggingOut(false);

      setError(
        error.message ||
          "Unable to logout. Please try again."
      );
    }
  };

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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not available";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

      case "Accepted":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

      case "Preparing":
        return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";

      case "Ready":
      case "Ready for Pickup":
        return "bg-green-50 text-green-700 ring-1 ring-green-200";

      case "Out for Delivery":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";

      case "Delivered":
      case "Picked Up":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-gray-50 text-gray-700 ring-1 ring-gray-200";
    }
  };

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-gray-200" />
                <div className="h-8 w-64 rounded-xl bg-gray-200" />
                <div className="h-4 w-80 rounded-lg bg-gray-200" />
              </div>

              <div className="hidden gap-3 sm:flex">
                <div className="h-11 w-28 rounded-xl bg-gray-200" />
                <div className="h-11 w-28 rounded-xl bg-gray-200" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-64 rounded-3xl bg-white lg:col-span-2" />
              <div className="h-64 rounded-3xl bg-white" />
            </div>

            <div className="h-80 rounded-3xl bg-white" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">

      {/* =========================
          HEADER
      ========================= */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-xl shadow-sm shadow-orange-200">
                🍴
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  CampusEats
                </p>

                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl">
                  Admin Dashboard
                </h1>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => loadAdminStats(true)}
                disabled={refreshing || loggingOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <span className={refreshing ? "animate-spin" : ""}>
                  ↻
                </span>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut || refreshing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <span>↪</span>
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

        {/* =========================
            HERO
        ========================= */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-200 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Platform Overview
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                CampusEats Control Center
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">
                Monitor campus food delivery activity, orders,
                vendors, users and platform performance from one
                place.
              </p>
            </div>

            <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-gray-400">
                  Accounts
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {stats.users}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-gray-400">
                  Orders
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {stats.orders}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-gray-400">
                  Food Items
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {stats.foodItems}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-gray-400">
                  Revenue
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  ₹{stats.revenue.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            ERROR
        ========================= */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-red-900">
                  Unable to load dashboard
                </p>

                <p className="mt-1 break-words text-sm text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* =========================
            MAIN KPI CARDS
        ========================= */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Students / Users
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
                  {stats.students}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Registered student accounts
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl ring-1 ring-blue-100">
                👨‍🎓
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-3/4 rounded-full bg-blue-500" />
            </div>
          </div>

          <div className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Vendors
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
                  {stats.vendors}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Campus food vendors
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl ring-1 ring-orange-100">
                🏪
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/3 rounded-full bg-orange-500" />
            </div>
          </div>

          <div className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Delivery Staff
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
                  {stats.deliveryStaff}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Registered delivery staff
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl ring-1 ring-green-100">
                🛵
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/2 rounded-full bg-green-500" />
            </div>
          </div>

          <div className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
                  {stats.orders}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  All platform orders
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl ring-1 ring-purple-100">
                📦
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-4/5 rounded-full bg-purple-500" />
            </div>
          </div>

        </section>

        {/* =========================
            ORDER STATUS
        ========================= */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  Pending Orders
                </p>

                <p className="mt-2 text-3xl font-extrabold text-amber-950">
                  {stats.pendingOrders}
                </p>

                <p className="mt-1 text-xs text-amber-600">
                  Waiting for action
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-amber-100">
                ⏳
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Active Orders
                </p>

                <p className="mt-2 text-3xl font-extrabold text-blue-950">
                  {stats.activeOrders}
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  Currently being processed
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-blue-100">
                🔄
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Completed Orders
                </p>

                <p className="mt-2 text-3xl font-extrabold text-emerald-950">
                  {stats.completedOrders}
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Successfully completed
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-emerald-100">
                ✓
              </div>
            </div>
          </div>

        </section>

        {/* =========================
            REVENUE + OVERVIEW
        ========================= */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">

          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 p-6 text-white shadow-lg lg:col-span-2 sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 left-1/2 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-orange-100">
                    Completed Order Revenue
                  </p>

                  <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
                    ₹{stats.revenue.toFixed(2)}
                  </p>

                  <p className="mt-3 max-w-md text-sm leading-6 text-orange-100">
                    Revenue calculated from delivered and
                    picked-up orders across the platform.
                  </p>
                </div>

                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur sm:flex">
                  ₹
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-orange-100">
                    Completed
                  </p>

                  <p className="mt-1 text-xl font-extrabold">
                    {stats.completedOrders}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-orange-100">
                    Total Orders
                  </p>

                  <p className="mt-1 text-xl font-extrabold">
                    {stats.orders}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Overview
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-gray-950">
                  Platform
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-lg">
                📊
              </div>
            </div>

            <div className="mt-6 space-y-1">

              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-gray-50">
                <span className="text-sm text-gray-500">
                  Food Items
                </span>

                <span className="font-extrabold text-gray-900">
                  {stats.foodItems}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-gray-50">
                <span className="text-sm text-gray-500">
                  Reviews
                </span>

                <span className="font-extrabold text-gray-900">
                  {stats.reviews}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-gray-50">
                <span className="text-sm text-gray-500">
                  Offers
                </span>

                <span className="font-extrabold text-gray-900">
                  {stats.offers}
                </span>
              </div>

              <div className="my-2 border-t border-gray-100" />

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                <span className="text-sm font-semibold text-gray-600">
                  Total Accounts
                </span>

                <span className="font-extrabold text-gray-950">
                  {stats.users}
                </span>
              </div>

            </div>
          </div>

        </section>

        {/* =========================
            RECENT ORDERS
        ========================= */}
        <section className="mt-8">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Activity
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest activity across CampusEats.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="self-start rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100 sm:self-auto"
            >
              View All Orders →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-3xl">
                📦
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                No Orders Yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Orders will appear here once customers place them.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

              <div className="overflow-x-auto">
                <table className="min-w-full">

                  <thead className="border-b border-gray-100 bg-gray-50/80">
                    <tr>
                      <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Order
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Vendor
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Type
                      </th>

                      <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-orange-50/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm">
                              📦
                            </div>

                            <div>
                              <p className="font-bold text-gray-900">
                                #
                                {order.id
                                  ?.slice(-8)
                                  .toUpperCase()}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {order.vendorName || "Campus Vendor"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
                            {order.orderType || "Delivery"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <p className="font-extrabold text-gray-950">
                            ₹
                            {Number(
                              order.total || 0
                            ).toFixed(2)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}
        </section>

        {/* =========================
            MANAGEMENT
        ========================= */}
        <section className="mt-10 pb-10">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Control Center
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
              Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Access and manage different parts of the platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {/* USERS */}
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl ring-1 ring-blue-100">
                  👥
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Users
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Manage student accounts
              </p>

              <p className="mt-4 text-xs font-extrabold text-blue-600">
                Manage Users
              </p>
            </button>

            {/* VENDORS */}
            <button
              type="button"
              onClick={() => navigate("/admin/vendors")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl ring-1 ring-orange-100">
                  🏪
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Vendors
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Manage campus vendors
              </p>

              <p className="mt-4 text-xs font-extrabold text-orange-600">
                Manage Vendors
              </p>
            </button>

            {/* DELIVERY */}
            <button
              type="button"
              onClick={() => navigate("/admin/delivery")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl ring-1 ring-green-100">
                  🛵
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-green-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Delivery Staff
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Manage delivery staff
              </p>

              <p className="mt-4 text-xs font-extrabold text-green-600">
                Manage Delivery
              </p>
            </button>

            {/* ORDERS */}
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl ring-1 ring-purple-100">
                  📦
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-purple-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Orders
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Monitor all orders
              </p>

              <p className="mt-4 text-xs font-extrabold text-purple-600">
                Manage Orders
              </p>
            </button>

            {/* FOOD */}
            <button
              type="button"
              onClick={() => navigate("/admin/food")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl ring-1 ring-red-100">
                  🍔
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-red-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Food Menu
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Monitor food items
              </p>

              <p className="mt-4 text-xs font-extrabold text-red-600">
                Manage Food
              </p>
            </button>

            {/* OFFERS */}
            <button
              type="button"
              onClick={() => navigate("/admin/offers")}
              className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-xl ring-1 ring-pink-100">
                  🎟️
                </div>

                <span className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-pink-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-gray-950">
                Offers
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Manage campus offers
              </p>

              <p className="mt-4 text-xs font-extrabold text-pink-600">
                Manage Offers
              </p>
            </button>

          </div>
        </section>

      </main>
    </div>
  );
}

export default AdminDashboard;