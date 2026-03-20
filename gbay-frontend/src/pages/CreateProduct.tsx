import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function CreateProduct() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [role, setRole] = useState("both");
  const navigate = useNavigate();
  const [saleMode, setSaleMode] = useState("direct");


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/product/create", {
      title,
      description,
      category,
      fixed_price: price,
      allowed_buyer_role: role,
  sale_mode: saleMode
    });
    navigate("/products");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Product</h2>

      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Title"
          onChange={e => setTitle(e.target.value)} required />

        <textarea className="w-full border p-2" placeholder="Description"
          onChange={e => setDescription(e.target.value)} />

        <input className="w-full border p-2" placeholder="Category"
          onChange={e => setCategory(e.target.value)} />

        <input className="w-full border p-2" placeholder="Price" type="number"
          onChange={e => setPrice(e.target.value)} required />

        <select className="w-full border p-2"
          onChange={e => setRole(e.target.value)}>
          <option value="both">Both</option>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
        </select><select onChange={e => setSaleMode(e.target.value)}>
          <option value="direct">Direct Sell</option>
          <option value="auction">Auction</option>
        </select>


        <button className="bg-black text-white w-full py-2">Add item</button>
      </form>
    </div>
  );
}
