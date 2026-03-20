import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("role", res.data.role);

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">gbay Login</h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Login
        </button>
      </form>
    </div>
  );
}
