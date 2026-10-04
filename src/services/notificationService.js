import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  getActiveOffers,
} from "./offerService";


/* =========================================================
   CREATE NOTIFICATION
========================================================= */

export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  orderId = "",
  offerId = "",
}) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (!title?.trim()) {
    throw new Error(
      "Notification title is required."
    );
  }

  if (!message?.trim()) {
    throw new Error(
      "Notification message is required."
    );
  }

  const notificationData = {
    userId,

    title:
      title.trim(),

    message:
      message.trim(),

    type,

    orderId:
      orderId || "",

    offerId:
      offerId || "",

    read: false,

    createdAt:
      serverTimestamp(),
  };


  const notificationsRef =
    collection(
      db,
      "notifications"
    );


  const notificationDoc =
    await addDoc(
      notificationsRef,
      notificationData
    );


  return {
    id: notificationDoc.id,
    ...notificationData,
  };
};


/* =========================================================
   GET USER NOTIFICATIONS
========================================================= */

export const getUserNotifications =
  async (userId) => {

    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }


    const notificationsRef =
      collection(
        db,
        "notifications"
      );


    const notificationsQuery =
      query(
        notificationsRef,
        where(
          "userId",
          "==",
          userId
        )
      );


    const snapshot =
      await getDocs(
        notificationsQuery
      );


    const notifications =
      snapshot.docs.map(
        (notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        })
      );


    /* -------------------------------------------------------
       SORT NEWEST FIRST
    ------------------------------------------------------- */

    notifications.sort(
      (a, b) => {

        const timeA =
          a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : 0;

        const timeB =
          b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : 0;

        return timeB - timeA;
      }
    );


    return notifications;
  };


/* =========================================================
   SYNC ACTIVE OFFER NOTIFICATIONS
========================================================= */

export const syncOfferNotifications =
  async (userId) => {

    if (!userId) {
      return;
    }


    try {

      /* -----------------------------------------------------
         GET ACTIVE OFFERS
      ----------------------------------------------------- */

      const activeOffers =
        await getActiveOffers();


      if (!activeOffers.length) {
        return;
      }


      /* -----------------------------------------------------
         GET EXISTING USER NOTIFICATIONS
      ----------------------------------------------------- */

      const existingNotifications =
        await getUserNotifications(
          userId
        );


      /* -----------------------------------------------------
         CHECK EACH OFFER
      ----------------------------------------------------- */

      for (
        const offer of activeOffers
      ) {

        const alreadyNotified =
          existingNotifications.some(
            (notification) =>
              notification.type ===
                "offer" &&
              notification.offerId ===
                offer.id
          );


        if (alreadyNotified) {
          continue;
        }


        /* ---------------------------------------------------
           CREATE OFFER NOTIFICATION
        --------------------------------------------------- */

        await createNotification({
          userId,

          title:
            `🎁 ${offer.offerName || "New Offer"}`,

          message:
            `Use coupon ${offer.couponCode} and save on your CampusEats order.`,

          type:
            "offer",

          offerId:
            offer.id,
        });
      }

    } catch (error) {

      console.error(
        "Offer notification sync error:",
        error
      );

      /*
        Do not break the Notifications page
        if offer notification syncing fails.
      */
    }
  };


/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */

export const markNotificationAsRead =
  async (notificationId) => {

    if (!notificationId) {
      throw new Error(
        "Notification ID is required."
      );
    }


    const notificationRef =
      doc(
        db,
        "notifications",
        notificationId
      );


    await updateDoc(
      notificationRef,
      {
        read: true,
      }
    );
  };


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

export const markAllNotificationsAsRead =
  async (notifications) => {

    if (!notifications?.length) {
      return;
    }


    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.read
      );


    await Promise.all(
      unreadNotifications.map(
        (notification) =>
          markNotificationAsRead(
            notification.id
          )
      )
    );
  };


/* =========================================================
   CLEAR ALL NOTIFICATION HISTORY
========================================================= */

export const clearAllNotifications =
  async (userId) => {

    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }


    try {

      const notificationsRef =
        collection(
          db,
          "notifications"
        );


      const notificationsQuery =
        query(
          notificationsRef,
          where(
            "userId",
            "==",
            userId
          )
        );


      const snapshot =
        await getDocs(
          notificationsQuery
        );


      if (snapshot.empty) {
        return;
      }


      await Promise.all(
        snapshot.docs.map(
          (notificationDoc) =>
            deleteDoc(
              notificationDoc.ref
            )
        )
      );

    } catch (error) {

      console.error(
        "Clear notification history error:",
        error
      );

      throw error;
    }
  };


/* =========================================================
   LISTEN TO UNREAD NOTIFICATION COUNT
========================================================= */

export const listenToUnreadNotificationCount =
  (userId, callback) => {

    if (!userId) {
      return () => {};
    }


    const notificationsRef =
      collection(
        db,
        "notifications"
      );


    const notificationsQuery =
      query(
        notificationsRef,
        where(
          "userId",
          "==",
          userId
        )
      );


    return onSnapshot(
      notificationsQuery,
      (snapshot) => {

        const unreadCount =
          snapshot.docs.filter(
            (notificationDoc) =>
              notificationDoc.data()
                .read !== true
          ).length;


        callback(
          unreadCount
        );
      },

      (error) => {

        console.error(
          "Unread notification listener error:",
          error
        );

        callback(0);
      }
    );
  };