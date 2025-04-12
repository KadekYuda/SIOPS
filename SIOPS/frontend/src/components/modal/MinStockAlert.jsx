import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, X, Bell, Package, Tag } from "lucide-react";
import api from "../../service/api";

const MinStockAlert = () => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      // Access the result property as shown in the Categories component
      const categoriesData = response.data.result;
      setCategories(categoriesData);
      console.log("Categories loaded:", categoriesData); // Debug logging
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  }, []);

  useEffect(() => {
    // Fetch categories on mount
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        // Use the dedicated endpoint for low stock items
        const response = await api.get("/batch/minstock");

        if (response.data && response.data.length > 0) {
        
          // Enrich notifications with category information
          const enrichedData = response.data.map(item => {
            const categoryCode = 
              item.code_categories;
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
          setVisible(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setVisible(false);
          }, 5000);
        }
      } catch (error) {
        console.error("Error fetching low stock items:", error);
      }
    };

    // Only fetch low stock items if we have categories loaded
    if (categories.length > 0) {
      fetchLowStockItems();
    }

    // Set interval to check periodically (e.g., every hour)
    const interval = setInterval(() => {
      if (categories.length > 0) {
        fetchLowStockItems();
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [categories]);

  // Function to show notification again (for user interaction)
  const showNotification = () => {
    if (notifications.length > 0) {
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    }
  };

  // Debug function to manually check data (can trigger from a button if needed)
  const debugData = () => {
    console.log("Current categories:", categories);
    console.log("Current notifications:", notifications);
  };

  if (!visible || notifications.length === 0) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center"
        onClick={() => {
          debugData(); // Debug on click
          showNotification();
        }}
      >
        <Bell size={20} />
      </motion.button>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <motion.div 
        className="rounded-lg shadow-lg border-l-4 border-red-600 overflow-hidden"
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      >
        <div className="p-4 bg-red-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-white" size={20} />
              <h3 className="font-bold">Low Stock Alert</h3>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-white hover:text-red-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto bg-red-50">
          {notifications.slice(0, 3).map((item, index) => (
            <motion.div
              key={item.code_product || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-2 mb-2 pb-2 border-b border-red-100 last:border-0"
            >
              <Package size={16} className="text-red-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{item.name_product}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Tag size={12} className="text-red-400" />
                  <span className="text-xs font-medium text-red-700">
                    {item.category_name !== "Uncategorized"
                      ? item.category_name
                      : "Uncategorized"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="text-red-600 font-bold">{item.total_stock}</span> units 
                  {" "}
                  <span className="text-gray-500"> (min: {item.min_stock})</span>
                </p>
              </div>
            </motion.div>
          ))}
          {notifications.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 pt-2 border-t border-red-200"
            >
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                +{notifications.length - 3} more items with low stock
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MinStockAlert;