import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { auth } from "../firebase/config";
import { createNotification } from "./notificationService";

/* =========================================================
   HELPER — VERIFY DELIVERY STAFF
========================================================= */

const verifyDeliveryStaff = async (deliveryStaffId) => {
  if (!deliveryStaffId) {
    throw new Error("Delivery staff ID is required.");
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  if (currentUser.uid !== deliveryStaffId) {
    throw new Error("Unauthorized delivery staff.");
  }

  const userRef = doc(db, "users", deliveryStaffId);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("Delivery staff account not found.");
  }

  const userData = userSnapshot.data();

  if (userData.role !== "delivery") {
    throw new Error(
      "You are not authorized to access the delivery panel."
    );
  }

  return {
    uid: deliveryStaffId,
    ...userData,
  };
};


/* =========================================================
   GET AVAILABLE DELIVERIES
   Ready + Delivery + Not Assigned
========================================================= */

export const getAvailableDeliveries = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  await verifyDeliveryStaff(currentUser.uid);

  const ordersRef = collection(db, "orders");

  const deliveriesQuery = query(
    ordersRef,
    where("orderType", "==", "Delivery"),
    where("status", "==", "Ready"),
    where("assignedDeliveryStaff", "==", "")
  );

  const snapshot = await getDocs(deliveriesQuery);

  const deliveries = snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data(),
  }));

  deliveries.sort((a, b) => {
    const timeA = a.createdAt?.toMillis
      ? a.createdAt.toMillis()
      : 0;

    const timeB = b.createdAt?.toMillis
      ? b.createdAt.toMillis()
      : 0;

    return timeB - timeA;
  });

  return deliveries;
};


/* =========================================================
   GET MY ACTIVE DELIVERIES
   Assigned to current delivery staff + Out for Delivery
========================================================= */

export const getMyActiveDeliveries = async (
  deliveryStaffId
) => {
  await verifyDeliveryStaff(deliveryStaffId);

  const ordersRef = collection(db, "orders");

  const deliveriesQuery = query(
    ordersRef,
    where(
      "assignedDeliveryStaff",
      "==",
      deliveryStaffId
    )
  );

  const snapshot = await getDocs(deliveriesQuery);

  const deliveries = snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data(),
  }));

  const activeDeliveries = deliveries.filter(
    (order) =>
      order.orderType === "Delivery" &&
      order.status === "Out for Delivery"
  );

  activeDeliveries.sort((a, b) => {
    const timeA = a.createdAt?.toMillis
      ? a.createdAt.toMillis()
      : 0;

    const timeB = b.createdAt?.toMillis
      ? b.createdAt.toMillis()
      : 0;

    return timeB - timeA;
  });

  return activeDeliveries;
};


/* =========================================================
   GET DELIVERY HISTORY
========================================================= */

export const getDeliveryHistory = async (
  deliveryStaffId
) => {
  await verifyDeliveryStaff(deliveryStaffId);

  const ordersRef = collection(db, "orders");

  const deliveriesQuery = query(
    ordersRef,
    where(
      "assignedDeliveryStaff",
      "==",
      deliveryStaffId
    )
  );

  const snapshot = await getDocs(deliveriesQuery);

  const deliveries = snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data(),
  }));

  const history = deliveries.filter(
    (order) =>
      order.orderType === "Delivery" &&
      order.status === "Delivered"
  );

  history.sort((a, b) => {
    const timeA = a.deliveredAt?.toMillis
      ? a.deliveredAt.toMillis()
      : a.updatedAt?.toMillis
      ? a.updatedAt.toMillis()
      : 0;

    const timeB = b.deliveredAt?.toMillis
      ? b.deliveredAt.toMillis()
      : b.updatedAt?.toMillis
      ? b.updatedAt.toMillis()
      : 0;

    return timeB - timeA;
  });

  return history;
};


/* =========================================================
   GET SINGLE DELIVERY ORDER
   Available OR Assigned To Current Staff
========================================================= */

export const getDeliveryOrderById = async (
  orderId,
  deliveryStaffId
) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await verifyDeliveryStaff(deliveryStaffId);

  const orderRef = doc(db, "orders", orderId);

  const orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    throw new Error("Order not found.");
  }

  const order = orderSnapshot.data();

  const isAssignedToMe =
    order.assignedDeliveryStaff ===
    deliveryStaffId;

  const isAvailableOrder =
    order.orderType === "Delivery" &&
    order.status === "Ready" &&
    order.assignedDeliveryStaff === "";

  if (!isAssignedToMe && !isAvailableOrder) {
    throw new Error(
      "You do not have access to this delivery order."
    );
  }

  return {
    id: orderSnapshot.id,
    ...order,
  };
};


/* =========================================================
   ACCEPT DELIVERY
   Ready → Out for Delivery
========================================================= */

