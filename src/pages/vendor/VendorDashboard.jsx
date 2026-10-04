import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { getVendorOrders } from "../../services/vendorOrderService";

function VendorDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD VENDOR ORDERS
  // =====================================================

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setLoading(false);
          return;
        }

        const vendorOrders = await getVendorOrders(
          currentUser.uid
        );

        setOrders(vendorOrders);
      } catch (error) {
        console.error(
          "Load vendor dashboard error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // =====================================================
  // ORDER STATISTICS
  // =====================================================

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "Preparing"
  ).length;

  const readyOrders = orders.filter(
    (order) =>
      order.status === "Ready" ||
      order.status === "Ready for Pickup"
  ).length;

  const pickupOrders = orders.filter(
    (order) => order.orderType === "Pickup"
  ).length;

  const deliveryOrders = orders.filter(
    (order) => order.orderType === "Delivery"
  ).length;

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders = [...orders]
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    })
    .slice(0, 5);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return "Recently";
    }

    return timestamp.toDate().toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) {
      return "";
    }

    return timestamp.toDate().toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "Accepted":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Preparing":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "Ready":
      case "Ready for Pickup":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Out for Delivery":
        return "bg-violet-50 text-violet-700 border-violet-200";

      case "Delivered":
      case "Picked Up":
        return "bg-green-50 text-green-700 border-green-200";

      case "Rejected":
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // =====================================================
  // ORDER TYPE
  // =====================================================

  const getOrderTypeClass = (orderType) => {
    if (orderType === "Pickup") {
      return "bg-indigo-50 text-indigo-700";
    }

    return "bg-sky-50 text-sky-700";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">

        <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-6 lg:px-8">

          <div className="animate-pulse">

            <div className="flex items-center justify-between">

              <div>
                <div className="h-3 w-28 rounded bg-gray-200" />
                <div className="mt-3 h-8 w-44 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-72 rounded bg-gray-200" />
              </div>

              <div className="hidden gap-2 md:flex">
                <div className="h-10 w-28 rounded-xl bg-gray-200" />
                <div className="h-10 w-24 rounded-xl bg-gray-200" />
              </div>

            </div>


            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">

              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-3xl bg-white shadow-sm"
                />
              ))}

            </div>


            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-20 rounded-3xl bg-white shadow-sm"
                />
              ))}

            </div>


            <div className="mt-8 h-72 rounded-3xl bg-white shadow-sm" />

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-10">

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-sm">
                  🏪
                </span>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">
                  CampusEats Vendor
                </p>

              </div>


              <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                Vendor Dashboard
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-6 text-gray-500">
                Manage your orders, menu, sales and customer
                activity from one place.
              </p>

            </div>


            {/* ACTIONS */}

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

              <button
                type="button"
                onClick={() =>
                  navigate("/vendor/orders")
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
              >
                📦
                View Orders
                <span>→</span>
              </button>


              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100 active:scale-[0.98]"
              >
                🚪
                Logout
              </button>

            </div>

          </div>

        </header>


        {/* =================================================
            KPI SECTION
        ================================================= */}

        <section className="mt-6">

          <div className="mb-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Order Overview
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Today's activity
            </h2>

          </div>


          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">


            {/* PENDING */}

            <div className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-lg">
                  ⏳
                </div>

                <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                  Waiting
                </span>

              </div>

              <p className="mt-5 text-3xl font-bold text-gray-900">
                {pendingOrders}
              </p>

              <p className="mt-1 text-xs font-bold text-gray-700">
                Pending Orders
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Waiting for action
              </p>

            </div>


            {/* PREPARING */}

            <div className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-lg">
                  🍳
                </div>

                <span className="rounded-full bg-orange-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-orange-600">
                  Active
                </span>

              </div>

              <p className="mt-5 text-3xl font-bold text-gray-900">
                {preparingOrders}
              </p>

              <p className="mt-1 text-xs font-bold text-gray-700">
                Preparing
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Currently preparing
              </p>

            </div>


            {/* READY */}

            <div className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
                  ✓
                </div>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                  Ready
                </span>

              </div>

              <p className="mt-5 text-3xl font-bold text-gray-900">
                {readyOrders}
              </p>

              <p className="mt-1 text-xs font-bold text-gray-700">
                Ready Orders
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Ready for next step
              </p>

            </div>


            {/* PICKUP */}

            <div className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-lg">
                  🛍️
                </div>

                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                  Pickup
                </span>

              </div>

              <p className="mt-5 text-3xl font-bold text-gray-900">
                {pickupOrders}
              </p>

              <p className="mt-1 text-xs font-bold text-gray-700">
                Pickup Orders
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Customer pickup
              </p>

            </div>


            {/* DELIVERY */}

            <div className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex h-10 items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-lg">
                  🛵
                </div>

                <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-sky-600">
                  Delivery
                </span>

              </div>

              <p className="mt-5 text-3xl font-bold text-gray-900">
                {deliveryOrders}
              </p>

              <p className="mt-1 text-xs font-bold text-gray-700">
                Delivery Orders
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Campus deliveries
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="mt-8">

          <div className="mb-4">

            <div className="flex items-center gap-2">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Management
              </p>

              <span className="rounded-full bg-orange-50 px-2 py-1 text-[9px] font-bold text-orange-600">
                Quick Access
              </span>

            </div>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Quick Actions
            </h2>

          </div>


          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">


            {/* ORDERS */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/orders")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                  📦
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Orders
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Manage customer orders
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-orange-50 group-hover:text-orange-500 group-hover:translate-x-1">
                →
              </span>

            </button>


            {/* MENU */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/menu")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                  🍔
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Menu
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Manage food items
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-orange-50 group-hover:text-orange-500 group-hover:translate-x-1">
                →
              </span>

            </button>


            {/* SALES */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/sales")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                  📊
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Sales
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    View sales performance
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:translate-x-1">
                →
              </span>

            </button>


            {/* OFFERS */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/offers")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl">
                  🎁
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Offers
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Manage coupons
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-purple-50 group-hover:text-purple-500 group-hover:translate-x-1">
                →
              </span>

            </button>


            {/* REVIEWS */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/reviews")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                  ⭐
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Reviews
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    View customer feedback
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-amber-50 group-hover:text-amber-500 group-hover:translate-x-1">
                →
              </span>

            </button>


            {/* PROFILE */}

            <button
              type="button"
              onClick={() =>
                navigate("/vendor/profile")
              }
              className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                  👤
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Profile
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Manage vendor profile
                  </p>
                </div>

              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition group-hover:bg-gray-100 group-hover:text-gray-700 group-hover:translate-x-1">
                →
              </span>

            </button>

          </div>

        </section>


        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="mt-8">

          <div className="mb-4 flex items-end justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Latest customer orders
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate("/vendor/orders")
              }
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-orange-500 transition hover:bg-orange-50"
            >
              View all
              <span>→</span>
            </button>

          </div>


          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

            {recentOrders.length === 0 ? (

              <div className="px-5 py-16 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-2xl">
                  📦
                </div>

                <h3 className="mt-4 text-sm font-bold text-gray-900">
                  No orders yet
                </h3>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-500">
                  New customer orders will appear here
                  when students place orders.
                </p>

              </div>

            ) : (

              <>

                {/* =================================================
                    DESKTOP TABLE
                ================================================= */}

                <div className="hidden overflow-x-auto lg:block">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b border-gray-100 bg-gray-50/70">

                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Order
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Items
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Type
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Date
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
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

                          <td className="px-5 py-4">

                            <p className="text-sm font-bold text-gray-900">
                              #{order.id.slice(0, 8)}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              {order.paymentMethod ||
                                "Payment"}
                            </p>

                          </td>


                          <td className="max-w-[280px] px-4 py-4">

                            <p className="truncate text-xs font-medium text-gray-700">

                              {order.items?.length
                                ? order.items
                                    .map(
                                      (item) =>
                                        `${item.name} × ${item.quantity}`
                                    )
                                    .join(", ")
                                : "No items"}

                            </p>


                            {order.orderType ===
                              "Delivery" &&
                              order.deliveryLocation && (

                                <p className="mt-1 max-w-[230px] truncate text-[10px] text-gray-400">
                                  📍 {order.deliveryLocation}
                                </p>

                              )}


                            {order.orderType ===
                              "Pickup" && (

                                <p className="mt-1 text-[10px] text-gray-400">
                                  🛍️ Customer pickup
                                </p>

                              )}

                          </td>


                          <td className="px-4 py-4">

                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${getOrderTypeClass(
                                order.orderType
                              )}`}
                            >
                              {order.orderType ===
                              "Pickup"
                                ? "Pickup"
                                : "Delivery"}
                            </span>

                          </td>


                          <td className="px-4 py-4">

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>

                          </td>


                          <td className="px-4 py-4">

                            <p className="text-xs font-medium text-gray-700">
                              {formatDate(
                                order.createdAt
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatTime(
                                order.createdAt
                              )}
                            </p>

                          </td>


                          <td className="px-5 py-4 text-right">

                            <p className="text-sm font-bold text-gray-900">
                              ₹{order.total}
                            </p>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>


                {/* =================================================
                    MOBILE / TABLET
                ================================================= */}

                <div className="divide-y divide-gray-100 lg:hidden">

                  {recentOrders.map((order) => (

                    <div
                      key={order.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-sm font-bold text-gray-900">
                              #{order.id.slice(0, 8)}
                            </p>

                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>

                          </div>


                          <p className="mt-2 truncate text-xs font-medium text-gray-600">

                            {order.items?.length
                              ? order.items
                                  .map(
                                    (item) =>
                                      `${item.name} × ${item.quantity}`
                                  )
                                  .join(", ")
                              : "No items"}

                          </p>

                        </div>


                        <p className="whitespace-nowrap text-sm font-bold text-gray-900">
                          ₹{order.total}
                        </p>

                      </div>


                      <div className="mt-3 flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-2">

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${getOrderTypeClass(
                              order.orderType
                            )}`}
                          >
                            {order.orderType ===
                            "Pickup"
                              ? "Pickup"
                              : "Delivery"}
                          </span>

                          <span className="truncate text-[10px] text-gray-400">
                            {formatDate(
                              order.createdAt
                            )}
                          </span>

                        </div>


                        <span className="shrink-0 text-[10px] text-gray-400">
                          {order.paymentMethod ||
                            "Payment"}
                        </span>

                      </div>


                      {order.orderType ===
                        "Delivery" &&
                        order.deliveryLocation && (

                          <p className="mt-2 truncate text-[10px] text-gray-400">
                            📍 {order.deliveryLocation}
                          </p>

                        )}


                      {order.orderType ===
                        "Pickup" && (

                        <p className="mt-2 text-[10px] text-gray-400">
                          🛍️ Customer pickup
                        </p>

                      )}

                    </div>

                  ))}

                </div>

              </>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default VendorDashboard;