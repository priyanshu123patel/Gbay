import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Products.css";
import { getProductImageUrl } from "../utils/urls";

type Tab = "browse" | "listings" | "purchases";

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
    image_path?: string;
};

type MyProduct = {
    product_id: number;
    title: string;
    description: string;
    category: string;
    fixed_price: number;
    sale_mode: string;
    is_sold: number;
    created_at: string;
    image_path?: string;
    buyer_name?: string;
};

type BuyerOrder = {
    order_id: number;
    product_id: number;
    title: string;
    description: string;
    final_price: number;
    order_status: string;
    created_at: string;
    image_path?: string;
    category: string;
    sale_mode: string;
    seller_name: string;
};

function ProductImage({ path, alt }: { path?: string; alt: string }) {
    const src = getProductImageUrl(path);
    return src ? (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
            }}
        />
    ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No image</span>
        </div>
    );
}

const ORDER_STATUS_STYLE: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    paid:      "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
    completed: "bg-blue-100 text-blue-700",
};

export default function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<string[]>([]); const [interestedIds, setInterestedIds] = useState<Set<number>>(new Set());
    const [category, setCategory] = useState("none");

    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("none"); // none | asc | desc
    const bannedKeywords = [
        "gun", "guns", "weapon", "weapons",
        "drugs", "cocaine", "heroin",
        "arms", "pistol", "rifle", "bomb"
    ];


    function containsIllegalKeyword(text: string) {
        const lower = text.toLowerCase();
        return bannedKeywords.some(word => lower.includes(word));
    }
    const handleSearch = async () => {
        try {
            const res = await api.get("/product/search", {
                params: {
                    q: query,
                    category: category.toLowerCase(),
                    sort
                }
            });
            setProducts(res.data);
        } catch (err: any) {
            alert(err.response.data.message);
        }
    };

    const handleInterest = async (product_id: number, asking_price: number) => {
        const offer = prompt(`Enter your offer price for this item (Asking: ₹${asking_price}):`, String(asking_price));
        if (!offer) return;
        
        try {
            await api.post("/product/interest", {
                product_id,
                offered_price: Number(offer)
            });
            alert("Success! The seller will be notified of your interest.");
            setInterestedIds(prev => new Set(prev).add(product_id));
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to express interest");
        }
    };

    const filteredProducts = products
        .filter(p => !p.is_sold) // Only show unsold products
        .filter(p => {
            if ((category !== "All" && category !== "none") && p.category.toLowerCase() !== category.toLowerCase()) {
                return false;
            }

            if (!query) return true;

            const search = query.toLowerCase();

            return (
                p.title.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.fixed_price.toString().includes(search)
            );
        })
        .sort((a, b) => {
            if (sort === "asc") return a.fixed_price - b.fixed_price;
            if (sort === "desc") return b.fixed_price - a.fixed_price;
            return 0;
        });


    useEffect(() => {
        api.get("/product/list").then(res => setProducts(res.data));
        api.get("/product/my-interests").then(res => {
            const ids = new Set<number>(res.data.map((p: any) => p.product_id));
            setInterestedIds(ids);
        }).catch(() => {});
    }, []);
    useEffect(() => {
        api.get("/product/categories").then(res => {
            setCategories(res.data.map((c: any) => c.category));
        });
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Products</h2>

            <div className="flex flex-wrap gap-3 items-center mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="w-full md:w-auto flex-1 relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={category}
                        className="flex-1 md:flex-none border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="none" disabled>Select Category</option>
                        <option value="All">All Categories</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothes">Clothes</option>
                        <option value="footwear">Footwear</option>
                        <option value="antique">Antique piece</option>
                    </select>
                    
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="flex-1 md:flex-none border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                        <option value="none" disabled>Sort by price</option>
                        <option value="asc">Price: Low - High</option>
                        <option value="desc">Price: High - Low</option>
                    </select>
                </div>

                <button
                    onClick={handleSearch}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                    <div 
                        key={p.product_id} 
                        onClick={() => navigate(`/product/${p.product_id}`)}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col cursor-pointer">
                        <div className="h-48 w-full bg-gray-200 relative overflow-hidden group">
                            {/*fkbghjsdgh*/}
                           {p.image_path ? (
                               <img 
                                 src={getProductImageUrl(p.image_path) || "/assets/placeholder-image.png"}
                                 alt={p.title} 
                                 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                 onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).src = '/assets/placeholder-image.png';
                                    (e.target as HTMLImageElement).style.objectFit = 'contain';
                                 }}
                               />
                           ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                   </svg>
                                   <span className="text-sm">No image available</span>
                               </div>
                           )}
                           
                           {/* Category Badge */}
                           <div className="absolute top-2 right-2 bg-transparent backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-700 shadow-sm capitalize">
                               {p.category}
                           </div>
                           
                           {/* Sale Mode Badge */}
                           {p.sale_mode === "auction" && (
                               <div className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-semibold shadow-sm flex items-center">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                   Auction
                               </div>
                           )}
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={p.title}>{p.title}</h3>
                                <span className="font-bold text-lg text-indigo-600">₹{p.fixed_price.toLocaleString('en-IN')}</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1" title={p.description}>{p.description}</p>
                            
                            <div className="flex items-center text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <span>Seller: <b className="text-gray-700">{p.seller_name}</b></span>
                            </div>
                            
                            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                {p.seller_id === Number(localStorage.getItem('user_id')) ? (
                                    <div className="w-full flex justify-between items-center bg-orange-50 px-3 py-2 rounded">
                                        <span className="text-orange-600 text-sm font-medium flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                            </svg>
                                            Your product
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/seller/product/${p.product_id}/interests`);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold underline decoration-2 underline-offset-2 transition-colors"
                                        >
                                            View Needs
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleInterest(p.product_id, p.fixed_price);
                                        }}
                                        disabled={interestedIds.has(p.product_id)}
                                        className={`w-full flex justify-center items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            interestedIds.has(p.product_id) 
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default" 
                                            : "bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-md"
                                        }`}
                                    >
                                        {interestedIds.has(p.product_id) ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Offer Sent
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                                I'm Interested
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}