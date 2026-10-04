import { useState } from "react";
import { Link } from "react-router-dom";

import { registerUser } from "../../services/authService";
import { createUserProfile } from "../../services/userService";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validation
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Create Firebase Authentication account
      const user = await registerUser(
        email.trim(),
        password
      );

      console.log(
        "Firebase Auth user created:",
        user.uid
      );

      // STEP 2: Create Firestore profile
      await createUserProfile(user, {
        name: name.trim(),
        phone: phone.trim(),
      });

      console.log(
        "Firestore profile created successfully."
      );

      // STEP 3: Show success
      setSuccess(
        "Account created successfully! You can now continue to Login."
      );

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error
      );

      console.error(
        "Error code:",
        error.code
      );

      console.error(
        "Error message:",
        error.message
      );

      // Firebase Authentication errors
      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "This email is already registered. Please go to Login."
        );
      } else if (
        error.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        error.code === "auth/weak-password"
      ) {
        setError(
          "Password must be at least 6 characters."
        );
      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection and try again."
        );
      }

      // Firestore errors
      else if (
        error.code === "permission-denied"
      ) {
        setError(
          "Account was created, but the Firestore permission rule blocked the profile. Check Firestore Security Rules."
        );
      } else {
        setError(
          `Registration failed: ${
            error.message ||
            "Unknown error"
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">

      {/* =========================================
          BRANDING
      ========================================== */}

      <div className="flex justify-center px-6 pt-8">

        <div className="text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-lg shadow-orange-200">

            <span className="text-4xl">
              🍔
            </span>

          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Campus<span className="text-orange-500">
              Eats
            </span>
          </h1>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Your campus food, delivered.
          </p>

        </div>

      </div>


      {/* =========================================
          REGISTER CARD
      ========================================== */}

      <div className="mx-auto mt-7 w-full max-w-md px-5 pb-10">

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-orange-100 sm:p-8">

          {/* Heading */}

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create your account 🚀
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Join CampusEats and order delicious
              food from around your campus.
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

              <div className="flex items-start gap-3">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm">
                  ✓
                </div>

                <div>

                  <p className="text-sm font-semibold text-green-700">
                    Account created!
                  </p>

                  <p className="mt-1 text-sm leading-5 text-green-600">
                    {success}
                  </p>

                </div>

              </div>

              <Link
                to="/login"
                className="mt-4 block rounded-xl bg-green-600 py-3 text-center text-sm font-bold text-white transition hover:bg-green-700"
              >
                Continue to Login
              </Link>

            </div>
          )}


          {/* =====================================
              REGISTER FORM
          ====================================== */}

          {!success && (
            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* Full Name */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full Name
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    autoComplete="name"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

              </div>


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


              {/* Phone */}

              <div>

                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    📱
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

              </div>


              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
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

                <p className="mt-2 text-xs text-gray-400">
                  Password must contain at least
                  6 characters.
                </p>

              </div>


              {/* Register Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-200 hover:bg-orange-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Creating Account...

                  </span>
                ) : (
                  "Create CampusEats Account"
                )}
              </button>

            </form>
          )}


          {/* =====================================
              LOGIN LINK
          ====================================== */}

          <div className="mt-7 border-t border-gray-100 pt-6 text-center">

            <p className="text-sm text-gray-500">
              Already have an account?
            </p>

            <Link
              to="/login"
              className="mt-1 inline-block text-sm font-bold text-orange-500 transition hover:text-orange-600"
            >
              Login to CampusEats →
            </Link>

          </div>


          {/* =====================================
              FOOTER
          ====================================== */}

          <p className="mt-6 text-center text-xs leading-5 text-gray-400">
            By creating an account, you can order
            food from campus cafés, canteens and
            food stalls.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;