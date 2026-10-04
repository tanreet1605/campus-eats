import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/config";


/* =========================================================
   CREATE OFFER
========================================================= */

export const createOffer = async ({
  vendorId,
  vendorName,
  offerName,
  couponCode,
  discountType,
  discountValue,
  minimumOrder,
  maximumDiscount,
}) => {
  try {
    /* -------------------------------------------------------
       CHECK AUTHENTICATED USER
    ------------------------------------------------------- */

    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You are not logged in.");
    }

    const authenticatedVendorId = currentUser.uid;

    console.log(
      "AUTH UID:",
      authenticatedVendorId
    );

    console.log(
      "PASSED VENDOR ID:",
      vendorId
    );


    /* -------------------------------------------------------
       VERIFY VENDOR ID
    ------------------------------------------------------- */

    if (authenticatedVendorId !== vendorId) {
      throw new Error(
        "Vendor ID mismatch. Please logout and login again."
      );
    }


    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!offerName?.trim()) {
      throw new Error(
        "Offer name is required."
      );
    }

    if (!couponCode?.trim()) {
      throw new Error(
        "Coupon code is required."
      );
    }

    if (!discountType) {
      throw new Error(
        "Discount type is required."
      );
    }

    const numericDiscount =
      Number(discountValue);

    const numericMinimumOrder =
      Number(minimumOrder) || 0;

    const numericMaximumDiscount =
      Number(maximumDiscount) || 0;


    if (
      !Number.isFinite(numericDiscount) ||
      numericDiscount <= 0
    ) {
      throw new Error(
        "Discount must be greater than 0."
      );
    }


    if (numericMinimumOrder < 0) {
      throw new Error(
        "Minimum order cannot be negative."
      );
    }


    if (numericMaximumDiscount < 0) {
      throw new Error(
        "Maximum discount cannot be negative."
      );
    }


    if (
      discountType !== "percentage" &&
      discountType !== "flat"
    ) {
      throw new Error(
        "Invalid discount type."
      );
    }


    if (
      discountType === "percentage" &&
      numericDiscount > 100
    ) {
      throw new Error(
        "Percentage discount cannot be greater than 100%."
      );
    }


    /* -------------------------------------------------------
       NORMALIZE COUPON CODE
    ------------------------------------------------------- */

    const normalizedCouponCode =
      couponCode.trim().toUpperCase();


    /* -------------------------------------------------------
       FIRESTORE OFFERS COLLECTION
    ------------------------------------------------------- */

    const offersRef =
      collection(db, "offers");


    /* -------------------------------------------------------
       CHECK ACTIVE DUPLICATE COUPON
    ------------------------------------------------------- */

    const existingCouponQuery =
      query(
        offersRef,
        where(
          "couponCode",
          "==",
          normalizedCouponCode
        ),
        where(
          "active",
          "==",
          true
        )
      );


    const existingCouponSnapshot =
      await getDocs(
        existingCouponQuery
      );


    if (!existingCouponSnapshot.empty) {
      throw new Error(
        "This coupon code already exists."
      );
    }


    /* -------------------------------------------------------
       OFFER DATA
    ------------------------------------------------------- */

    const offerData = {
      vendorId:
        authenticatedVendorId,

      vendorName:
        vendorName ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Vendor",

      offerName:
        offerName.trim(),

      couponCode:
        normalizedCouponCode,

      discountType,

      discountValue:
        numericDiscount,

      minimumOrder:
        numericMinimumOrder,

      maximumDiscount:
        numericMaximumDiscount,

      active: true,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };


    console.log(
      "OFFER DATA:",
      offerData
    );


    /* -------------------------------------------------------
       CREATE OFFER
    ------------------------------------------------------- */

    const offerReference =
      await addDoc(
        offersRef,
        offerData
      );


    console.log(
      "Offer created successfully:",
      offerReference.id
    );


    return {
      id: offerReference.id,
      ...offerData,
    };

  } catch (error) {

    console.error(
      "Create offer error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   GET VENDOR OFFERS
========================================================= */

export const getVendorOffers = async (
  vendorId
) => {
  try {
    if (!vendorId) {
      throw new Error(
        "Vendor ID is required."
      );
    }


    const offersRef =
      collection(db, "offers");


    const offersQuery =
      query(
        offersRef,
        where(
          "vendorId",
          "==",
          vendorId
        )
      );


    const snapshot =
      await getDocs(
        offersQuery
      );


    const offers =
      snapshot.docs.map(
        (offerDoc) => ({
          id: offerDoc.id,
          ...offerDoc.data(),
        })
      );


    /* -------------------------------------------------------
       SORT NEWEST FIRST
    ------------------------------------------------------- */

    offers.sort((a, b) => {
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


    return offers;

  } catch (error) {

    console.error(
      "Get vendor offers error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   GET ACTIVE OFFERS
========================================================= */

export const getActiveOffers = async () => {
  try {

    const offersRef =
      collection(db, "offers");


    const offersQuery =
      query(
        offersRef,
        where(
          "active",
          "==",
          true
        )
      );


    const snapshot =
      await getDocs(
        offersQuery
      );


    const offers =
      snapshot.docs.map(
        (offerDoc) => ({
          id: offerDoc.id,
          ...offerDoc.data(),
        })
      );


    return offers;

  } catch (error) {

    console.error(
      "Get active offers error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   GET OFFER BY COUPON CODE
========================================================= */

export const getOfferByCouponCode = async (
  couponCode
) => {
  try {

    if (!couponCode?.trim()) {
      throw new Error(
        "Coupon code is required."
      );
    }


    const normalizedCouponCode =
      couponCode.trim().toUpperCase();


    console.log(
      "Searching coupon:",
      normalizedCouponCode
    );


    const offersRef =
      collection(db, "offers");


    const offerQuery =
      query(
        offersRef,

        where(
          "couponCode",
          "==",
          normalizedCouponCode
        ),

        where(
          "active",
          "==",
          true
        )
      );


    const snapshot =
      await getDocs(
        offerQuery
      );


    if (snapshot.empty) {
      throw new Error(
        "Invalid or inactive coupon code."
      );
    }


    const offerDoc =
      snapshot.docs[0];


    const offer = {
      id: offerDoc.id,
      ...offerDoc.data(),
    };


    console.log(
      "Coupon found:",
      offer
    );


    return offer;

  } catch (error) {

    console.error(
      "Get offer by coupon code error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   CALCULATE OFFER DISCOUNT

   Usage:

   calculateOfferDiscount(
     offer,
     subtotal
   )
========================================================= */

export const calculateOfferDiscount = (
  offer,
  subtotal
) => {

  console.log(
    "Calculating offer discount:",
    {
      offer,
      subtotal,
    }
  );


  /* -------------------------------------------------------
     CHECK OFFER
  ------------------------------------------------------- */

  if (!offer) {
    return 0;
  }


  /* -------------------------------------------------------
     CONVERT SUBTOTAL TO NUMBER
  ------------------------------------------------------- */

  const numericSubtotal =
    Number(subtotal) || 0;


  if (numericSubtotal <= 0) {
    return 0;
  }


  /* -------------------------------------------------------
     MINIMUM ORDER
  ------------------------------------------------------- */

  const minimumOrder =
    Number(
      offer.minimumOrder || 0
    );


  if (
    numericSubtotal <
    minimumOrder
  ) {

    console.log(
      "Minimum order not reached:",
      {
        subtotal:
          numericSubtotal,

        minimumOrder,
      }
    );

    return 0;
  }


  let discount = 0;


  /* -------------------------------------------------------
     PERCENTAGE DISCOUNT
  ------------------------------------------------------- */

  if (
    offer.discountType ===
    "percentage"
  ) {

    const percentage =
      Number(
        offer.discountValue || 0
      );


    discount =
      (
        numericSubtotal *
        percentage
      ) / 100;


    /* -----------------------------------------------------
       MAXIMUM DISCOUNT
    ----------------------------------------------------- */

    const maximumDiscount =
      Number(
        offer.maximumDiscount || 0
      );


    if (
      maximumDiscount > 0
    ) {

      discount =
        Math.min(
          discount,
          maximumDiscount
        );
    }
  }


  /* -------------------------------------------------------
     FLAT DISCOUNT
  ------------------------------------------------------- */

  else if (
    offer.discountType ===
    "flat"
  ) {

    discount =
      Number(
        offer.discountValue || 0
      );
  }


  /* -------------------------------------------------------
     INVALID DISCOUNT TYPE
  ------------------------------------------------------- */

  else {

    console.error(
      "Invalid offer discount type:",
      offer.discountType
    );

    return 0;
  }


  /* -------------------------------------------------------
     DISCOUNT CANNOT EXCEED SUBTOTAL
  ------------------------------------------------------- */

  discount =
    Math.min(
      discount,
      numericSubtotal
    );


  /* -------------------------------------------------------
     ROUND TO 2 DECIMAL PLACES
  ------------------------------------------------------- */

  discount =
    Math.round(
      discount * 100
    ) / 100;


  console.log(
    "Final calculated discount:",
    discount
  );


  return discount;
};


/* =========================================================
   UPDATE OFFER
========================================================= */

export const updateOffer = async (
  offerId,
  {
    offerName,
    couponCode,
    discountType,
    discountValue,
    minimumOrder,
    maximumDiscount,
    active,
  }
) => {

  try {

    /* -------------------------------------------------------
       AUTH CHECK
    ------------------------------------------------------- */

    const currentUser =
      auth.currentUser;


    if (!currentUser) {
      throw new Error(
        "You are not logged in."
      );
    }


    if (!offerId) {
      throw new Error(
        "Offer ID is required."
      );
    }


    /* -------------------------------------------------------
       GET CURRENT USER
    ------------------------------------------------------- */

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const userSnapshot =
      await getDoc(
        userRef
      );


    if (!userSnapshot.exists()) {
      throw new Error(
        "User profile not found."
      );
    }


    const userData =
      userSnapshot.data();


    const userRole =
      userData.role;


    const isAdmin =
      userRole === "admin";


    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!offerName?.trim()) {
      throw new Error(
        "Offer name is required."
      );
    }


    if (!couponCode?.trim()) {
      throw new Error(
        "Coupon code is required."
      );
    }


    const numericDiscount =
      Number(discountValue);


    const numericMinimumOrder =
      Number(minimumOrder) || 0;


    const numericMaximumDiscount =
      Number(maximumDiscount) || 0;


    if (
      !Number.isFinite(
        numericDiscount
      ) ||
      numericDiscount <= 0
    ) {
      throw new Error(
        "Discount must be greater than 0."
      );
    }


    if (
      numericMinimumOrder < 0
    ) {
      throw new Error(
        "Minimum order cannot be negative."
      );
    }


    if (
      numericMaximumDiscount < 0
    ) {
      throw new Error(
        "Maximum discount cannot be negative."
      );
    }


    if (
      discountType !==
        "percentage" &&
      discountType !==
        "flat"
    ) {
      throw new Error(
        "Invalid discount type."
      );
    }


    if (
      discountType ===
        "percentage" &&
      numericDiscount > 100
    ) {
      throw new Error(
        "Percentage discount cannot be greater than 100%."
      );
    }


    /* -------------------------------------------------------
       GET EXISTING OFFER
    ------------------------------------------------------- */

    const offerRef =
      doc(
        db,
        "offers",
        offerId
      );


    const existingOffer =
      await getDoc(
        offerRef
      );


    if (!existingOffer.exists()) {
      throw new Error(
        "Offer not found."
      );
    }


    const existingOfferData =
      existingOffer.data();


    /* -------------------------------------------------------
       SECURITY CHECK

       ADMIN:
       Can edit any offer.

       VENDOR:
       Can edit only their own offer.
    ------------------------------------------------------- */

    if (
      !isAdmin &&
      existingOfferData.vendorId !==
        currentUser.uid
    ) {

      throw new Error(
        "You are not allowed to update this offer."
      );
    }


    /* -------------------------------------------------------
       NORMALIZE COUPON
    ------------------------------------------------------- */

    const normalizedCouponCode =
      couponCode.trim().toUpperCase();


    /* -------------------------------------------------------
       CHECK DUPLICATE ACTIVE COUPON
    ------------------------------------------------------- */

    const offersRef =
      collection(db, "offers");


    const duplicateQuery =
      query(
        offersRef,

        where(
          "couponCode",
          "==",
          normalizedCouponCode
        ),

        where(
          "active",
          "==",
          true
        )
      );


    const duplicateSnapshot =
      await getDocs(
        duplicateQuery
      );


    const duplicateExists =
      duplicateSnapshot.docs.some(
        (item) =>
          item.id !== offerId
      );


    if (duplicateExists) {
      throw new Error(
        "This coupon code already exists."
      );
    }


    /* -------------------------------------------------------
       UPDATE DATA
    ------------------------------------------------------- */

    const updateData = {

      offerName:
        offerName.trim(),

      couponCode:
        normalizedCouponCode,

      discountType,

      discountValue:
        numericDiscount,

      minimumOrder:
        numericMinimumOrder,

      maximumDiscount:
        numericMaximumDiscount,

      updatedAt:
        serverTimestamp(),
    };


    /* -------------------------------------------------------
       ADMIN CAN CHANGE ACTIVE STATUS
    ------------------------------------------------------- */

    if (
      isAdmin &&
      typeof active === "boolean"
    ) {

      updateData.active =
        active;
    }


    /* -------------------------------------------------------
       UPDATE FIRESTORE
    ------------------------------------------------------- */

    await updateDoc(
      offerRef,
      updateData
    );


    console.log(
      "Offer updated successfully:",
      offerId
    );


    return {
      id:
        offerId,

      offerName:
        offerName.trim(),

      couponCode:
        normalizedCouponCode,

      discountType,

      discountValue:
        numericDiscount,

      minimumOrder:
        numericMinimumOrder,

      maximumDiscount:
        numericMaximumDiscount,

      ...(isAdmin &&
      typeof active === "boolean"
        ? {
            active,
          }
        : {}),
    };

  } catch (error) {

    console.error(
      "Update offer error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   TOGGLE OFFER STATUS
========================================================= */

export const toggleOfferStatus = async (
  offerId,
  active
) => {

  try {

    /* -------------------------------------------------------
       AUTH CHECK
    ------------------------------------------------------- */

    const currentUser =
      auth.currentUser;


    if (!currentUser) {
      throw new Error(
        "You are not logged in."
      );
    }


    if (!offerId) {
      throw new Error(
        "Offer ID is required."
      );
    }


    /* -------------------------------------------------------
       GET CURRENT USER
    ------------------------------------------------------- */

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const userSnapshot =
      await getDoc(
        userRef
      );


    if (!userSnapshot.exists()) {
      throw new Error(
        "User profile not found."
      );
    }


    const userData =
      userSnapshot.data();


    const isAdmin =
      userData.role === "admin";


    /* -------------------------------------------------------
       GET OFFER
    ------------------------------------------------------- */

    const offerRef =
      doc(
        db,
        "offers",
        offerId
      );


    const existingOffer =
      await getDoc(
        offerRef
      );


    if (!existingOffer.exists()) {
      throw new Error(
        "Offer not found."
      );
    }


    const offerData =
      existingOffer.data();


    /* -------------------------------------------------------
       SECURITY CHECK

       ADMIN:
       Can change any offer.

       VENDOR:
       Can change only their own offer.
    ------------------------------------------------------- */

    if (
      !isAdmin &&
      offerData.vendorId !==
        currentUser.uid
    ) {

      throw new Error(
        "You are not allowed to change this offer."
      );
    }


    /* -------------------------------------------------------
       UPDATE STATUS
    ------------------------------------------------------- */

    await updateDoc(
      offerRef,
      {
        active:
          Boolean(active),

        updatedAt:
          serverTimestamp(),
      }
    );


    console.log(
      `Offer ${
        active
          ? "activated"
          : "deactivated"
      } successfully.`
    );


    return {
      id:
        offerId,

      active:
        Boolean(active),
    };

  } catch (error) {

    console.error(
      "Toggle offer status error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   DELETE OFFER
========================================================= */

export const deleteOffer = async (
  offerId
) => {

  try {

    /* -------------------------------------------------------
       AUTH CHECK
    ------------------------------------------------------- */

    const currentUser =
      auth.currentUser;


    if (!currentUser) {
      throw new Error(
        "You are not logged in."
      );
    }


    if (!offerId) {
      throw new Error(
        "Offer ID is required."
      );
    }


    /* -------------------------------------------------------
       GET CURRENT USER
    ------------------------------------------------------- */

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );


    const userSnapshot =
      await getDoc(
        userRef
      );


    if (!userSnapshot.exists()) {
      throw new Error(
        "User profile not found."
      );
    }


    const userData =
      userSnapshot.data();


    const isAdmin =
      userData.role === "admin";


    /* -------------------------------------------------------
       GET OFFER
    ------------------------------------------------------- */

    const offerRef =
      doc(
        db,
        "offers",
        offerId
      );


    const existingOffer =
      await getDoc(
        offerRef
      );


    if (!existingOffer.exists()) {
      throw new Error(
        "Offer not found."
      );
    }


    const offerData =
      existingOffer.data();


    /* -------------------------------------------------------
       SECURITY CHECK

       ADMIN:
       Can delete any offer.

       VENDOR:
       Can delete only their own offer.
    ------------------------------------------------------- */

    if (
      !isAdmin &&
      offerData.vendorId !==
        currentUser.uid
    ) {

      throw new Error(
        "You are not allowed to delete this offer."
      );
    }


    /* -------------------------------------------------------
       DELETE OFFER
    ------------------------------------------------------- */

    await deleteDoc(
      offerRef
    );


    console.log(
      "Offer deleted successfully:",
      offerId
    );


    return true;

  } catch (error) {

    console.error(
      "Delete offer error:",
      error
    );

    throw error;
  }
};