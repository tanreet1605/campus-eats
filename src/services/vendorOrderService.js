import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/config";


// ======================================================
// VALID ORDER STATUS TRANSITIONS
// ======================================================

const VALID_STATUS_TRANSITIONS = {
  Delivery: {
    Pending: ["Accepted", "Rejected"],
    Accepted: ["Preparing"],
    Preparing: ["Ready"],
    Ready: ["Out for Delivery"],
    "Out for Delivery": ["Delivered"],
  },

  Pickup: {
    Pending: ["Accepted", "Rejected"],
    Accepted: ["Preparing"],
    Preparing: ["Ready for Pickup"],
    "Ready for Pickup": ["Picked Up"],
  },
};


// ======================================================
// GET ALL ORDERS FOR CURRENT VENDOR
// ======================================================

export const getVendorOrders = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error("Vendor ID is required.");
    }

    const ordersRef = collection(db, "orders");

    const ordersQuery = query(
      ordersRef,
      where("vendorId", "==", vendorId)
    );

    const ordersSnapshot = await getDocs(
      ordersQuery
    );

    const vendorOrders = ordersSnapshot.docs.map(
      (orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      })
    );

    // Sort newest first
    vendorOrders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return vendorOrders;

  } catch (error) {
    console.error(
      "Get vendor orders error:",
      error
    );

    throw error;
  }
};


// ======================================================
// UPDATE ORDER STATUS
// ======================================================

export const updateOrderStatus = async (
  orderId,
  newStatus
) => {
  try {
    // -----------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------

    if (!orderId) {
      throw new Error("Order ID is required.");
    }

    if (!newStatus) {
      throw new Error("Order status is required.");
    }


    // -----------------------------------------------
    // CHECK AUTHENTICATED VENDOR
    // -----------------------------------------------

    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "You must be logged in to update an order."
      );
    }


    // -----------------------------------------------
    // GET ORDER
    // -----------------------------------------------

    const orderRef = doc(
      db,
      "orders",
      orderId
    );

    const orderSnapshot = await getDoc(
      orderRef
    );

    if (!orderSnapshot.exists()) {
      throw new Error("Order not found.");
    }

    const order = orderSnapshot.data();


    // -----------------------------------------------
    // VERIFY VENDOR OWNERSHIP
    // -----------------------------------------------

    if (order.vendorId !== currentUser.uid) {
      throw new Error(
        "You are not allowed to update this order."
      );
    }


    // -----------------------------------------------
    // DETERMINE ORDER TYPE
    // -----------------------------------------------

    const orderType =
      order.orderType === "Pickup"
        ? "Pickup"
        : "Delivery";


    // -----------------------------------------------
    // CHECK STATUS TRANSITION
    // -----------------------------------------------

    const allowedTransitions =
      VALID_STATUS_TRANSITIONS[orderType];

    const currentStatus = order.status || "Pending";

    const allowedNextStatuses =
      allowedTransitions[currentStatus] || [];


    if (
      !allowedNextStatuses.includes(newStatus)
    ) {
      throw new Error(
        `Invalid status change: ${currentStatus} → ${newStatus}`
      );
    }


    // -----------------------------------------------
    // UPDATE FIRESTORE
    // -----------------------------------------------

    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    throw error;
  }
};


// ======================================================
// GET VENDOR SALES DATA
// ======================================================

export const getVendorSalesData = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error("Vendor ID is required.");
    }

    const ordersRef = collection(db, "orders");

    const salesQuery = query(
      ordersRef,
      where("vendorId", "==", vendorId)
    );

    const salesSnapshot = await getDocs(
      salesQuery
    );

    const salesOrders = salesSnapshot.docs.map(
      (orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      })
    );

    // Sort newest first
    salesOrders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return salesOrders;

  } catch (error) {
    console.error(
      "Get vendor sales data error:",
      error
    );

    throw error;
  }
};