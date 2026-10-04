import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  getVendorFoodItems,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  toggleFoodAvailability,
} from "../../services/foodService";

const CATEGORIES = [
  "Breakfast",
  "Main Course",
  "Snacks",
  "Fast Food",
  "Beverages",
  "Desserts",
  "Healthy Food",
  "Combos",
];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Main Course",
  prepTime: "",
  imageUrl: "",
  available: true,
};

const VendorMenu = () => {
  const { user } = useAuth();

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Action states
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  // ============================================================
  // LOAD VENDOR FOOD
  // ============================================================

  const loadFoodItems = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError("");

      const items = await getVendorFoodItems(user.uid);

      setFoodItems(items);
    } catch (err) {
      console.error("Error loading vendor menu:", err);
      setError("Unable to load your menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoodItems();
  }, [user?.uid]);

  // ============================================================
  // FILTER FOOD ITEMS
  // ============================================================

  const filteredFoodItems = useMemo(() => {
    return foodItems.filter((food) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        search === "" ||
        food.name?.toLowerCase().includes(search) ||
        food.description?.toLowerCase().includes(search) ||
        food.category?.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        food.category === selectedCategory;

      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" && food.available === true) ||
        (availabilityFilter === "Unavailable" &&
          food.available === false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [
    foodItems,
    searchTerm,
    selectedCategory,
    availabilityFilter,
  ]);

  // ============================================================
  // MENU COUNTS
  // ============================================================

  const totalItems = foodItems.length;

  const availableItems = foodItems.filter(
    (food) => food.available === true
  ).length;

  const unavailableItems = foodItems.filter(
    (food) => food.available === false
  ).length;

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingFood(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (food) => {
    setEditingFood(food);

    setForm({
      name: food.name || "",
      description: food.description || "",
      price: food.price ?? "",
      category: food.category || "Main Course",
      prepTime: food.prepTime ?? "",
      imageUrl: food.imageUrl || "",
      available: food.available !== false,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingFood(null);
    setForm(emptyForm);
  };

  // ============================================================
  // ADD / UPDATE FOOD
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      setError("You are not logged in.");
      return;
    }

    if (!form.name.trim()) {
      setError("Food name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (form.price === "" || Number(form.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (form.prepTime === "" || Number(form.prepTime) <= 0) {
      setError("Please enter a valid preparation time.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingFood) {
        await updateFoodItem(editingFood.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category,
          prepTime: Number(form.prepTime),
          imageUrl: form.imageUrl.trim(),
          available: form.available,
        });

        setSuccess("Food item updated successfully.");
      } else {
        await addFoodItem({
          vendorId: user.uid,
          vendorName:
            user.displayName ||
            user.email?.split("@")[0] ||
            "Vendor",
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category,
          prepTime: Number(form.prepTime),
          imageUrl: form.imageUrl.trim(),
          available: form.available,
        });

        setSuccess("Food item added successfully.");
      }

      setShowForm(false);
      setEditingFood(null);
      setForm(emptyForm);

      await loadFoodItems();
    } catch (err) {
      console.error("Error saving food item:", err);
      setError(err.message || "Unable to save food item.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // AVAILABILITY
  // ============================================================

  const handleAvailability = async (food) => {
    try {
      setAvailabilityId(food.id);
      setError("");
      setSuccess("");

      await toggleFoodAvailability(food.id, !food.available);

      setSuccess(
        food.available
          ? `${food.name} is now unavailable.`
          : `${food.name} is now available.`
      );

      await loadFoodItems();
    } catch (err) {
      console.error("Error changing availability:", err);
      setError("Unable to change food availability.");
    } finally {
      setAvailabilityId(null);
    }
  };

  // ============================================================
  // DELETE FOOD
  // ============================================================

  const handleDelete = async (food) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${food.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(food.id);
      setError("");
      setSuccess("");

      await deleteFoodItem(food.id);

      setFoodItems((prev) =>
        prev.filter((item) => item.id !== food.id)
      );

      setSuccess(`${food.name} deleted successfully.`);
    } catch (err) {
      console.error("Error deleting food:", err);
      setError("Unable to delete food item.");
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setAvailabilityFilter("All");
  };

  const filtersActive =
    searchTerm !== "" ||
    selectedCategory !== "All" ||
    availabilityFilter !== "All";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              />
            ))}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="h-48 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span>🍽️</span>
                Vendor Menu
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                My Menu
              </h1>

              <p className="mt-1 max-w-xl text-sm text-orange-50 sm:text-base">
                Manage your food items, pricing, availability and
                preparation details from one place.
              </p>
            </div>

            <button
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-orange-600 shadow-md transition hover:-translate-y-0.5 hover:bg-orange-50 active:translate-y-0"
            >
              <span className="text-lg">+</span>
              Add Food
            </button>
          </div>
        </div>

        {/* ======================================================
            MESSAGES
        ====================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            <span className="text-lg">✓</span>
            <div>
              <p className="font-semibold">Success</p>
              <p className="mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Items
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {totalItems}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  In your menu
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🍽️
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Available
                </p>

                <p className="mt-1 text-3xl font-bold text-emerald-600">
                  {availableItems}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Ready for orders
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                🟢
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Unavailable
                </p>

                <p className="mt-1 text-3xl font-bold text-red-600">
                  {unavailableItems}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Temporarily hidden
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
                🔴
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================
            SEARCH & FILTERS
        ====================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">

          <div className="mb-4 flex flex-col gap-1">
            <h2 className="font-bold text-slate-900">
              Menu Items
            </h2>

            <p className="text-xs text-slate-500 sm:text-sm">
              Search and filter your food items
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">

            {/* SEARCH */}

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search food, category or description..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            {/* CATEGORY */}

            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            >
              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            {/* AVAILABILITY */}

            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            >
              <option value="All">
                All Availability
              </option>

              <option value="Available">
                🟢 Available
              </option>

              <option value="Unavailable">
                🔴 Unavailable
              </option>
            </select>

          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">

            <p className="text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredFoodItems.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {totalItems}
              </span>{" "}
              items
            </p>

            {filtersActive && (
              <button
                onClick={clearFilters}
                className="font-bold text-orange-600 transition hover:text-orange-700"
              >
                Clear Filters
              </button>
            )}

          </div>
        </div>

        {/* ======================================================
            EMPTY STATES
        ====================================================== */}

        {foodItems.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
              🍽️
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Your menu is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add your first food item and start building
              your campus menu.
            </p>

            <button
              onClick={openAddForm}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
            >
              + Add First Food
            </button>

          </div>

        ) : filteredFoodItems.length === 0 ? (

          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-100">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
              🔍
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              No matching items
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          /* ====================================================
             FOOD GRID
          ==================================================== */

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredFoodItems.map((food) => (

              <div
                key={food.id}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden">

                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-7xl">
                      🍽️
                    </div>
                  )}

                  {/* STATUS */}

                  <div className="absolute left-4 top-4">
                    {food.available ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="absolute bottom-4 right-4 rounded-xl bg-slate-950/85 px-3 py-2 text-sm font-bold text-white shadow-lg backdrop-blur">
                    ₹{food.price}
                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {food.name}
                      </h2>

                      <span className="mt-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        {food.category}
                      </span>

                    </div>

                  </div>

                  <p className="mt-4 min-h-[42px] text-sm leading-5 text-slate-500">
                    {food.description}
                  </p>

                  {/* INFO */}

                  <div className="mt-4 flex items-center gap-3 border-y border-slate-100 py-3 text-xs text-slate-500">

                    <span className="flex items-center gap-1">
                      ⏱️
                      <span className="font-semibold text-slate-700">
                        {food.prepTime || "-"} min
                      </span>
                    </span>

                    <span className="h-4 w-px bg-slate-200" />

                    <span className="flex items-center gap-1">
                      🍽️
                      <span className="font-semibold text-slate-700">
                        {food.category}
                      </span>
                    </span>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-4 grid grid-cols-2 gap-2">

                    <button
                      onClick={() => openEditForm(food)}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() =>
                        handleAvailability(food)
                      }
                      disabled={availabilityId === food.id}
                      className={`rounded-xl px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        food.available
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {availabilityId === food.id
                        ? "Updating..."
                        : food.available
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(food)
                      }
                      disabled={deletingId === food.id}
                      className="col-span-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === food.id
                        ? "Deleting..."
                        : "🗑️ Delete Food"}
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* ======================================================
            ADD / EDIT MODAL
        ====================================================== */}

        {showForm && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">

            <div className="max-h-[94vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 sm:px-6">

                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg text-white shadow-sm">
                      {editingFood ? "✏️" : "+"}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                        {editingFood
                          ? "Edit Food Item"
                          : "Add Food Item"}
                      </h2>

                      <p className="text-xs text-slate-500 sm:text-sm">
                        {editingFood
                          ? "Update your menu item details."
                          : "Add a new item to your campus menu."}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeForm}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="max-h-[calc(94vh-80px)] overflow-y-auto p-5 sm:p-6">

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* FOOD NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Food Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Shahi Paneer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Description *
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe your food item..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  {/* PRICE + PREP TIME */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Price (₹) *
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="price"
                          value={form.price}
                          onChange={handleChange}
                          min="1"
                          step="1"
                          placeholder="200"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Preparation Time *
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          ⏱️
                        </span>

                        <input
                          type="number"
                          name="prepTime"
                          value={form.prepTime}
                          onChange={handleChange}
                          min="1"
                          max="180"
                          step="1"
                          placeholder="15"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-14 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          min
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Category *
                    </label>

                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    >
                      {CATEGORIES.map((category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IMAGE URL */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Food Image URL
                      <span className="ml-2 font-normal text-slate-400">
                        Optional
                      </span>
                    </label>

                    <input
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/food.jpg"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Add a publicly accessible image URL for this food.
                    </p>

                    {form.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          src={form.imageUrl}
                          alt="Food preview"
                          className="h-36 w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* AVAILABILITY */}

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/40">

                    <input
                      type="checkbox"
                      name="available"
                      checked={form.available}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          available: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-5 w-5 accent-orange-500"
                    />

                    <div>
                      <p className="font-bold text-slate-800">
                        Available for ordering
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        Students can order this item when
                        availability is enabled.
                      </p>
                    </div>

                  </label>

                  {/* FORM BUTTONS */}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row">

                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingFood
                        ? "Update Food"
                        : "Add Food"}
                    </button>

                  </div>

                </form>

              </div>
            </div>
          </div>

        )}

      </div>
    </div>
  );
};

export default VendorMenu;