import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

const DELIVERY_FEE = 20;
const MAX_ITEM_QUANTITY = 20;

/*
  Calculate cart totals
*/
const calculateTotals = (items) => {
  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const deliveryFee =
    items.length > 0
      ? DELIVERY_FEE
      : 0;

  const total =
    subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    total,
  };
};


/*
  Get cart
*/
export const getCart = async (userId) => {
  try {
    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }

    const cartRef = doc(
      db,
      "carts",
      userId
    );

    const cartSnapshot =
      await getDoc(cartRef);

    if (!cartSnapshot.exists()) {
      return {
        userId,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
      };
    }

    return {
      id: cartSnapshot.id,
      ...cartSnapshot.data(),
    };
  } catch (error) {
    console.error(
      "Error getting cart:",
      error
    );

    throw error;
  }
};


/*
  Add item to cart

  Firestore transaction prevents
  one cart update from overwriting
  another cart update.
*/
export const addToCart = async (
  userId,
  foodItem,
  quantity = 1
) => {
  try {
    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }

    if (!foodItem?.id) {
      throw new Error(
        "Food item ID is missing."
      );
    }

    if (!foodItem.available) {
      throw new Error(
        "This food item is currently unavailable."
      );
    }

    const quantityToAdd =
      Number(quantity);

    if (
      !Number.isFinite(
        quantityToAdd
      ) ||
      quantityToAdd < 1
    ) {
      throw new Error(
        "Invalid quantity."
      );
    }

    const cartRef = doc(
      db,
      "carts",
      userId
    );

    let finalCart = null;

    await runTransaction(
      db,
      async (transaction) => {
        const cartSnapshot =
          await transaction.get(
            cartRef
          );

        let items = [];

        if (cartSnapshot.exists()) {
          items =
            cartSnapshot.data().items ||
            [];
        }

        const existingItemIndex =
          items.findIndex(
            (item) =>
              item.id === foodItem.id
          );

        if (
          existingItemIndex !== -1
        ) {
          const existingItem =
            items[
              existingItemIndex
            ];

          const newQuantity =
            Number(
              existingItem.quantity || 0
            ) + quantityToAdd;

          if (
            newQuantity >
            MAX_ITEM_QUANTITY
          ) {
            throw new Error(
              `Maximum ${MAX_ITEM_QUANTITY} units allowed for one item.`
            );
          }

          items[
            existingItemIndex
          ] = {
            ...existingItem,
            quantity:
              newQuantity,
            available:
              foodItem.available,
          };
        } else {
          if (
            quantityToAdd >
            MAX_ITEM_QUANTITY
          ) {
            throw new Error(
              `Maximum ${MAX_ITEM_QUANTITY} units allowed for one item.`
            );
          }

          items.push({
            id: foodItem.id,
            name:
              foodItem.name || "",
            price:
              Number(
                foodItem.price || 0
              ),
            imageUrl:
              foodItem.imageUrl || "",
            vendorId:
              foodItem.vendorId || "",
            vendorName:
              foodItem.vendorName ||
              "Campus Vendor",
            quantity:
              quantityToAdd,
            available:
              foodItem.available,
          });
        }

        const totals =
          calculateTotals(items);

        const cartData = {
          userId,
          items,
          ...totals,
          updatedAt:
            serverTimestamp(),
        };

        transaction.set(
          cartRef,
          cartData,
          {
            merge: true,
          }
        );

        finalCart = {
          userId,
          items,
          ...totals,
        };
      }
    );

    return finalCart;
  } catch (error) {
    console.error(
      "Error adding item to cart:",
      error
    );

    throw error;
  }
};


/*
  Update cart item quantity
*/
export const updateCartItemQuantity =
  async (
    userId,
    foodId,
    quantity
  ) => {
    try {
      if (!userId) {
        throw new Error(
          "User ID is required."
        );
      }

      if (!foodId) {
        throw new Error(
          "Food ID is required."
        );
      }

      const newQuantity =
        Number(quantity);

      if (
        !Number.isFinite(
          newQuantity
        )
      ) {
        throw new Error(
          "Invalid quantity."
        );
      }

      if (
        newQuantity >
        MAX_ITEM_QUANTITY
      ) {
        throw new Error(
          `Maximum ${MAX_ITEM_QUANTITY} units allowed for one item.`
        );
      }

      const cartRef = doc(
        db,
        "carts",
        userId
      );

      let finalCart = null;

      await runTransaction(
        db,
        async (transaction) => {
          const cartSnapshot =
            await transaction.get(
              cartRef
            );

          if (!cartSnapshot.exists()) {
            throw new Error(
              "Cart does not exist."
            );
          }

          let items =
            cartSnapshot.data()
              .items || [];

          if (
            newQuantity <= 0
          ) {
            items =
              items.filter(
                (item) =>
                  item.id !== foodId
              );
          } else {
            const itemIndex =
              items.findIndex(
                (item) =>
                  item.id === foodId
              );

            if (
              itemIndex === -1
            ) {
              throw new Error(
                "Food item not found in cart."
              );
            }

            items[itemIndex] = {
              ...items[itemIndex],
              quantity:
                newQuantity,
            };
          }

          const totals =
            calculateTotals(
              items
            );

          transaction.set(
            cartRef,
            {
              userId,
              items,
              ...totals,
              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          finalCart = {
            userId,
            items,
            ...totals,
          };
        }
      );

      return finalCart;
    } catch (error) {
      console.error(
        "Error updating cart quantity:",
        error
      );

      throw error;
    }
  };


/*
  Remove item from cart
*/
export const removeFromCart =
  async (
    userId,
    foodId
  ) => {
    try {
      if (!userId) {
        throw new Error(
          "User ID is required."
        );
      }

      if (!foodId) {
        throw new Error(
          "Food ID is required."
        );
      }

      const cartRef = doc(
        db,
        "carts",
        userId
      );

      let finalCart = null;

      await runTransaction(
        db,
        async (transaction) => {
          const cartSnapshot =
            await transaction.get(
              cartRef
            );

          if (
            !cartSnapshot.exists()
          ) {
            finalCart = {
              userId,
              items: [],
              subtotal: 0,
              deliveryFee: 0,
              total: 0,
            };

            return;
          }

          const currentItems =
            cartSnapshot.data()
              .items || [];

          const items =
            currentItems.filter(
              (item) =>
                item.id !== foodId
            );

          const totals =
            calculateTotals(
              items
            );

          transaction.set(
            cartRef,
            {
              userId,
              items,
              ...totals,
              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          finalCart = {
            userId,
            items,
            ...totals,
          };
        }
      );

      return finalCart;
    } catch (error) {
      console.error(
        "Error removing item from cart:",
        error
      );

      throw error;
    }
  };


/*
  Clear cart

  This should only be called after
  a successful order.
*/
export const clearCart = async (
  userId
) => {
  try {
    if (!userId) {
      throw new Error(
        "User ID is required."
      );
    }

    const cartRef = doc(
      db,
      "carts",
      userId
    );

    await runTransaction(
      db,
      async (transaction) => {
        const cartSnapshot =
          await transaction.get(
            cartRef
          );

        /*
          If the cart doesn't exist,
          there is nothing to clear.
        */
        if (!cartSnapshot.exists()) {
          return;
        }

        transaction.set(
          cartRef,
          {
            userId,
            items: [],
            subtotal: 0,
            deliveryFee: 0,
            total: 0,
            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }
    );

    return {
      userId,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    };
  } catch (error) {
    console.error(
      "Error clearing cart:",
      error
    );

    throw error;
  }
};