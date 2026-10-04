import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { createNotification } from "./notificationService";

import {
  getOfferByCouponCode,
  calculateOfferDiscount,
} from "./offerService";


// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async ({
  userId,
  cart,
  orderType,
  deliveryLocation = "",
  specialInstructions = "",
  paymentMethod,
  couponCode = "",
  offerId = "",
}) => {
  // ----------------------------------------------------------
  // Basic validation
  // ----------------------------------------------------------

  if (!userId) {
    throw new Error("User is not logged in.");
  }

  if (!cart?.items?.length) {
    throw new Error("Your cart is empty.");
  }

  if (
    orderType !== "Delivery" &&
    orderType !== "Pickup"
  ) {
    throw new Error("Invalid order type.");
  }

  if (!paymentMethod) {
    throw new Error("Please select a payment method.");
  }

  // Delivery requires location
  if (
    orderType === "Delivery" &&
    !deliveryLocation?.trim()
  ) {
    throw new Error(
      "Please select a delivery location."
    );
  }


  // ----------------------------------------------------------
  // Validate cart items from Firebase
  // ----------------------------------------------------------

  const validatedItems = [];

  for (const item of cart.items) {
    if (!item.id) {
      throw new Error(
        "One of the food items is invalid."
      );
    }

    const foodRef = doc(
      db,
      "foodItems",
      item.id
    );

    const foodSnapshot = await getDoc(foodRef);

    if (!foodSnapshot.exists()) {
      throw new Error(
        `${item.name || "A food item"} is no longer available.`
      );
    }

    const foodData = foodSnapshot.data();


    // --------------------------------------------------------
    // Check availability
    // --------------------------------------------------------

    if (foodData.available === false) {
      throw new Error(
        `${foodData.name || item.name} is currently unavailable.`
      );
    }


    // --------------------------------------------------------
    // Validate quantity
    // --------------------------------------------------------

    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      throw new Error(
        `Invalid quantity for ${foodData.name || item.name}.`
      );
    }


    // --------------------------------------------------------
    // Use Firebase price instead of trusting cart price
    // --------------------------------------------------------

    const price = Number(foodData.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        `Invalid price for ${foodData.name || item.name}.`
      );
    }


    validatedItems.push({
      id: foodSnapshot.id,
      name: foodData.name || item.name,
      description:
        foodData.description || "",
      price,
      quantity,
      imageUrl:
        foodData.imageUrl ||
        item.imageUrl ||
        "",
      vendorId:
        foodData.vendorId || "",
      vendorName:
        foodData.vendorName || "",
    });
  }


  // ----------------------------------------------------------
  // Calculate subtotal
  // ----------------------------------------------------------

  const subtotal = validatedItems.reduce(
    (total, item) =>
      total +
      Number(item.price) *
        Number(item.quantity),
    0
  );


  // ----------------------------------------------------------
  // Delivery fee
  // ----------------------------------------------------------

  const deliveryFee =
    orderType === "Delivery"
      ? 20
      : 0;


  // ----------------------------------------------------------
  // APPLY COUPON / OFFER
  // ----------------------------------------------------------

  let discount = 0;

  let appliedOffer = null;

  if (couponCode?.trim()) {
    const normalizedCoupon =
      couponCode.trim().toUpperCase();

    // Find active offer from Firebase
    const offer =
      await getOfferByCouponCode(
        normalizedCoupon
      );

    if (!offer) {
      throw new Error(
        "Invalid or expired coupon code."
      );
    }


    // If Checkout sent an offerId,
    // make sure it matches the coupon
    if (
      offerId &&
      offer.id !== offerId
    ) {
      throw new Error(
        "The selected offer is no longer valid."
      );
    }


    // Calculate discount using the
    // actual Firebase subtotal
    discount =
      calculateOfferDiscount(
        offer,
        subtotal
      );


    // Check minimum order amount
    if (
      Number(offer.minimumOrder || 0) >
      subtotal
    ) {
      throw new Error(
        `Minimum order of ₹${Number(
          offer.minimumOrder
        )} is required for this coupon.`
      );
    }


    // Make sure discount is valid
    if (
      !Number.isFinite(discount) ||
      discount < 0
    ) {
      discount = 0;
    }


    // Never allow discount above subtotal
    discount = Math.min(
      discount,
      subtotal
    );


    appliedOffer = {
      id: offer.id,
      offerName:
        offer.offerName || "",
      couponCode:
        offer.couponCode ||
        normalizedCoupon,
      discountType:
        offer.discountType || "",
      discountValue:
        Number(
          offer.discountValue || 0
        ),
    };
  }


  // ----------------------------------------------------------
  // Final total
  // ----------------------------------------------------------

  const total = Math.max(
    0,
    subtotal +
      deliveryFee -
      discount
  );


  // ----------------------------------------------------------
  // Vendor information
  // ----------------------------------------------------------

  const firstItem =
    validatedItems[0];

  const vendorId =
    firstItem.vendorId || "";

  const vendorName =
    firstItem.vendorName || "";


  // ----------------------------------------------------------
  // Pickup status
  // ----------------------------------------------------------

  const pickupStatus =
    orderType === "Pickup"
      ? "Waiting"
      : "";


  // ----------------------------------------------------------
  // Create order document
  // ----------------------------------------------------------

  const orderData = {
    userId,

    vendorId,

    vendorName,

    items: validatedItems,

    subtotal,

    deliveryFee,

    discount,

    total,


    // --------------------------------------------------------
    // Offer information
    // --------------------------------------------------------

    offerId:
      appliedOffer?.id || "",

    offerName:
      appliedOffer?.offerName || "",

    couponCode:
      appliedOffer?.couponCode || "",


    // --------------------------------------------------------
    // Order type
    // --------------------------------------------------------

    orderType,

    deliveryLocation:
      orderType === "Delivery"
        ? deliveryLocation.trim()
        : "",

    pickupStatus,


    // --------------------------------------------------------
    // Payment
    // --------------------------------------------------------

    paymentMethod,

    paymentStatus:
      "Pending",


    // --------------------------------------------------------
    // Order status
    // --------------------------------------------------------

    status: "Pending",


    // --------------------------------------------------------
    // Additional information
    // --------------------------------------------------------

    specialInstructions:
      specialInstructions.trim(),

    assignedDeliveryStaff:
      "",

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };


  // ----------------------------------------------------------
  // Save order
  // ----------------------------------------------------------

  const ordersRef =
    collection(db, "orders");

  const orderDoc =
    await addDoc(
      ordersRef,
      orderData
    );


  // ----------------------------------------------------------
  // Create notification
  // ----------------------------------------------------------

  try {
    if (orderType === "Pickup") {
      await createNotification({
        userId,
        title: "Order Placed",
        message:
          `Your pickup order #${orderDoc.id.slice(
            0,
            8
          )} has been placed successfully.`,
        type: "order",
        orderId: orderDoc.id,
      });
    } else {
      await createNotification({
        userId,
        title: "Order Placed",
        message:
          `Your delivery order #${orderDoc.id.slice(
            0,
            8
          )} has been placed successfully.`,
        type: "order",
        orderId: orderDoc.id,
      });
    }
  } catch (notificationError) {
    console.error(
      "Order notification error:",
      notificationError
    );

    // Notification failure should NOT
    // cancel a successfully created order.
  }


  // ----------------------------------------------------------
  // Return created order
  // ----------------------------------------------------------

  return {
    id: orderDoc.id,
    ...orderData,
  };
};


// ============================================================
// GET USER ORDERS
// ============================================================

export const getUserOrders = async (
  userId
) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  try {
    const ordersRef =
      collection(db, "orders");

    const ordersQuery =
      query(
        ordersRef,
        where(
          "userId",
          "==",
          userId
        )
      );

    const snapshot =
      await getDocs(ordersQuery);

    const orders =
      snapshot.docs.map(
        (orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        })
      );


    // Newest orders first
    orders.sort((a, b) => {
      const timeA =
        a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : 0;

      const timeB =
        b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : 0;

      return timeB - timeA;
    });

    return orders;

  } catch (error) {
    console.error(
      "Get user orders error:",
      error
    );

    throw error;
  }
};


// ============================================================
// REAL-TIME ORDER LISTENER
// ============================================================

export const subscribeToOrder = (
  orderId,
  callback,
  onError
) => {
  if (!orderId) {
    throw new Error(
      "Order ID is required."
    );
  }

  const orderRef = doc(
    db,
    "orders",
    orderId
  );

  return onSnapshot(
    orderRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    (error) => {
      console.error(
        "Order listener error:",
        error
      );

      if (onError) {
        onError(error);
      }
    }
  );
};