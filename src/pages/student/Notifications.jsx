import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  syncOfferNotifications,
} from "../../services/notificationService";


function Notifications() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [clearing, setClearing] = useState(false);


  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================= */

  const loadNotifications = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);

      await syncOfferNotifications(user.uid);

      const data = await getUserNotifications(user.uid);

      setNotifications(data);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadNotifications();
  }, [user?.uid]);


  /* =========================================================
     UNREAD COUNT
  ========================================================= */

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.read
    ).length;
  }, [notifications]);


  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read: true,
                }
              : item
          )
        );
      }


      /* ---------------------------------------------------
         ORDER NOTIFICATION
      --------------------------------------------------- */

      if (notification.orderId) {
        navigate(
          `/student/orders/${notification.orderId}`
        );

        return;
      }


      /* ---------------------------------------------------
         OFFER NOTIFICATION
      --------------------------------------------------- */

      if (notification.type === "offer") {
        navigate("/student");

        return;
      }

    } catch (error) {
      console.error(
        "Notification click error:",
        error
      );
    }
  };


  /* =========================================================
     MARK ALL READ
  ========================================================= */

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(notifications);

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error
      );
    }
  };


  /* =========================================================
     CLEAR HISTORY
  ========================================================= */

  const handleClearHistory = async () => {
    if (!user?.uid) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all notification history?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);

      await clearAllNotifications(user.uid);

      setNotifications([]);

    } catch (error) {
      console.error(
        "Clear history error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to clear notification history."
      );

    } finally {
      setClearing(false);
    }
  };


  /* =========================================================
     ICON
  ========================================================= */

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return "📦";

      case "delivery":
        return "🛵";

      case "offer":
        return "🎁";

      case "announcement":
        return "📢";

      default:
        return "🔔";
    }
  };


  /* =========================================================
     ICON BACKGROUND
  ========================================================= */

  const getNotificationIconStyle = (type) => {
    switch (type) {
      case "order":
        return "bg-orange-100 text-orange-600";

      case "delivery":
        return "bg-blue-100 text-blue-600";

      case "offer":
        return "bg-green-100 text-green-600";

      case "announcement":
        return "bg-purple-100 text-purple-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };


  /* =========================================================
     TYPE LABEL
  ========================================================= */

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "order":
        return "ORDER UPDATE";

      case "delivery":
        return "DELIVERY";

      case "offer":
        return "SPECIAL OFFER";

      case "announcement":
        return "ANNOUNCEMENT";

      default:
        return "UPDATE";
    }
  };


  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return "Recently";
    }

    return timestamp.toDate().toLocaleString();
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">

        <div className="mx-auto min-h-screen max-w-md bg-[#f8f8f8]">

          {/* Loading Header */}

          <div className="border-b border-gray-100 bg-white px-5 py-5">

            <div className="flex items-center gap-3">

              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />

              <div className="flex-1">

                <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />

                <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-100" />

              </div>

            </div>

          </div>


          {/* Loading Cards */}

          <div className="space-y-3 px-5 pt-5">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
              >

                <div className="flex gap-3">

                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-gray-100" />

                  <div className="flex-1">

                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />

                    <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-100" />

                    <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-100" />

                    <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-100" />

                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>
    );
  }


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">

      <div className="mx-auto min-h-screen max-w-md bg-[#f8f8f8]">


        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">

          <div className="flex items-center justify-between gap-3">

            <div className="flex min-w-0 items-center gap-3">

              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 active:scale-95"
              >
                ←
              </button>


              <div className="min-w-0">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">
                  CampusEats
                </p>

                <h1 className="truncate text-xl font-bold text-gray-900">
                  Notifications
                </h1>

              </div>

            </div>


            {/* Notification Bell */}

            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">

              🔔

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}

            </div>

          </div>


          {/* Subtitle */}

          <div className="mt-4 flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Stay updated with CampusEats
              </p>

              {unreadCount > 0 ? (
                <p className="mt-1 text-xs font-medium text-orange-500">
                  {unreadCount} unread{" "}
                  {unreadCount === 1
                    ? "notification"
                    : "notifications"}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-green-600">
                  You're all caught up
                </p>
              )}

            </div>

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

          {notifications.length > 0 && (
            <div className="mt-4 flex gap-2">

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex-1 rounded-xl bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-600 transition hover:bg-orange-100 active:scale-[0.98]"
                >
                  ✓ Mark all as read
                </button>
              )}

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing}
                className={`${
                  unreadCount > 0
                    ? "flex-1"
                    : "w-full"
                } rounded-xl border border-red-100 bg-white px-3 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {clearing
                  ? "Clearing..."
                  : "Clear History"}
              </button>

            </div>
          )}

        </header>


        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="px-5 pt-5">


          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {notifications.length === 0 ? (

            <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
                🔔
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                No notifications yet
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                You're all caught up! New order updates,
                delivery alerts and special offers will
                appear here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/student")}
                className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
              >
                Browse Food
              </button>

            </div>

          ) : (

            <div className="space-y-3">


              {/* Notification Summary */}

              <div className="flex items-center justify-between px-1">

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Recent updates
                </p>

                <p className="text-xs font-medium text-gray-400">
                  {notifications.length}{" "}
                  {notifications.length === 1
                    ? "notification"
                    : "notifications"}
                </p>

              </div>


              {/* =================================================
                  NOTIFICATION CARDS
              ================================================= */}

              {notifications.map(
                (notification) => {

                  const unread =
                    !notification.read;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={`group w-full rounded-3xl border p-4 text-left transition duration-200 active:scale-[0.99] ${
                        unread
                          ? "border-orange-100 bg-white shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >

                      <div className="flex gap-3">


                        {/* =================================================
                            ICON
                        ================================================= */}

                        <div className="relative shrink-0">

                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${getNotificationIconStyle(
                              notification.type
                            )}`}
                          >
                            {getNotificationIcon(
                              notification.type
                            )}
                          </div>


                          {/* Unread indicator */}

                          {unread && (
                            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />
                          )}

                        </div>


                        {/* =================================================
                            CONTENT
                        ================================================= */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0 flex-1">

                              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                                {getNotificationTypeLabel(
                                  notification.type
                                )}
                              </p>

                              <h3
                                className={`mt-1 text-sm leading-5 ${
                                  unread
                                    ? "font-bold text-gray-900"
                                    : "font-semibold text-gray-800"
                                }`}
                              >
                                {notification.title}
                              </h3>

                            </div>


                            {/* Arrow */}

                            <span className="mt-1 shrink-0 text-lg text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-400">
                              →
                            </span>

                          </div>


                          {/* Message */}

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {notification.message}
                          </p>


                          {/* Bottom Meta */}

                          <div className="mt-3 flex items-center justify-between gap-2">

                            <p className="text-[11px] font-medium text-gray-400">
                              {formatDate(
                                notification.createdAt
                              )}
                            </p>


                            {unread ? (
                              <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">
                                NEW
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-gray-300">
                                Read
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          )}

        </main>

      </div>

    </div>
  );
}


export default Notifications;