import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
// import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Products from "../pages/Products";
import Footer from "../pages/Footer";
import { getProfileImageUrl } from "../utils/urls";

export default function CreateProduct() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("username")?.charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;

    api.get("/user/me").then((res) => {
      if (!mounted) return;
      const rawPath = res.data?.profile_image;
      if (!rawPath || typeof rawPath !== "string") {
        setProfileImageUrl(null);
        return;
      }

      setProfileImageUrl(getProfileImageUrl(rawPath));
    }).catch(() => {
      if (mounted) setProfileImageUrl(null);
    });

    return () => {
      mounted = false;
    };
  }, []);
  return (
    <div className=" min-h-screen">
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
                E-Commerce & Auctions
              </div>

          <div ref={menuRef} className="relative inline-block shrink-0">
            {/* Notifications Button */}
            <div className="absolute right-0 mr-20 mt-2 cursor-pointer" onClick={() => navigate('/notifications')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

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
                  <a className="dropdown-menu" href="buy-sell-items">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z" /></svg>
                    <span>Buy / Sell item</span>
                  </a>
                  <a className="dropdown-menu" href="my-products">

                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z" /></svg>
                    <span>My Products</span>
                  </a>
                  <a className="dropdown-menu" href="auctions">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z"/></svg>
                    <span>Auctions</span>
                  </a>
                  <a className="dropdown-menu" href="profile">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z" /></svg>
                    <span>Profile</span>
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
      <main className="bg-slate-100 mt-10">
        <Products />
      </main>

      <Footer />
    </div>
  );
}