import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../firebase/config";

/* =========================================================
   VENDOR PROFILE
========================================================= */

function VendorProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    uid: "",
    name: "",
    email: "",
    phone: "",
    role: "vendor",
  });

  const [editMode, setEditMode] = useState(false);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();

        setProfile({
          uid: currentUser.uid,
          name:
            data.name ||
            currentUser.displayName ||
            "",
          email:
            data.email ||
            currentUser.email ||
            "",
          phone: data.phone || "",
          role: data.role || "vendor",
        });
      } else {
        setProfile({
          uid: currentUser.uid,
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: "",
          role: "vendor",
        });
      }
    } catch (err) {
      console.error("Load vendor profile error:", err);

      setError(
        "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     PHONE VALIDATION
  ======================================================= */

  const validatePhone = (phone) => {
    const cleanedPhone = phone.replace(/\D/g, "");

    return /^[6-9]\d{9}$/.test(cleanedPhone);
  };

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSave = async () => {
    try {
      setError("");
      setMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You are not logged in.");
        return;
      }

      const trimmedName = profile.name.trim();
      const cleanedPhone = profile.phone.replace(/\D/g, "");

      if (!trimmedName) {
        setError("Vendor name is required.");
        return;
      }

      if (trimmedName.length < 2) {
        setError(
          "Vendor name must contain at least 2 characters."
        );
        return;
      }

      if (!profile.phone.trim()) {
        setError("Phone number is required.");
        return;
      }

      if (!validatePhone(cleanedPhone)) {
        setError(
          "Please enter a valid 10-digit Indian mobile number."
        );
        return;
      }

      setSaving(true);

      const userRef = doc(
        db,
        "users",
        currentUser.uid
      );

      await updateDoc(userRef, {
        name: trimmedName,
        phone: cleanedPhone,
      });

      setProfile((previous) => ({
        ...previous,
        name: trimmedName,
        phone: cleanedPhone,
      }));

      setMessage(
        "Profile updated successfully."
      );

      setEditMode(false);
    } catch (err) {
      console.error(
        "Save vendor profile error:",
        err
      );

      setError(
        err.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const handleCancelEdit = async () => {
    setEditMode(false);
    setError("");
    setMessage("");

    await loadProfile();
  };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const handlePasswordReset = async () => {
    try {
      setError("");
      setMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser?.email) {
        setError(
          "No email address is associated with this account."
        );
        return;
      }

      setPasswordLoading(true);

      await sendPasswordResetEmail(
        auth,
        currentUser.email
      );

      setMessage(
        `Password reset email sent to ${currentUser.email}.`
      );
    } catch (err) {
      console.error(
        "Password reset error:",
        err
      );

      setError(
        err.message ||
          "Unable to send password reset email."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      setError("");

      await signOut(auth);

      navigate("/login");
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );

      setError(
        "Unable to logout. Please try again."
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Loading vendor profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we fetch your account details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===================================================
          TOP HEADER
      =================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            <button
              type="button"
              onClick={() => navigate("/vendor")}
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg shadow-sm shadow-orange-200">
                🍽️
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                  CampusEats
                </p>

                <p className="text-sm font-bold text-slate-900">
                  Vendor Portal
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/vendor")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <span>←</span>
              <span className="hidden sm:inline">
                Dashboard
              </span>
            </button>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-orange-100 sm:p-8">

          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-20 h-56 w-56 rounded-full bg-white/10" />

          <div className="relative z-10 max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <span>⚙️</span>
              Account Settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Vendor Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">
              Manage your CampusEats vendor information,
              security settings, and account details from one place.
            </p>

          </div>

          <div className="relative z-10 mt-6 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-green-300" />
            Account Active
          </div>
        </section>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold">
              ✓
            </div>

            <div>
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-0.5 text-emerald-600">
                {message}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </div>

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-0.5 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* =================================================
              PROFILE INFORMATION
          ================================================= */}

          <section className="lg:col-span-2">

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              {/* Card header */}

              <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                      🏪
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Account Information
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Your basic vendor information
                      </p>
                    </div>

                  </div>

                  {!editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setEditMode(true);
                      }}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      ✎ Edit Profile
                    </button>
                  )}

                </div>
              </div>

              {/* Form */}

              <div className="p-5 sm:p-6">

                <div className="space-y-6">

                  {/* Vendor Name */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Vendor Name
                    </label>

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">
                        🏪
                      </span>

                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        disabled={!editMode || saving}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Enter vendor name"
                      />

                    </div>
                  </div>

                  {/* Email */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">
                        ✉️
                      </span>

                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-500"
                      />

                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <span>🔒</span>
                      Email address cannot be changed from the vendor panel.
                    </p>
                  </div>

                  {/* Phone */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number
                    </label>

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">
                        📱
                      </span>

                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        disabled={!editMode || saving}
                        maxLength={10}
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="10-digit mobile number"
                      />

                    </div>

                    {editMode && (
                      <p className="mt-2 text-xs text-slate-400">
                        Enter a valid 10-digit Indian mobile number.
                      </p>
                    )}
                  </div>

                  {/* Role */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Account Role
                    </label>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                          👤
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Vendor
                          </p>

                          <p className="text-xs text-slate-400">
                            CampusEats business account
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        Vendor
                      </span>

                    </div>
                  </div>

                </div>

                {/* Save / Cancel */}

                {editMode && (
                  <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          ✓ Save Changes
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>

                  </div>
                )}

              </div>
            </div>
          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-6">

            {/* Security */}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl">
                🔐
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Security
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Keep your CampusEats vendor account secure by managing your password.
              </p>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={passwordLoading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                    Sending...
                  </>
                ) : (
                  <>
                    🔑 Reset Password
                  </>
                )}
              </button>

            </div>

            {/* Account */}

            <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🚪
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Account
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Sign out from your CampusEats vendor account.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>

            </div>

          </aside>
        </div>

        {/* =================================================
            ACCOUNT DETAILS
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-xl">
                📋
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Account Details
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Information associated with your CampusEats vendor account.
                </p>
              </div>

            </div>
          </div>

          <div className="p-5 sm:p-6">

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Role */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Role
                  </p>

                  <span>👤</span>
                </div>

                <p className="mt-3 font-bold capitalize text-slate-900">
                  {profile.role}
                </p>

              </div>

              {/* Email */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <span>✉️</span>
                </div>

                <p className="mt-3 break-all text-sm font-semibold text-slate-900">
                  {profile.email}
                </p>

              </div>

              {/* Phone */}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phone
                  </p>

                  <span>📱</span>
                </div>

                <p className="mt-3 font-semibold text-slate-900">
                  {profile.phone || "Not provided"}
                </p>

              </div>

              {/* Status */}

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Account Status
                  </p>

                  <span>●</span>
                </div>

                <p className="mt-3 font-bold text-emerald-700">
                  Active
                </p>

              </div>

            </div>

            {/* UID */}

            {profile.uid && (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Account ID
                  </p>

                  <span className="w-fit rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Firebase UID
                  </span>

                </div>

                <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600">
                  {profile.uid}
                </p>

              </div>
            )}

          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="py-8 text-center">

          <p className="text-xs text-slate-400">
            CampusEats Vendor Portal
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Manage your account securely and efficiently.
          </p>

        </div>

      </main>
    </div>
  );
}

export default VendorProfile;