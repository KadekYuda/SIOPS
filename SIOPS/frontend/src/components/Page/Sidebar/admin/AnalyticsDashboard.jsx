import React, { useState, useEffect, useMemo } from "react";
import { Package, ShoppingBag, DollarSign, ClipboardList } from "lucide-react";
import api from "../../../../service/api.js";
import OrderCh from "../../../Chart/OrderCh.jsx";

const AnalyticsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [opnames, setOpnames] = useState([]);

  // Chart filter state
  const [activeChartFilter, setActiveChartFilter] = useState("orders");
  const [timeFilter, setTimeFilter] = useState("weekly");

  // Universal chart data preparation function
  const prepareChartStats = useMemo(() => {
    let dataSource = [];
    let statusField = "status";
    let dateField = "created_at";
    let valueField = "total_amount";

    // Generate time-based data based on timeFilter
    const generateTimeData = () => {
      const now = new Date();
      const periods = [];

      if (timeFilter === "daily") {
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          periods.push({
            label: date.toLocaleDateString(),
            value: i,
          });
        }
      } else if (timeFilter === "weekly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periods.push({
            label: `W${Math.ceil(date.getDate() / 7)}`,
            value: i,
          });
        }
      } else if (timeFilter === "monthly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          periods.push({
            label: date.toLocaleDateString("default", { month: "short" }),
            value: i,
          });
        }
      } else if (timeFilter === "yearly") {
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - i);
          periods.push({
            label: date.getFullYear().toString(),
            value: i,
          });
        }
      }

      // First check if data exists
      if (!dataSource || dataSource.length === 0) {
        // Return empty placeholder data with the correct labels
        return periods.map((period) => ({
          month: period.label,
          count: 0,
          value: 0,
          orders: 0,
          sales: 0,
          products: 0,
          opname: 0,
          totalValue: 0,
          amount: 0,
          isEmpty: true,
        }));
      }

      return periods.map((period) => {
        const periodData = dataSource.filter((item) => {
          // For opname data, if scheduled_date is missing, don't filter out the record
          if (activeChartFilter === "opname" && !item[dateField]) {
            // Include all records regardless of date for opname
            // This ensures all scheduled records are counted even if they don't have a date
            return true;
          }

          if (!item[dateField]) return false;

          const itemDate = new Date(item[dateField]);
          if (isNaN(itemDate.getTime())) return false; // Invalid date

          if (timeFilter === "daily") {
            const periodDate = new Date(period.label);
            if (isNaN(periodDate.getTime())) return false;
            return itemDate.toDateString() === periodDate.toDateString();
          } else if (timeFilter === "weekly") {
            const weekStart = new Date(itemDate);
            weekStart.setDate(itemDate.getDate() - itemDate.getDay());
            return (
              Math.ceil(itemDate.getDate() / 7) ===
              parseInt(period.label.replace("W", ""))
            );
          } else if (timeFilter === "monthly") {
            const currentDate = new Date();
            const targetMonth = currentDate.getMonth() - period.value;
            const targetYear = currentDate.getFullYear();

            // Handle year rollover
            const adjustedYear = targetMonth < 0 ? targetYear - 1 : targetYear;
            const adjustedMonth =
              targetMonth < 0 ? 12 + targetMonth : targetMonth;

            return (
              itemDate.getMonth() === adjustedMonth &&
              itemDate.getFullYear() === adjustedYear
            );
          } else if (timeFilter === "yearly") {
            return itemDate.getFullYear() === parseInt(period.label);
          }
          return false;
        });

        const totalValue = periodData.reduce(
          (sum, item) => sum + (parseFloat(item[valueField]) || 0),
          0
        );

        const result = {
          month: period.label,
          count: periodData.length,
          value: totalValue,
          // Add alternative field names for different data types
          orders: activeChartFilter === "orders" ? periodData.length : 0,
          sales: activeChartFilter === "sales" ? periodData.length : 0,
          products: activeChartFilter === "products" ? periodData.length : 0,
          opname: activeChartFilter === "opname" ? periodData.length : 0,
          totalValue: totalValue,
          amount: totalValue,
          isEmpty: periodData.length === 0,
        };

        // Add specific field names based on active chart filter
        if (activeChartFilter === "sales") {
          result.salesAmount = totalValue;
          result.salesCount = periodData.length;
          result.salesValue = totalValue;
        } else if (activeChartFilter === "products") {
          result.productAmount = totalValue;
          result.productCount = periodData.length;
          result.productValue = totalValue;
        } else if (activeChartFilter === "opname") {
          result.opnameAmount = totalValue;
          result.opnameCount = periodData.length;
          result.opnameValue = totalValue;
        } else if (activeChartFilter === "orders") {
          result.orderAmount = totalValue;
          result.orderCount = periodData.length;
          result.orderValue = totalValue;
        }

        // Debug individual period
        if (periodData.length > 0 && activeChartFilter === "sales") {
          console.log(`Sales period ${period.label}:`, {
            count: periodData.length,
            value: totalValue,
            sampleItems: periodData.slice(0, 2).map((item) => ({
              date: item[dateField],
              value: item[valueField],
            })),
          });
        }

        return result;
      });
    };

    // Switch data source based on active filter
    switch (activeChartFilter) {
      case "sales":
        dataSource = Array.isArray(sales) ? sales : [];
        statusField = null; // Sales don't have status field
        dateField = "sales_date";
        valueField = "total_amount";
        break;

      case "products":
        dataSource = Array.isArray(products) ? products : [];
        statusField = null; // Products don't have status field
        dateField = "created_at";
        valueField = "sell_price";
        break;

      case "orders":
        dataSource = Array.isArray(orders) ? orders : [];
        statusField = "order_status";
        dateField = "order_date";
        valueField = "total_amount";
        break;

      case "opname":
        dataSource = Array.isArray(opnames) ? opnames : [];
        statusField = "status";
        dateField = "scheduled_date"; // Use scheduled_date instead of opname_date as fallback
        valueField = "system_stock"; // Use system_stock as value since there's no total_value
        break;

      default:
        dataSource = Array.isArray(orders) ? orders : [];
        statusField = "order_status";
        dateField = "order_date";
        valueField = "total_amount";
    }

    if (!dataSource || dataSource.length === 0) {
      return {
        pendingOrders: 0,
        approvedOrders: 0,
        receivedOrders: 0,
        cancelledOrders: 0,
        pendingValue: 0,
        approvedValue: 0,
        receivedValue: 0,
        cancelledValue: 0,
        monthlyData: [],
      };
    }

    const statusCounts = { pending: 0, approved: 0, received: 0, cancelled: 0 };
    const statusValues = { pending: 0, approved: 0, received: 0, cancelled: 0 };

    // Special handling for sales - group by users instead of status
    if (activeChartFilter === "sales") {
      const userSales = {};
      const userValues = {};
      const userNames = [];

      dataSource.forEach((item) => {
        const userName = item.User?.name || item.user_name || "Unknown";
        if (!userNames.includes(userName)) {
          userNames.push(userName);
        }
        userSales[userName] = (userSales[userName] || 0) + 1;
        userValues[userName] =
          (userValues[userName] || 0) + (parseFloat(item[valueField]) || 0);
      });

      // Map users to status categories for visualization (max 4 users)
      const limitedUserNames = userNames.slice(0, 4);
      limitedUserNames.forEach((userName, index) => {
        const statusKey = ["pending", "approved", "received", "cancelled"][
          index
        ];
        statusCounts[statusKey] = userSales[userName] || 0;
        statusValues[statusKey] = userValues[userName] || 0;
      });

      return {
        pendingOrders: statusCounts.pending,
        approvedOrders: statusCounts.approved,
        receivedOrders: statusCounts.received,
        cancelledOrders: statusCounts.cancelled,
        pendingValue: statusValues.pending,
        approvedValue: statusValues.approved,
        receivedValue: statusValues.received,
        cancelledValue: statusValues.cancelled,
        // Add specific sales field names that OrderCh expects
        salesPending: statusCounts.pending,
        salesApproved: statusCounts.approved,
        salesCompleted: statusCounts.received,
        salesCancelled: statusCounts.cancelled,
        salesPendingValue: statusValues.pending,
        salesApprovedValue: statusValues.approved,
        salesCompletedValue: statusValues.received,
        salesCancelledValue: statusValues.cancelled,
        monthlyData: generateTimeData(),
        dailyData: timeFilter === "daily" ? generateTimeData() : [],
        weeklyData: timeFilter === "weekly" ? generateTimeData() : [],
        yearlyData: timeFilter === "yearly" ? generateTimeData() : [],
        userNames: limitedUserNames,
      };
    }
    // Special handling for products - group by batch stock status
    else if (activeChartFilter === "products") {
      const stockCategories = {
        lowStock: 0,
        expiringSoon: 0,
        expired: 0,
        minStock: 0,
      };
      const stockValues = {
        lowStock: 0,
        expiringSoon: 0,
        expired: 0,
        minStock: 0,
      };

      dataSource.forEach((item) => {
        const currentStock =
          item.BatchStocks?.reduce(
            (sum, batch) => sum + (batch.quantity || 0),
            0
          ) || 0;
        const minStock = item.min_stock || 0;
        const price = parseFloat(item.price) || 0;

        // Check for expired or expiring batches
        const now = new Date();
        const expiredBatches =
          item.BatchStocks?.filter((batch) => {
            const expDate = new Date(batch.exp_date);
            return expDate < now;
          }) || [];

        const expiringSoonBatches =
          item.BatchStocks?.filter((batch) => {
            const expDate = new Date(batch.exp_date);
            const daysUntilExp = (expDate - now) / (1000 * 60 * 60 * 24);
            return daysUntilExp > 0 && daysUntilExp <= 30;
          }) || [];

        if (expiredBatches.length > 0) {
          stockCategories.expired++;
          stockValues.expired += price;
        } else if (expiringSoonBatches.length > 0) {
          stockCategories.expiringSoon++;
          stockValues.expiringSoon += price;
        } else if (currentStock <= minStock) {
          stockCategories.minStock++;
          stockValues.minStock += price;
        } else if (currentStock <= minStock * 2) {
          stockCategories.lowStock++;
          stockValues.lowStock += price;
        }
      });

      return {
        pendingOrders: stockCategories.lowStock,
        approvedOrders: stockCategories.expiringSoon,
        receivedOrders: stockCategories.expired,
        cancelledOrders: stockCategories.minStock,
        pendingValue: stockValues.lowStock,
        approvedValue: stockValues.expiringSoon,
        receivedValue: stockValues.expired,
        cancelledValue: stockValues.minStock,
        // Add specific product field names that OrderCh expects
        lowStock: stockCategories.lowStock,
        expiringSoon: stockCategories.expiringSoon,
        expired: stockCategories.expired,
        minStock: stockCategories.minStock,
        lowStockValue: stockValues.lowStock,
        expiringSoonValue: stockValues.expiringSoon,
        expiredValue: stockValues.expired,
        minStockValue: stockValues.minStock,
        monthlyData: generateTimeData(),
        dailyData: timeFilter === "daily" ? generateTimeData() : [],
        weeklyData: timeFilter === "weekly" ? generateTimeData() : [],
        yearlyData: timeFilter === "yearly" ? generateTimeData() : [],
      };
    }
    // Handle orders and opname with actual status
    else {
      // Debug log for opname data before processing
      if (activeChartFilter === "opname") {
        console.log("=== Opname Data Analysis ===");
        console.log("Total opname records:", dataSource.length);
        console.log("Sample opname data:", dataSource.slice(0, 3));
        console.log(
          "Status distribution:",
          dataSource.reduce((acc, item) => {
            const status = item[statusField] || "null";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        );
        console.log("============================");
      }

      dataSource.forEach((item) => {
        const status = item[statusField];
        const value = parseFloat(item[valueField]) || 0;
        const normalizedStatus = status?.toLowerCase();

        // For opname, use original status names from database (scheduled, submitted, adjusted)
        if (activeChartFilter === "opname") {
          console.log(
            `Opname status found: "${status}" (normalized: "${normalizedStatus}")`
          );

          if (normalizedStatus === "scheduled") {
            statusCounts.pending++; // Keep "scheduled" in first position
            statusValues.pending += value;
            console.log(
              `Counted "scheduled" status. New scheduled count: ${statusCounts.pending}`
            );
          } else if (normalizedStatus === "submitted") {
            statusCounts.approved++; // Keep "submitted" in second position
            statusValues.approved += value;
            console.log(
              `Counted "submitted" status. New submitted count: ${statusCounts.approved}`
            );
          } else if (normalizedStatus === "adjusted") {
            statusCounts.received++; // Keep "adjusted" in third position
            statusValues.received += value;
            console.log(
              `Counted "adjusted" status. New adjusted count: ${statusCounts.received}`
            );
          } else if (!status || status === null || status === undefined) {
            // Handle null/undefined status - count as "scheduled" (default DB status)
            statusCounts.pending++;
            statusValues.pending += value;
            console.log(
              `Null/undefined status counted as "scheduled". New scheduled count: ${statusCounts.pending}`
            );
          } else {
            // For unknown status, use fourth position
            statusCounts.cancelled++;
            statusValues.cancelled += value;
            console.log(
              `Unknown opname status: "${status}" - counted in fourth position. New count: ${statusCounts.cancelled}`
            );
          }
        } else if (activeChartFilter === "orders") {
          // For orders, use order_status field properly
          if (normalizedStatus === "pending") {
            statusCounts.pending++;
            statusValues.pending += value;
          } else if (normalizedStatus === "approved") {
            statusCounts.approved++;
            statusValues.approved += value;
          } else if (normalizedStatus === "received") {
            statusCounts.received++;
            statusValues.received += value;
          } else if (normalizedStatus === "cancelled") {
            statusCounts.cancelled++;
            statusValues.cancelled += value;
          }
          // No default case for orders to avoid conflicts
        }
      });
    }

    // Debug log final status counts for opname
    if (activeChartFilter === "opname") {
      console.log("=== Final Opname Status Counts ===");
      console.log("pending:", statusCounts.pending);
      console.log("approved:", statusCounts.approved);
      console.log("received:", statusCounts.received);
      console.log("cancelled:", statusCounts.cancelled);
      console.log(
        "Total count:",
        statusCounts.pending +
          statusCounts.approved +
          statusCounts.received +
          statusCounts.cancelled
      );

      // Check the data filtering issue
      const timeFilteredCounts = {
        total_in_datasource: dataSource.length,
        status_in_dataSource: dataSource.reduce((acc, item) => {
          const status = item.status || "null";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        dateField_used: dateField,
        records_with_dateField: dataSource.filter((item) => item[dateField])
          .length,
        records_without_dateField: dataSource.filter((item) => !item[dateField])
          .length,
        invalid_dates: dataSource.filter((item) => {
          if (!item[dateField]) return false;
          const itemDate = new Date(item[dateField]);
          return isNaN(itemDate.getTime());
        }).length,
      };
      console.log("Time filtering analysis:", timeFilteredCounts);
      console.log("=====================================");
    }

    return {
      // For opname, use original status names to avoid confusion
      pendingOrders: statusCounts.pending,
      approvedOrders: statusCounts.approved,
      receivedOrders: statusCounts.received,
      cancelledOrders: statusCounts.cancelled,
      pendingValue: statusValues.pending,
      approvedValue: statusValues.approved,
      receivedValue: statusValues.received,
      cancelledValue: statusValues.cancelled,
      // Add fallback field names that OrderCh checks for
      pending: statusCounts.pending,
      approved: statusCounts.approved,
      received: statusCounts.received,
      cancelled: statusCounts.cancelled,
      // Add specific field names that OrderCh expects for opname
      // Use actual status names from database instead of UI labels
      scheduledOrders: statusCounts.pending, // "scheduled" status (first position)
      submittedOrders: statusCounts.approved, // "submitted" status (second position)
      adjustedOrders: statusCounts.received, // "adjusted" status (third position)
      overdueOrders: statusCounts.cancelled, // "overdue" position for any other status
      scheduledValue: statusValues.pending,
      submittedValue: statusValues.approved,
      adjustedValue: statusValues.received,
      overdueValue: statusValues.cancelled,
      monthlyData: generateTimeData(),
      dailyData: timeFilter === "daily" ? generateTimeData() : [],
      weeklyData: timeFilter === "weekly" ? generateTimeData() : [],
      yearlyData: timeFilter === "yearly" ? generateTimeData() : [],
    };
  }, [activeChartFilter, orders, sales, products, opnames, timeFilter]);

  useEffect(() => {
    fetchOrderData();
    fetchSalesData();
    fetchProductsData();
    fetchOpnameData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await api.get("/sales");
      const sortedSales = response.data.sort(
        (a, b) =>
          new Date(b.sales_date || b.created_at) -
          new Date(a.sales_date || a.created_at)
      );
      setSales(sortedSales);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSales([]);
    }
  };

  const fetchProductsData = async () => {
    try {
      const response = await api.get("/products");
      console.log("Products response:", response.data);

      const productsArray = Array.isArray(response.data)
        ? response.data
        : response.data && Array.isArray(response.data.data)
        ? response.data.data
        : [];

      const productsWithBatches = await Promise.all(
        productsArray.map(async (product) => {
          try {
            const batchResponse = await api.get(
              `/batch-stock/product/${product.code_product}`
            );
            return {
              ...product,
              BatchStocks: Array.isArray(batchResponse.data)
                ? batchResponse.data
                : [],
            };
          } catch (error) {
            return {
              ...product,
              BatchStocks: [],
            };
          }
        })
      );
      setProducts(productsWithBatches);
    } catch (error) {
      console.error("Error fetching products data:", error);
      setProducts([]);
    }
  };

  const fetchOpnameData = async () => {
    try {
      const response = await api.get("/opname/all");
      console.log("=== Raw Opname API Response ===");
      console.log("Total records:", response.data.length);
      console.log("First 5 records:", response.data.slice(0, 5));

      // Check detailed status breakdown
      const statusBreakdown = response.data.reduce((acc, item) => {
        const status = item.status || "null";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log("Status breakdown:", statusBreakdown);

      // Check if all scheduled records have date fields
      const scheduledWithDates = response.data
        .filter((item) => item.status === "scheduled")
        .filter(
          (item) =>
            item.scheduled_date !== null && item.scheduled_date !== undefined
        );

      console.log("SCHEDULED status analysis:", {
        total_scheduled: statusBreakdown["scheduled"] || 0,
        with_scheduled_date: scheduledWithDates.length,
        without_scheduled_date:
          (statusBreakdown["scheduled"] || 0) - scheduledWithDates.length,
        first_few_examples: response.data
          .filter((item) => item.status === "scheduled")
          .slice(0, 3)
          .map((item) => ({
            opname_id: item.opname_id,
            scheduled_date: item.scheduled_date,
            opname_date: item.opname_date,
            created_at: item.created_at,
            system_stock: item.system_stock,
          })),
      });

      console.log("TOTAL COUNTS BY STATUS:", {
        scheduled: response.data.filter((item) => item.status === "scheduled")
          .length,
        submitted: response.data.filter((item) => item.status === "submitted")
          .length,
        adjusted: response.data.filter((item) => item.status === "adjusted")
          .length,
        null_status: response.data.filter((item) => !item.status).length,
      });
      console.log("==============================");

      const sortedOpname = response.data.sort(
        (a, b) =>
          new Date(b.scheduled_date || b.opname_date || b.created_at) -
          new Date(a.scheduled_date || a.opname_date || a.created_at)
      );
      setOpnames(sortedOpname);
    } catch (error) {
      console.error("Error fetching opname data:", error);
      setOpnames([]);
    }
  };

  const fetchOrderData = async () => {
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
  };

  return (
    <div className="mb-8">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
            Analytics Dashboard
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm ${
                activeChartFilter === "sales"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setActiveChartFilter("sales")}
            >
              <DollarSign size={16} className="mr-2" />
              Sales
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm ${
                activeChartFilter === "products"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setActiveChartFilter("products")}
            >
              <Package size={16} className="mr-2" />
              Products
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm ${
                activeChartFilter === "orders"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setActiveChartFilter("orders")}
            >
              <ShoppingBag size={16} className="mr-2" />
              Orders
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm ${
                activeChartFilter === "opname"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setActiveChartFilter("opname")}
            >
              <ClipboardList size={16} className="mr-2" />
              Opname
            </button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6">
          <div className="bg-gray-50 p-3 rounded-lg flex flex-wrap gap-2 justify-center">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === "daily"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setTimeFilter("daily")}
            >
              Daily
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === "weekly"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setTimeFilter("weekly")}
            >
              Weekly
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === "monthly"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setTimeFilter("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === "yearly"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setTimeFilter("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-96 relative">
          {/* Sales Chart */}
          {activeChartFilter === "sales" && (
            <div className="h-full">
              <OrderCh
                chartData={prepareChartStats}
                timeFilter={timeFilter}
                activeTab="count"
                dataType="sales"
              />
            </div>
          )}

          {/* Products Chart */}
          {activeChartFilter === "products" && (
            <div className="h-full">
              <OrderCh
                chartData={prepareChartStats}
                timeFilter={timeFilter}
                activeTab="count"
                dataType="products"
              />
            </div>
          )}

          {/* Orders Chart */}
          {activeChartFilter === "orders" && (
            <div className="h-full">
              <OrderCh
                chartData={prepareChartStats}
                timeFilter={timeFilter}
                activeTab="count"
                dataType="orders"
              />
            </div>
          )}

          {/* Opname Chart */}
          {activeChartFilter === "opname" && (
            <div className="h-full">
              <OrderCh
                chartData={prepareChartStats}
                timeFilter={timeFilter}
                activeTab="count"
                dataType="opname"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
