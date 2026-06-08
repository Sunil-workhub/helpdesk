import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../../config/authConfig";

import SwiftLogo from "../../assets/logo/IndefLogo.png";
import BgImage from "../../assets/images/it-hepdesk-front.jpg";
import BgImage1 from "../../assets/images/it-hep-desk-bg.jpg";
import { API_BASE_URL, AUTH_TOKEN } from "../../config/env";

// Force MSAL to use localStorage for cross-tab session tracking
msalConfig.cache = {
  cacheLocation: "localStorage",
  storeAuthStateInCookie: true,
};

console.log(
  "[MSAL Init] Configuring instance with localStorage synchronization rules...",
);
const msalInstance = new PublicClientApplication(msalConfig);
let msalInitPromise = msalInstance.initialize();

/* ── UI Design System Tokens ─────────────────────────────────────── */
const ACCENT = "#5789A0";
const ACCENT_DARK = "#456f82";
const TEXT_MAIN = "#111111";
const TEXT_SUB = "#9aa3b0";
const BORDER = "#e4e8ed";
const ERROR = "#ef4444";
const INPUT_FOCUS = "rgba(30, 45, 122, 0.12)";

export default function LoginPage() {
  const navigate = useNavigate();

  // Shared Core States
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [statusText, setStatusText] = useState("");

  // Toggle View State
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);

  // Traditional Credentials States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const hasTriggeredInitialCheck = useRef(false);

  useEffect(() => {
    const handleAuthWorkflow = async () => {
      console.log(
        "[Workflow Started] Waiting for msalInstance.initialize()...",
      );
      await msalInitPromise;
      console.log("[Workflow Initialized] MSAL instance ready.");

      try {
        // 1. Process redirect token parameters if returning from Microsoft authentication page
        console.log("[Step 1] Executing handleRedirectPromise()...");
        const response = await msalInstance.handleRedirectPromise();

        if (response) {
          console.log(
            "[Step 1 - Success] Active redirect hash token parsed from URL:",
            response.account?.username,
          );
          handleMicrosoftAccount(response);
          return;
        }
        console.log(
          "[Step 1 - Skip] No incoming authentication hash parsed from URL.",
        );

        // 2. Evaluate SSO automation criteria
        if (!hasTriggeredInitialCheck.current) {
          hasTriggeredInitialCheck.current = true;

          const wasExplicitLogout = sessionStorage.getItem("explicit_logout");
          console.log(
            "[Step 2] Checking execution constraints. explicit_logout flag value:",
            wasExplicitLogout,
          );

          if (wasExplicitLogout === "true") {
            console.log(
              "[Step 2 - Halt] Explicit logout detected. Shutting down auto-login to render forms.",
            );
            sessionStorage.removeItem("explicit_logout");
            setLoading(false);
          } else {
            console.log(
              "[Step 2 - Proceed] Routing user to the conditional auto-login engine...",
            );
            checkCrossTabAndAutoLogin();
          }
        }
      } catch (err) {
        console.error(
          "[Workflow Critical Error] Crash detected during redirect initialization phase:",
          err,
        );
        setApiError("Microsoft redirect verification failed.");
        setLoading(false);
      }
    };
    handleAuthWorkflow();
  }, []);

  /* ════════════════ METHOD A: MICROSOFT SSO & AUTOMATED ROUTING ════════════════ */
  const checkCrossTabAndAutoLogin = async () => {
    console.log(
      "[Auto-Login Engine] Checking local browser cache parameters...",
    );

    // Set loading spinner initially while we inspect storage profiles
    setLoading(true);
    setStatusText("Verifying corporate browser session...");

    await msalInitPromise;

    // 1. Read synchronized cross-tab profiles out of localStorage
    let activeAccounts = msalInstance.getAllAccounts();
    console.log(
      "[Auto-Login Engine] Initial accounts verification array size:",
      activeAccounts.length,
    );

    // 2. If memory is blank, force a quick check to let LocalStorage synchronization rehydrate completely
    if (activeAccounts.length === 0) {
      console.log(
        "[Auto-Login Engine] Memory array blank. Verifying raw localStorage keys...",
      );
      const keys = Object.keys(localStorage);
      const hasMsalCache = keys.some(
        (k) =>
          k.includes("msal.account.keys") || k.includes("login.windows.net"),
      );

      if (hasMsalCache) {
        console.log(
          "[Auto-Login Engine] Found structural cache signatures. Waiting for context rehydration...",
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        activeAccounts = msalInstance.getAllAccounts();
        console.log(
          "[Auto-Login Engine] Post-rehydration memory size evaluated:",
          activeAccounts.length,
        );
      }
    }

    // 3. Process Account Evaluation Blocks
    if (activeAccounts.length > 0) {
      const preferredAccount = activeAccounts[0];
      const emailAddress = preferredAccount.username || "";
      console.log(
        "[Auto-Login Engine] Discovered user cache email parameter:",
        emailAddress,
      );

      // CRITICAL FIXED RULE: Background auto-login must isolate strictly to "@indef.com" emails
      if (emailAddress.toLowerCase().endsWith("@indef.com")) {
        console.log(
          "[Auto-Login Engine - Verified] Target matches '@indef.com'. Attempting silent token fetch...",
        );
        setStatusText("Synchronizing corporate access session...");

        try {
          const silentRequest = { ...loginRequest, account: preferredAccount };
          const silentResponse =
            await msalInstance.acquireTokenSilent(silentRequest);
          console.log(
            "[Auto-Login Engine - Success] Silent token claimed securely.",
          );
          await handleMicrosoftAccount(silentResponse);
        } catch (silentError) {
          console.warn(
            "[Auto-Login Engine - Warning] Silent token acquisition failed, forwarding to interactive route:",
            silentError,
          );
          triggerAutoRedirectLogin();
        }
      } else {
        // FIXED: If the user is from another organization (not indef.com), safely drop them onto the button form view.
        console.log(
          "[Auto-Login Engine - Blocked] User does not belong to '@indef.com'. Stopping auto-login loop.",
        );
        setLoading(false);
      }
    } else {
      // FIXED: If there are absolutely 0 accounts in storage (fresh computer or session wiped),
      // DO NOT trigger the automatic redirect loop. Stop right here and let them choose their method manually.
      console.log(
        "[Auto-Login Engine - Blocked] No account context discovered in local memory. Auto-redirect cancelled.",
      );
      setLoading(false);
    }
  };

  const triggerAutoRedirectLogin = async () => {
    console.log(
      "[Auto-Redirect Triggered] Launching full-screen automated pass to Microsoft portal...",
    );
    setStatusText("Redirecting to Microsoft Secure Login...");

    await msalInitPromise;
    try {
      const autoRedirectRequest = {
        ...loginRequest,
        domainHint: "indef.com", // Forces Microsoft to check the indef.com domain context directory directly
      };
      await msalInstance.loginRedirect(autoRedirectRequest);
    } catch (err) {
      console.error(
        "[Auto-Redirect - Critical Failure] Direct navigation process crashed:",
        err,
      );
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    console.log(
      "[Manual Trigger] User explicitly clicked Microsoft login button.",
    );
    setApiError("");
    setLoading(true);
    setStatusText("Redirecting to Microsoft Secure Login...");

    await msalInitPromise;
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error(
        "[Manual Login Error] Redirection process execution crashed:",
        err,
      );
      setApiError(err.message || "Authentication redirect failed.");
      setLoading(false);
    }
  };

  const handleMicrosoftAccount = async (authResponse) => {
    console.log(
      "[API Pipeline] Preparing handshake values for backend lookups...",
    );
    setLoading(true);
    setStatusText("Verifying corporate identity...");

    const corporateEmail = authResponse.account?.username;
    const microsoftToken = authResponse.idToken;
    console.log(
      "[API Pipeline] Email extracted from token context payload:",
      corporateEmail,
    );

    if (!corporateEmail) {
      console.error("[API Pipeline - Abort] Identity string returned null.");
      setApiError("Could not retrieve your email address from Microsoft.");
      setLoading(false);
      return;
    }

    // Direct filter logic to intercept personal email addresses right at the gate
    if (
      corporateEmail.endsWith("@gmail.com") ||
      corporateEmail.endsWith("@outlook.com") ||
      corporateEmail.endsWith("@hotmail.com")
    ) {
      console.error(
        "[API Pipeline - Blocked] Intercepted unauthorized non-enterprise address structure:",
        corporateEmail,
      );
      setApiError(
        "Access Denied: Personal email accounts are unauthorized. Please use your corporate email.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ILeap/MicrosoftAuthenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_TOKEN,
        },
        body: JSON.stringify({
          email: corporateEmail,
          idToken: microsoftToken,
        }),
      });

      const data = await res.json();
      console.log(
        "[API Pipeline] Server responded with status code:",
        res.status,
      );

      if (data.status !== "Success" || !data.data) {
        console.error(
          "[API Pipeline - Failed] Backend database mapping rejected this email.",
        );
        throw new Error(
          data.message ||
            "Your Microsoft account is not linked to an active employee profile.",
        );
      }

      console.log(
        "[API Pipeline - Success] Storing user payload into sessionStorage...",
      );
      setStatusText("Configuring user profile...");
      sessionStorage.setItem("user", JSON.stringify(data.data));

      console.log(
        "[API Pipeline - Routing] Route cleared. Redirecting to layout dashboard.",
      );
      navigate("/helpdesk", { replace: true });
    } catch (err) {
      console.error("[API Pipeline - Error] Exception caught:", err.message);
      setApiError(err.message);
      setLoading(false);
    }
  };

  /* ── METHOD B: MANUAL CREDENTIALS ── */
  const validateManualForm = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    return e;
  };

  const handleCredentialLogin = async (ev) => {
    ev.preventDefault();
    console.log("[Manual Form Submitted] Running validation rules...");
    setApiError("");

    const errs = validateManualForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setStatusText("Logging in…");

    try {
      const res = await fetch(`${API_BASE_URL}/ILeap/AuthenticateHDUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_TOKEN,
        },
        body: JSON.stringify({ emp_No: username, password: password }),
      });

      const data = await res.json();

      if (data.status !== "Success") {
        throw new Error(data.message || "Invalid credentials");
      }

      sessionStorage.setItem("user", JSON.stringify(data.data));
      navigate("/helpdesk", { replace: true });
    } catch (err) {
      setApiError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
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
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* LEFT PANEL */}
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
                  "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)",
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
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              Helpdesk Portal
              <br />
              Integrated IT & HR support portal
            </h2>
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              flex: 1,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              padding: "28px 40px",
              overflowY: "auto",
              boxSizing: "border-box",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <img
                src={SwiftLogo}
                alt="Logo"
                style={{ height: 75, objectFit: "contain" }}
              />
            </div>

            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  margin: "20px 0",
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
                    margin: "0 0 30px",
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
                      marginBottom: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#fef2f2",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: ERROR,
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>⚠️</span> {apiError}
                  </div>
                )}

                {!showCredentialsForm ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
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
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f9fafb")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#ffffff")
                      }
                    >
                      <svg width="18" height="18" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M1 1h10v10H1z" />
                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                      </svg>
                      Sign in with Microsoft
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        margin: "10px 0",
                      }}
                    >
                      <div style={{ flex: 1, height: 1, background: BORDER }} />
                      <span
                        style={{
                          fontSize: 12,
                          color: TEXT_SUB,
                          fontWeight: 500,
                        }}
                      >
                        OR
                      </span>
                      <div style={{ flex: 1, height: 1, background: BORDER }} />
                    </div>

                    <button
                      onClick={() => setShowCredentialsForm(true)}
                      style={{
                        height: 50,
                        width: "100%",
                        borderRadius: 10,
                        border: "none",
                        background: ACCENT,
                        color: "#fff",
                        fontSize: 14.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "2px 4px 2px rgba(87, 137, 160, 0.2)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = ACCENT_DARK)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = ACCENT)
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Sign in with Credentials
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCredentialLogin}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                    noValidate
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errors.username)
                            setErrors((p) => ({ ...p, username: undefined }));
                        }}
                        placeholder="Username / Employee No."
                        autoComplete="username"
                        style={{
                          height: 48,
                          padding: "0 16px",
                          borderRadius: 10,
                          border: `1.5px solid ${errors.username ? ERROR : BORDER}`,
                          background: errors.username ? "#fef2f2" : "#f8f9fb",
                          fontSize: 13.5,
                          color: TEXT_MAIN,
                          outline: "none",
                          transition: "all 0.15s",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = ACCENT;
                          e.target.style.boxShadow = `0 0 0 3px ${INPUT_FOCUS}`;
                          e.target.style.background = "#fff";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.username
                            ? ERROR
                            : BORDER;
                          e.target.style.boxShadow = "none";
                          e.target.style.background = errors.username
                            ? "#fef2f2"
                            : "#f8f9fb";
                        }}
                      />
                      {errors.username && (
                        <span
                          style={{ fontSize: 11, color: ERROR, paddingLeft: 4 }}
                        >
                          {errors.username}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password)
                              setErrors((p) => ({ ...p, password: undefined }));
                          }}
                          placeholder="Password"
                          autoComplete="current-password"
                          style={{
                            height: 48,
                            padding: "0 44px 0 16px",
                            borderRadius: 10,
                            border: `1.5px solid ${errors.password ? ERROR : BORDER}`,
                            background: errors.password ? "#fef2f2" : "#f8f9fb",
                            fontSize: 13.5,
                            color: TEXT_MAIN,
                            outline: "none",
                            transition: "all 0.15s",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = ACCENT;
                            e.target.style.boxShadow = `0 0 0 3px ${INPUT_FOCUS}`;
                            e.target.style.background = "#fff";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.password
                              ? ERROR
                              : BORDER;
                            e.target.style.boxShadow = "none";
                            e.target.style.background = errors.password
                              ? "#fef2f2"
                              : "#f8f9fb";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          style={{
                            position: "absolute",
                            right: 13,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            color: TEXT_SUB,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {showPassword ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <span
                          style={{ fontSize: 11, color: ERROR, paddingLeft: 4 }}
                        >
                          {errors.password}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      style={{
                        height: 50,
                        width: "100%",
                        borderRadius: 10,
                        border: "none",
                        background: ACCENT,
                        color: "#fff",
                        fontSize: 14.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: 4,
                        boxShadow: "2px 4px 2px rgba(47, 97, 224, 0.2)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = ACCENT_DARK)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = ACCENT)
                      }
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCredentialsForm(false);
                        setErrors({});
                        setApiError("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: ACCENT,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: 10,
                        alignSelf: "center",
                        outline: "none",
                      }}
                    >
                      ← Back to Single Sign-On
                    </button>
                  </form>
                )}
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
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @media (max-width: 680px) { .login-image-panel { display: none !important; } }
      `}</style>
    </>
  );
}
