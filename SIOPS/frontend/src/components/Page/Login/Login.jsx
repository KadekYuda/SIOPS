import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo2 from "../../../assets/Logo2.png";
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import api from "../../../service/api";

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      
      const response = await api.post('/users/login', {
        email,
        password
      },);
  
      console.log("Login successful:", response.data);
      
      // Panggil callback untuk memperbarui state user di AppRoutes
      if (onLoginSuccess) {
        await onLoginSuccess();
      }
  
      // Ambil role dari response
      const { role } = response.data.user;
      console.log("User role:", role);
      console.log("Cookies after login:", document.cookie);
  
      // Redirect berdasarkan role
      if (role === 'admin') {
        console.log("Redirecting to DashboardAdmin...");
        navigate('/dashboardAdmin');
      } else if (role === 'staff') {
        console.log("Redirecting to Dashboard...");
        navigate('/dashboard');
      }
  
    } catch (error) {
      if (error.response) {
        console.log("Error response from backend:", error.response);
        setError(error.response.data.msg || "An error occurred on the server");
      } else if (error.request) {
        console.log("Error request (no response from server):", error.request);
        setError("No response from server");
      } else {
        console.log("Error setting up the request:", error.message);
        setError("Error setting up the request");
      }
      console.error("Login error:", error);
      console.error("Login error:", error);
    }
  };
  
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-800 relative">
      <div className="bg-white dark:bg-gray-100 rounded-[30px] shadow-lg flex flex-col md:flex-row w-[90%] max-w-[900px] h-auto md:h-[500px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -200 }}
          className="flex-1 bg-white dark:bg-gray-100 p-6 md:p-10 flex flex-col justify-center"
        >
          <img src={Logo2} alt="Logo" className="h-20 w-20 md:h-28 md:w-32 mx-auto" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 mx-auto">
            {isLogin ? 'Login' : 'Reset Password'}
          </h2>

          <form className="space-y-4" onSubmit={handleLogin}>
            {isLogin ? (
              <>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  value={email}
                  autoComplete='username'
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    autoComplete='current-password'
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 dark:bg-gradient-to-br dark:from-purple-800 dark:to-blue-900 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Enter your Email to reset password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 dark:bg-gradient-to-br dark:from-purple-800 dark:to-blue-900 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                >
                  Reset Password
                </button>
              </>
            )}
          </form>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 200 }}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-400 dark:bg-gradient-to-br dark:from-purple-800 dark:to-blue-900 text-white p-6 md:p-10 flex flex-col justify-center items-center rounded-b-[30px] md:rounded-[150px_0_0_100px]"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {isLogin ? 'Forget Password?' : 'Back to Login'}
          </h2>
          <p className="mb-4 text-center text-sm md:text-base">
            {isLogin
              ? 'Register with your personal details to use all of the site\'s features'
              : 'Go back to login to access your account'}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="py-2 px-6 md:py-3 md:px-8 bg-white dark:bg-purple-600 text-purple-600 dark:text-white rounded-lg hover:bg-gray-100 transition duration-300"
          >
            {isLogin ? 'Reset' : 'Login'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;