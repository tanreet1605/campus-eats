import { useState } from "react";
import { Link } from "react-router-dom";

import { resetPassword } from "../../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(email.trim());

      setSuccess(
        "Password reset link has been sent to your email. Please check your inbox."
      );

      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account was found with this email address.");
      } else if (
        error.code === "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection and try again."
        );
      } else {
        setError(
          "Unable to send reset link. Please try again."
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

      <div className="flex justify-center px-6 pt-10">

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
            Delicious food. Right on campus.
          </p>

        </div>

      </div>


      {/* =========================================
          FORGOT PASSWORD CARD
      ========================================== */}

      <div className="mx-auto mt-8 w-full max-w-md px-5 pb-10">

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-orange-100 sm:p-8">

          {/* Icon */}

          <div className="mb-6 flex justify-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
              🔐
            </div>

          </div>


          {/* Heading */}

          <div className="mb-7 text-center">

            <h2 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Don't worry! Enter your registered
              email and we'll send you a link to
              reset your password.
            </p>

          </div>


          {/* =====================================
              ERROR
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
              SUCCESS
          ====================================== */}

          {success && (
            <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm">
                  ✓
                </div>

                <div>

                  <p className="text-sm font-semibold text-green-700">
                    Reset link sent!
                  </p>

                  <p className="mt-1 text-sm leading-5 text-green-600">
                    {success}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =====================================
              FORM
          ====================================== */}

          <form
            onSubmit={handleResetPassword}
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
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

              </div>

            </div>


            {/* Send Reset Link */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-200 hover:bg-orange-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >

              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Sending Reset Link...

                </span>
              ) : (
                "Send Reset Link"
              )}

            </button>

          </form>


          {/* =====================================
              BACK TO LOGIN
          ====================================== */}

          <div className="mt-7 border-t border-gray-100 pt-6 text-center">

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 transition hover:text-orange-600"
            >
              ← Back to Login
            </Link>

          </div>


          {/* Footer */}

          <p className="mt-6 text-center text-xs leading-5 text-gray-400">
            Make sure you enter the email address
            associated with your CampusEats account.
          </p>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;