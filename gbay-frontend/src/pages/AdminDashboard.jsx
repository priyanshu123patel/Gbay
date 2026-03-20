import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getProductImageUrl } from "../utils/urls";

function toImageList(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return [];

  return imagePath
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.startsWith("http://") || item.startsWith("https://")) {
        return item;
      }
      return getProductImageUrl(item) || "/assets/placeholder-image.png";
    });
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? "-");
  return `Rs ${num.toLocaleString("en-IN")}`;
}

const cardBase =
  "rounded-2xl border border-white/40 bg-white/85 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [auctionQuery, setAuctionQuery] = useState("");

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeListings: 0,
    totalUsers: 0,
    totalOrders: 0,
    blockedUsers: 0,
    openReports: 0
  });
  const [activity, setActivity] = useState({
    recentProducts: [],
    recentOrders: [],
    recentInterests: []
  });
  const [reportedProducts, setReportedProducts] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedAuctionBids, setSelectedAuctionBids] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        usersRes,
        productsRes,
        statsRes,
        activityRes,
        reportsRes,
        historyRes,
        auctionsRes
      ] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/products"),
        api.get("/admin/stats"),
        api.get("/admin/activity"),
        api.get("/admin/reported-products"),
        api.get("/admin/purchase-history"),
        api.get("/admin/auctions")
      ]);

      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);
      setStats(statsRes.data || {});
      setActivity(activityRes.data || { recentProducts: [], recentOrders: [], recentInterests: [] });
      setReportedProducts(reportsRes.data || []);
      setPurchaseHistory(historyRes.data || []);
      setAuctions(auctionsRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timer = setTimeout(() => setActionMessage(""), 2800);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/admin");
  };

  const handleDeleteUser = async (userId) => {
    await api.delete(`/admin/users/${userId}`);
    setUsers((prev) => prev.filter((item) => item.user_id !== userId));
    setActionMessage("User deleted successfully");
  };

  const handleBlockToggle = async (userId, isLocked) => {
    const endpoint = isLocked ? "unblock" : "block";
    await api.patch(`/admin/users/${userId}/${endpoint}`);
    setUsers((prev) =>
      prev.map((item) =>
        item.user_id === userId
          ? { ...item, is_locked: isLocked ? 0 : 1 }
          : item
      )
    );
    setActionMessage(isLocked ? "User unblocked successfully" : "User blocked successfully");
  };

  const handleRoleChange = async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    setUsers((prev) =>
      prev.map((item) => (item.user_id === userId ? { ...item, role } : item))
    );
    setActionMessage("User role updated");
  };

  const handleDisableProduct = async (productId) => {
    await api.patch(`/admin/products/${productId}/disable`);
    setProducts((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, is_sold: 1 } : item
      )
    );
    setActionMessage("Product listing disabled");
  };

  const handleEnableProduct = async (productId) => {
    await api.patch(`/admin/products/${productId}/enable`);
    setProducts((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, is_sold: 0 } : item
      )
    );
    setActionMessage("Product listing enabled");
  };

  const handleRemoveProduct = async (productId) => {
    await api.delete(`/admin/products/${productId}`);
    setProducts((prev) => prev.filter((item) => item.product_id !== productId));
    setActionMessage("Product removed successfully");
  };

  const handleViewProduct = async (productId) => {
    const res = await api.get(`/admin/products/${productId}`);
    setSelectedProduct(res.data);
  };

  const handleViewUser = async (userId) => {
    const res = await api.get(`/admin/users/${userId}`);
    setSelectedUserDetails(res.data);
  };

  const handleReportProduct = async (productId) => {
    const reason = window.prompt("Enter report reason for this product:");
    if (!reason || !reason.trim()) return;

    await api.post("/admin/reported-products", {
      product_id: productId,
      reason: reason.trim()
    });

    const reportsRes = await api.get("/admin/reported-products");
    setReportedProducts(reportsRes.data || []);
    setActionMessage("Product reported to moderation queue");
  };

  const handleWarnSeller = async (reportId) => {
    await api.post(`/admin/reported-products/${reportId}/warn-seller`);
    setReportedProducts((prev) =>
      prev.map((item) =>
        item.report_id === reportId ? { ...item, status: "warned" } : item
      )
    );
    setActionMessage("Seller warning sent");
  };

  const handleRemoveFake = async (reportId) => {
    await api.post(`/admin/reported-products/${reportId}/remove-fake`);
    setReportedProducts((prev) =>
      prev.map((item) =>
        item.report_id === reportId ? { ...item, status: "resolved" } : item
      )
    );
    await loadDashboardData();
    setActionMessage("Fake listing removed and report resolved");
  };

  const handleViewAuctionBids = async (auctionId) => {
    const res = await api.get(`/admin/auctions/${auctionId}/bids`);
    setSelectedAuctionBids(res.data);
  };

  const exportPurchaseHistory = () => {
    const headers = [
      "order_id",
      "product",
      "buyer_name",
      "buyer_email",
      "seller_name",
      "seller_email",
      "final_price",
      "order_status",
      "created_at"
    ];

    const rows = purchaseHistory.map((item) => [
      item.order_id,
      item.title,
      item.buyer_name,
      item.buyer_email,
      item.seller_name,
      item.seller_email,
      item.final_price,
      item.order_status,
      item.created_at
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `admin-purchase-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeReports = useMemo(
    () => reportedProducts.filter((item) => item.status !== "resolved"),
    [reportedProducts]
  );

  const liveAuctions = useMemo(
    () => auctions.filter((item) => item.status === "active"),
    [auctions]
  );

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (item) =>
        String(item.user_id).includes(q) ||
        String(item.username || "").toLowerCase().includes(q) ||
        String(item.email || "").toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (item) =>
        String(item.product_id).includes(q) ||
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.seller_name || "").toLowerCase().includes(q)
    );
  }, [products, productQuery]);

  const filteredAuctions = useMemo(() => {
    const q = auctionQuery.trim().toLowerCase();
    if (!q) return auctions;
    return auctions.filter(
      (item) =>
        String(item.auction_id).includes(q) ||
        String(item.product_id).includes(q) ||
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.seller_name || "").toLowerCase().includes(q) ||
        String(item.status || "").toLowerCase().includes(q)
    );
  }, [auctions, auctionQuery]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#fde68a_0,#fef9c3_24%,#f8fafc_45%),radial-gradient(circle_at_90%_20%,#bae6fd_0,#e0f2fe_26%,transparent_40%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-[0_12px_50px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Control Center</h1>
              <p className="mt-1 text-sm text-slate-600">Moderation, users, products, orders, and live auction intelligence.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadDashboardData}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Refresh
              </button>
              <button
                onClick={logout}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
          

          {error && <div className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</div>}
          {actionMessage && <div className="mt-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">{actionMessage}</div>}
          {loading && <div className="mt-4 rounded-xl bg-slate-100 p-4 text-slate-700">Loading admin data...</div>}
        </div>

        {!loading && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <div className={`${cardBase} bg-gradient-to-br from-amber-50 to-yellow-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Total Products</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalProducts || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-emerald-50 to-lime-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Active Listings</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.activeListings || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-sky-50 to-cyan-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Registered Users</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalUsers || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-violet-50 to-fuchsia-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Total Orders</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalOrders || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-rose-50 to-orange-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Blocked Users</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.blockedUsers || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-orange-50 to-amber-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Open Reports</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.openReports || 0}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-teal-50 to-cyan-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Live Auctions</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{liveAuctions.length}</p>
              </div>
              <div className={`${cardBase} bg-gradient-to-br from-indigo-50 to-blue-100`}>
                <p className="text-xs uppercase tracking-wide text-slate-600">Total Auctions</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{auctions.length}</p>
              </div>
            </section>

            <section className={cardBase}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Live & Historical Auctions</h2>
                <input
                  value={auctionQuery}
                  onChange={(e) => setAuctionQuery(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Search auction, product, seller, status"
                />
              </div>

              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="p-2">Auction</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Seller</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Current Price</th>
                      <th className="p-2">Bids</th>
                      <th className="p-2">Interested</th>
                      <th className="p-2">Schedule</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuctions.map((auction) => (
                      <tr key={auction.auction_id} className="border-b border-slate-100">
                        <td className="p-2 font-semibold">#{auction.auction_id}</td>
                        <td className="p-2">{auction.title} (#{auction.product_id})</td>
                        <td className="p-2">{auction.seller_name}</td>
                        <td className="p-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${auction.status === "active" ? "bg-emerald-100 text-emerald-800" : auction.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                            {auction.status}
                          </span>
                        </td>
                        <td className="p-2">{formatPrice(auction.current_price)}</td>
                        <td className="p-2">{auction.bid_count}</td>
                        <td className="p-2">{auction.interested_count}</td>
                        <td className="p-2 text-xs text-slate-600">
                          <div>Start: {formatDate(auction.start_time)}</div>
                          <div>End: {formatDate(auction.end_time)}</div>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => handleViewAuctionBids(auction.auction_id)}
                            className="rounded-lg bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-700"
                          >
                            View Bids
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardBase}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Registered Users</h2>
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Search user by id, name, email"
                />
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="p-2">ID</th>
                      <th className="p-2">Username</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="border-b border-slate-100">
                        <td className="p-2">{user.user_id}</td>
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">
                          <select
                            className="rounded-lg border px-2 py-1"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                          >
                            <option value="customer">customer</option>
                            <option value="business">business</option>
                          </select>
                        </td>
                        <td className="p-2">{user.is_locked ? "Blocked" : "Active"}</td>
                        <td className="p-2 space-x-2">
                          <button
                            onClick={() => handleViewUser(user.user_id)}
                            className="rounded-lg bg-sky-700 px-2 py-1 text-white"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleBlockToggle(user.user_id, !!user.is_locked)}
                            className="rounded-lg bg-amber-500 px-2 py-1 text-white"
                          >
                            {user.is_locked ? "Unblock" : "Block"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="rounded-lg bg-red-600 px-2 py-1 text-white"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardBase}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">All Products</h2>
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Search product by id, title, seller"
                />
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="p-2">ID</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Seller</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Listing</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.product_id} className="border-b border-slate-100">
                        <td className="p-2">{product.product_id}</td>
                        <td className="p-2">{product.title}</td>
                        <td className="p-2">{product.seller_name}</td>
                        <td className="p-2">{formatPrice(product.fixed_price)}</td>
                        <td className="p-2">{product.is_sold ? "Disabled/Inactive" : "Active"}</td>
                        <td className="p-2 space-x-2">
                          <button
                            onClick={() => handleViewProduct(product.product_id)}
                            className="rounded-lg bg-sky-600 px-2 py-1 text-white"
                          >
                            Details
                          </button>
                          <button
                            onClick={() =>
                              product.is_sold
                                ? handleEnableProduct(product.product_id)
                                : handleDisableProduct(product.product_id)
                            }
                            className="rounded-lg bg-yellow-600 px-2 py-1 text-white"
                          >
                            {product.is_sold ? "Enable" : "Disable"}
                          </button>
                          <button
                            onClick={() => handleReportProduct(product.product_id)}
                            className="rounded-lg bg-amber-700 px-2 py-1 text-white"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(product.product_id)}
                            className="rounded-lg bg-red-600 px-2 py-1 text-white"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardBase}>
              <h2 className="mb-3 text-xl font-bold text-slate-900">Reported Products</h2>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="p-2">Report ID</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Seller</th>
                      <th className="p-2">Reason</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReports.map((report) => (
                      <tr key={report.report_id} className="border-b border-slate-100">
                        <td className="p-2">{report.report_id}</td>
                        <td className="p-2">{report.title}</td>
                        <td className="p-2">{report.seller_name}</td>
                        <td className="p-2">{report.reason}</td>
                        <td className="p-2">{report.status}</td>
                        <td className="p-2 space-x-2">
                          <button
                            onClick={() => handleWarnSeller(report.report_id)}
                            className="rounded-lg bg-amber-600 px-2 py-1 text-white"
                          >
                            Warn Seller
                          </button>
                          <button
                            onClick={() => handleRemoveFake(report.report_id)}
                            className="rounded-lg bg-red-600 px-2 py-1 text-white"
                          >
                            Remove Fake
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardBase}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
                <button
                  onClick={exportPurchaseHistory}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="p-2">Order</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Buyer</th>
                      <th className="p-2">Seller</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map((order) => (
                      <tr key={order.order_id} className="border-b border-slate-100">
                        <td className="p-2">#{order.order_id}</td>
                        <td className="p-2">{order.title}</td>
                        <td className="p-2">{order.buyer_name} ({order.buyer_email})</td>
                        <td className="p-2">{order.seller_name} ({order.seller_email})</td>
                        <td className="p-2">{formatPrice(order.final_price)}</td>
                        <td className="p-2">{order.order_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className={cardBase}>
                <h3 className="mb-2 font-bold text-slate-900">Recent Product Activity</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {activity.recentProducts?.map((item) => (
                    <li key={item.product_id} className="rounded-lg bg-slate-50 p-2">
                      #{item.product_id} - {item.title}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cardBase}>
                <h3 className="mb-2 font-bold text-slate-900">Recent Order Activity</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {activity.recentOrders?.map((item) => (
                    <li key={item.order_id} className="rounded-lg bg-slate-50 p-2">
                      #{item.order_id} - {item.title} - {item.order_status}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cardBase}>
                <h3 className="mb-2 font-bold text-slate-900">Recent Marketplace Interests</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {activity.recentInterests?.map((item) => (
                    <li key={item.interest_id} className="rounded-lg bg-slate-50 p-2">
                      {item.buyer_name} offered {formatPrice(item.offered_price)} for #{item.product_id}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>

      {selectedUserDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          onClick={() => setSelectedUserDetails(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">User Details</h2>
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="rounded-lg bg-slate-700 px-3 py-1 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-800 md:grid-cols-2">
              <p><strong>ID:</strong> {selectedUserDetails.user.user_id}</p>
              <p><strong>Username:</strong> {selectedUserDetails.user.username}</p>
              <p><strong>Email:</strong> {selectedUserDetails.user.email}</p>
              <p><strong>Phone:</strong> {selectedUserDetails.user.phone || "-"}</p>
              <p><strong>Role:</strong> {selectedUserDetails.user.role}</p>
              <p><strong>Status:</strong> {selectedUserDetails.user.is_locked ? "Blocked" : "Active"}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Listed</p><p className="text-lg font-bold">{selectedUserDetails.metrics.totalListed}</p></div>
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Active Listings</p><p className="text-lg font-bold">{selectedUserDetails.metrics.activeListings}</p></div>
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Purchases</p><p className="text-lg font-bold">{selectedUserDetails.metrics.totalPurchases}</p></div>
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Sales</p><p className="text-lg font-bold">{selectedUserDetails.metrics.totalSales}</p></div>
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Total Spent</p><p className="text-lg font-bold">{formatPrice(selectedUserDetails.metrics.totalSpent)}</p></div>
              <div className="rounded bg-slate-100 p-3 text-sm"><p>Total Earned</p><p className="text-lg font-bold">{formatPrice(selectedUserDetails.metrics.totalEarned)}</p></div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg bg-slate-700 px-3 py-1 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-800">
              <p><strong>ID:</strong> {selectedProduct.product_id}</p>
              <p><strong>Title:</strong> {selectedProduct.title}</p>
              <p><strong>Description:</strong> {selectedProduct.description}</p>
              <p><strong>Category:</strong> {selectedProduct.category}</p>
              <p><strong>Seller:</strong> {selectedProduct.seller_name} ({selectedProduct.seller_email})</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {toImageList(selectedProduct.image_path).map((img) => (
                <img
                  key={img}
                  src={img}
                  alt="Product"
                  className="h-28 w-full rounded border object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedAuctionBids && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          onClick={() => setSelectedAuctionBids(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Auction Bid Leaderboard</h2>
              <button
                onClick={() => setSelectedAuctionBids(null)}
                className="rounded-lg bg-slate-700 px-3 py-1 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
              </button>
            </div>

            <p className="mb-3 text-sm text-slate-700">
              Auction #{selectedAuctionBids.auction?.auction_id} | Product: {selectedAuctionBids.auction?.title}
            </p>

            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="p-2">#</th>
                    <th className="p-2">Bidder</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Bid Amount</th>
                    <th className="p-2">Bid Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAuctionBids.bids?.map((bid, index) => (
                    <tr key={bid.bid_id} className="border-b border-slate-100">
                      <td className="p-2 font-semibold">{index + 1}</td>
                      <td className="p-2">{bid.bidder_name}</td>
                      <td className="p-2">{bid.bidder_email}</td>
                      <td className="p-2">{formatPrice(bid.bid_amount)}</td>
                      <td className="p-2">{formatDate(bid.bid_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
