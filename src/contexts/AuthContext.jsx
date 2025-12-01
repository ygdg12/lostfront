import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");
    console.log("checkAuth: Reading localStorage:", { token, userData });

    if (token && userData) {
      try {
        const decoded = jwtDecode(token);
        console.log("checkAuth: Decoded token:", decoded);
        if (decoded.exp * 1000 > Date.now()) {
          const parsedUser = JSON.parse(userData);
          console.log("checkAuth: Setting user:", parsedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.log("checkAuth: Token expired, clearing localStorage");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("checkAuth: Error processing auth data:", error.message);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      console.log("checkAuth: No token or user data found");
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    console.log("AuthContext: Added authChange listener");
    return () => {
      window.removeEventListener("authChange", checkAuth);
      console.log("AuthContext: Removed authChange listener");
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("authChange"));
    console.log("AuthContext: Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);