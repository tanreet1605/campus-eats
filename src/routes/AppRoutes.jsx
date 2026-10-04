import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* =====================================================
   AUTH
===================================================== */

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";


/* =====================================================
   STUDENT
===================================================== */

import Home from "../pages/student/Home";
import FoodDetails from "../pages/student/FoodDetails";
import Favorites from "../pages/student/Favorites";
import Profile from "../pages/student/Profile";
import Cart from "../pages/student/Cart";
import Notifications from "../pages/student/Notifications";
import ReviewOrder from "../pages/student/ReviewOrder";
import Checkout from "../pages/student/Checkout";
import OrderConfirmation from "../pages/student/OrderConfirmation";
import Orders from "../pages/student/Orders";
import OrderDetails from "../pages/student/OrderDetails";


/* =====================================================
   VENDOR
===================================================== */

import VendorDashboard from "../pages/vendor/VendorDashboard";
import VendorOrders from "../pages/vendor/VendorOrders";
import VendorMenu from "../pages/vendor/VendorMenu";
import VendorSales from "../pages/vendor/VendorSales";
import VendorOffers from "../pages/vendor/VendorOffers";
import VendorProfile from "../pages/vendor/VendorProfile";
import VendorReviews from "../pages/vendor/VendorReviews";


/* =====================================================
   DELIVERY
===================================================== */

import DeliveryDashboard from "../pages/delivery/DeliveryDashboard";
import DeliveryOrderDetails from "../pages/delivery/DeliveryOrderDetails";


/* =====================================================
   ADMIN
===================================================== */

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminFood from "../pages/admin/AdminFood";
import AdminVendors from "../pages/admin/AdminVendors";
import AdminDelivery from "../pages/admin/AdminDelivery";
import AdminOffers from "../pages/admin/AdminOffers";


function AppRoutes() {
  return (
    <Routes>

      {/* =================================================
          AUTH ROUTES
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />


      {/* =================================================
          ROOT
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* =================================================
          STUDENT ROUTES
      ================================================= */}

      <Route
        path="/student"
        element={<Home />}
      />

      <Route
        path="/student/home"
        element={<Home />}
      />

      <Route
        path="/student/food/:foodId"
        element={<FoodDetails />}
      />

      <Route
        path="/student/favorites"
        element={<Favorites />}
      />

      <Route
        path="/student/profile"
        element={<Profile />}
      />

      <Route
        path="/student/cart"
        element={<Cart />}
      />

      <Route
        path="/student/notifications"
        element={<Notifications />}
      />

      <Route
        path="/student/orders"
        element={<Orders />}
      />

      <Route
        path="/student/orders/:orderId"
        element={<OrderDetails />}
      />

      <Route
        path="/student/orders/:orderId/review"
        element={<ReviewOrder />}
      />

      <Route
        path="/student/checkout"
        element={<Checkout />}
      />

      <Route
        path="/student/order-confirmation/:orderId"
        element={<OrderConfirmation />}
      />


      {/* =================================================
          VENDOR ROUTES
      ================================================= */}

      <Route
        path="/vendor"
        element={<VendorDashboard />}
      />

      <Route
        path="/vendor/orders"
        element={<VendorOrders />}
      />

      <Route
        path="/vendor/menu"
        element={<VendorMenu />}
      />

      <Route
        path="/vendor/sales"
        element={<VendorSales />}
      />

      <Route
        path="/vendor/offers"
        element={<VendorOffers />}
      />

      <Route
        path="/vendor/profile"
        element={<VendorProfile />}
      />

      <Route
        path="/vendor/reviews"
        element={<VendorReviews />}
      />


      {/* =================================================
          DELIVERY ROUTES
      ================================================= */}

      <Route
        path="/delivery"
        element={<DeliveryDashboard />}
      />

      <Route
        path="/delivery/orders/:orderId"
        element={<DeliveryOrderDetails />}
      />


      {/* =================================================
          ADMIN ROUTES
      ================================================= */}

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

      <Route
        path="/admin/users"
        element={<AdminUsers />}
      />

      <Route
        path="/admin/orders"
        element={<AdminOrders />}
      />

      <Route
        path="/admin/food"
        element={<AdminFood />}
      />

      <Route
        path="/admin/vendors"
        element={<AdminVendors />}
      />

      <Route
        path="/admin/delivery"
        element={<AdminDelivery />}
      />

      <Route path="/admin/offers" element={<AdminOffers />} />

      {/* =================================================
          UNKNOWN ROUTES
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default AppRoutes;