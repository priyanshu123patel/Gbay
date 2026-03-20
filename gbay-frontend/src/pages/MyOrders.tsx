import { useEffect, useState } from "react";
import api from "../api/axios";

type Order = {
  order_id: number;
  title: string;
  final_price: number;
  order_status: string;
  created_at: string;
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get("/order/buyer-history")
      .then(res => setOrders(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>

      {orders.map(o => (
        <div key={o.order_id}
             className="border p-4 mb-3 rounded">
          <p className="font-semibold">{o.title}</p>
          <p>Price: ₹{o.final_price}</p>
          <p>Status: {o.order_status}</p>
        </div>
      ))}
    </div>
  );
}
