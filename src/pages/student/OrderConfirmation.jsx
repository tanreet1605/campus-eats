import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/config";

function OrderConfirmation() {
  const navigate = useNavigate();

  const { orderId } = useParams();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  ====================================================
  LOAD ORDER
  ====================================================
  */

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const orderRef = doc(
          db,
          "orders",
          orderId
        );

        const orderSnapshot =
          await getDoc(orderRef);

        if (!orderSnapshot.exists()) {
          setError("Order not found.");
          return;
        }

        setOrder({
          id: orderSnapshot.id,
          ...orderSnapshot.data(),
        });
      } catch (error) {
        console.error(
          "Order confirmation error:",
          error
        );

        setError(
          "Unable to load your order."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  /*
  ====================================================
  LOADING
  ====================================================
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-green-500" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-gray-900">
              Loading your order
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Just a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  ====================================================
  ERROR
  ====================================================
  */

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              !
            </div>

            <h1 className="mt-5 text-xl font-extrabold text-gray-900">
              Order Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error ||
                "Unable to load this order."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/student")
              }
              className="mt-6 w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPickup =
    order.orderType === "Pickup";

  return (
    <div className="min-h-screen bg-[#f8f8f8] px-5 py-6">

      <div className="mx-auto max-w-md">

        {/* ==================================================
            SUCCESS HEADER
        ================================================== */}

        <div className="text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-3xl font-black text-white shadow-lg shadow-green-100">
              ✓
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-green-700">
              Order successfully placed
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
            Order Placed! 🎉
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
            Your CampusEats order has been
            successfully placed and sent to the
            vendor.
          </p>
        </div>

        {/* ==================================================
            ORDER TYPE
        ================================================== */}

        <section
          className={`mt-7 overflow-hidden rounded-3xl border p-5 shadow-sm ${
            isPickup
              ? "border-blue-100 bg-blue-50"
              : "border-orange-100 bg-orange-50"
          }`}
        >

          <div className="flex items-center gap-4">

            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm`}
            >
              {isPickup ? "🥡" : "🛵"}
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Order Type
              </p>

              <h2
                className={`mt-1 text-lg font-black ${
                  isPickup
                    ? "text-blue-700"
                    : "text-orange-600"
                }`}
              >
                {isPickup
                  ? "Self Pickup"
                  : "Delivery Order"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {isPickup
                  ? "Pick up your order from the vendor."
                  : "Your order will be delivered to your selected campus location."}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            ORDER STATUS
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              📦
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Current Status
              </p>

              <p className="mt-1 text-base font-extrabold text-orange-500">
                {order.status || "Pending"}
              </p>
            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-orange-600">
              {order.status || "Pending"}
            </span>
          </div>
        </section>

        {/* ==================================================
            DELIVERY / PICKUP INFORMATION
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isPickup
                  ? "bg-blue-50"
                  : "bg-orange-50"
              } text-xl`}
            >
              {isPickup ? "🏪" : "📍"}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {isPickup
                  ? "Pickup From"
                  : "Deliver To"}
              </p>

              <p className="mt-1 text-base font-extrabold text-gray-900">
                {isPickup
                  ? order.vendorName ||
                    "Campus Vendor"
                  : order.deliveryLocation ||
                    "Campus Location"}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl p-4 ${
              isPickup
                ? "bg-blue-50"
                : "bg-orange-50"
            }`}
          >
            <p className="text-xs leading-5 text-gray-600">
              {isPickup
                ? "Your order will be prepared by the vendor. Please collect it when the order becomes ready."
                : "Our delivery staff will deliver your order to this campus location."}
            </p>
          </div>
        </section>

        {/* ==================================================
            PICKUP INSTRUCTIONS
        ================================================== */}

        {isPickup && (
          <section className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                🥡
              </div>

              <div>

                <p className="font-extrabold text-blue-800">
                  Pickup Instructions
                </p>

                <p className="mt-2 text-xs leading-5 text-blue-700">
                  Please collect your order from
                  the vendor when the order becomes
                  ready for pickup.
                </p>

              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            PAYMENT / TOTAL
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Payment
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {order.paymentMethod ||
                  "Cash on Delivery"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-xl">
              💵
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">

            <div className="flex justify-between text-sm">

              <span className="text-gray-500">
                Delivery Fee
              </span>

              <span className="font-semibold text-gray-800">
                ₹
                {Number(
                  order.deliveryFee || 0
                )}
              </span>
            </div>

            {Number(order.discount || 0) > 0 && (
              <div className="mt-3 flex justify-between text-sm">

                <span className="font-medium text-green-600">
                  Discount
                </span>

                <span className="font-bold text-green-600">
                  -₹
                  {Number(
                    order.discount || 0
                  )}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Paid / Payable
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {order.paymentStatus ===
                  "Paid"
                    ? "Payment completed"
                    : "Payment pending"}
                </p>
              </div>

              <p className="text-2xl font-black text-orange-500">
                ₹
                {Number(
                  order.total || 0
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            ORDER ID
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Order ID
              </p>

              <p className="mt-1 break-all pr-3 text-sm font-extrabold text-gray-900">
                {order.id}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
              #
            </div>
          </div>
        </section>

        {/* ==================================================
            NEXT STEP
        ================================================== */}

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
            What's next?
          </p>

          <div className="mt-4 space-y-4">

            <div className="flex gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-orange-500">
                1
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Vendor receives your order
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  The vendor will start processing
                  your order.
                </p>
              </div>
            </div>

            <div className="flex gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-orange-500">
                2
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Your food is prepared
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  You'll be able to track the order
                  status from your Orders section.
                </p>
              </div>
            </div>

            <div className="flex gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-600">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Enjoy your food
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {isPickup
                    ? "Collect your order when it is ready."
                    : "Your food will be delivered to your selected location."}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            BUTTONS
        ================================================== */}

        <div className="mt-6 space-y-3 pb-4">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/student/orders/${orderId}`
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.98]"
          >
            <span>View Order</span>
            <span>→</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/student")
            }
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            Continue Shopping
          </button>

        </div>

      </div>
    </div>
  );
}

export default OrderConfirmation;