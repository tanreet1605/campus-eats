import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const userData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(userData);
    } catch (err) {
      console.error("Admin users error:", err);

      setError(
        "Unable to load users. Please check Firebase permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(searchText) ||
        user.email?.toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const getRoleStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "vendor":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "delivery":
        return "bg-green-50 text-green-700 border-green-200";

      case "student":
      case "user":
        return "bg-blue-50 text-blue-700 border-blue-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return "🛡️";

      case "vendor":
        return "🏪";

      case "delivery":
        return "🛵";

      case "student":
      case "user":
        return "🎓";

      default:
        return "👤";
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";

      case "vendor":
        return "Vendor";

      case "delivery":
        return "Delivery Staff";

      case "student":
        return "Student";

      case "user":
        return "User";

      default:
        return role || "Unknown";
    }
  };

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

  const studentCount = users.filter(
    (user) =>
      user.role === "student" ||
      user.role === "user"
  ).length;

  const vendorCount = users.filter(
    (user) => user.role === "vendor"
  ).length;

  const deliveryCount = users.filter(
    (user) => user.role === "delivery"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-4 w-80 max-w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-9 w-16 bg-gray-200 rounded mt-4" />
                <div className="h-8 w-8 bg-gray-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded mb-5" />
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-gray-200 h-96 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 transition mb-3"
              >
                <span className="text-lg">←</span>
                Back to Admin Dashboard
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center text-xl">
                  👥
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] font-bold text-orange-600">
                    CampusEats Admin
                  </p>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Users Management
                  </h1>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-2 sm:ml-14">
                Monitor students, vendors, delivery staff and administrators.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-orange-500 text-white font-bold shadow-sm hover:shadow-md transition"
            >
              <span>↻</span>
              Refresh Users
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-red-100 flex items-center justify-center">
              ⚠️
            </div>

            <div>
              <p className="font-bold text-red-800">
                Unable to load users
              </p>

              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

          <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Students / Users
                </p>

                <h2 className="text-3xl font-black text-gray-900 mt-2">
                  {studentCount}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">
                🎓
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Registered campus users
            </p>
          </div>

          <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Vendors
                </p>

                <h2 className="text-3xl font-black text-gray-900 mt-2">
                  {vendorCount}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">
                🏪
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Active food partners
            </p>
          </div>

          <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Delivery Staff
                </p>

                <h2 className="text-3xl font-black text-gray-900 mt-2">
                  {deliveryCount}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-xl">
                🛵
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Campus delivery team
            </p>
          </div>

          <div className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Administrators
                </p>

                <h2 className="text-3xl font-black text-gray-900 mt-2">
                  {adminCount}
                </h2>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-xl">
                🛡️
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Platform administrators
            </p>
          </div>

        </section>

        {/* SEARCH + FILTER */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-7">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-black text-lg">
                Find Users
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Search by name or email and filter by role.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold">
              {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* SEARCH */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Search Users
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            {/* ROLE FILTER */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Filter by Role
              </label>

              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="all">
                  All Roles
                </option>

                <option value="student">
                  Students
                </option>

                <option value="user">
                  Users
                </option>

                <option value="vendor">
                  Vendors
                </option>

                <option value="delivery">
                  Delivery Staff
                </option>

                <option value="admin">
                  Admins
                </option>
              </select>
            </div>

          </div>
        </section>

        {/* RESULTS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-orange-600">
              User Directory
            </p>

            <h2 className="text-2xl font-black text-gray-900 mt-1">
              All Users
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {users.length}
              </span>{" "}
              users
            </p>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>

                  <th className="text-left px-6 py-4 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    User
                  </th>

                  <th className="text-left px-6 py-4 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    Email
                  </th>

                  <th className="text-left px-6 py-4 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    Role
                  </th>

                  <th className="text-left px-6 py-4 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    Joined
                  </th>

                  <th className="text-left px-6 py-4 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    User ID
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredUsers.length === 0 ? (

                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto">
                        🔍
                      </div>

                      <p className="font-black text-gray-900 mt-4">
                        No users found
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Try changing your search or role filter.
                      </p>
                    </td>
                  </tr>

                ) : (

                  filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="group hover:bg-orange-50/30 transition"
                    >

                      {/* USER */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">

                          <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center font-black text-orange-600">
                            {(
                              user.name ||
                              user.email ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[220px]">
                              {user.name || "Unnamed User"}
                            </p>

                            <p className="text-xs text-gray-400 mt-0.5">
                              CampusEats Account
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-600 max-w-[260px] truncate">
                          {user.email || "No email"}
                        </p>
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getRoleStyle(
                            user.role
                          )}`}
                        >
                          <span>
                            {getRoleIcon(user.role)}
                          </span>

                          {getRoleName(user.role)}
                        </span>
                      </td>

                      {/* JOINED */}
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-gray-600">
                          {formatDate(user.createdAt)}
                        </p>
                      </td>

                      {/* USER ID */}
                      <td className="px-6 py-5">
                        <span className="inline-block max-w-[180px] truncate rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5 text-[11px] text-gray-400 font-mono">
                          {user.id}
                        </span>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4">

          {filteredUsers.length === 0 ? (

            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto">
                🔍
              </div>

              <p className="font-black text-gray-900 mt-4">
                No users found
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Try changing your search or filter.
              </p>
            </div>

          ) : (

            filteredUsers.map((user) => (

              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center font-black text-orange-600">
                      {(
                        user.name ||
                        user.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-gray-900 truncate">
                        {user.name || "Unnamed User"}
                      </h3>

                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {user.email || "No email"}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-bold ${getRoleStyle(
                      user.role
                    )}`}
                  >
                    {getRoleIcon(user.role)}
                    {getRoleName(user.role)}
                  </span>

                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 gap-3">

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400">
                        Joined
                      </p>

                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400">
                        Role
                      </p>

                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {getRoleName(user.role)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400">
                      User ID
                    </p>

                    <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mt-1 break-all">
                      {user.id}
                    </p>
                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </main>
    </div>
  );
}

export default AdminUsers;