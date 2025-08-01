import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoAM1 from "../../../assets/LogoAM1.png";
import {
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  User,
  Lock,
  AlertCircle,
  Store,
  Sparkles,
  CheckCircle2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../../service/api";

const EnterprisePortalCard = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Package size={24} />,
      text: "Complete Stock Management",
      color: "from-blue-400 to-blue-600",
      description: "Track inventory with batches and expiry dates",
    },
    {
      icon: <ShoppingBag size={24} />,
      text: "Order Tracking System",
      color: "from-purple-400 to-purple-600",
      description: "Manage and monitor all purchase orders",
    },
    {
      icon: <CheckCircle2 size={24} />,
      text: "Opname Verification",
      color: "from-indigo-400 to-indigo-600",
      description: "Verify physical inventory against system data",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl shadow-black/50 w-full h-full relative overflow-hidden z-20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-lg animate-bounce"></div>

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6 shadow-lg hover:scale-105 transition-transform duration-300">
          <ShieldCheck size={40} className="text-white drop-shadow-lg" />
        </div>

        <div className="flex items-center mb-2">
          <Sparkles size={20} className="text-yellow-300 mr-2 animate-pulse" />
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            SIMSOP
          </h1>
          <Sparkles size={20} className="text-yellow-300 ml-2 animate-pulse" />
        </div>

        <p className="text-center mt-2 opacity-90 max-w-xs text-blue-100">
          Stock Inventory Management, Order Processing & Opname System
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`flex items-center transition-all duration-500 ${
              index === currentFeature ? "scale-105 opacity-100" : "opacity-70"
            }`}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${
                feature.color
              } rounded-xl flex items-center justify-center mr-4 shadow-lg transition-transform duration-300 ${
                index === currentFeature ? "scale-110 shadow-xl" : ""
              }`}
            >
              {feature.icon}
            </div>
            <div className="flex-1">
              <span className="font-medium block">{feature.text}</span>
              <span className="text-sm opacity-75 text-blue-100">
                {feature.description}
              </span>
            </div>
            {index === currentFeature && (
              <CheckCircle2
                size={20}
                className="text-green-400 animate-pulse"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-2 mb-6">
        {features.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentFeature ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="border-t border-white/20 pt-6 mt-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
          <span className="text-sm font-medium">
            System Status: Operational
          </span>
        </div>

        <p className="text-center text-sm opacity-70">
          © {new Date().getFullYear()} SIMSOP - AGIK MART. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get("/users/verify-token");
        if (response.data.user) {
          const role = response.data.user.role;
          const redirectPath =
            role === "admin" ? "/dashboardAdmin" : "/dashboard";
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        console.error("Token verification error:", error);
      }
    };
    checkAuthStatus();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/users/login", { email, password });
      if (onLoginSuccess) {
        await onLoginSuccess();
      }
      const { role } = response.data.user;
      if (role === "admin") {
        navigate("/dashboardAdmin");
      } else if (role === "staff") {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.msg || "Invalid credentials");
      } else if (error.request) {
        setError("Connection error. Please check your network.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200/30 dark:bg-purple-900/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-200/20 to-indigo-200/20 dark:from-pink-900/10 dark:to-indigo-900/10 rounded-full filter blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="md:bg-white/90 md:dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl md:shadow-none md:border-none flex flex-col md:flex-row w-[95%] max-w-6xl overflow-visible relative z-10 gap-6 md:gap-0"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 p-8 md:p-12 flex flex-col justify-center relative bg-white/90 dark:bg-gray-900/90 md:bg-transparent rounded-3xl e shadow-2xl shadow-black/50 border border-white/20 md:border-none backdrop-blur-2xl md:backdrop-blur-none z-20"
        >
          <div className="absolute top-6 right-6 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-12 w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse"></div>

          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-3">
                <Store className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-3 text-center bg-gradient-to-r from-gray-800 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent"
          >
            Welcome Back
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center text-gray-600 dark:text-gray-300 text-lg mb-8"
          >
            Login to manage inventory, orders and opname tasks
          </motion.p>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-6 relative z-10"
            onSubmit={handleLogin}
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <User size={16} className="mr-2 text-purple-600" />
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 pl-5 border-2 rounded-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm outline-none border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 dark:focus:border-purple-400"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-300 -z-10 blur focus-within:opacity-20"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <Lock size={16} className="mr-2 text-purple-600" />
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pl-5 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm outline-none border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 dark:focus:border-purple-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-300 -z-10 blur focus-within:opacity-20"></div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start animate-pulse"
              >
                <AlertCircle
                  size={20}
                  className="text-red-500 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0"
                />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} className="mr-3" />
                  <span>Login</span>
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className=" flex-1 flex flex-col justify-center items-center rounded-3xl e z-20"
        >
          <EnterprisePortalCard />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
