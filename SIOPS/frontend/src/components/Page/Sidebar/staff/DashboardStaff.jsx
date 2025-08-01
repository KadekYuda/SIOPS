import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingBag,
  Package,
  Activity,
  AlertCircle,
  BarChart3,
  Eye,
  Target,
  CheckCircle,
} from "lucide-react";
import api from "../../../../service/api";

const DashboardStaff = () => {
  const [orders, setOrders] = useState([]);
  const [batchStock, setBatchStock] = useState([]);
  const [opnameTasks, setOpnameTasks] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [stockStats, setStockStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    expiredCount: 0,
    nearExpiryCount: 0,
    totalOrders: 0,
    pendingOpname: 0,
    completedOpname: 0,
    stockValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cardLoadingState, setCardLoadingState] = useState({
    totalProducts: true,
    lowStockCount: true,
    expiredCount: true,
    nearExpiryCount: true,
    totalOrders: true,
    pendingOpname: true,
    completedOpname: true,
    stockValue: true,
  });

  // Pagination states for stock expiry
  // We'll remove the unused state variables for pagination to improve performance

  const fetchOrderData = useCallback(async () => {
    try {
      const response = await api.get("/orders");
      const sortedOrders = response.data.sort(
        (a, b) => new Date(b.tgl_order) - new Date(a.tgl_order)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error fetching order data:", error);
      setOrders([]);
    }
  }, []);

  const fetchBatchStockData = useCallback(async () => {
    try {
      const response = await api.get("/batch/stock");
      setBatchStock(response.data.result || []);
    } catch (error) {
      console.error("Error fetching batch stock data:", error);
      setBatchStock([]);
    }
  }, []);

  const fetchOpnameData = useCallback(async () => {
    try {
      // Include all statuses by adding include_all_status=true query parameter
      const response = await api.get("/opname/tasks?include_all_status=true");
      setOpnameTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching opname data:", error);
      setOpnameTasks([]);
    }
  }, []);

  const fetchLowStockAlerts = useCallback(async () => {
    try {
      const response = await api.get("/batch/minstock");
      setLowStockAlerts(response.data || []);
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      setLowStockAlerts([]);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      setUserProfile(response.data.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);

    // Create an object to track individual card loading states
    const loadingStates = {
      totalProducts: true,
      lowStockCount: true,
      expiredCount: true,
      nearExpiryCount: true,
      totalOrders: true,
      pendingOpname: true,
      completedOpname: true,
      stockValue: true,
    };

    setCardLoadingState(loadingStates);

    try {
      // Fetch all data in parallel but handle each response independently
      // This allows us to update each card as soon as its data is available

      // Batch Stock data affects multiple cards
      fetchBatchStockData()
        .then((data) => {
          setCardLoadingState((prev) => ({
            ...prev,
            totalProducts: false,
            expiredCount: false,
            nearExpiryCount: false,
            stockValue: false,
          }));
        })
        .catch((err) => {
          console.error("Error fetching batch stock:", err);
          setCardLoadingState((prev) => ({
            ...prev,
            totalProducts: false,
            expiredCount: false,
            nearExpiryCount: false,
            stockValue: false,
          }));
        });

      // Orders data
      fetchOrderData()
        .then((data) => {
          setCardLoadingState((prev) => ({
            ...prev,
            totalOrders: false,
          }));
        })
        .catch((err) => {
          console.error("Error fetching orders:", err);
          setCardLoadingState((prev) => ({
            ...prev,
            totalOrders: false,
          }));
        });

      // Opname data
      fetchOpnameData()
        .then((data) => {
          setCardLoadingState((prev) => ({
            ...prev,
            pendingOpname: false,
            completedOpname: false,
          }));
        })
        .catch((err) => {
          console.error("Error fetching opname tasks:", err);
          setCardLoadingState((prev) => ({
            ...prev,
            pendingOpname: false,
            completedOpname: false,
          }));
        });

      // Low stock alerts
      fetchLowStockAlerts()
        .then((data) => {
          setCardLoadingState((prev) => ({
            ...prev,
            lowStockCount: false,
          }));
        })
        .catch((err) => {
          console.error("Error fetching low stock alerts:", err);
          setCardLoadingState((prev) => ({
            ...prev,
            lowStockCount: false,
          }));
        });

      // User profile is not tied to card loading
      fetchUserProfile().catch((err) => {
        console.error("Error fetching user profile:", err);
      });
    } catch (error) {
      console.error("Error initializing dashboard data fetch:", error);
      // Reset all loading states on error
      setCardLoadingState({
        totalProducts: false,
        lowStockCount: false,
        expiredCount: false,
        nearExpiryCount: false,
        totalOrders: false,
        pendingOpname: false,
        completedOpname: false,
        stockValue: false,
      });
    } finally {
      setTimeout(() => setLoading(false), 300); // Set overall loading to false after a short delay
    }
  }, [
    fetchOrderData,
    fetchBatchStockData,
    fetchOpnameData,
    fetchLowStockAlerts,
    fetchUserProfile,
  ]);

  const calculateStockStats = useCallback(() => {
    const today = new Date();

    // Use a single loop through batchStock to calculate multiple metrics
    // This is much faster than multiple filter operations
    let expiredCount = 0;
    let nearExpiryCount = 0;
    let stockValue = 0;

    // Process batch stock in a single pass for better performance
    for (const batch of batchStock) {
      // Calculate stock value in the same loop
      const quantity = parseInt(batch.stock_quantity) || 0;
      const price = parseFloat(batch.purchase_price) || 0;
      stockValue += quantity * price;

      // Check expiry dates in the same loop
      if (batch.exp_date) {
        const expDate = new Date(batch.exp_date);
        if (expDate < today) {
          expiredCount++;
        } else {
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 30) {
            nearExpiryCount++;
          }
        }
      }
    }

    // Calculate low stock count - already optimized as length property
    const lowStockCount = lowStockAlerts.length;

    // Optimize opname counting with a single pass
    let pendingOpname = 0;
    let completedOpname = 0;

    for (const task of opnameTasks) {
      if (task.status === "scheduled") {
        pendingOpname++;
      } else if (
        task.status === "submitted" ||
        task.status === "approved" ||
        task.status === "adjusted"
      ) {
        completedOpname++;
      }
    }

    // Update all stats at once
    setStockStats({
      totalProducts: batchStock.length,
      lowStockCount,
      expiredCount,
      nearExpiryCount,
      totalOrders: orders.length,
      pendingOpname,
      completedOpname,
      stockValue,
    });
  }, [batchStock, opnameTasks, lowStockAlerts, orders]);

  // Fetch data when component mounts and handle cleanup
  useEffect(() => {
    // Use AbortController for cleanup
    const controller = new AbortController();

    // Create a wrapper function for fetch to pass the signal
    const fetchWithSignal = async () => {
      try {
        await fetchAllData();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error in initial data fetch:", error);
        }
      }
    };

    // Execute fetch
    fetchWithSignal();

    // Cleanup function to cancel any pending requests when unmounting
    return () => {
      controller.abort();
    };
  }, [fetchAllData]);

  // Memoize the conditions that determine if we need to recalculate stats
  const shouldCalculateStats = useMemo(() => {
    return (
      batchStock.length > 0 ||
      opnameTasks.length > 0 ||
      lowStockAlerts.length > 0 ||
      orders.length > 0
    );
  }, [
    batchStock.length,
    opnameTasks.length,
    lowStockAlerts.length,
    orders.length,
  ]);

  // Only recalculate when relevant data changes and we have some data
  useEffect(() => {
    if (shouldCalculateStats) {
      // Use requestAnimationFrame for better performance
      const calcId = requestAnimationFrame(() => {
        calculateStockStats();
      });

      return () => cancelAnimationFrame(calcId);
    }
  }, [shouldCalculateStats, calculateStockStats]);

  // We've removed the pagination-related state variables and effects

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pt-20">
      <div className="container mx-auto">
        {/* Page Header with Personal Greeting - Fixed height to prevent CLS */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-8 min-h-[120px]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-800">
                Welcome back, {userProfile.name || "Staff"}! 👋
              </h2>
              <p className="text-gray-500">
                Stock Management, Order Tracking & Opname Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Stock Management Performance Cards - Fixed heights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg min-h-[140px]">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 opacity-90">
                  Total Batches
                </h3>
                <p className="text-3xl font-bold">
                  {cardLoadingState.totalProducts ? (
                    <span className="inline-block w-12 h-8 bg-blue-400 animate-pulse rounded"></span>
                  ) : (
                    stockStats.totalProducts
                  )}
                </p>
                <p className="text-sm opacity-80 mt-1 truncate">
                  Stock Value: Rp{" "}
                  {cardLoadingState.stockValue ? (
                    <span className="inline-block w-24 h-4 bg-blue-400 animate-pulse rounded"></span>
                  ) : (
                    stockStats.stockValue.toLocaleString()
                  )}
                </p>
              </div>
              <Package className="opacity-80 flex-shrink-0" size={48} />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg min-h-[140px]">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 opacity-90">
                  Low Stock Alerts
                </h3>
                <p className="text-3xl font-bold">
                  {cardLoadingState.lowStockCount ? (
                    <span className="inline-block w-8 h-8 bg-red-400 animate-pulse rounded"></span>
                  ) : (
                    stockStats.lowStockCount
                  )}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  Products need restocking
                </p>
              </div>
              <AlertCircle className="opacity-80 flex-shrink-0" size={48} />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg min-h-[140px]">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 opacity-90">
                  Near Expiry
                </h3>
                <p className="text-3xl font-bold">
                  {cardLoadingState.nearExpiryCount ? (
                    <span className="inline-block w-8 h-8 bg-orange-400 animate-pulse rounded"></span>
                  ) : (
                    stockStats.nearExpiryCount
                  )}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  Items expire in 30 days
                </p>
              </div>
              <Target className="opacity-80 flex-shrink-0" size={48} />
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-6 rounded-xl shadow-lg min-h-[140px]">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 opacity-90">
                  Expired Items
                </h3>
                <p className="text-3xl font-bold">
                  {cardLoadingState.expiredCount ? (
                    <span className="inline-block w-8 h-8 bg-gray-400 animate-pulse rounded"></span>
                  ) : (
                    stockStats.expiredCount
                  )}
                </p>
                <p className="text-sm opacity-80 mt-1">Items already expired</p>
              </div>
              <Activity className="opacity-80 flex-shrink-0" size={48} />
            </div>
          </div>
        </div>

        {/* Additional Stock Management Metrics - Fixed heights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md min-h-[80px]">
            <div className="flex items-center h-full">
              <CheckCircle
                className="text-green-500 mr-3 flex-shrink-0"
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  Completed Opname
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {cardLoadingState.completedOpname ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stockStats.completedOpname
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md min-h-[80px]">
            <div className="flex items-center h-full">
              <Eye className="text-blue-500 mr-3 flex-shrink-0" size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">Pending Opname</p>
                <p className="text-xl font-bold text-gray-800">
                  {cardLoadingState.pendingOpname ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stockStats.pendingOpname
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md min-h-[80px]">
            <div className="flex items-center h-full">
              <ShoppingBag
                className="text-purple-500 mr-3 flex-shrink-0"
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">Total Orders</p>
                <p className="text-xl font-bold text-gray-800">
                  {cardLoadingState.totalOrders ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    stockStats.totalOrders
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md min-h-[80px]">
            <div className="flex items-center h-full">
              <BarChart3
                className="text-indigo-500 mr-3 flex-shrink-0"
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">Stock Status</p>
                <p className="text-xl font-bold text-gray-800">
                  {cardLoadingState.expiredCount ||
                  cardLoadingState.lowStockCount ? (
                    <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    // Use a more efficient way to calculate status
                    (() => {
                      const { expiredCount, lowStockCount } = stockStats;
                      if (expiredCount === 0 && lowStockCount === 0)
                        return "Good";
                      if (expiredCount > 5 || lowStockCount > 5)
                        return "Critical";
                      return "Warning";
                    })()
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStaff;
