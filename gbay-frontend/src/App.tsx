import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import CreateProduct from "./pages/CreateProduct";
import InterestedBuyers from "./pages/InterestedBuyers";
import ProtectedRoute from "./components/ProtectedRoute";
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import DashboardLayout from "./layouts/DashboardLayout";
import MyProducts from "./pages/MyProducts";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgetPassword";
import "./styles/App.css";

// import Dashboard from "./pages/Dashboard";
// import Products from "./pages/Products";
// import SellerDashboard from "./pages/SellerDashboard";
// import Orders from "./pages/Orders";

// {/* <Route
//   path="/"
//   element={
//     <ProtectedRoute>
//       <DashboardLayout />
//     </ProtectedRoute>
//   }
// >
//   <Route path="dashboard" element={<Dashboard />} />
//   <Route path="products" element={<Products />} />
//   {/* <Route path="seller" element={<SellerDashboard />} /> */}
//   {/* <Route path="orders" element={<Orders />} /> */}
// </Route> */}

export default function App() {
    return (
        <><BrowserRouter>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="my-products" element={<MyProducts />} />
                    <Route path="orders" element={<MyOrders />} />
                </Route>
                {/* <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                /> */}
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/create-product"
                    element={
                        <ProtectedRoute>
                            <CreateProduct />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/seller/product/:productId/interests"
                    element={
                        <ProtectedRoute>
                            <InterestedBuyers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/auctions"
                    element={
                        <ProtectedRoute>
                            <Auctions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/auction/:id"
                    element={
                        <ProtectedRoute>
                            <AuctionDetail />
                        </ProtectedRoute>
                    }
                />

                {/* <Route
                    path="/my-products"
                    element={
                        <ProtectedRoute>
                            <MyProducts />
                        </ProtectedRoute>
                    }
                /> */}

                {/* <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <MyOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                /> */}
                <Route path="/login" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </BrowserRouter>
        </>
    );
}
