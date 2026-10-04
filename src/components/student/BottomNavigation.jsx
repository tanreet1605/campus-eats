import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "../../firebase/config";

function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let unsubscribeCart = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setCartCount(0);
          return;
        }

        const cartRef = doc(db, "carts", user.uid);

        unsubscribeCart = onSnapshot(
          cartRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              setCartCount(0);
              return;
            }

            const cartData = snapshot.data();

            const items = cartData.items || [];

            const totalItems = items.reduce(
              (total, item) =>
                total + Number(item.quantity || 0),
              0
            );

            setCartCount(totalItems);
          },
          (error) => {
            console.error(
              "Cart listener error:",
              error
            );

            setCartCount(0);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeCart) {
        unsubscribeCart();
      }
    };
  }, []);

  const navigationItems = [
    {
      label: "Home",
      icon: "🏠",
      path: "/student",
    },
    {
      label: "Search",
      icon: "🔍",
      path: "/student",
    },
    {
      label: "Cart",
      icon: "🛒",
      path: "/student/cart",
    },
    {
      label: "Orders",
      icon: "📦",
      path: "/student/orders",
    },
    {
      label: "Profile",
      icon: "👤",
      path: "/student/profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">

      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">

        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.path;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`relative flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
                isActive
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            >

              {/* Icon */}
              <span className="relative text-xl">

                {item.icon}

                {/* Cart Badge */}
                {item.label === "Cart" &&
                  cartCount > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {cartCount > 99
                        ? "99+"
                        : cartCount}
                    </span>
                  )}

              </span>

              {/* Label */}
              <span className="text-[11px] font-medium">
                {item.label}
              </span>

            </button>
          );
        })}

      </div>

    </nav>
  );
}

export default BottomNavigation;