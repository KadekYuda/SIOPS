import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Bell, Package, ShoppingCart, ArrowRightCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../service/api";

const MinStockAlert = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New loading state
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current page is dashboard
  const isDashboard = location.pathname === "/dashboardAdmin" || location.pathname === "/dashboard";

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      if (response.data && response.data.result) {
        setCategories(response.data.result);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  // Fetch minimum stock alerts with category information
  const fetchMinimumStockAlerts = useCallback(async () => {
    try {
      const response = await api.get("/batch/minstock");
      if (response.data && response.data.length > 0) {
        // Enrich and sort notifications
        const enrichedData = response.data.map((item) => {
          const category = categories.find(
            (cat) => cat.code_categories === item.code_categories
          );
          return {
            ...item,
            category_name: category ? category.name_categories : "Uncategorized",
          };
        }).sort((a, b) => a.name_product.localeCompare(b.name_product));

        setNotifications(enrichedData);

        // Auto-show notification only on dashboard after data is loaded
        if (isDashboard && !isLoaded) {
          setIsOpen(true);
          setIsLoaded(true);
          setTimeout(() => setIsOpen(false), 10000);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching minimum stock alerts:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false); // Mark loading as complete
    }
  }, [categories, isDashboard, isLoaded]);

  // Check user role
  const checkUserRole = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userRole = response.data.user?.role;
      setIsAdmin(userRole === "admin");
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    }
  }, []);

  // Initial data load with batched fetching
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([checkUserRole(), fetchCategories()]);
    };
    loadInitialData();
  }, [checkUserRole, fetchCategories]);

  // Load alerts when categories are available
  useEffect(() => {
    if (categories.length > 0) {
      fetchMinimumStockAlerts();
    }
  }, [categories, fetchMinimumStockAlerts]);

  // Reset isLoaded flag when navigating to a different page
  useEffect(() => {
    if (!isDashboard) {
      setIsLoaded(false);
    }
  }, [location.pathname, isDashboard]);

  // Set up periodic refresh (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMinimumStockAlerts();
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMinimumStockAlerts]);

  // Handle restock button click
  const handleRestock = useCallback((product) => {
    const orderData = {
      code_product: product.code_product,
      name_product: product.name_product,
      category_name: product.category_name,
      sell_price: product.sell_price,
      code_categories: product.code_categories,
    };
    sessionStorage.setItem("restockProduct", JSON.stringify(orderData));
    setIsOpen(false);
    sessionStorage.setItem("openCreateOrder", "true");
    window.location.href = isAdmin ? "/orderAdmin" : "/order";
  }, [isAdmin]);

  // Handle navigation to products
  const handleProducts = useCallback(() => {
    navigate("/product");
  }, [navigate]);

  // Memoize notifications to prevent unnecessary re-renders
  const memoizedNotifications = useMemo(() => notifications, [notifications]);

  // Simplified animation variants for the modal
  const modalVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !isLoading && memoizedNotifications.length > 0 && (
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-x-4 bottom-16 md:right-4 md:left-auto md:bottom-16 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-red-200 w-full max-w-md">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-start">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-red-600 flex-shrink-0 shadow-md">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-base font-bold text-white">
                    Low Stock Alert
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs text-white font-medium">
                      {memoizedNotifications.length} product{memoizedNotifications.length !== 1 ? "s" : ""} below minimum level
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-2 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-3 max-h-64 overflow-y-auto bg-gradient-to-b from-red-50/50 to-white">
                <div className="space-y-3">
                  {memoizedNotifications.slice(0, 1000).map((item) => ( // Limit to 10 items to prevent rendering lag
                    <div
                      key={item.code_product}
                      className="flex flex-col p-3 rounded-xl border border-red-100 bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 mr-3 flex-shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 truncate">
                            {item.name_product}
                          </h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {item.category_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mt-3 px-1">
                        <div className="flex-1">
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                              <div
                                style={{ width: `${Math.min(100, (item.current_stock / item.min_stock) * 100)}%` }}
                                className="bg-red-500"
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span className="font-medium">Current: <span className="text-red-600">{item.current_stock}</span></span>
                            <span className="font-medium">Minimum: {item.min_stock}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="mt-3 px-4 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium w-full flex items-center justify-center"
                        onClick={() => handleRestock(item)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-3 flex flex-col md:flex-row md:justify-between border-t border-gray-200 space-y-2 md:space-y-0">
                <button
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-white text-sm w-full md:w-auto border border-gray-200 hover:border-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  Dismiss
                </button>
                <button
                  onClick={handleProducts}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium text-sm w-full flex items-center justify-center"
                >
                  View All Inventory
                  <ArrowRightCircle className="ml-1.5 h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell button with simplified animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-3.5 ${
            memoizedNotifications.length > 0
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-gray-500 to-gray-600"
          } text-white rounded-full shadow-lg flex items-center justify-center relative`}
          onClick={() => setIsOpen(true)}
          disabled={memoizedNotifications.length === 0}
          aria-label="Show low stock notifications"
        >
          <Bell size={22} />
          {memoizedNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-bold shadow-md border border-red-200">
              {memoizedNotifications.length}
            </span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export default MinStockAlert;