import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowRight, X, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api from "../../service/api";

const MinStockAlert = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Check if current page is dashboard
  const isDashboard =
    location.pathname === "/dashboardAdmin" ||
    location.pathname === "/dashboard";

  // Fetch categories - using the same approach as Product.jsx
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
        // Enrich notifications with category information
        const enrichedData = response.data.map((item) => {
          const category = categories.find(
            (cat) => cat.code_categories === item.code_categories
          );
          return {
            ...item,
            category_name: category
              ? category.name_categories
              : "Uncategorized",
          };
        });

        setNotifications(enrichedData);

        // Auto-show notification only on dashboard
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

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  // Initial data load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
  const handleRestock = (product) => {
    // Store product data in sessionStorage
    const orderData = {
      code_product: product.code_product,
      name_product: product.name_product,
      category_name: product.category_name,
      sell_price: product.sell_price,
      code_categories: product.code_categories,
    };

    // Store the data and redirect
    sessionStorage.setItem("restockProduct", JSON.stringify(orderData));

    // Close modal before navigating
    setIsOpen(false);

    // Navigate based on role
    if (isAdmin) {
      sessionStorage.setItem("openCreateOrder", "true");
      window.location.href = "/orderss";
    } else {
      window.location.href = "/orders";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed right-4 bottom-16 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 w-full relative">
                {/* Header */}
                <div className="bg-red-100 p-4 flex items-start">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500 text-white flex-shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-red-800">
                      Low Stock Alert
                    </h3>
                    <p className="text-sm text-red-600">
                      {notifications.length} product
                      {notifications.length !== 1 ? "s" : ""} below minimum
                      stock level
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {notifications.map((item) => (
                      <div
                        key={item.code_product}
                        className="flex items-start p-3 rounded-lg border border-red-100 bg-red-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name_product}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.category_name}
                          </p>
                          <div className="flex items-center mt-1 text-sm">
                            <span className="text-red-600 font-medium">
                              Stock: {item.current_stock}
                            </span>
                            <ArrowRight className="h-4 w-4 mx-2 text-red-400" />
                            <span className="text-gray-700">
                              Min: {item.min_stock}
                            </span>
                          </div>
                        </div>
                        <button
                          className="ml-4 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium"
                          onClick={() => handleRestock(item)}
                        >
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 flex justify-between border-t">
                  <button
                    className="text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Dismiss
                  </button>

                  <Link to="/report">
                    <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
                      View All Inventory
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell button is always visible on all pages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`p-3 ${
            notifications.length > 0 ? "bg-red-600" : "bg-gray-500"
          } text-white rounded-full shadow-lg flex items-center justify-center relative`}
          onClick={() => setIsOpen(true)}
          disabled={notifications.length === 0}
          aria-label="Show low stock notifications"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-xs font-bold shadow-sm">
              {notifications.length}
            </span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export default MinStockAlert;
