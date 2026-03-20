import { useState, useEffect } from "react";
import api from "../api/axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Auth.css";
import { googleAuthUrl } from "../utils/urls";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRightActive, setIsRightActive] = useState(false);
  const [searchParams] = useSearchParams();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      const user_id = searchParams.get("user_id");
      const username = searchParams.get("username");
      const role = searchParams.get("role");

      localStorage.setItem("token", token);
      if (user_id) localStorage.setItem("user_id", user_id);
      if (username) localStorage.setItem("username", username);
      if (role) localStorage.setItem("role", role);

      if (role === "admin" || role === "business") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [searchParams, navigate]);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // signup
  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirmPassword, setSuConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [suPhone, setSuPhone] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("username", res.data.username);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("role", res.data.role);

      const isAdminUser = res.data.role === "admin" || res.data.role === "business";

      if (isAdminRoute && !isAdminUser) {
        setLoginError("Admin access only. Please login with an admin account.");
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        return;
      }

      navigate(isAdminUser ? "/admin/dashboard" : "/dashboard");
    } catch (err: any) {
      setLoginError(err.response?.data?.message || "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError("");

    if (suPassword !== suConfirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        username: suUsername,
        email: suEmail,
        phone: suPhone,
        password: suPassword,
        role: "customer"
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("role", res.data.role);

      navigate("/dashboard");
      setIsRightActive(false);
    } catch (err: any) {
      setSignupError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-body">
      <div className="gbay-logo-wrapper">
        {/* <div className="gbay-logo">

          <div className="g-wrapper">
            <img src="/assets/earth.png" alt="Earth" className="earth-inside" />
          </div>

          <span className="g">G</span>
          <span className="b">b</span>
          <span className="a">a</span>
          <span className="y">y</span>
        </div> */}
        <h1 className="text-lg font-semibold text-gray-900">
          <img src="../assets/logo.png" alt="Logo" className=" ml-2 w-32 h-12"></img>
        </h1>
      </div>

      <div className={`container ${isRightActive ? "right-panel-active" : ""}`}>

        {/* signup */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignup}>
            <div className="title">Sign Up</div>

            {signupError && <p className="invalid">{signupError}</p>}

            <div className="input-field">
              <input type="text" required onChange={e => setSuUsername(e.target.value)} />
              <label>Username</label>
            </div>

            <div className="input-field">
              <input type="email" required onChange={e => setSuEmail(e.target.value)} />
              <label>Email</label>
            </div>

            <div className="input-field">
              <input type="text" required onChange={e => setSuPhone(e.target.value)} />
              <label>Phone</label>
            </div>

            <div className="input-field">
              <input type="password" required onChange={e => setSuPassword(e.target.value)} />
              <label>Password</label>
            </div>

            <div className="input-field">
              <input type="password" required onChange={e => setSuConfirmPassword(e.target.value)} />
              <label>Confirm Password</label>
            </div>

            <button type="submit" className="submit">Sign Up</button>
            <div className="">or</div>
            <div className="divider">
              <span>or</span>
            </div>

            <a href={googleAuthUrl} className="google-btn btn" id="google-btn">
              <img src="../public/assets/google.png" /> Continue with Google</a>

            <p className="mobile-toggle">
              Already have an account?{" "}
              <span onClick={() => setIsRightActive(false)}>Login</span>
            </p>
          </form>
        </div>

        {/* login */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <div className="title">Login</div>

            {loginError && <p className="invalid">{loginError}</p>}

            <div className="input-field">
              <input type="text" required onChange={e => setEmail(e.target.value)} />
              <label>Enter Email or Username</label>
            </div>

            <div className="input-field">
              <input type="password" required onChange={e => setPassword(e.target.value)} />
              <label>Enter Password</label>
            </div>

            <p className="forgetPass">
              <span onClick={() => navigate("/forgot-password")}>
                Forgot Password?
              </span>
            </p>

            <button type="submit" className="submit">Login</button>
            <div className="">or</div>
            <div className="divider">
              <span>or</span>
            </div>

            <a href={googleAuthUrl} className="google-btn btn" id="google-btn">
              <img src="../public/assets/google.png" /> Continue with Google</a>

            <p className="mobile-toggle">
              Don’t have an account?{" "}
              <span onClick={() => setIsRightActive(true)}>Sign Up</span>
            </p>
          </form>
        </div>

        {/* overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <div className="welcome-text" style={{ marginRight: 111 }}>Welcome Back!</div>
              <p style={{ marginRight: 111, color: "#64748b" }}>To keep connected with us please login</p>
              <button className="ghost" onClick={() => setIsRightActive(false)} style={{ marginRight: 140 }}>
                Login
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <div className="welcome-text" style={{ marginLeft: 111 }}>Hello!</div>
              <p style={{ marginLeft: 111, color: "#64748b" }}>Enter your details and start journey with us</p>
              <button className="ghost" onClick={() => setIsRightActive(true)} style={{ marginLeft: 140 }}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
