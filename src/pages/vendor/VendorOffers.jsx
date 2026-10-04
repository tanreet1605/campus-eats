import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  createOffer,
  getVendorOffers,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
} from "../../services/offerService";

function VendorOffers() {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingOffer, setEditingOffer] = useState(null);

  const [form, setForm] = useState({
    offerName: "",
    couponCode: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrder: "",
    maximumDiscount: "",
    active: true,
  });

  // =====================================================
  // LOAD OFFERS
  // =====================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    loadOffers();
  }, [user, authLoading]);

  const loadOffers = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        return;
      }

      const data = await getVendorOffers(user.uid);

      setOffers(data || []);
    } catch (error) {
      console.error("Load offers error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      offerName: "",
      couponCode: "",
      discountType: "percentage",
      discountValue: "",
      minimumOrder: "",
      maximumDiscount: "",
      active: true,
    });

    setEditingOffer(null);
  };

  // =====================================================
  // CREATE / UPDATE OFFER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      alert("Vendor is not logged in.");
      return;
    }

    if (!form.offerName.trim()) {
      alert("Please enter offer name.");
      return;
    }

    if (!form.couponCode.trim()) {
      alert("Please enter coupon code.");
      return;
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      alert("Please enter a valid discount value.");
      return;
    }

    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      alert("Percentage discount cannot be more than 100%.");
      return;
    }

    try {
      setSaving(true);

      const offerData = {
        offerName: form.offerName.trim(),
        couponCode: form.couponCode.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrder: Number(form.minimumOrder || 0),
        maximumDiscount: Number(form.maximumDiscount || 0),
        active: Boolean(form.active),
      };

      if (editingOffer) {
        await updateOffer(editingOffer.id, offerData);

        alert("Offer updated successfully.");
      } else {
        await createOffer({
          vendorId: user.uid,
          vendorName:
            user.displayName ||
            user.email?.split("@")[0] ||
            "Vendor",
          ...offerData,
        });

        alert("Offer created successfully.");
      }

      resetForm();

      await loadOffers();
    } catch (error) {
      console.error("Save offer error:", error);

      alert(
        error?.message ||
          "Unable to save offer. Please check Firebase permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (offer) => {
    setEditingOffer(offer);

    setForm({
      offerName: offer.offerName || "",
      couponCode: offer.couponCode || "",
      discountType: offer.discountType || "percentage",
      discountValue: offer.discountValue ?? "",
      minimumOrder: offer.minimumOrder ?? "",
      maximumDiscount: offer.maximumDiscount ?? "",
      active: offer.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================

  const handleToggleStatus = async (offer) => {
    if (!offer?.id) {
      return;
    }

    const newStatus = !offer.active;

    const actionText = newStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} "${offer.offerName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await toggleOfferStatus(offer.id, newStatus);

      await loadOffers();
    } catch (error) {
      console.error("Toggle offer status error:", error);

      alert(
        error?.message ||
          "Unable to change offer status."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (offer) => {
    if (!offer?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${offer.offerName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteOffer(offer.id);

      alert("Offer deleted successfully.");

      await loadOffers();
    } catch (error) {
      console.error("Delete offer error:", error);

      alert(
        error?.message ||
          "Unable to delete offer."
      );
    }
  };

  // =====================================================
  // FORMAT DISCOUNT
  // =====================================================

  const getDiscountText = (offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}% OFF`;
    }

    return `₹${offer.discountValue} OFF`;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-80 rounded bg-slate-200" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">

            <div className="h-[520px] animate-pulse rounded-3xl bg-white shadow-sm lg:col-span-1" />

            <div className="space-y-4 lg:col-span-2">
              <div className="h-36 animate-pulse rounded-3xl bg-white shadow-sm" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
                <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
            🔒
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Vendor Login Required
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please login as a vendor to manage your
            offers and coupons.
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-12">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() => navigate("/vendor")}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            ← Vendor Dashboard
          </button>

          <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-5 text-white shadow-lg sm:p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                  🎟️ Vendor Promotions
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Offers & Coupons
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-orange-50 sm:text-base">
                  Create and manage discount offers that
                  students can use while ordering from your
                  menu.
                </p>

              </div>

              <div className="flex items-center gap-3">

                <div className="rounded-2xl bg-white/10 px-5 py-3 text-center backdrop-blur">
                  <p className="text-2xl font-bold">
                    {offers.length}
                  </p>

                  <p className="text-xs text-orange-50">
                    Total Offers
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-white/10 px-5 py-3 text-center backdrop-blur sm:block">
                  <p className="text-2xl font-bold">
                    {
                      offers.filter(
                        (offer) => offer.active
                      ).length
                    }
                  </p>

                  <p className="text-xs text-orange-50">
                    Active
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">

        {/* =====================================================
            CREATE / EDIT AREA
        ===================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          {/* FORM */}

          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-1">

            <div className="border-b border-slate-100 p-5 sm:p-6">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                    {editingOffer
                      ? "Update Promotion"
                      : "New Promotion"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {editingOffer
                      ? "Edit Offer"
                      : "Create New Offer"}
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Configure your discount and coupon
                    settings.
                  </p>

                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                  {editingOffer ? "✏️" : "🎟️"}
                </div>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >

              {/* OFFER NAME */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Offer Name
                </label>

                <input
                  type="text"
                  name="offerName"
                  value={form.offerName}
                  onChange={handleChange}
                  placeholder="Weekend Special"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* COUPON */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Coupon Code
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">
                    🎫
                  </span>

                  <input
                    type="text"
                    name="couponCode"
                    value={form.couponCode}
                    onChange={handleChange}
                    placeholder="WEEKEND50"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Students will enter this code at checkout.
                </p>
              </div>

              {/* TYPE */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Discount Type
                  </label>

                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="percentage">
                      Percentage (%)
                    </option>

                    <option value="flat">
                      Flat Amount (₹)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Discount Value
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {form.discountType ===
                      "percentage"
                        ? "%"
                        : "₹"}
                    </span>

                    <input
                      type="number"
                      name="discountValue"
                      value={form.discountValue}
                      onChange={handleChange}
                      min="1"
                      max={
                        form.discountType ===
                        "percentage"
                          ? "100"
                          : undefined
                      }
                      placeholder={
                        form.discountType ===
                        "percentage"
                          ? "20"
                          : "50"
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-9 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                  </div>
                </div>

              </div>

              {/* MINIMUM */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Minimum Order Amount
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="minimumOrder"
                    value={form.minimumOrder}
                    onChange={handleChange}
                    min="0"
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Set 0 if there is no minimum order.
                </p>
              </div>

              {/* MAXIMUM */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Maximum Discount
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="maximumDiscount"
                    value={form.maximumDiscount}
                    onChange={handleChange}
                    min="0"
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Mainly useful for percentage offers.
                </p>
              </div>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50">

                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded accent-orange-500"
                />

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Activate immediately
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Make this offer available to customers.
                  </p>
                </div>

              </label>

              {/* BUTTONS */}

              <div className="flex flex-col gap-2 pt-1">

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingOffer
                    ? "Update Offer"
                    : "Create Offer"}
                </button>

                {editingOffer && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel Editing
                  </button>
                )}

              </div>

            </form>
          </div>

          {/* RIGHT SIDE INFORMATION */}

          <div className="space-y-5 lg:col-span-2">

            <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5 sm:p-6">

              <div className="flex gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  💡
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Create attractive student offers
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Use percentage discounts for larger
                    orders or flat discounts for simple
                    promotional campaigns.
                  </p>

                </div>

              </div>

            </div>

            {/* QUICK STATS */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  🎟️
                </div>

                <p className="mt-4 text-xs font-medium text-slate-500">
                  Total Offers
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {offers.length}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  ✓
                </div>

                <p className="mt-4 text-xs font-medium text-slate-500">
                  Active
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {
                    offers.filter(
                      (offer) => offer.active
                    ).length
                  }
                </p>

              </div>

              <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-1">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  ⏸️
                </div>

                <p className="mt-4 text-xs font-medium text-slate-500">
                  Inactive
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {
                    offers.filter(
                      (offer) => !offer.active
                    ).length
                  }
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            OFFERS LIST
        ===================================================== */}

        <section className="mt-8">

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Promotions
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Your Offers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {offers.length} offer
                {offers.length !== 1 ? "s" : ""} created
              </p>
            </div>

            {offers.length > 0 && (
              <span className="w-fit rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                {
                  offers.filter(
                    (offer) => offer.active
                  ).length
                } Active
              </span>
            )}

          </div>

          {offers.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                🎟️
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No offers yet
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Create your first offer using the form
                above and start attracting more student
                orders.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {offers.map((offer) => (

                <div
                  key={offer.id}
                  className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* OFFER TOP */}

                  <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white">

                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

                    <div className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/10" />

                    <div className="relative">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="text-xs font-semibold uppercase tracking-wider text-orange-100">
                            Special Offer
                          </p>

                          <h3 className="mt-1 truncate text-lg font-bold">
                            {offer.offerName}
                          </h3>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            offer.active
                              ? "bg-white text-emerald-700"
                              : "bg-black/20 text-white"
                          }`}
                        >
                          {offer.active
                            ? "● Active"
                            : "● Inactive"}
                        </span>

                      </div>

                      {/* DISCOUNT */}

                      <div className="mt-5">

                        <p className="text-3xl font-black tracking-tight">
                          {getDiscountText(offer)}
                        </p>

                        <p className="mt-1 text-xs text-orange-100">
                          Available through coupon
                        </p>

                      </div>

                      {/* COUPON */}

                      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/50 bg-white/10 px-3 py-2 backdrop-blur">

                        <span className="text-sm">
                          🎫
                        </span>

                        <span className="text-sm font-black tracking-widest">
                          {offer.couponCode}
                        </span>

                      </div>

                    </div>
                  </div>

                  {/* OFFER DETAILS */}

                  <div className="p-5">

                    <div className="space-y-3">

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-2">

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            🛒
                          </span>

                          <span className="text-sm text-slate-500">
                            Minimum Order
                          </span>

                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          ₹
                          {Number(
                            offer.minimumOrder || 0
                          )}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-2">

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            🎯
                          </span>

                          <span className="text-sm text-slate-500">
                            Max Discount
                          </span>

                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {offer.maximumDiscount
                            ? `₹${offer.maximumDiscount}`
                            : "No limit"}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-2">

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            📌
                          </span>

                          <span className="text-sm text-slate-500">
                            Type
                          </span>

                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {offer.discountType ===
                          "percentage"
                            ? "Percentage"
                            : "Flat Amount"}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="border-t border-slate-100 bg-slate-50 p-4">

                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(offer)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(
                            offer
                          )
                        }
                        className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                          offer.active
                            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {offer.active
                          ? "⏸ Deactivate"
                          : "▶ Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(offer)
                        }
                        className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      >
                        🗑️ Delete Offer
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default VendorOffers;