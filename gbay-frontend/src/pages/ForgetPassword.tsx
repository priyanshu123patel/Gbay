import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    await api.post("/auth/send-otp", { phone });
    setStep(2);
  };

  const resetPassword = async () => {
    await api.post("/auth/reset-password", {
      phone,
      otp,
      newPassword: password
    });
    alert("Password reset successful");
    navigate("/login");
  };

  return (
    <div className="auth-body">
      <div className="container">
        {step === 1 && (
          <>
            <h2 className="title">Forgot Password</h2>
            <input type="text" placeholder="Mobile Number" onChange={e => setPhone(e.target.value)} />
            <button className="submit" onClick={sendOtp}>Send OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="title">Verify OTP</h2>
            <input placeholder="OTP" onChange={e => setOtp(e.target.value)} />
            <input placeholder="New Password" type="password"
                   onChange={e => setPassword(e.target.value)} />
            <button className="submit" onClick={resetPassword}>Reset Password</button>
          </>
        )}
      </div>
    </div>
  );
}
