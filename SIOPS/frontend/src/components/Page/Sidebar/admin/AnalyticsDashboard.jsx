import React, { useState, useEffect, useMemo } from "react";
import { Package, ShoppingBag, DollarSign, ClipboardList } from "lucide-react";
import api from "../../../../service/api.js";
import OrderCh from "../../../Chart/OrderCh.jsx";

const AnalyticsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [opnames, setOpnames] = useState([]);

  // Debug - Log current state values when they change
  useEffect(() => {
    console.log("Products state updated:", products.length);
  }, [products]);

  // Chart filter state
  const [activeChartFilter, setActiveChartFilter] = useState("orders");
  const [timeFilter, setTimeFilter] = useState("weekly");

  // Universal chart data preparation function
  // Note: Using useMemo to avoid recalculating this function on every render
  const prepareChartStats = useMemo(() => {
    console.log(
      "Preparing chart stats with activeChartFilter:",
      activeChartFilter
    );
    console.log("Products data available:", products.length);
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
            label: date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
            }),
            value: i,
          });
        }
      } else if (timeFilter === "weekly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());

          // Format yang lebih user-friendly untuk weekly
          const monthName = weekStart.toLocaleDateString("id-ID", {
            month: "short",
          });

          periods.push({
            label: `W${12 - i} ${monthName}`,
            value: i,
          });
        }
      } else if (timeFilter === "monthly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          periods.push({
            label: date.toLocaleDateString("id-ID", {
              month: "short",
              year: "numeric",
            }),
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
          stock: activeChartFilter === "stock" ? periodData.length : 0,
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
        } else if (activeChartFilter === "stock") {
          result.stockAmount = totalValue;
          result.stockCount = periodData.length;
          result.stockValue = totalValue;
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

      case "stock":
        dataSource = Array.isArray(products) ? products : [];
        statusField = null; // Stock items don't have status field
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

      dataSource.forEach((item, index) => {
        // Coba berbagai cara untuk mendapatkan nama user
        let userName = "System"; // Default yang lebih baik dari "Unknown"

        if (item.User?.name) {
          userName = item.User.name;
        } else if (item.user?.name) {
          userName = item.user.name;
        } else if (item.user_name) {
          userName = item.user_name;
        } else if (item.User?.user_id) {
          userName = `User ${item.User.user_id}`;
        } else if (item.user_id) {
          userName = `User ${item.user_id}`;
        } else {
          // Jika benar-benar tidak ada informasi user, berikan nama berdasarkan urutan
          userName = `Staff ${index + 1}`;
        }

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
    // Special handling for batch stock - group by batch stock status
    else if (activeChartFilter === "stock") {
      console.log(
        "Preparing batch stock chart data from batches:",
        dataSource.length
      );

      const stockCategories = {
        lowStock: 0,
        expiringSoon: 0,
        expired: 0,
        normalStock: 0,
      };
      const stockValues = {
        lowStock: 0,
        expiringSoon: 0,
        expired: 0,
        normalStock: 0,
      };

      dataSource.forEach((item, index) => {
        console.log(
          `Processing product ${index}:`,
          item.name_product || item.code_product
        );
        console.log(
          `  Has BatchStocks: ${item.BatchStocks ? "yes" : "no"}, Count: ${
            item.BatchStocks?.length || 0
          }`
        );

        const currentStock =
          item.BatchStocks?.reduce((sum, batch) => {
            const stockQty = parseInt(batch.stock_quantity) || 0;
            // Use only stock_quantity (not initial_stock) to match BatchStok.jsx
            console.log(
              `    Batch ${
                batch.batch_code
              }: stock_quantity=${stockQty}, initial_stock=${
                parseInt(batch.initial_stock) || 0
              }`
            );
            return sum + stockQty;
          }, 0) || 0;
        console.log(`  Total stock: ${currentStock}`);

        // Use 5 as fallback value if min_stock is not defined, to match BatchStok.jsx
        const minStock = item.min_stock ? parseInt(item.min_stock) || 5 : 5;
        const price =
          parseFloat(item.price) || parseFloat(item.sell_price) || 0;
        console.log(`  Min stock: ${minStock}, Price: ${price}`);

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
            return daysUntilExp > 0 && daysUntilExp <= 60;
          }) || [];

        if (expiredBatches.length > 0) {
          stockCategories.expired++;
          stockValues.expired += price;
          console.log(`  Categorized as: expired`);
        } else if (expiringSoonBatches.length > 0) {
          stockCategories.expiringSoon++;
          stockValues.expiringSoon += price;
          console.log(`  Categorized as: expiringSoon`);
        } else {
          // Normal stock (above low stock threshold + 5)
          stockCategories.normalStock++;
          stockValues.normalStock += price;
          console.log(
            `  Categorized as: normalStock (${currentStock} > ${minStock + 5})`
          );
        }
      });

      // Use window.batchStockStats if available, fallback to product categorization
      const batchStockData = window.batchStockStats || {
        lowStock: 0,
        expiringSoon: 0,
        expired: 0,
        normalStock: 0,
        lowStockValue: 0,
        expiringSoonValue: 0,
        expiredValue: 0,
        normalStockValue: 0,
      };

      const stockChartData = {
        // Stock-specific fields using real batch data
        lowStock: batchStockData.lowStock,
        expiringSoon: batchStockData.expiringSoon,
        expired: batchStockData.expired,
        normalStock: batchStockData.normalStock,
        lowStockValue: batchStockData.lowStockValue,
        expiringSoonValue: batchStockData.expiringSoonValue,
        expiredValue: batchStockData.expiredValue,
        normalStockValue: batchStockData.normalStockValue,
        monthlyData: generateTimeData(),
        dailyData: timeFilter === "daily" ? generateTimeData() : [],
        weeklyData: timeFilter === "weekly" ? generateTimeData() : [],
        yearlyData: timeFilter === "yearly" ? generateTimeData() : [],
      };

      console.log("Stock chart data ready:", stockChartData);
      return stockChartData;
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
            statusCounts.canc1elled++;
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
    fetchStockData();
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

      // Debug: Log sample sales data to check user information
      console.log(
        "Sales data sample:",
        sortedSales.length > 0 ? sortedSales[0] : "No sales data"
      );
      if (sortedSales.length > 0) {
        console.log("User info in first sale:", {
          User: sortedSales[0].User,
          user: sortedSales[0].user,
          user_name: sortedSales[0].user_name,
          user_id: sortedSales[0].user_id,
        });
      }

      setSales(sortedSales);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setSales([]);
    }
  };

  const fetchStockData = async () => {
    try {
      // Ambil semua batch stock langsung dengan limit yang sama seperti BatchStok
      const batchResponse = await api.get(`/batch/stock?limit=10000`);
      console.log("All batch stock response:", batchResponse.data);

      // Ambil batch dari response
      const allBatches = batchResponse.data.result || [];

      console.log("Total batches:", allBatches.length);

      // Hitung jumlah produk di setiap kategori
      const today = new Date();

      // Hitung kategori untuk setiap batch
      const lowStockBatches = [];
      const expiringSoonBatches = [];
      const expiredBatches = [];
      const normalStockBatches = [];

      allBatches.forEach((batch) => {
        const expDate = batch.exp_date ? new Date(batch.exp_date) : null;
        const diffDays = expDate
          ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
          : null;
        const stockQuantity = parseInt(batch.stock_quantity) || 0;

        // Use batch.Product?.min_stock to match BatchStok exactly
        const minStock = batch.Product?.min_stock
          ? parseInt(batch.Product.min_stock) || 5
          : 5;

        // Kategorisasi dengan prioritas: Expired > Expiring > Low > Normal
        // Setiap batch hanya masuk 1 kategori

        // Expired batches (highest priority)
        if (expDate && diffDays <= 0) {
          expiredBatches.push(batch);
        }
        // Expiring soon batches
        else if (expDate && diffDays > 0 && diffDays <= 60) {
          expiringSoonBatches.push(batch);
        }
        // Low stock batches (match BatchStok Low tab logic - exactly same as BatchStok)
        else if (stockQuantity <= minStock + 5) {
          lowStockBatches.push(batch);
        }
        // Normal stock: must be above minStock + 5 (exactly same as BatchStok)
        else {
          normalStockBatches.push(batch);
        }
      });

      // Siapkan data untuk chart (tanpa menambah produk yang tidak punya batch)
      console.log("Final category counts:", {
        lowStock: lowStockBatches.length,
        expiringSoon: expiringSoonBatches.length,
        expired: expiredBatches.length,
        normalStock: normalStockBatches.length,
        totalBatches:
          lowStockBatches.length +
          expiringSoonBatches.length +
          expiredBatches.length +
          normalStockBatches.length,
        allBatchesLength: allBatches.length,
      });

      // Siapkan data untuk chart berdasarkan QUANTITY (bukan batch count)
      const batchStockChartData = {
        // Hitung total quantity per kategori (bukan jumlah batch)
        lowStock: lowStockBatches.reduce((sum, batch) => {
          return sum + (parseInt(batch.stock_quantity) || 0);
        }, 0),
        expiringSoon: expiringSoonBatches.reduce((sum, batch) => {
          return sum + (parseInt(batch.stock_quantity) || 0);
        }, 0),
        expired: expiredBatches.reduce((sum, batch) => {
          return sum + (parseInt(batch.stock_quantity) || 0);
        }, 0),
        normalStock: normalStockBatches.reduce((sum, batch) => {
          return sum + (parseInt(batch.stock_quantity) || 0);
        }, 0),

        // Hitung nilai untuk tiap kategori (berdasarkan harga * kuantitas)
        lowStockValue: lowStockBatches.reduce((sum, batch) => {
          const quantity = parseInt(batch.stock_quantity) || 0;
          const price = parseFloat(batch.purchase_price) || 0;
          return sum + quantity * price;
        }, 0),
        expiringSoonValue: expiringSoonBatches.reduce((sum, batch) => {
          const quantity = parseInt(batch.stock_quantity) || 0;
          const price = parseFloat(batch.purchase_price) || 0;
          return sum + quantity * price;
        }, 0),
        expiredValue: expiredBatches.reduce((sum, batch) => {
          const quantity = parseInt(batch.stock_quantity) || 0;
          const price = parseFloat(batch.purchase_price) || 0;
          return sum + quantity * price;
        }, 0),
        normalStockValue: normalStockBatches.reduce((sum, batch) => {
          const quantity = parseInt(batch.stock_quantity) || 0;
          const price = parseFloat(batch.purchase_price) || 0;
          return sum + quantity * price;
        }, 0),
      };

      console.log("Batch stock chart data:", batchStockChartData);

      // Debug: Hitung total seperti BatchStok untuk perbandingan
      const totalLikeBatchStok = allBatches.reduce((sum, batch) => {
        return sum + (parseInt(batch.stock_quantity) || 0);
      }, 0);

      const totalFromCategories =
        batchStockChartData.lowStock +
        batchStockChartData.expiringSoon +
        batchStockChartData.expired +
        batchStockChartData.normalStock;

      console.log("ANALYTICS DASHBOARD: Total calculation comparison:");
      console.log("- Sum of categories:", totalFromCategories);
      console.log("- Simple sum like BatchStok:", totalLikeBatchStok);
      console.log("- All batches count:", allBatches.length);
      console.log("- Category breakdown:", {
        lowStock: batchStockChartData.lowStock,
        expiringSoon: batchStockChartData.expiringSoon,
        expired: batchStockChartData.expired,
        normalStock: batchStockChartData.normalStock,
      });

      // Simpan data chart dalam state global untuk digunakan di seluruh aplikasi
      window.batchStockStats = batchStockChartData;

      // Atur data produk dengan kategori batch stock
      setProducts([
        ...lowStockBatches.map((batch) => ({ ...batch, category: "lowStock" })),
        ...expiringSoonBatches.map((batch) => ({
          ...batch,
          category: "expiringSoon",
        })),
        ...expiredBatches.map((batch) => ({ ...batch, category: "expired" })),
        ...normalStockBatches.map((batch) => ({
          ...batch,
          category: "normalStock",
        })),
      ]);
    } catch (error) {
      console.error("Error fetching batch stock data:", error);
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
                activeChartFilter === "stock"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setActiveChartFilter("stock")}
            >
              <Package size={16} className="mr-2" />
              Stock
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
          {/* We'll show a debug message if we have no data */}
          {products.length === 0 && activeChartFilter === "stock" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg">Loading batch stock data...</p>
                <p className="text-sm mt-2">
                  If this message persists, there might be an issue with the
                  batch stock data.
                </p>
              </div>
            </div>
          )}

          {/* If we have products but chart still shows no data, let's force some data */}
          {products.length > 0 && activeChartFilter === "stock" && (
            <div className="h-full">
              <OrderCh
                chartData={{
                  lowStock:
                    window.batchStockStats?.lowStock ||
                    products.filter((item) => item.category === "lowStock")
                      .length,
                  expiringSoon:
                    window.batchStockStats?.expiringSoon ||
                    products.filter((item) => item.category === "expiringSoon")
                      .length,
                  expired:
                    window.batchStockStats?.expired ||
                    products.filter((item) => item.category === "expired")
                      .length,
                  normalStock:
                    window.batchStockStats?.normalStock ||
                    products.filter((item) => item.category === "normalStock")
                      .length,
                  // Hitung nilai untuk masing-masing kategori (harga * kuantitas)
                  lowStockValue:
                    window.batchStockStats?.lowStockValue ||
                    products
                      .filter((item) => item.category === "lowStock")
                      .reduce((sum, item) => {
                        const quantity = parseInt(item.stock_quantity) || 0;
                        const price = parseFloat(item.purchase_price) || 0;
                        return sum + quantity * price;
                      }, 0),
                  expiringSoonValue:
                    window.batchStockStats?.expiringSoonValue ||
                    products
                      .filter((item) => item.category === "expiringSoon")
                      .reduce((sum, item) => {
                        const quantity = parseInt(item.stock_quantity) || 0;
                        const price = parseFloat(item.purchase_price) || 0;
                        return sum + quantity * price;
                      }, 0),
                  expiredValue:
                    window.batchStockStats?.expiredValue ||
                    products
                      .filter((item) => item.category === "expired")
                      .reduce((sum, item) => {
                        const quantity = parseInt(item.stock_quantity) || 0;
                        const price = parseFloat(item.purchase_price) || 0;
                        return sum + quantity * price;
                      }, 0),
                  normalStockValue:
                    window.batchStockStats?.normalStockValue ||
                    products
                      .filter((item) => item.category === "normalStock")
                      .reduce((sum, item) => {
                        const quantity = parseInt(item.stock_quantity) || 0;
                        const price = parseFloat(item.purchase_price) || 0;
                        return sum + quantity * price;
                      }, 0),
                  // Data untuk grafik time series (kosong karena tidak kita gunakan untuk products)
                  monthlyData: [],
                  dailyData: [],
                  weeklyData: [],
                  yearlyData: [],
                }}
                timeFilter={timeFilter}
                activeTab="count"
                dataType="stock"
              />
            </div>
          )}

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
