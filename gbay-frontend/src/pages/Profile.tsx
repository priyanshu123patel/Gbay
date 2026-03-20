import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { getProfileImageUrl } from "../utils/urls";

export default function Profile() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("username")?.charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const initials = (user?.username || user?.email || "U")
    .toString()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  const profileImageUrl = (() => {
    return getProfileImageUrl(user?.profile_image);
  })();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get("/user/me")
      .then((res) => {
        if (!mounted) return;
        setUser(res.data);
        setForm({
          username: res.data.username || "",
          phone: res.data.phone || "",
        });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const startEdit = () => {
    setMessage(null);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    if (user) {
      setForm({ username: user.username || "", phone: user.phone || "" });
    }
    setEditing(false);
    setError(null);
  };

  const validate = () => {
    if (!form.username || form.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    if (!/^[0-9+\-() ]{6,20}$/.test(form.phone || "")) {
      setError("Enter a valid phone number");
      return false;
    }

    return true;
  };

  const save = async () => {
    setError(null);
    setMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await api.put("/user/me", {
        username: form.username,
        phone: form.phone,
      });

      setMessage("Profile updated successfully");
      const res = await api.get("/user/me");
      setUser(res.data);
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const onChooseProfileImage = () => {
    imageInputRef.current?.click();
  };

  const onProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("profile_image", file);

    setUploadingImage(true);
    try {
      await api.put("/user/me/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const res = await api.get("/user/me");
      setUser(res.data);
      setMessage("Profile image updated successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to upload profile image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const joinedOn = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  if (loading && !user) {
    return (
      <div className="min-h-[65vh] w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-5">
          <div className="h-44 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-80 rounded-2xl bg-gray-100" />
            <div className="h-80 rounded-2xl bg-gray-100 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <header id="hea" className="fixed top-0 left-0 w-full z-50 
                 bg-slate-100/30 backdrop-blur-sm 
                 border-b border-white/20">
        <div className="max-w-full mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 shrink-0">
            <img src="/assets/logo.png" alt="Logo" className="ml-0 md:ml-2 w-24 md:w-32 h-10 md:h-12 object-contain"></img>
          </h1>

          <div className="hidden md:flex justify-center items-center text-lg md:text-2xl font-semibold text-gray-800 tracking-wide text-center mx-4">
            A Full-Stack E-Commerce & Auction Management System
          </div>
          <div className="md:hidden flex-1 text-center font-semibold text-gray-800 text-sm mx-2 line-clamp-1">
            Buy & Sell Items
          </div>
          <div ref={menuRef} className="relative inline-block shrink-0">
            {/* Profile Button */}
            <div
              onClick={() => setOpen((prev) => !prev)}
              className="bg-slate-400 h-8 w-8 md:h-10 md:w-10 overflow-hidden flex items-center justify-center mr-2 md:mr-5
                   border-2 border-blue-500 rounded-full font-medium text-sm md:text-base
                   cursor-pointer select-none"
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                userName
              )}
            </div>
            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50">
                <ul className="py-1 text-sm text-gray-700">
                  <a className="dropdown-menu" href="dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z" /></svg>
                    <span>Dashboard</span>
                  </a>
                  <a className="dropdown-menu" href="buy-sell-items">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" /></svg>
                    <span>Buy / Sell item</span>
                  </a>
                  <a className="dropdown-menu" href="my-products">

                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z" /></svg>
                    <span>My Products</span>
                  </a>
                  <a className="dropdown-menu" href="settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>
                    <span>Settings</span>
                  </a>
                  <a
                    onClick={logout}
                    className="dropdown-menu bg-red-600 text-white hover:bg-red-700 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" /></svg>
                    <span>Logout</span>
                  </a>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
    <div className=" mt-10 min-h-[65vh] w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm sm:p-8">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-200/35 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-orange-200 bg-white/80 text-xl font-bold text-orange-700 shadow-sm sm:h-20 sm:w-20 sm:text-2xl">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials || "U"}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onChooseProfileImage}
                  disabled={uploadingImage}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white shadow transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage ? "Uploading..." : "Edit Image"}
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onProfileImageChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-orange-500">
                  Account Profile
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  {user?.username || "My Profile"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your account details, contact information, and security settings.
                </p>
              </div>
            </div>

            {!editing ? (
              <button
                onClick={startEdit}
                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancel}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
            <h3 className="text-base font-bold text-gray-900">Account Snapshot</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 break-all font-medium text-gray-900">{user?.email || "N/A"}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Member Since</p>
                <p className="mt-1 font-medium text-gray-900">{joinedOn}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Verification Status</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user?.is_verified
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {user?.is_verified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {editing ? "Editing enabled" : "Read only"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  value={form.username}
                  disabled={!editing}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  value={form.phone}
                  disabled={!editing}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600"
                  value={user?.email || ""}
                  disabled
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Security</p>
              <p className="mt-1 text-sm text-blue-700">
                Keep your account safe by updating your password regularly.
              </p>
              <a
                href="/forgot-password"
                className="mt-3 inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100"
              >
                Reset or Change Password
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
