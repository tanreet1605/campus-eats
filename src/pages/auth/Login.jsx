import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // Login and get user's role from Firestore
      const loginResult = await loginUser(email, password);

      const role = loginResult.role;

      console.log("Logged in user role:", role);

      // ==========================================
      // ROLE-BASED NAVIGATION
      // ==========================================

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "vendor") {
        navigate("/vendor");
      } else if (role === "delivery") {
        navigate("/delivery");
      } else if (role === "student") {
        navigate("/student");
      } else {
        setError(
          "Invalid user role. Please contact administrator."
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else if (
        error.message ===
        "User profile not found in Firestore."
      ) {
        setError(
          "User profile not found. Please contact administrator."
        );
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">

      {/* =========================================
          TOP BRANDING
      ========================================== */}

      <div className="flex justify-center px-6 pt-10">
        <div className="text-center">

          {/* Logo */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-lg shadow-orange-200">
            <span className="text-4xl">
              🍔
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Campus<span className="text-orange-500">Eats</span>
          </h1>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Delicious food. Right on campus.
          </p>

        </div>
      </div>


      {/* =========================================
          LOGIN CARD
      ========================================== */}

      <div className="mx-auto mt-8 w-full max-w-md px-5 pb-10">

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-orange-100 sm:p-8">

          {/* Heading */}

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back! 👋
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Login to order your favourite food
              on campus.
            </p>

          </div>


          {/* =====================================
              ERROR MESSAGE
          ====================================== */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm">
                ❌
              </div>

              <p className="text-sm font-medium leading-6 text-red-600">
                {error}
              </p>

            </div>
          )}


          {/* =====================================
              SUCCESS MESSAGE
          ====================================== */}

          {success && (
            <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">

              <p className="text-sm font-medium text-green-600">
                {success}
              </p>

            </div>
          )}


          {/* =====================================
              LOGIN FORM
          ====================================== */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  ✉️
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

              </div>

            </div>


            {/* Password */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/forgot-password")
                  }
                  className="text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                >
                  Forgot Password?
                </button>

              </div>

              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  🔒
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500 transition hover:text-orange-500"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>


            {/* =====================================
                LOGIN BUTTON
            ====================================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-200 hover:bg-orange-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >

              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Logging in...

                </span>
              ) : (
                "Login to CampusEats"
              )}

            </button>

          </form>


          {/* =====================================
              DIVIDER
          ====================================== */}

          <div className="my-7 flex items-center gap-3">

            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs font-medium text-gray-400">
              NEW TO CAMPUSEATS?
            </span>

            <div className="h-px flex-1 bg-gray-200" />

          </div>


          {/* =====================================
              REGISTER
          ====================================== */}

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full rounded-2xl border-2 border-orange-100 bg-orange-50 py-3.5 text-sm font-bold text-orange-600 transition hover:border-orange-200 hover:bg-orange-100 active:scale-[0.98]"
          >
            Create a New Account
          </button>


          {/* =====================================
              FOOTER
          ====================================== */}

          <p className="mt-6 text-center text-xs leading-5 text-gray-400">
            Order food from your campus cafés,
            canteens and food stalls.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;