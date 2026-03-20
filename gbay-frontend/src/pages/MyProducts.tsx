import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Footer from "./Footer";
import { getProductImageUrl, getProfileImageUrl } from "../utils/urls";

type Tab = "selling" | "bought";

type ListingProduct = {
  product_id: number;
  title: string;
  description?: string;
  category?: string;
  fixed_price: number;
  sale_mode?: string;
  is_sold: number;
  created_at?: string;
  sold_at?: string;
  image_path?: string;
  buyer_name?: string;
};

type BuyerOrder = {
  order_id: number;
  product_id: number;
  title: string;
  description?: string;
  final_price: number;
  order_status: string;
  created_at: string;
  image_path?: string;
  category?: string;
  sale_mode?: string;
  seller_name?: string;
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  completed: "bg-blue-100 text-blue-700",
};

function formatMoney(value: number) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function MyProducts() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("username")?.charAt(0).toUpperCase();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("selling");
  const [open, setOpen] = useState(false);

  const [listings, setListings] = useState<ListingProduct[]>([]);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listingQuery, setListingQuery] = useState("");
  const [listingStatus, setListingStatus] = useState("all");
  const [listingSort, setListingSort] = useState("newest");

  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderSort, setOrderSort] = useState("newest");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myProductsRes, buyerOrdersRes] = await Promise.all([
        api.get("/product/my-products"),
        api.get("/order/buyer-history"),
      ]);

      setListings(myProductsRes.data || []);
      setOrders(buyerOrdersRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load your history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredListings = useMemo(() => {
    const q = listingQuery.trim().toLowerCase();
    let list = listings.slice();

    if (listingStatus === "selling") list = list.filter((p) => p.is_sold === 0);
    if (listingStatus === "sold") list = list.filter((p) => p.is_sold === 1);

    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          String(p.fixed_price).includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    if (listingSort === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    if (listingSort === "oldest") {
      list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    }
    if (listingSort === "price-asc") list.sort((a, b) => a.fixed_price - b.fixed_price);
    if (listingSort === "price-desc") list.sort((a, b) => b.fixed_price - a.fixed_price);

    return list;
  }, [listings, listingQuery, listingStatus, listingSort]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    let list = orders.slice();

    if (orderStatus !== "all") {
      list = list.filter((o) => (o.order_status || "").toLowerCase() === orderStatus.toLowerCase());
    }

    if (q) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.seller_name || "").toLowerCase().includes(q) ||
          String(o.final_price).includes(q)
      );
    }

    if (orderSort === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    if (orderSort === "oldest") {
      list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    }
    if (orderSort === "price-asc") list.sort((a, b) => a.final_price - b.final_price);
    if (orderSort === "price-desc") list.sort((a, b) => b.final_price - a.final_price);

    return list;
  }, [orders, orderQuery, orderStatus, orderSort]);

  const currentCollection = activeTab === "selling" ? filteredListings : filteredOrders;
  const totalPages = Math.max(1, Math.ceil(currentCollection.length / pageSize));
  const pageItems = currentCollection.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, listingQuery, listingStatus, listingSort, orderQuery, orderStatus, orderSort]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const copyLink = (id: number) => {
    const url = `${window.location.origin}/product/${id}`;
    navigator.clipboard?.writeText(url);
    alert("Product link copied to clipboard");
  };

  return (
    <>
      <header
        id="hea"
        className="fixed top-0 left-0 w-full z-50 bg-slate-100/30 backdrop-blur-sm border-b border-white/20"
      >
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            <img src="/assets/logo.png" alt="Logo" className="ml-2 w-32 h-12" />
          </h1>
          <div className="flex justify-between items-center text-2xl font-semibold text-gray-800 tracking-wide">
            A Full-Stack E-Commerce & Auction Management System
          </div>
          <div ref={menuRef} className="relative inline-block">
            <div
              onClick={() => setOpen((prev) => !prev)}
              className="bg-slate-400 h-10 w-10 overflow-hidden flex items-center justify-center mr-5 border-2 border-blue-500 rounded-full font-medium cursor-pointer select-none"
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                userName
              )}
            </div>

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

      <div className="mt-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">My Products</h2>
          <button onClick={loadData} className="border px-3 py-1 rounded">
            Refresh
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-2 inline-flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("selling")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "selling" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-700 hover:bg-indigo-50"
            }`}
          >
            Items On Sell ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bought")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "bought" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-700 hover:bg-indigo-50"
            }`}
          >
            Bought Items ({orders.length})
          </button>
        </div>

        {activeTab === "selling" ? (
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Search listed items by title, category or price..."
              value={listingQuery}
              onChange={(e) => setListingQuery(e.target.value)}
            />

            <select
              value={listingStatus}
              onChange={(e) => setListingStatus(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="all">All</option>
              <option value="selling">On Sell</option>
              <option value="sold">Sold</option>
            </select>

            <select
              value={listingSort}
              onChange={(e) => setListingSort(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Search bought items by title, seller or price..."
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
            />

            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={orderSort}
              onChange={(e) => setOrderSort(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        )}

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {!loading && pageItems.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No items found</h3>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "selling" &&
            (pageItems as ListingProduct[]).map((p) => (
              <div
                key={p.product_id}
                onClick={() => navigate(`/product/${p.product_id}`)}
                className="border rounded-xl shadow bg-white overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {p.image_path ? (
                    <img
                      src={getProductImageUrl(p.image_path) || "/assets/placeholder-image.png"}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/placeholder-image.png";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold leading-none ${
                      p.is_sold ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.is_sold ? "Sold" : "On Sell"}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1 truncate" title={p.title}>
                    {p.title}
                  </h3>

                  <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(p.fixed_price)}</p>
                  {p.created_at && (
                    <p className="text-xs text-gray-500 mt-1">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                  )}

                  {p.is_sold ? (
                    <p className="text-xs mt-1 text-red-500 font-medium pb-2 border-b border-gray-100">
                      Sold to: {p.buyer_name || "Buyer"}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/seller/product/${p.product_id}/interests`);
                      }}
                      className="flex-1 text-xs text-center font-semibold text-white bg-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      View Needs
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLink(p.product_id);
                      }}
                      className="flex-1 text-xs text-center font-semibold border border-indigo-200 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition"
                    >
                      Link
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/create-product?id=${p.product_id}`);
                      }}
                      className="flex-1 text-xs text-center font-semibold border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {activeTab === "bought" &&
            (pageItems as BuyerOrder[]).map((o) => (
              <div
                key={o.order_id}
                onClick={() => navigate(`/product/${o.product_id}`)}
                className="border rounded-xl shadow bg-white overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {o.image_path ? (
                    <img
                      src={getProductImageUrl(o.image_path) || "/assets/placeholder-image.png"}
                      alt={o.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/placeholder-image.png";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}

                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold leading-none ${
                      ORDER_STATUS_STYLE[o.order_status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.order_status}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1 truncate" title={o.title}>
                    {o.title}
                  </h3>

                  <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(o.final_price)}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{o.description || "No description"}</p>
                  <p className="text-xs text-gray-500 mt-2">Seller: {o.seller_name || "Seller"}</p>
                  <p className="text-xs text-gray-500 mt-1">Bought on: {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((s) => Math.max(1, s - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <div className="px-3 py-1">
            Page {page} / {totalPages}
          </div>

          <button
            onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <Footer />
      </div>
    </>
  );
}
