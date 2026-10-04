import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

import {
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
} from "../../services/offerService";

function AdminOffers() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");

  const [editForm, setEditForm] = useState({
    offerName: "",
    couponCode: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrder: "",
    maximumDiscount: "",
    active: true,
  });

  // ============================================================
  // LOAD OFFERS
  // ============================================================

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "offers")
      );

      const offerData = snapshot.docs.map(
        (offerDoc) => ({
          id: offerDoc.id,
          ...offerDoc.data(),
        })
      );

      setOffers(offerData);

      console.log("Admin offers:", offerData);
    } catch (err) {
      console.error("Admin offers error:", err);

      setError(
        "Unable to load offers. Please check Firebase permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // ============================================================
  // FORMAT DISCOUNT
  // ============================================================

  const formatDiscount = (offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue || 0}% OFF`;
    }

    return `₹${Number(
      offer.discountValue || 0
    ).toFixed(0)} OFF`;
  };

  // ============================================================
  // FILTER OFFERS
  // ============================================================

  const filteredOffers = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return offers.filter((offer) => {
      const matchesSearch =
        !searchText ||
        offer.offerName
          ?.toLowerCase()
          .includes(searchText) ||
        offer.couponCode
          ?.toLowerCase()
          .includes(searchText) ||
        offer.vendorName
          ?.toLowerCase()
          .includes(searchText) ||
        offer.vendorId
          ?.toLowerCase()
          .includes(searchText);

      const isActive = offer.active === true;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && isActive) ||
        (statusFilter === "Inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [offers, search, statusFilter]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalOffers = offers.length;

  const activeOffers = offers.filter(
    (offer) => offer.active === true
  ).length;

  const inactiveOffers =
    totalOffers - activeOffers;

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const openEditModal = (offer) => {
    setEditingOffer(offer);

    setEditForm({
      offerName: offer.offerName || "",
      couponCode: offer.couponCode || "",
      discountType:
        offer.discountType || "percentage",
      discountValue:
        offer.discountValue ?? "",
      minimumOrder:
        offer.minimumOrder ?? "",
      maximumDiscount:
        offer.maximumDiscount ?? "",
      active: offer.active === true,
    });

    setError("");
  };

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  const closeEditModal = () => {
    if (saving) return;

    setEditingOffer(null);

    setEditForm({
      offerName: "",
      couponCode: "",
      discountType: "percentage",
      discountValue: "",
      minimumOrder: "",
      maximumDiscount: "",
      active: true,
    });
  };

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // SAVE EDIT
  // ============================================================

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingOffer) return;

    setError("");

    if (!editForm.offerName.trim()) {
      setError("Offer name is required.");
      return;
    }

    if (!editForm.couponCode.trim()) {
      setError("Coupon code is required.");
      return;
    }

    const discountValue = Number(
      editForm.discountValue
    );

    const minimumOrder = Number(
      editForm.minimumOrder || 0
    );

    const maximumDiscount =
      editForm.maximumDiscount === ""
        ? null
        : Number(editForm.maximumDiscount);

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      setError("Please enter a valid discount value.");
      return;
    }

    if (
      editForm.discountType === "percentage" &&
      discountValue > 100
    ) {
      setError(
        "Percentage discount cannot be more than 100%."
      );
      return;
    }

    if (
      !Number.isFinite(minimumOrder) ||
      minimumOrder < 0
    ) {
      setError("Please enter a valid minimum order.");
      return;
    }

    if (
      maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) ||
        maximumDiscount <= 0)
    ) {
      setError(
        "Maximum discount must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      await updateOffer(editingOffer.id, {
        offerName: editForm.offerName.trim(),
        couponCode: editForm.couponCode
          .trim()
          .toUpperCase(),
        discountType: editForm.discountType,
        discountValue,
        minimumOrder,
        maximumDiscount,
        active: editForm.active,
      });

      closeEditModal();

      await loadOffers();
    } catch (err) {
      console.error("Update offer error:", err);

      setError(
        err.message ||
          "Unable to update offer."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TOGGLE OFFER STATUS
  // ============================================================

  const handleToggleStatus = async (offer) => {
    const action = offer.active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${offer.offerName}"?`
    );

    if (!confirmed) return;

    try {
      setActionId(offer.id);
      setError("");

      await toggleOfferStatus(
        offer.id,
        !offer.active
      );

      await loadOffers();
    } catch (err) {
      console.error(
        "Toggle offer status error:",
        err
      );

      setError(
        err.message ||
          "Unable to change offer status."
      );
    } finally {
      setActionId("");
    }
  };

  // ============================================================
  // DELETE OFFER
  // ============================================================

  const handleDeleteOffer = async (offer) => {
    const confirmed = window.confirm(
      `Delete "${offer.offerName}" permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionId(offer.id);
      setError("");

      await deleteOffer(offer.id);

      await loadOffers();
    } catch (err) {
      console.error(
        "Delete offer error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete offer."
      );
    } finally {
      setActionId("");
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Loading Offers
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching campus discount offers...
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/40">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin")
                }
                className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
              >
                <span>←</span>
                Back to Admin Dashboard
              </button>

              <div className="flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-sm">
                  🎟️
                </span>

                <p className="text-sm font-bold text-pink-600">
                  CampusEats Admin
                </p>

              </div>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Offers Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage campus offers and discount coupons.
              </p>

            </div>

            <button
              type="button"
              onClick={loadOffers}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-300"
            >
              🔄 Refresh Offers
            </button>

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm">

            <div className="flex items-start gap-3 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">

                <p className="font-bold text-red-800">
                  Offer operation failed
                </p>

                <p className="mt-1 break-words text-sm text-red-700">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="rounded-lg px-2 py-1 text-red-500 transition hover:bg-red-100"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* TOTAL */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Offers
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-900">
                  {totalOffers}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-2xl transition group-hover:scale-110">
                🎟️
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-pink-100">
              <div className="h-full w-full rounded-full bg-pink-400" />
            </div>

          </div>

          {/* ACTIVE */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Active Offers
                </p>

                <h2 className="mt-2 text-3xl font-black text-emerald-600">
                  {activeOffers}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl transition group-hover:scale-110">
                🟢
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width:
                    totalOffers > 0
                      ? `${Math.min(
                          100,
                          (activeOffers /
                            totalOffers) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>

          </div>

          {/* INACTIVE */}

          <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Inactive Offers
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-600">
                  {inactiveOffers}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl transition group-hover:scale-110">
                ⚪
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gray-400"
                style={{
                  width:
                    totalOffers > 0
                      ? `${Math.min(
                          100,
                          (inactiveOffers /
                            totalOffers) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>

          </div>

        </section>

        {/* ======================================================
            SEARCH + FILTER
        ====================================================== */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50/70 via-white to-pink-50/40 px-5 py-4">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-bold text-gray-900">
                  Search & Filters
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Find and manage campus discount offers
                </p>

              </div>

              {(search || statusFilter !== "All") && (
                <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  Filters Active
                </span>
              )}

            </div>

          </div>

          <div className="p-5">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* SEARCH */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Search Offers
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    placeholder="Search by offer name, coupon code, vendor or ID..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Offer Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="All">
                    All Offers
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            RESULTS HEADER
        ====================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-black text-gray-900">
                Campus Offers
              </h2>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {filteredOffers.length}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredOffers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {offers.length}
              </span>{" "}
              offers
            </p>

          </div>

          <span className="w-fit rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-bold text-pink-700">
            🎟️ Coupon Management
          </span>

        </div>

        {/* ======================================================
            DESKTOP TABLE
        ====================================================== */}

        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-gray-200 bg-gray-50/90">

                <tr>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Offer
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Vendor
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Coupon
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Discount
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Minimum
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredOffers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-3xl">
                        🎟️
                      </div>

                      <p className="font-bold text-gray-900">
                        No offers found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filter.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredOffers.map((offer) => {

                    const busy =
                      actionId === offer.id;

                    return (
                      <tr
                        key={offer.id}
                        className="group transition hover:bg-orange-50/40"
                      >

                        {/* OFFER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-lg transition group-hover:scale-105">
                              🎟️
                            </div>

                            <div className="min-w-0">

                              <p className="font-bold text-gray-900">
                                {offer.offerName ||
                                  "Unnamed Offer"}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Created{" "}
                                {formatDate(
                                  offer.createdAt
                                )}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* VENDOR */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-bold text-gray-800">
                            {offer.vendorName ||
                              "Unknown Vendor"}
                          </p>

                          <p className="mt-1 max-w-[150px] truncate font-mono text-[11px] text-gray-400">
                            {offer.vendorId ||
                              "N/A"}
                          </p>

                        </td>

                        {/* COUPON */}

                        <td className="px-5 py-4">

                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 font-mono text-sm font-black text-purple-700">
                            <span>🏷️</span>
                            {offer.couponCode ||
                              "N/A"}
                          </span>

                        </td>

                        {/* DISCOUNT */}

                        <td className="px-5 py-4">

                          <span className="inline-flex rounded-lg bg-pink-50 px-3 py-1.5 text-sm font-black text-pink-600">
                            {formatDiscount(
                              offer
                            )}
                          </span>

                        </td>

                        {/* MINIMUM */}

                        <td className="px-5 py-4">

                          <span className="text-sm font-bold text-gray-700">
                            ₹
                            {Number(
                              offer.minimumOrder || 0
                            ).toFixed(0)}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                              offer.active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                offer.active
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {offer.active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                openEditModal(
                                  offer
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleToggleStatus(
                                  offer
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                offer.active
                                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {busy
                                ? "..."
                                : offer.active
                                ? "⏸️ Deactivate"
                                : "▶️ Activate"}
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleDeleteOffer(
                                  offer
                                )
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              🗑️ Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ======================================================
            MOBILE
        ====================================================== */}

        <div className="space-y-4 md:hidden">

          {filteredOffers.length === 0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-3xl">
                🎟️
              </div>

              <p className="font-bold text-gray-900">
                No offers found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filter.
              </p>

            </div>

          ) : (

            filteredOffers.map((offer) => {

              const busy =
                actionId === offer.id;

              return (
                <div
                  key={offer.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >

                  {/* CARD HEADER */}

                  <div className="border-b border-gray-100 bg-gradient-to-r from-pink-50/70 via-white to-orange-50/40 p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-xl">
                          🎟️
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate font-black text-gray-900">
                            {offer.offerName ||
                              "Unnamed Offer"}
                          </h3>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {offer.vendorName ||
                              "Unknown Vendor"}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                          offer.active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                            : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            offer.active
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />

                        {offer.active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                  </div>

                  <div className="p-5">

                    {/* COUPON */}

                    <div>

                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Coupon Code
                      </p>

                      <span className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 font-mono text-sm font-black text-purple-700">
                        🎟️
                        {offer.couponCode ||
                          "N/A"}
                      </span>

                    </div>

                    {/* DISCOUNT */}

                    <div className="mt-5 rounded-xl bg-pink-50 p-4">

                      <p className="text-[11px] font-bold uppercase tracking-wide text-pink-400">
                        Discount
                      </p>

                      <p className="mt-1 text-xl font-black text-pink-600">
                        {formatDiscount(
                          offer
                        )}
                      </p>

                    </div>

                    {/* DETAILS */}

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-gray-50 p-3">

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          Minimum Order
                        </p>

                        <p className="mt-1 font-bold text-gray-800">
                          ₹
                          {Number(
                            offer.minimumOrder || 0
                          ).toFixed(0)}
                        </p>

                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          Max Discount
                        </p>

                        <p className="mt-1 font-bold text-gray-800">
                          {offer.maximumDiscount
                            ? `₹${Number(
                                offer.maximumDiscount
                              ).toFixed(0)}`
                            : "No limit"}
                        </p>

                      </div>

                    </div>

                    {/* CREATED */}

                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">

                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Created
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-600">
                        {formatDate(
                          offer.createdAt
                        )}
                      </p>

                    </div>

                    {/* VENDOR ID */}

                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">

                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Vendor ID
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-gray-500">
                        {offer.vendorId ||
                          "N/A"}
                      </p>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          openEditModal(
                            offer
                          )
                        }
                        className="rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          handleToggleStatus(
                            offer
                          )
                        }
                        className={`rounded-xl px-3 py-3 text-sm font-bold transition disabled:opacity-50 ${
                          offer.active
                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {busy
                          ? "Processing..."
                          : offer.active
                          ? "⏸️ Deactivate"
                          : "▶️ Activate"}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          handleDeleteOffer(
                            offer
                          )
                        }
                        className="rounded-xl bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                </div>
              );
            })

          )}

        </div>

      </main>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      {editingOffer && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close modal"
            onClick={closeEditModal}
            className="absolute inset-0 cursor-default bg-gray-950/60 backdrop-blur-sm"
          />

          {/* MODAL */}

          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-orange-50 via-white to-pink-50 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  ✏️
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    CampusEats Admin
                  </p>

                  <h2 className="text-xl font-black text-gray-900">
                    Edit Offer
                  </h2>

                </div>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSaveEdit}
              className="overflow-y-auto p-6"
            >

              <div className="space-y-5">

                {/* FORM ERROR */}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    ⚠️ {error}
                  </div>
                )}

                {/* OFFER NAME */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Offer Name
                  </label>

                  <input
                    type="text"
                    name="offerName"
                    value={editForm.offerName}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Example: Weekend Special"
                  />

                </div>

                {/* COUPON */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Coupon Code
                  </label>

                  <input
                    type="text"
                    name="couponCode"
                    value={editForm.couponCode}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm uppercase text-gray-900 outline-none transition placeholder:font-sans placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Example: WEEKEND20"
                  />

                </div>

                {/* DISCOUNT TYPE + VALUE */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Discount Type
                    </label>

                    <select
                      name="discountType"
                      value={editForm.discountType}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    >

                      <option value="percentage">
                        Percentage
                      </option>

                      <option value="flat">
                        Flat Amount
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Discount Value
                    </label>

                    <div className="relative">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="discountValue"
                        value={editForm.discountValue}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder={
                          editForm.discountType ===
                          "percentage"
                            ? "20"
                            : "50"
                        }
                      />

                    </div>

                  </div>

                </div>

                {/* MIN + MAX */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Minimum Order
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="minimumOrder"
                      value={editForm.minimumOrder}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      placeholder="200"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Maximum Discount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="maximumDiscount"
                      value={editForm.maximumDiscount}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      placeholder="100"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      Leave empty for no limit.
                    </p>

                  </div>

                </div>

                {/* ACTIVE */}

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/50">

                  <input
                    type="checkbox"
                    name="active"
                    checked={editForm.active}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        active:
                          e.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-orange-500"
                  />

                  <div>

                    <p className="font-bold text-gray-900">
                      Offer is Active
                    </p>

                    <p className="mt-0.5 text-sm text-gray-500">
                      Active offers can be used by students.
                    </p>

                  </div>

                </label>

              </div>

              {/* BUTTONS */}

              <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminOffers;