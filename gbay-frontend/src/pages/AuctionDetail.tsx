import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function AuctionDetail() {
  const { id } = useParams();
  const [price, setPrice] = useState("");
  const [auction, setAuction] = useState<any>(null);

  useEffect(() => {
    api.get(`/auction/${id}`).then(res => setAuction(res.data));
  }, [id]);

  const bid = async () => {
    await api.post("/auction/bid", {
      auction_id: id,
      bid_amount: price
    });
    alert("Bid placed");
  };

  if (!auction) return null;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Auction #{auction.auction_id}</h2>
      <p>Current Price: ₹{auction.current_price}</p>

      <input
        className="border p-2 mr-2"
        placeholder="Your bid"
        onChange={e => setPrice(e.target.value)}
      />
      <button onClick={bid} className="bg-black text-white px-4 py-2">
        Place Bid
      </button>
    </div>
  );
}
