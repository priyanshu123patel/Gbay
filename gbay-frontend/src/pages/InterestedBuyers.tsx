import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

type Buyer = {
  buyer_id: number;
  username: string;
  email: string;
  offered_price: number;
  status: string;
};

export default function InterestedBuyers() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuyers();
  }, [productId]);

  const fetchBuyers = () => {
    api.get(`/product/${productId}/interests`)
      .then(res => setBuyers(res.data))
      .catch(err => console.error(err));
  };

  const handleSelectBuyer = async (buyerId: number) => {
    if (!window.confirm("Are you sure you want to sell to this buyer?")) return;
    
    setLoading(true);
    try {
      await api.post("/product/select-buyer", {
        product_id: productId,
        buyer_id: buyerId
      });
      alert("Success! The buyer has been selected and notified.");
      fetchBuyers(); // Refresh list to show updated statuses
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to select buyer");
    } finally {
      setLoading(false);
    }
  };

  const hasAccepted = buyers.some(b => b.status === "accepted");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 text-sm text-gray-500 hover:text-black flex items-center"
      >
        &larr; Back to My Products
      </button>

      <h2 className="text-3xl text-black font-bold mb-6">Interested Buyers</h2>

      {buyers.length === 0 ? (
        <div className="bg-[#2D2D2D] rounded-xl p-8 text-center text-gray-400">
          No one has expressed interest in this product yet.
        </div>
      ) : (
        <div className="space-y-4">
          {buyers.map(b => (
            <div key={b.buyer_id} className={`p-6 bg-[#2D2D2D] border rounded-xl flex justify-between items-center transition-colors ${
              b.status === "accepted" ? "border-green-500/50" : "border-gray-700 hover:border-gray-600"
            }`}>
              <div>
                <p className="text-xl font-semibold mb-1">{b.username}</p>
                <p className="text-gray-400 text-sm mb-3">Email: {b.email}</p>
                <p className="text-green-400 font-medium">Offered Price: ₹{b.offered_price}</p>
                
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                  b.status === "accepted" ? "bg-green-100 text-green-700" :
                  b.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  Status: {b.status.toUpperCase()}
                </span>
              </div>
              
              {!hasAccepted && (
                <button
                  onClick={() => handleSelectBuyer(b.buyer_id)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Sell to Buyer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
