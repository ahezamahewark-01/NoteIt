import { useState, useEffect, useCallback } from "react";
import { api, setUnauthorizedHandler } from "../services/api";
import Header from "./Header";
import Footer from "./Footer";
import Landing from "./Landing";
import Dashboard from "./Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    api
      .checkSession()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Header isLogin={user} onLogout={handleLogout} />
      {user ? <Dashboard /> : <Landing onLogin={handleLogin} />}
      <Footer />
    </>
  );
}

export default App;
