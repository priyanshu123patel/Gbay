import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Footer from "./Footer";
import { getProductImageUrl, getProfileImageUrl } from "../utils/urls";

type Product = {
  product_id: number;
  seller_id: number;
  title: string;
  description: string;
  fixed_price: number;
  is_sold: number;
  seller_name: string;
  sale_mode: string;
  category: string;
  offered_price?: number;
  interest_status?: string;
};

export default function BuySellProduct() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
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
                  <a className="dropdown-menu" href="my-products">

                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 -960 960 960" fill="#666666"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z" /></svg>
                    <span>My Products</span>
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
      <div className="mt-10 min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
        <div className="max-w-5xl mx-auto">

          {/* Header Hero */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 mb-4 tracking-tight">
              Marketplace
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Discover amazing items from our community or list your own in seconds.
            </p>
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex justify-center mb-10 w-full px-2">
            <div className="flex w-full md:w-auto bg-slate-200/60 backdrop-blur-sm p-1.5 rounded-full shadow-inner">
              <button
                onClick={() => setActiveTab("buy")}
                className={`flex-1 md:flex-none relative flex justify-center items-center gap-2 px-4 md:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-out ${activeTab === "buy"
                  ? "bg-white text-indigo-700 shadow-md transform scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
              >
                <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Buy Items
              </button>
              <button
                onClick={() => setActiveTab("sell")}
                className={`flex-1 md:flex-none relative flex justify-center items-center gap-2 px-4 md:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-out ${activeTab === "sell"
                  ? "bg-white text-blue-700 shadow-md transform scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
              >
                <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                List an Item
              </button>
            </div>
          </div>

          {/* Content Area with simple fade-in effect simulation */}
          <div className="animate-fade-in-up">
            {activeTab === "buy" ? <BuySection /> : <SellSection />}
          </div>
        </div>

        {/* Dynamic Keyframes for simple animation */}
        <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

        <Footer />
      </div>
    </>
  );
}

function BuySection() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const myUserId = Number(localStorage.getItem('user_id') || "0");

  const removeInterest = async (product_id: number) => {
    try {
      await api.delete('/product/interest/' + product_id);
      setProducts(prev => prev.filter(p => p.product_id !== product_id));
      alert('Interest removed successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to remove interest');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/product/my-interests");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const buyableProducts = useMemo(() => {
    return products.filter(p => !p.is_sold && p.title.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-7xl flex items-center">
        <svg className="absolute left-4 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="text"
          placeholder="Search fantastic items..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyableProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">No items found</h3>
              <p className="text-slate-500 mt-1">Select interested items first.</p>
            </div>
          ) : (
            buyableProducts.map(p => (
              <div 
                key={p.product_id}
                onClick={() => navigate(`/product/${p.product_id}`)}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="h-48 w-full bg-gradient-to-br from-indigo-100 to-blue-50 relative overflow-hidden text-indigo-200 flex items-center justify-center">
                  {(p as any).image_path ? (
                    <img 
                      src={getProductImageUrl((p as any).image_path) || "/assets/placeholder-image.png"}
                      alt={p.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/placeholder-image.png'; 
                      }}
                    />
                  ) : (
                    <svg className="w-16 h-16 opacity-50 group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-slate-700 shadow-sm uppercase">
                    {p.category}
                  </div>
                  {p.sale_mode === "auction" && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm flex gap-1 items-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
                      Auction
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={p.title}>{p.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-1">{p.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Asking Price</p>
                      <p className="font-extrabold text-xl text-slate-900">{p.fixed_price}</p>
                    </div>
                    {p.interest_status && (
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.interest_status === "accepted" ? "bg-green-100 text-green-700" : p.interest_status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {p.interest_status.toUpperCase()}
                          </span>
                          <div className="text-xs text-slate-500 mt-1">Offered: {p.offered_price}</div>
                          <br/><button onClick={(e) => { e.stopPropagation(); removeInterest(p.product_id); }} className="mt-2 text-xs text-red-500 hover:text-red-700 underline">Not Interested</button>
                        </div>
                      )}
                  </div>
                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Seller: <span className="font-medium text-slate-600">{p.seller_name}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SellSection() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [role, setRole] = useState("both");
  const [saleMode, setSaleMode] = useState("direct");
  const [auctionDate, setAuctionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCategory = category === "Other" && customCategory.trim() !== "" ? customCategory : category;
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", finalCategory);
      formData.append("fixed_price", price);
      formData.append("allowed_buyer_role", role);
      formData.append("sale_mode", saleMode);
      
      if (images && images.length > 0) {
        images.forEach(img => formData.append("images", img));
      }

      const response = await api.post("/product/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const productId = response.data.product_id;

      if (saleMode === "auction") {
        await api.post("/auction/start", {
          product_id: productId,
          start_price: price,
          auction_date: auctionDate,
          start_time: startTime,
          end_time: endTime
        });
      }

      alert("🎉 Spectacular! Your item has been listed.");
      navigate("/my-products");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden md:mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-6 md:px-8 py-6 pb-1 text-white">
        <h2 className="text-2xl md:text-3xl pb-1 font-bold">List your item for sale</h2>
        <p className="text-blue-100 text-sm md:text-base mt-1">Fill out the details below to publish to the marketplace.</p>
      </div>

      <form onSubmit={submit} className="bg-slate-50 p-6 md:p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
          <input
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            placeholder="e.g. Vintage Leather Jacket"
            value={title} onChange={e => setTitle(e.target.value)} required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <textarea
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
            placeholder="Describe the condition, features, why you are selling..."
            value={description} onChange={e => setDescription(e.target.value)} required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Product Images</label>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">{images.length > 0 ? `${images.length} images selected` : "SVG, PNG, JPG or GIF"}</p>
              </div>
              <input id="dropzone-file" type="file" multiple className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Price (?)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium"></span>
              <input
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                placeholder="0" type="number" min="1"
                value={price} onChange={e => setPrice(e.target.value)} required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                value={category} onChange={e => setCategory(e.target.value)}
              >
                <option value="Electronics">Electronics</option>
                <option value="Clothes">Clothes</option>
                <option value="Footwear">Footwear</option>
                <option value="Antique piece">Antique piece</option>
                <option value="Other">Other...</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            {category === "Other" && (
              <div className="mt-3 animate-fade-in-up">
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Target Buyer</label>
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
              {['both', 'customer', 'business'].map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${role === r
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {r === 'both' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Sale Mode</label>
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSaleMode('direct')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${saleMode === 'direct'
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Direct Sell
              </button>
              <button
                type="button"
                onClick={() => setSaleMode('auction')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${saleMode === 'auction'
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
                Auction
              </button>
            </div>
          </div>
        </div>

        {saleMode === 'auction' && (
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 animate-fade-in-up mt-6 space-y-4">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
              Auction Schedule
            </h3>
            <p className="text-xs text-orange-600/80 -mt-2">The starting price will automatically be set to your product price ({price || '0'}).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auction Date</label>
                <input
                  type="date"
                  className="w-full bg-white border border-orange-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
                  value={auctionDate} onChange={e => setAuctionDate(e.target.value)} required={saleMode === 'auction'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full bg-white border border-orange-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
                  value={startTime} onChange={e => setStartTime(e.target.value)} required={saleMode === 'auction'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full bg-white border border-orange-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
                  value={endTime} onChange={e => setEndTime(e.target.value)} required={saleMode === 'auction'}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100">
          <button
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <><div className="p-5 pt-0 pb-0">List Item Now</div></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}