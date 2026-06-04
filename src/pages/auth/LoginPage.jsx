import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../../config/authConfig";

import SwiftLogo from "../../assets/logo/IndefLogo.png";
import BgImage from "../../assets/images/it-hepdesk-front.jpg";
import BgImage1 from "../../assets/images/it-hep-desk-bg.jpg";
import { API_BASE_URL, AUTH_TOKEN } from "../../config/env";

// Initialize the MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);
// Make sure instance is initialized before using
let msalInitPromise = msalInstance.initialize();

/* ── UI Design System Tokens ─────────────────────────────────────── */
const ACCENT = "#5789A0";
const TEXT_MAIN = "#111111";
const TEXT_SUB = "#9aa3b0";
const ERROR = "#ef4444";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [statusText, setStatusText] = useState("");

  // Handle Microsoft redirect fallback handling on mount
  useEffect(() => {
    const handleRedirect = async () => {
      await msalInitPromise;
      try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          handleMicrosoftAccount(response);
        }
      } catch (err) {
        console.error("Redirect Auth Error:", err);
        setApiError("Microsoft redirect verification failed.");
      }
    };
    handleRedirect();
  }, []);

  const handleMicrosoftLogin = async () => {
    setApiError("");
    setLoading(true);
    setStatusText("Opening Microsoft Login...");

    await msalInitPromise;
    try {
      // Initiates a popup window login. (Alternative: loginRedirect)
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      await handleMicrosoftAccount(loginResponse);
    } catch (err) {
      console.error("Popup Login Failed: ", err);
      setApiError(err.message || "Microsoft authentication canceled.");
      setLoading(false);
    }
  };

  const handleMicrosoftAccount = async (authResponse) => {
    setLoading(true);
    setStatusText("Verifying corporate identity...");

    // Extract the corporate email and secure token from Microsoft's response
    const corporateEmail = authResponse.account?.username;
    const microsoftToken = authResponse.idToken;

    if (!corporateEmail) {
      setApiError("Could not retrieve your email address from Microsoft.");
      setLoading(false);
      return;
    }

    try {
      // Send the information to your .NET backend API
      const res = await fetch(`${API_BASE_URL}/ILeap/MicrosoftAuthenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_TOKEN,
        },
        body: JSON.stringify({
          email: corporateEmail,
          idToken: microsoftToken, // Passing the token allows your backend to securely verify authenticity
        }),
      });

      const data = await res.json();

      if (data.status !== "Success" || !data.data) {
        throw new Error(
          data.message ||
            "Your Microsoft account is not linked to an employee profile.",
        );
      }

      setStatusText("Configuring user profile...");
      // Save your classic payload into local sessionStorage
      sessionStorage.setItem("user", JSON.stringify(data.data));

      // Send user to their target dashboard routing structure
      navigate("/helpdesk", { replace: true });
    } catch (err) {
      setApiError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        backgroundImage: `url(${BgImage1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6,14,22,0.62)",
          backdropFilter: "blur(1px)",
        }}
      />

      <div
        className="login-card"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          width: "min(940px, 92vw)",
          height: "min(600px, 90vh)",
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* LEFT — Visual Banner */}
        <div
          className="login-image-panel"
          style={{
            flex: "0 0 48%",
            position: "relative",
            backgroundImage: `url(${BgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 24px 26px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.72))",
            }}
          />
          <h2
            style={{
              position: "relative",
              zIndex: 2,
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.3,
            }}
          >
            Helpdesk Portal
            <br />
            Integrated IT & HR Support
          </h2>
        </div>

        {/* RIGHT — Dynamic Login Core */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            padding: "28px 40px",
            boxSizing: "border-box",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <img
              src={SwiftLogo}
              alt="Logo"
              style={{ height: 80, objectFit: "contain" }}
            />
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <svg
                style={{
                  animation: "loginSpin 1s linear infinite",
                  color: ACCENT,
                }}
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" />
              </svg>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: TEXT_MAIN,
                  margin: 0,
                }}
              >
                {statusText}
              </h2>
            </div>
          ) : (
            <>
              <h1
                style={{
                  margin: "0 0 4px",
                  fontSize: 26,
                  fontWeight: 800,
                  color: TEXT_MAIN,
                  textAlign: "center",
                }}
              >
                Welcome 👋
              </h1>
              <p
                style={{
                  margin: "0 0 40px",
                  fontSize: 13,
                  color: TEXT_SUB,
                  textAlign: "center",
                }}
              >
                Access your internal IT Helpdesk environment
              </p>

              {apiError && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: "12px",
                    borderRadius: 10,
                    background: "#fef2f2",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: ERROR,
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>⚠️</span> {apiError}
                </div>
              )}

              {/* Centralized Microsoft Login CTA Button */}
              <button
                onClick={handleMicrosoftLogin}
                style={{
                  height: 50,
                  width: "100%",
                  borderRadius: 10,
                  border: "1.5px solid #d2d6dc",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Official Microsoft Square Color Grid Logo SVG */}
                <svg width="18" height="18" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Sign in with Microsoft
              </button>
            </>
          )}

          <div
            style={{ marginTop: "auto", paddingTop: 20, textAlign: "center" }}
          >
            <p style={{ fontSize: 11, color: "#9c9c9c", margin: 0 }}>
              © {new Date().getFullYear()} Indef Manufacturing Limited
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes loginSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
