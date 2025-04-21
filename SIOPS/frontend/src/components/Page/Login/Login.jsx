import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import Logo2 from "../../../assets/Logo2.png";
import LogoAM1 from "../../../assets/LogoAM1.png";
import {
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  User,
  Lock,
  AlertCircle,
  BarChart2,
  UserCheck,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../../service/api";


const EnterprisePortalCard = () => {
  // Features list with icons and colors
  const features = [
    { 
      icon: <BarChart2 size={24} />, 
      text: "Real-time analytics dashboard",
      color: "from-blue-400 to-blue-600"
    },
    { 
      icon: <Shield size={24} />, 
      text: "Enhanced security protocols",
      color: "from-purple-400 to-purple-600" 
    },
    { 
      icon: <UserCheck size={24} />, 
      text: "Role-based access control",
      color: "from-indigo-400 to-indigo-600"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 dark:from-purple-900 dark:via-indigo-900 dark:to-blue-900 text-white p-8 rounded-3xl shadow-lg w-full">
      {/* Header with Icon */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-purple-500/30 rounded-full flex items-center justify-center backdrop-blur-sm mb-6">
          <ShieldCheck  size={36} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-center">Enterprise Portal</h1>

        <p className="text-center mt-4 opacity-90 max-w-xs">
          Access your complete business management system with enhanced
          security.
        </p>
      </div>

      {/* Feature List - Updated with the new format */}
      <div className="space-y-5 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mr-4 shadow-md`}>
              {feature.icon}
            </div>
            <span>{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 pt-4 mt-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
          <span className="text-sm">System Status: Operational</span>
        </div>

        <p className="text-center text-sm opacity-70">
          © {new Date().getFullYear()} AGIK MART. All rights reserved.
        </p>
      </div>
    </div>
  );
};
// Main Login Component
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animation completion after a delay
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
      const response = await api.post("/users/login", {
        email,
        password,
      });
      

      // Call callback to update user state in AppRoutes
      if (onLoginSuccess) {
        await onLoginSuccess();
      }

      // Get role from response
      const { role } = response.data.user;

      // Redirect based on role
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col md:flex-row w-[95%] max-w-5xl overflow-hidden"
      >
        {/* Left Column - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 p-8 md:p-12 flex flex-col justify-center relative"
        >
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200 dark:bg-purple-900/20 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>

          <div className="flex justify-center mb-6">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              src={LogoAM1}
              alt="Logo"
              className="h-20 text-black w-auto drop-shadow-md"
            />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white"
          >
            Welcome Back
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center text-gray-600 dark:text-gray-300 mb-8"
          >
            Sign in to access your dashboard
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
                <User size={16} className="mr-2" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800/50 dark:text-white bg-white/80 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
              >
                <Lock size={16} className="mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800/50 dark:text-white bg-white/80 backdrop-blur-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start"
              >
                <AlertCircle
                  size={18}
                  className="text-red-500 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0"
                />
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white rounded-xl hover:shadow-lg transition duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Right Column - Decorative */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 flex flex-col justify-center items-center relative rounded-b-3xl md:rounded-none md:rounded-r-3xl overflow-hidden"
        >
          <EnterprisePortalCard />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
