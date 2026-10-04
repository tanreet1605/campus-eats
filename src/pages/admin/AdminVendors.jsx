import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

function AdminVendors() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD VENDORS
  // =====================================================

  const loadVendors = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const snapshot = await getDocs(
          collection(db, "users")
        );

        const vendorData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (user) => user.role === "vendor"
          );

        setVendors(vendorData);
      } catch (err) {
        console.error(
          "Admin vendors error:",
          err
        );

        setError(
          err.message ||
            "Unable to load vendors. Please check Firebase permissions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // =====================================================
  // FILTER VENDORS
  // =====================================================

  const filteredVendors = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    if (!searchText) {
      return vendors;
    }

    return vendors.filter((vendor) => {
      const name =
        vendor.name?.toLowerCase() || "";

      const email =
        vendor.email?.toLowerCase() || "";

      const phone =
        String(vendor.phone || "")
          .toLowerCase();

      const vendorId =
        vendor.id?.toLowerCase() || "";

      return (
        name.includes(searchText) ||
        email.includes(searchText) ||
        phone.includes(searchText) ||
        vendorId.includes(searchText)
      );
    });
  }, [vendors, search]);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-8 w-64 rounded bg-gray-200" />
              <div className="h-4 w-80 max-w-full rounded bg-gray-200" />
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="mt-4 h-9 w-16 rounded bg-gray-200" />
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-gray-200" />
                </div>

                <div className="mt-5 h-3 w-40 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="mb-7 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 h-5 w-40 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-xl bg-gray-200" />
          </div>

          <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm" />
        </main>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* TITLE */}

            <div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin")
                }
                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-orange-600"
              >
                <span className="text-lg">
                  ←
                </span>

                Back to Admin Dashboard
              </button>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                  🏪
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    CampusEats Admin
                  </p>

                  <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                    Vendors Management
                  </h1>

                </div>

              </div>

              <p className="mt-2 text-sm text-gray-500 sm:ml-14">
                Manage and monitor registered campus food vendors.
              </p>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() =>
                loadVendors(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Vendors"}
            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                ⚠️
              </div>

              <div className="flex-1">

                <p className="font-bold text-red-800">
                  Unable to load vendors
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg px-2 py-1 font-bold text-red-500 transition hover:bg-red-100"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* TOTAL VENDORS */}

          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-semibold text-gray-500">
                  Total Vendors
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-900">
                  {vendors.length}
                </h2>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                🏪
              </div>

            </div>

            <p className="mt-4 text-xs font-medium text-gray-400">
              Registered vendor accounts
            </p>

          </div>

          {/* SHOWING */}

          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-semibold text-gray-500">
                  Showing
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-900">
                  {filteredVendors.length}
                </h2>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🔎
              </div>

            </div>

            <p className="mt-4 text-xs font-medium text-gray-400">
              Matching current search
            </p>

          </div>

          {/* ACCOUNT TYPE */}

          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-semibold text-gray-500">
                  Account Type
                </p>

                <h2 className="mt-2 text-xl font-black text-orange-600">
                  Vendor
                </h2>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl">
                ✓
              </div>

            </div>

            <p className="mt-4 text-xs font-medium text-gray-400">
              Campus food provider
            </p>

          </div>

        </section>

        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="mb-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                Vendor Directory
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Find Vendors
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search by vendor name, email, phone or account ID.
              </p>

            </div>

            <div className="w-fit rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
              {filteredVendors.length} result
              {filteredVendors.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <div className="relative flex-1">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by vendor name, email, phone or ID..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />

            </div>

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Clear Search
              </button>
            )}

          </div>

        </section>

        {/* =================================================
            RESULTS HEADER
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
              Campus Food Partners
            </p>

            <h2 className="mt-1 text-2xl font-black text-gray-900">
              All Vendors
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredVendors.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {vendors.length}
              </span>{" "}
              vendors
            </p>

          </div>

          <span className="w-fit rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
            🏪 Vendor Accounts
          </span>

        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-gray-200 bg-gray-50/80">

                <tr>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Vendor ID
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredVendors.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                        🏪
                      </div>

                      <p className="mt-4 font-black text-gray-900">
                        No vendors found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {search
                          ? "Try a different search."
                          : "No vendor accounts are registered yet."}
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredVendors.map(
                    (vendor) => (

                      <tr
                        key={vendor.id}
                        className="group transition hover:bg-orange-50/30"
                      >

                        {/* VENDOR */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-100 to-orange-50 text-lg">
                              🏪
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-bold text-gray-900">
                                {vendor.name ||
                                  "Unnamed Vendor"}
                              </p>

                              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                                <span>
                                  ✓
                                </span>
                                Vendor
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* EMAIL */}

                        <td className="px-6 py-5">

                          <p className="max-w-[260px] truncate text-sm text-gray-600">
                            {vendor.email ||
                              "No email"}
                          </p>

                        </td>

                        {/* PHONE */}

                        <td className="px-6 py-5">

                          <p className="text-sm text-gray-600">
                            {vendor.phone ||
                              "No phone"}
                          </p>

                        </td>

                        {/* JOINED */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-medium text-gray-600">
                            {formatDate(
                              vendor.createdAt
                            )}
                          </p>

                        </td>

                        {/* ID */}

                        <td className="px-6 py-5">

                          <span className="inline-block max-w-[190px] truncate rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 font-mono text-[11px] text-gray-400">
                            {vendor.id}
                          </span>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="space-y-4 md:hidden">

          {filteredVendors.length === 0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                🏪
              </div>

              <p className="mt-4 font-black text-gray-900">
                No vendors found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try a different search."
                  : "No vendor accounts are registered yet."}
              </p>

            </div>

          ) : (

            filteredVendors.map(
              (vendor) => (

                <div
                  key={vendor.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  {/* TOP */}

                  <div className="flex items-start gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-xl">
                      🏪
                    </div>

                    <div className="min-w-0 flex-1">

                      <h3 className="truncate font-black text-gray-900">
                        {vendor.name ||
                          "Unnamed Vendor"}
                      </h3>

                      <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                        ✓ Vendor
                      </span>

                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">

                    <div>

                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-700">
                        {vendor.email ||
                          "No email"}
                      </p>

                    </div>

                    <div>

                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {vendor.phone ||
                          "No phone"}
                      </p>

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          Joined
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {formatDate(
                            vendor.createdAt
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          Vendor ID
                        </p>

                        <p className="mt-1 break-all rounded-lg bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-500">
                          {vendor.id}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </main>

    </div>
  );
}

export default AdminVendors;