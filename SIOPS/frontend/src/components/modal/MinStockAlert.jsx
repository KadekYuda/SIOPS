import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Bell, Package, Tag, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api from "../../service/api";

const MinStockAlert = () => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();
  
  // Check if current page is dashboard
  const isDashboard = location.pathname === "/dashboardAdmin" || location.pathname === "/dashboard";

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      const categoriesData = response.data.result;
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  }, []);

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    if (categories.length === 0) return;
    
    try {
      const response = await api.get("/batch/minstock");

      if (response.data && response.data.length > 0) {
        // Enrich notifications with category information
        const enrichedData = response.data.map(item => {
          const categoryCode = item.code_categories;
          const categoryInfo = categories.find(cat => 
            cat.code_categories === categoryCode || 
            cat.id === categoryCode
          );
          
          return {
            ...item,
            category_name: categoryInfo ? categoryInfo.name_categories : "Uncategorized"
          };
        });
        
        setNotifications(enrichedData);
        
        // Auto-show notification only on dashboard
        if (isDashboard && !isLoaded) {
          setVisible(true);
          setIsLoaded(true);
          
          // Auto-hide after 10 seconds
          setTimeout(() => {
            setVisible(false);
          }, 10000);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    }
  }, [categories, isDashboard, isLoaded]);

  // Initial data load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load low stock items when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      fetchLowStockItems();
    }
  }, [categories, fetchLowStockItems]);

  // Reset isLoaded flag when navigating to a different page
  useEffect(() => {
    if (!isDashboard) {
      setIsLoaded(false);
    }
  }, [location.pathname, isDashboard]);

  // Set up periodic refresh (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLowStockItems();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchLowStockItems]);

  // Function to toggle notification when bell is clicked
  const toggleNotification = () => {
    setVisible(prev => !prev);
  };

  return (
    <>
      <AnimatePresence>
        {visible && notifications.length > 0 && (
          <motion.div
            key="notification-panel"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 z-50 w-80"
          >
            <div className="rounded-lg shadow-xl overflow-hidden border border-red-300">
              <div className="p-3 bg-red-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="text-white" size={18} />
                    <h3 className="font-bold">Low Stock Alert</h3>
                  </div>
                  <button
                    onClick={() => setVisible(false)}
                    className="text-white hover:text-red-100 transition-colors"
                    aria-label="Close alert"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto bg-white">
                {notifications.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.code_product || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 border-b border-gray-100 hover:bg-red-50"
                  >
                    <div className="flex items-start">
                      <Package size={18} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name_product}</p>
                        <div className="flex items-center mt-1">
                          <Tag size={12} className="text-red-400 mr-1" />
                          <span className="text-xs font-medium text-red-700">
                            {item.category_name}
                          </span>
                        </div>
                        <p className="text-xs mt-1">
                          <span className="text-red-600 font-bold">{item.total_stock}</span>
                          {" units "}
                          <span className="text-gray-500">(min: {item.min_stock})</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {notifications.length > 3 && (
                  <Link 
                    to="/report" 
                    className="block p-3 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center justify-between text-red-600 font-medium">
                      <span>+{notifications.length - 3} more items with low stock</span>
                      <ExternalLink size={14} />
                    </div>
                  </Link>
                )}
              </div>
            </div>
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
          className={`p-3 ${notifications.length > 0 ? 'bg-red-600' : 'bg-gray-500'} text-white rounded-full shadow-lg flex items-center justify-center relative`}
          onClick={toggleNotification}
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