import { useState } from "react";
import { api } from "../services/api";
const API_URL = import.meta.env.VITE_API_URL;

function Landing({ onLogin }) {
  const [isSingingUp, setSingingUp] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSingup = async () => {
    try {
      const result = await api.register(userData);
      onLogin(result.user);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(err.message || "Failed to register.");
    }
  };

  const handleLogin = async () => {
    try {
      const result = await api.login(userData);
      onLogin(result.user);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(err.message || "Failed to login");
    }
  };

  const handleGoogleAuth = async () => {
    try{
        window.location.href = `${API_URL}/auth/google`;    
    }
    catch (err){
      setError(err.message);
      console.error(err.message || "Failed to authenticate with Google");
    }
  }

  return (
    <>
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          ⚠️ {error} <span className="dismiss">✕</span>
        </div>
      )}

      <div className="landing">
        <div className="landing-info">\
        </div>

        <div className="login-card">
          <h2>{isSingingUp ? "Sign up using" : "Log in using"}</h2>
          <div className="social-row">
            <button className="social-btn" onClick={handleGoogleAuth}>
              <svg width={20} height={20} viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Google
            </button>
            <button className="social-btn">
              <svg width={20} height={20} viewBox="0 0 128 128" id="apple">
                <path d="M97.905 67.885c.174 18.8 16.494 25.057 16.674 25.137-.138.44-2.607 8.916-8.597 17.669-5.178 7.568-10.553 15.108-19.018 15.266-8.318.152-10.993-4.934-20.504-4.934-9.508 0-12.479 4.776-20.354 5.086-8.172.31-14.395-8.185-19.616-15.724-10.668-15.424-18.821-43.585-7.874-62.594 5.438-9.44 15.158-15.417 25.707-15.571 8.024-.153 15.598 5.398 20.503 5.398 4.902 0 14.106-6.676 23.782-5.696 4.051.169 15.421 1.636 22.722 12.324-.587.365-13.566 7.921-13.425 23.639m-15.633-46.166c4.338-5.251 7.258-12.563 6.462-19.836-6.254.251-13.816 4.167-18.301 9.416-4.02 4.647-7.54 12.087-6.591 19.216 6.971.54 14.091-3.542 18.43-8.796"></path>
              </svg>
              Apple
            </button>
          </div>

          {/* <!-- Divider --> */}
          <div className="divider">
            <span>or</span>
          </div>

          <form action="/register" method="POST">
            {/* <!-- Email input --> */}
            <div className="input-group">
              <span className="input-icon">✉</span>
              <input
                type="email"
                placeholder="Email address"
                name="username"
                value={userData.username}
                onChange={handleChange}
              />
            </div>

            {/* <!-- Password input --> */}
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={userData.password}
                onChange={handleChange}
              />
            </div>

            {/* <!-- Submit button --> */}
            <button
              className="login-btn"
              type="button"
              onClick={() => {
                isSingingUp ? handleSingup() : handleLogin();
              }}
            >
              {isSingingUp ? "Sing up" : "Log In"}
            </button>
          </form>

          {/* <!-- Forgot password link --> */}
          {isSingingUp ? null : (
            <a href="#" className="forgot">
              Forgot password?
            </a>
          )}

          {/* <!-- Sign up text --> */}
          {isSingingUp ? (
            <p className="signup-text">
              Already have an account?{" "}
              <a
                onClick={() => {
                  setSingingUp(false);
                  setError(null);
                }}
              >
                Log in
              </a>
            </p>
          ) : (
            <p className="signup-text">
              Don't have an account?{" "}
              <a
                onClick={() => {
                  setSingingUp(true);
                  setError(null);
                }}
              >
                Sign up
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Landing;
