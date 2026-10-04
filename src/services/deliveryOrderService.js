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

import { db } from "../firebase/config";

import { createNotification } from "./notificationService";


/*
====================================================
GET READY ORDERS
====================================================
*/

export const getReadyOrders = async () => {
  try {
    const ordersRef = collection(db, "orders");

    const ordersQuery = query(
      ordersRef,
      where("status", "==", "Ready"),
      where("assignedDeliveryStaff", "==", "")
    );

    const snapshot = await getDocs(ordersQuery);

    const orders = snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data(),
    }));

    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return orders;

  } catch (error) {
    console.error(
      "Get ready orders error:",
      error
    );

    throw error;
  }
};


/*
====================================================
GET MY DELIVERIES
====================================================
*/

export const getMyDeliveries = async (
  deliveryStaffId
) => {
  try {
    if (!deliveryStaffId) {
      throw new Error(
        "Delivery staff ID is required."
      );
    }

    const ordersRef = collection(db, "orders");

    const ordersQuery = query(
      ordersRef,
      where(
        "assignedDeliveryStaff",
        "==",
        deliveryStaffId
      ),
      where(
        "status",
        "==",
        "Out for Delivery"
      )
    );

    const snapshot = await getDocs(
      ordersQuery
    );

    const orders = snapshot.docs.map(
      (orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      })
    );

    orders.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis
        ? a.updatedAt.toMillis()
        : 0;

      const timeB = b.updatedAt?.toMillis
        ? b.updatedAt.toMillis()
        : 0;

      return timeB - timeA;
    });

    return orders;

  } catch (error) {
    console.error(
      "Get my deliveries error:",
      error
    );

    throw error;
  }
};


/*
====================================================
ACCEPT DELIVERY
====================================================
*/

export const acceptDelivery = async (
  orderId,
  deliveryStaffId
) => {
  try {
    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }

    if (!deliveryStaffId) {
      throw new Error(
        "Delivery staff ID is required."
      );
    }


    // ---------------------------------------------
    // GET ACTUAL ORDER FROM FIRESTORE
    // ---------------------------------------------

    const orderRef = doc(
      db,
      "orders",
      orderId
    );

    const orderSnapshot = await getDoc(
      orderRef
    );

    if (!orderSnapshot.exists()) {
      throw new Error(
        "Order does not exist."
      );
    }

    const orderData =
      orderSnapshot.data();


    // ---------------------------------------------
    // GET CUSTOMER ID
    // ---------------------------------------------

    const customerId =
      orderData.userId;


    if (!customerId) {
      throw new Error(
        "Customer user ID is missing from this order."
      );
    }


    // ---------------------------------------------
    // UPDATE ORDER
    // ---------------------------------------------

    await updateDoc(orderRef, {
      assignedDeliveryStaff:
        deliveryStaffId,

      status:
        "Out for Delivery",

      updatedAt:
        serverTimestamp(),
    });


    // ---------------------------------------------
    // CREATE CUSTOMER NOTIFICATION
    // ---------------------------------------------

    try {

      await createNotification({
        userId: customerId,

        title:
          "Order Out for Delivery 🛵",

        message:
          "Your order has been accepted by delivery staff and is now on the way.",

        type:
          "order",

        orderId:
          orderId,
      });

      console.log(
        "Out for delivery notification created."
      );

    } catch (notificationError) {

      console.error(
        "Out for delivery notification error:",
        notificationError
      );

      // Order update was successful.
      // Do not fail the delivery operation
      // because notification creation failed.
    }

  } catch (error) {

    console.error(
      "Accept delivery error:",
      error
    );

    throw error;
  }
};


/*
====================================================
MARK ORDER AS DELIVERED
====================================================
*/

export const markOrderDelivered = async (
  orderId
) => {
  try {
    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }


    // ---------------------------------------------
    // GET ACTUAL ORDER FROM FIRESTORE
    // ---------------------------------------------

    const orderRef = doc(
      db,
      "orders",
      orderId
    );

    const orderSnapshot = await getDoc(
      orderRef
    );

    if (!orderSnapshot.exists()) {
      throw new Error(
        "Order does not exist."
      );
    }

    const orderData =
      orderSnapshot.data();


    // ---------------------------------------------
    // GET CUSTOMER ID
    // ---------------------------------------------

    const customerId =
      orderData.userId;


    if (!customerId) {
      throw new Error(
        "Customer user ID is missing from this order."
      );
    }


    // ---------------------------------------------
    // UPDATE ORDER
    // ---------------------------------------------

    await updateDoc(orderRef, {
      status:
        "Delivered",

      updatedAt:
        serverTimestamp(),
    });


    // ---------------------------------------------
    // CREATE CUSTOMER NOTIFICATION
    // ---------------------------------------------

    try {

      await createNotification({
        userId: customerId,

        title:
          "Order Delivered 🎉",

        message:
          "Your order has been delivered successfully.",

        type:
          "order",

        orderId:
          orderId,
      });

      console.log(
        "Order delivered notification created."
      );

    } catch (notificationError) {

      console.error(
        "Order delivered notification error:",
        notificationError
      );

      // Order update was successful.
      // Do not fail the delivery operation
      // because notification creation failed.
    }

  } catch (error) {

    console.error(
      "Mark delivered error:",
      error
    );

    throw error;
  }
};