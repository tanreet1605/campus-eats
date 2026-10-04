import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { getUserOrders } from "../../services/orderService";

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [hostel, setHostel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ---------------------------------------
  // MONTHLY SPENDING
  // ---------------------------------------

  const [orders, setOrders] = useState([]);
  const [spendingLoading, setSpendingLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  // ---------------------------------------
  // LOAD PROFILE
  // ---------------------------------------

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();

          setProfile(data);

          setName(data.name || "");
          setPhone(data.phone || "");
          setStudentId(data.studentId || "");
          setDepartment(data.department || "");
          setCourse(data.course || "");
          setHostel(data.hostel || "");
        } else {
          const defaultProfile = {
            email: user.email || "",
            role: "student",
          };

          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // ---------------------------------------
  // LOAD STUDENT ORDERS
  // ---------------------------------------

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.uid) {
        setSpendingLoading(false);
        return;
      }

      try {
        setSpendingLoading(true);

        const data = await getUserOrders(user.uid);

        setOrders(data || []);
      } catch (err) {
        console.error(
          "Monthly spending orders error:",
          err
        );
      } finally {
        setSpendingLoading(false);
      }
    };

    loadOrders();
  }, [user?.uid]);

  // ---------------------------------------
  // SAVE PROFILE
  // ---------------------------------------

  const handleSaveProfile = async () => {
    setMessage("");
    setError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedStudentId = studentId.trim();
    const trimmedDepartment = department.trim();
    const trimmedCourse = course.trim();
    const trimmedHostel = hostel.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!user?.uid) {
      setError("User is not logged in.");
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        name: trimmedName,
        phone: trimmedPhone,
        studentId: trimmedStudentId,
        department: trimmedDepartment,
        course: trimmedCourse,
        hostel: trimmedHostel,
      });

      setProfile((previous) => ({
        ...previous,
        name: trimmedName,
        phone: trimmedPhone,
        studentId: trimmedStudentId,
        department: trimmedDepartment,
        course: trimmedCourse,
        hostel: trimmedHostel,
      }));

      setName(trimmedName);
      setPhone(trimmedPhone);
      setStudentId(trimmedStudentId);
      setDepartment(trimmedDepartment);
      setCourse(trimmedCourse);
      setHostel(trimmedHostel);

      setIsEditing(false);

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------
  // CANCEL EDIT
  // ---------------------------------------

  const handleCancelEdit = () => {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setStudentId(profile?.studentId || "");
    setDepartment(profile?.department || "");
    setCourse(profile?.course || "");
    setHostel(profile?.hostel || "");

    setIsEditing(false);

    setMessage("");
    setError("");
  };

  // ---------------------------------------
  // RESET PASSWORD
  // ---------------------------------------

  const handleResetPassword = async () => {
    setMessage("");
    setError("");

    if (!user?.email) {
      setError("Email address is not available.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);

      setMessage(
        "Password reset email has been sent to your registered email."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Unable to send password reset email.");
    }
  };

  // ---------------------------------------
  // LOGOUT
  // ---------------------------------------

  const handleLogout = async () => {
    setMessage("");
    setError("");
    setLoggingOut(true);

    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to logout. Please try again.");
      setLoggingOut(false);
    }
  };

  // ---------------------------------------
  // MONTHLY SPENDING CALCULATION
  // ---------------------------------------

  const deliveredOrdersForMonth = orders.filter((order) => {
    if (order.status !== "Delivered") {
      return false;
    }

    if (!order.createdAt?.toDate) {
      return false;
    }

    const orderDate = order.createdAt.toDate();

    return (
      orderDate.getFullYear() === selectedMonth.getFullYear() &&
      orderDate.getMonth() === selectedMonth.getMonth()
    );
  });

  const monthlySpending = deliveredOrdersForMonth.reduce(
    (total, order) =>
      total + Number(order.total || 0),
    0
  );

  const monthlyOrderCount =
    deliveredOrdersForMonth.length;

  const averageOrder =
    monthlyOrderCount > 0
      ? Math.round(
          monthlySpending /
            monthlyOrderCount
        )
      : 0;

  // ---------------------------------------
  // MONTH NAME
  // ---------------------------------------

  const monthName = selectedMonth.toLocaleString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );

  // ---------------------------------------
  // CHANGE MONTH
  // ---------------------------------------

  const changeMonth = (amount) => {
    setSelectedMonth(
      (previousMonth) =>
        new Date(
          previousMonth.getFullYear(),
          previousMonth.getMonth() + amount,
          1
        )
    );
  };

  // ---------------------------------------
  // PREVENT FUTURE MONTHS
  // ---------------------------------------

  const now = new Date();

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const isCurrentMonth =
    selectedMonth.getFullYear() ===
      currentMonthStart.getFullYear() &&
    selectedMonth.getMonth() ===
      currentMonthStart.getMonth();

  // ---------------------------------------
  // DELIVERY LOCATION
  // ---------------------------------------

  const deliveryLocation =
    localStorage.getItem(
      "campusEatsDeliveryLocation"
    ) || "No location selected";

  // ---------------------------------------
  // LOADING
  // ---------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] px-5">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>

            <h2 className="mt-5 text-lg font-black text-gray-900">
              Loading profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Getting your CampusEats account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-28">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => navigate("/student")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 active:scale-95"
              aria-label="Go back"
            >
              ←
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                CampusEats
              </p>

              <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-gray-900">
                My Profile
              </h1>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
              👤
            </div>

          </div>

        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-5 pt-5">

        {/* ================================================= */}
        {/* PROFILE HERO */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-100">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner backdrop-blur">
              👤
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
                Student Account
              </p>

              <h2 className="mt-1 truncate text-2xl font-black">
                {profile?.name || "Student"}
              </h2>

              <p className="mt-1 truncate text-sm text-orange-100">
                {profile?.email || user?.email}
              </p>

            </div>

          </div>

          <div className="mt-5 flex items-center gap-2">

            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              🎓 {profile?.course || "Student"}
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              🏫 CampusEats
            </span>

          </div>

        </section>

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {message && (
          <div className="flex items-start gap-3 rounded-3xl border border-green-100 bg-green-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-green-600">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-green-700">
                Success
              </p>

              <p className="mt-1 text-xs leading-5 text-green-600">
                {message}
              </p>
            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 p-4 shadow-sm">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-black text-red-600">
              !
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-extrabold text-red-700">
                Something went wrong
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* MONTHLY SPENDING */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="p-5">

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Spending
                </p>

                <h2 className="mt-1 text-xl font-black text-gray-900">
                  Monthly Spending
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Track your CampusEats food expenses
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                💰
              </div>

            </div>

            {/* MONTH NAVIGATION */}

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 p-2">

              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-orange-600 shadow-sm transition hover:bg-orange-100 active:scale-95"
                aria-label="Previous month"
              >
                ←
              </button>

              <div className="text-center">

                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                  Selected Month
                </p>

                <p className="mt-0.5 text-sm font-black text-gray-900">
                  {monthName}
                </p>

              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={isCurrentMonth}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-orange-600 shadow-sm transition hover:bg-orange-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next month"
              >
                →
              </button>

            </div>

            {spendingLoading ? (
              <div className="py-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-3 text-sm text-gray-500">
                  Calculating spending...
                </p>

              </div>
            ) : (
              <>

                {/* TOTAL */}

                <div className="mt-5 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center text-white shadow-lg shadow-orange-100">

                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl">
                    ₹
                  </div>

                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-orange-100">
                    Total Spent
                  </p>

                  <p className="mt-1 text-4xl font-black tracking-tight">
                    ₹{monthlySpending.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-2 text-xs text-orange-100">
                    Delivered orders only
                  </p>

                </div>

                {/* STATS */}

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                      📦
                    </div>

                    <p className="mt-2 text-2xl font-black text-gray-900">
                      {monthlyOrderCount}
                    </p>

                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Delivered Orders
                    </p>

                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                      📊
                    </div>

                    <p className="mt-2 text-2xl font-black text-gray-900">
                      ₹{averageOrder.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Average / Order
                    </p>

                  </div>

                </div>

                {monthlyOrderCount === 0 && (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      🍽️
                    </div>

                    <p className="mt-3 text-sm font-bold text-gray-700">
                      No delivered orders this month
                    </p>

                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-400">
                      Your spending will appear here after you complete an order.
                    </p>

                  </div>
                )}

              </>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* PERSONAL INFORMATION */}
        {/* ================================================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between gap-3">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Account
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Personal Information
              </h2>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setIsEditing(true);
                }}
                className="rounded-xl bg-orange-50 px-3.5 py-2.5 text-xs font-extrabold text-orange-600 transition hover:bg-orange-100 active:scale-95"
              >
                ✏️ Edit
              </button>
            )}

          </div>

          {isEditing ? (

            <div className="space-y-4">

              {/* INPUT COMPONENT STYLE */}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    setPhone(value);
                  }}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Student ID
                </label>

                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Department
                </label>

                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Course
                </label>

                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. BCA"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Hostel
                </label>

                <input
                  type="text"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Hostel 1"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Email
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3.5">

                  <span className="text-lg">
                    ✉️
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-600">
                      {profile?.email || user?.email || ""}
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Email cannot be changed here.
                    </p>
                  </div>

                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>

              </div>

            </div>

          ) : (

            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">

              <div className="flex items-center justify-between gap-4 bg-gray-50 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Name
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.name || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">👤</span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.phone || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">📱</span>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Student ID
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.studentId || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">🎓</span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Department
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.department || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">🏫</span>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Course
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.course || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">📚</span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Hostel
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {profile?.hostel || "Not provided"}
                  </p>
                </div>
                <span className="text-lg">🏠</span>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Email
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-gray-800">
                    {profile?.email ||
                      user?.email ||
                      "Not available"}
                  </p>
                </div>
                <span className="text-lg">✉️</span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Role
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold capitalize text-orange-600">
                    {profile?.role || "student"}
                  </span>
                </div>

                <span className="text-lg">🛡️</span>
              </div>

            </div>

          )}

        </section>

        {/* ================================================= */}
        {/* DELIVERY LOCATION */}
        {/* ================================================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between gap-3">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Delivery
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Delivery Location
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your saved campus delivery location
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              📍
            </div>

          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
              📍
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                Saved Location
              </p>

              <p className="mt-1 truncate text-sm font-extrabold text-gray-800">
                {deliveryLocation}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => navigate("/student")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-extrabold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98]"
          >
            Change Delivery Location
            <span>→</span>
          </button>

        </section>

        {/* ================================================= */}
        {/* QUICK ACCESS */}
        {/* ================================================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Shortcuts
            </p>

            <h2 className="mt-1 text-xl font-black text-gray-900">
              Quick Access
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() =>
                navigate("/student/orders")
              }
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:scale-[0.98]"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition group-hover:bg-orange-100">
                📦
              </div>

              <p className="mt-3 text-sm font-black text-gray-800">
                My Orders
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                View order history
              </p>

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/student/favorites")
              }
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:scale-[0.98]"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition group-hover:bg-orange-100">
                ❤️
              </div>

              <p className="mt-3 text-sm font-black text-gray-800">
                Favorites
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Saved food items
              </p>

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/student/cart")
              }
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:scale-[0.98]"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition group-hover:bg-orange-100">
                🛒
              </div>

              <p className="mt-3 text-sm font-black text-gray-800">
                My Cart
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                View your cart
              </p>

            </button>

            <button
              type="button"
              onClick={() => navigate("/student")}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:scale-[0.98]"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition group-hover:bg-orange-100">
                🍽️
              </div>

              <p className="mt-3 text-sm font-black text-gray-800">
                Browse Food
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Explore campus food
              </p>

            </button>

          </div>

        </section>

        {/* ================================================= */}
        {/* SECURITY */}
        {/* ================================================= */}

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              🔐
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Account Protection
              </p>

              <h2 className="mt-1 text-xl font-black text-gray-900">
                Security
              </h2>

            </div>

          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            className="group w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:scale-[0.99]"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                🔑
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-extrabold text-gray-800">
                  Change Password
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Receive a secure password reset link on your registered email.
                </p>

              </div>

              <span className="text-lg text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500">
                →
              </span>

            </div>

          </button>

        </section>

        {/* ================================================= */}
        {/* LOGOUT */}
        {/* ================================================= */}

        <section className="rounded-3xl border border-red-100 bg-white p-4 shadow-sm">

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-100 transition hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loggingOut ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Logging out...
              </>
            ) : (
              <>
                🚪 Logout
              </>
            )}

          </button>

          <p className="mt-3 text-center text-[11px] text-gray-400">
            You can sign in again anytime with your CampusEats account.
          </p>

        </section>

      </main>

    </div>
  );
}

export default Profile;