export const acceptDelivery = async (
  orderId,
  deliveryStaffId
) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await verifyDeliveryStaff(deliveryStaffId);

  const orderRef = doc(db, "orders", orderId);

  const result = await runTransaction(
    db,
    async (transaction) => {
      const orderSnapshot =
        await transaction.get(orderRef);

      if (!orderSnapshot.exists()) {
        throw new Error("Order not found.");
      }

      const order = orderSnapshot.data();

      if (order.orderType !== "Delivery") {
        throw new Error(
          "This order is not a delivery order."
        );
      }

      if (order.status !== "Ready") {
        throw new Error(
          "This order is no longer available for delivery."
        );
      }

      if (
        order.assignedDeliveryStaff &&
        order.assignedDeliveryStaff !== ""
      ) {
        throw new Error(
          "This order has already been assigned to another delivery staff member."
        );
      }

      transaction.update(orderRef, {
        assignedDeliveryStaff:
          deliveryStaffId,

        status: "Out for Delivery",

        updatedAt: serverTimestamp(),
      });

      return {
        id: orderId,
        ...order,
        assignedDeliveryStaff:
          deliveryStaffId,
        status: "Out for Delivery",
      };
    }
  );

  /* =====================================================
     NOTIFY STUDENT
  ===================================================== */

  try {
    await createNotification({
      userId: result.userId,

      title: "🛵 Order Out for Delivery",

      message:
        "Your CampusEats order is now out for delivery.",

      type: "delivery",

      orderId: result.id,
    });
  } catch (notificationError) {
    console.error(
      "Delivery notification failed:",
      notificationError
    );
  }

  return result;
};


/* =========================================================
   MARK DELIVERY AS DELIVERED
   Out for Delivery → Delivered
========================================================= */

export const markDeliveryAsDelivered = async (
  orderId,
  deliveryStaffId
) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  await verifyDeliveryStaff(deliveryStaffId);

  const orderRef = doc(db, "orders", orderId);

  const result = await runTransaction(
    db,
    async (transaction) => {
      const orderSnapshot =
        await transaction.get(orderRef);

      if (!orderSnapshot.exists()) {
        throw new Error("Order not found.");
      }

      const order = orderSnapshot.data();

      if (order.orderType !== "Delivery") {
        throw new Error(
          "This is not a delivery order."
        );
      }

      if (
        order.assignedDeliveryStaff !==
        deliveryStaffId
      ) {
        throw new Error(
          "You are not assigned to this delivery."
        );
      }

      if (
        order.status !==
        "Out for Delivery"
      ) {
        throw new Error(
          "This order is not currently out for delivery."
        );
      }

      transaction.update(orderRef, {
        status: "Delivered",

        updatedAt: serverTimestamp(),

        deliveredAt: serverTimestamp(),
      });

      return {
        id: orderId,
        ...order,
        status: "Delivered",
      };
    }
  );

  return result;
};


/* =========================================================
   GET DELIVERY STATISTICS
========================================================= */

export const getDeliveryStats = async (
  deliveryStaffId
) => {
  await verifyDeliveryStaff(deliveryStaffId);

  const ordersRef = collection(db, "orders");

  const deliveriesQuery = query(
    ordersRef,
    where(
      "assignedDeliveryStaff",
      "==",
      deliveryStaffId
    )
  );

  const snapshot = await getDocs(
    deliveriesQuery
  );

  const deliveries = snapshot.docs.map(
    (orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data(),
    })
  );

  /* =====================================================
     ACTIVE DELIVERIES
  ===================================================== */

  const activeDeliveries =
    deliveries.filter(
      (order) =>
        order.orderType === "Delivery" &&
        order.status === "Out for Delivery"
    );


  /* =====================================================
     COMPLETED DELIVERIES
  ===================================================== */

  const completedDeliveries =
    deliveries.filter(
      (order) =>
        order.orderType === "Delivery" &&
        order.status === "Delivered"
    );


  /* =====================================================
     TODAY'S DELIVERIES
  ===================================================== */

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const todaysDeliveries =
    completedDeliveries.filter(
      (order) => {
        const deliveredTime =
          order.deliveredAt?.toDate
            ? order.deliveredAt.toDate()
            : order.updatedAt?.toDate
            ? order.updatedAt.toDate()
            : null;

        if (!deliveredTime) {
          return false;
        }

        return (
          deliveredTime >= todayStart &&
          deliveredTime < todayEnd
        );
      }
    );


  /* =====================================================
     TOTAL DELIVERED VALUE
  ===================================================== */

  const totalDeliveredValue =
    completedDeliveries.reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0
    );


  return {
    activeDeliveries:
      activeDeliveries.length,

    todaysDeliveries:
      todaysDeliveries.length,

    completedDeliveries:
      completedDeliveries.length,

    totalDeliveredValue,
  };
};