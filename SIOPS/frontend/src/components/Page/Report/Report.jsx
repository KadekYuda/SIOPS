import React, { useEffect, useState, useCallback } from "react";
import api from "../../../service/api";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Select from "react-select";
import {
  FileText,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  ClipboardList,
  Database,
} from "lucide-react";
import Pagination from "../Product/Pagination";

export default function ReportPage() {
  const [reportType, setReportType] = useState("stock");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayData, setDisplayData] = useState([]); // Data after pagination
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // New filter for category
  const [categories, setCategories] = useState([]); // List of categories
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [apiStatus, setApiStatus] = useState({
    status: "unknown",
    message: "Checking API connection...",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    console.log(`Fetching report data for type: ${reportType}`);
    try {
      // Build the proper API endpoint based on report type
      let apiPath;
      let fallbackApiPath;
      switch (reportType) {
        case "opname":
          apiPath = "/report/opname"; // Report path to opname data
          fallbackApiPath = "/opname/all"; // Fallback to direct path if report route fails
          break;
        case "sales":
          apiPath = "/report/sales"; // Report path to sales data
          fallbackApiPath = "/sales"; // Fallback to direct path if report route fails
          break;
        case "orders":
          apiPath = "/report/orders"; // Report path to orders data
          fallbackApiPath = "/orders"; // Fallback to direct path if report route fails
          break;
        case "stock":
          apiPath = "/report/stock"; // Report path to stock data
          fallbackApiPath = "/batch/stock"; // Fallback to direct path if report route fails
          break;
        default:
          apiPath = "/report/stock";
          fallbackApiPath = "/batch/stock";
      }

      console.log(`Attempting to fetch report data from: ${apiPath}`);

      // Create parameters object based on what's available
      const params = {};
      if (startDate) {
        // Ensure date format is YYYY-MM-DD for backend
        params.start = startDate;
        console.log(`Date filter - Start date: ${startDate}`);
      }
      if (endDate) {
        // Ensure date format is YYYY-MM-DD for backend
        params.end = endDate;
        console.log(`Date filter - End date: ${endDate}`);
      }
      if (selectedCategory) {
        params.category = selectedCategory;
        console.log(`Category filter: ${selectedCategory}`);
      }

      console.log("API Parameters:", params);

      let res;
      try {
        // Try the report endpoint first
        res = await api.get(apiPath, { params });
        console.log(`Successfully fetched data from ${apiPath}`);
      } catch (error) {
        console.log(`Error with ${apiPath}:`, error.message);

        // Only use fallback for non-category filtered requests to avoid losing filter functionality
        if (!selectedCategory) {
          console.log(
            `Trying fallback route ${fallbackApiPath} (no category filter)`
          );
          try {
            res = await api.get(fallbackApiPath, { params });
            console.log(
              `Successfully fetched data from fallback ${fallbackApiPath}`
            );
          } catch (fallbackError) {
            console.error(
              `Both primary and fallback endpoints failed:`,
              fallbackError.message
            );
            throw fallbackError;
          }
        } else {
          console.log(`Category filter active, not using fallback endpoint`);
          throw error; // Don't use fallback when category filter is active
        }
      }

      // Process response data based on structure
      let reportData = [];

      // Check if response has data in various formats
      if (res.data) {
        if (Array.isArray(res.data)) {
          reportData = res.data;
        } else if (res.data.result && Array.isArray(res.data.result)) {
          reportData = res.data.result;
        } else if (typeof res.data === "object") {
          reportData = [res.data]; // Convert single object to array
        }
      }

      console.log(
        `Received ${reportData.length} records for ${reportType} report`
      );

      // Debug: Log sample data structure to understand the format
      if (reportData.length > 0) {
        console.log(`Sample ${reportType} data structure:`, reportData[0]);
        console.log(`Full first record keys:`, Object.keys(reportData[0]));
      }

      // Transform data based on report type if needed
      let transformedData = reportData;

      switch (reportType) {
        case "stock":
          // Add index number for each item during transformation
          transformedData = reportData.map((item, index) => ({
            id:
              item.batch_id ||
              item.id ||
              `stock-${Math.random().toString(36).substring(2, 9)}`,
            indexNumber: index + 1, // Add index number starting from 1
            batch_code: item.batch_code || "-",
            // Restore product information
            product: item.product || {
              code: item.code_product || "No Code",
              name: item.name_product || "Unknown Product",
            },
            initial_stock: item.initial_stock || 0,
            current_stock: item.stock_quantity || item.current_stock || 0,
            purchase_price: parseFloat(item.purchase_price || 0),
            selling_price: parseFloat(item.selling_price || 0),
            arrival_date: item.arrival_date,
            exp_date: item.exp_date,
            status:
              item.status ||
              (item.exp_date
                ? new Date(item.exp_date) < new Date()
                  ? "Expired"
                  : "Valid"
                : "No Expiry"),
          }));
          break;

        // Default case - keep original data structure
        default:
          transformedData = reportData;
          break;

        case "opname":
          transformedData = reportData.map((item, index) => {
            // Ensure we have a consistent structure for opname data
            // First, handle the various ways product information might be nested
            let productName = "Unknown Product";
            let productCode = "No Code";

            if (item.batch_stock?.product) {
              productName =
                item.batch_stock.product.name ||
                item.batch_stock.product.name_product ||
                "Unknown Product";
              productCode =
                item.batch_stock.product.code ||
                item.batch_stock.product.code_product ||
                "No Code";
            } else if (item.batchStock?.product) {
              productName =
                item.batchStock.product.name ||
                item.batchStock.product.name_product ||
                "Unknown Product";
              productCode =
                item.batchStock.product.code ||
                item.batchStock.product.code_product ||
                "No Code";
            } else if (item.Batchstock?.product) {
              productName =
                item.Batchstock.product.name ||
                item.Batchstock.product.name_product ||
                "Unknown Product";
              productCode =
                item.Batchstock.product.code ||
                item.Batchstock.product.code_product ||
                "No Code";
            } else if (item.product) {
              productName =
                item.product.name ||
                item.product.name_product ||
                "Unknown Product";
              productCode =
                item.product.code || item.product.code_product || "No Code";
            } else if (item.BatchStock?.Product) {
              productName =
                item.BatchStock.Product.name ||
                item.BatchStock.Product.name_product ||
                "Unknown Product";
              productCode =
                item.BatchStock.Product.code ||
                item.BatchStock.Product.code_product ||
                "No Code";
            } else if (item.product_name) {
              productName = item.product_name;
              productCode = item.product_code || item.code_product || "No Code";
            } else if (item.code_product) {
              productCode = item.code_product;
              productName = `Product ${item.code_product}`;
            }

            // Get batch information from all possible paths
            let batchCode =
              item.batch_stock?.batch_code ||
              item.batchStock?.batch_code ||
              item.Batchstock?.batch_code ||
              item.BatchStock?.batch_code ||
              item.batch_code ||
              "-";

            let batchId =
              item.batch_stock?.id ||
              item.batch_stock?.batch_id ||
              item.batchStock?.id ||
              item.batchStock?.batch_id ||
              item.Batchstock?.id ||
              item.Batchstock?.batch_id ||
              item.BatchStock?.id ||
              item.BatchStock?.batch_id ||
              item.batch_id ||
              0;

            // If we have a batchId but no batchCode, generate one
            if (batchId && batchCode === "-") {
              batchCode = `BATCH-${batchId}`;
            }

            return {
              id:
                item.opname_id ||
                item.id ||
                `opname-${index}-${Math.random().toString(36).substring(2, 9)}`,
              indexNumber: index + 1, // Add index for consistent display
              opname_id: item.opname_id,
              scheduled_date: item.scheduled_date,
              opname_date: item.opname_date,
              system_stock:
                typeof item.system_stock !== "undefined"
                  ? Number(item.system_stock)
                  : 0,
              physical_stock:
                typeof item.physical_stock !== "undefined"
                  ? Number(item.physical_stock)
                  : 0,
              expired_stock:
                typeof item.expired_stock !== "undefined"
                  ? Number(item.expired_stock)
                  : 0,
              damaged_stock:
                typeof item.damaged_stock !== "undefined"
                  ? Number(item.damaged_stock)
                  : 0,
              difference:
                typeof item.difference !== "undefined"
                  ? Number(item.difference)
                  : typeof item.selisih !== "undefined"
                  ? Number(item.selisih)
                  : typeof item.physical_stock !== "undefined" &&
                    typeof item.system_stock !== "undefined"
                  ? Number(item.physical_stock) - Number(item.system_stock)
                  : 0,
              notes: item.notes || "",
              created_at: item.created_at || new Date().toISOString(),
              // Handle both nested and flattened structures
              batch_stock: {
                id: batchId,
                batch_code: batchCode,
                product: {
                  code: productCode,
                  name: productName,
                },
              },
              user: item.User ||
                item.user || {
                  id: item.user_id || 0,
                  name: item.user_name || item.username || "Unknown User",
                  email: item.user_email || item.email || "-",
                },
              status: item.status || "scheduled",
              final_status:
                item.final_status ||
                (typeof item.difference !== "undefined" &&
                (item.status === "submitted" || item.status === "adjusted")
                  ? item.difference === 0
                    ? "Match"
                    : item.difference > 0
                    ? "Surplus"
                    : "Shortage"
                  : "-"),
            };
          });
          break;

        case "sales":
          transformedData = reportData.map((item, index) => {
            // Handle various possible data structures for sales
            let productName = "Unknown Product";
            let productCode = "No Code";
            let batchCode = "-";

            // Try to extract product info from multiple possible structures
            if (item.BatchStock?.Product?.name) {
              productName = item.BatchStock.Product.name;
              productCode =
                item.BatchStock.Product.code ||
                item.BatchStock.Product.code_product ||
                "No Code";
              batchCode = item.BatchStock.batch_code || item.batch_code || "-";
            } else if (item.batch_stock?.product?.name) {
              productName = item.batch_stock.product.name;
              productCode =
                item.batch_stock.product.code ||
                item.batch_stock.product.code_product ||
                "No Code";
              batchCode = item.batch_stock.batch_code || item.batch_code || "-";
            } else if (item.product_name) {
              productName = item.product_name;
              productCode = item.product_code || item.code_product || "No Code";
              batchCode = item.batch_code || "-";
            } else if (item.Product?.name) {
              productName = item.Product.name;
              productCode =
                item.Product.code || item.Product.code_product || "No Code";
              batchCode = item.batch_code || "-";
            } else if (item.name_product) {
              productName = item.name_product;
              productCode = item.code_product || "No Code";
              batchCode = item.batch_code || "-";
            }

            return {
              id:
                item.id ||
                `sales-${index}-${Math.random().toString(36).substring(2, 9)}`,
              indexNumber: item.indexNumber || index + 1,
              sale_id: item.sale_id || item.sales_id,
              sales_detail_id: item.sales_detail_id,
              product_name: productName,
              batch_code: batchCode,
              quantity: parseInt(item.quantity || 0),
              price: parseFloat(item.price || item.selling_price || 0),
              subtotal: parseFloat(item.subtotal || 0),
              sales_date: item.sales_date,
              total_amount: parseFloat(item.total_amount || 0),
              user: item.user ||
                item.User || {
                  id: item.user_id || 0,
                  name: item.user_name || item.username || "Unknown User",
                  email: "-",
                },
              created_at: item.created_at || item.sales_date,
              // Keep batch_stock structure for compatibility
              batch_stock: {
                id: item.batch_id || 0,
                batch_code: batchCode,
                product: {
                  code: productCode,
                  name: productName,
                },
              },
            };
          });
          break;

        case "orders":
          transformedData = reportData.map((item, index) => {
            // Handle various possible data structures for orders
            let productName = "Unknown Product";
            let productCode = "No Code";
            let batchCode = "-";

            // Try to extract product info from multiple possible structures
            if (item.BatchStock?.Product?.name) {
              productName = item.BatchStock.Product.name;
              productCode =
                item.BatchStock.Product.code ||
                item.BatchStock.Product.code_product ||
                "No Code";
              batchCode = item.BatchStock.batch_code || item.batch_code || "-";
            } else if (item.batch_stock?.product?.name) {
              productName = item.batch_stock.product.name;
              productCode =
                item.batch_stock.product.code ||
                item.batch_stock.product.code_product ||
                "No Code";
              batchCode = item.batch_stock.batch_code || item.batch_code || "-";
            } else if (item.product_name) {
              productName = item.product_name;
              productCode = item.product_code || item.code_product || "No Code";
              batchCode = item.batch_code || "-";
            } else if (item.Product?.name) {
              productName = item.Product.name;
              productCode =
                item.Product.code || item.Product.code_product || "No Code";
              batchCode = item.batch_code || "-";
            } else if (item.name_product) {
              productName = item.name_product;
              productCode = item.code_product || "No Code";
              batchCode = item.batch_code || "-";
            }

            return {
              id:
                item.id ||
                `order-${index}-${Math.random().toString(36).substring(2, 9)}`,
              indexNumber: item.indexNumber || index + 1,
              order_id: item.order_id,
              order_detail_id: item.order_detail_id,
              product_name: productName,
              batch_code: batchCode,
              quantity: parseInt(item.quantity || 0),
              price: parseFloat(item.price || item.ordered_price || 0),
              subtotal: parseFloat(item.subtotal || 0),
              order_date: item.order_date,
              order_status: item.order_status || item.status || "pending",
              total_amount: parseFloat(item.total_amount || 0),
              user: item.user ||
                item.User || {
                  id: item.user_id || 0,
                  name: item.user_name || item.username || "Unknown User",
                  email: "-",
                },
              created_at: item.created_at,
              // Keep batch_stock structure for compatibility
              batch_stock: {
                id: item.batch_id || 0,
                batch_code: batchCode,
                product: {
                  code: productCode,
                  name: productName,
                },
              },
              // Keep legacy status field for compatibility
              status: item.order_status || item.status || "pending",
            };
          });
          break;
      }

      setData(transformedData);
      setCurrentPage(0); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching data:", error);

      // Check if the error is related to backend implementation
      if (error.response?.status === 500) {
        const errorMsg = `Server error (500): API endpoint /api${
          reportType === "opname"
            ? "/report/opname"
            : reportType === "sales"
            ? "/report/sales"
            : reportType === "orders"
            ? "/report/orders"
            : "/report/stock"
        } belum diimplementasikan dengan benar di backend.`;
        console.warn(errorMsg);
        setError(errorMsg);

        // Set empty data but don't crash the UI
        setData([]);
      } else {
        const errorMsg = error.response?.status
          ? `Gagal mengambil data laporan (${error.response.status}): ${error.message}`
          : `Gagal mengambil data laporan: ${error.message}`;
        setError(errorMsg);
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, selectedCategory]);

  // Fetch categories for filter
  const fetchCategories = useCallback(async () => {
    try {
      console.log("Fetching categories...");
      const response = await api.get("/categories");
      console.log("Categories response:", response.data);

      if (
        response.data &&
        response.data.result &&
        Array.isArray(response.data.result)
      ) {
        setCategories(response.data.result);
        console.log(`Loaded ${response.data.result.length} categories`);
      } else if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        console.log(`Loaded ${response.data.length} categories`);
      } else {
        console.warn(
          "Categories data is not in expected format:",
          response.data
        );
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  // Fetch total product count separately
  const fetchTotalProductCount = useCallback(async () => {
    try {
      if (reportType === "stock") {
        // Try the dedicated endpoint first
        try {
          const response = await api.get("/report/product-count");
          if (
            response.data &&
            typeof response.data.totalProducts === "number"
          ) {
            return response.data.totalProducts;
          }
        } catch (endpointError) {
          console.log(
            "Product count endpoint not available, trying alternate methods"
          );
        }

        // Fallback to products list
        const response = await api.get("/products");
        if (response.data && Array.isArray(response.data)) {
          return response.data.length;
        }
      }
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
    return null;
  }, [reportType]);

  // Calculate summary statistics
  useEffect(() => {
    if (filteredData.length > 0) {
      let summaryData = {};

      try {
        // Fetch accurate product count for stock reports
        if (reportType === "stock") {
          fetchTotalProductCount().then((productCount) => {
            if (productCount !== null) {
              setSummary((prevSummary) => ({
                ...prevSummary,
                totalProducts: productCount,
              }));
            }
          });
        }

        if (reportType === "sales") {
          // Handle both flattened and nested sales data structures
          let totalSales = 0;
          let totalQuantity = 0;

          filteredData.forEach((item) => {
            if (item.SalesDetails && Array.isArray(item.SalesDetails)) {
              // Handle nested structure from direct API
              totalSales += parseFloat(item.total_amount || 0);

              item.SalesDetails.forEach((detail) => {
                totalQuantity += detail.quantity || 0;
              });
            } else {
              // Handle flattened structure from report API
              totalSales += parseFloat(item.subtotal || item.total_amount || 0);
              totalQuantity += item.quantity || 0;
            }
          });

          summaryData = {
            totalSales,
            totalQuantity,
            totalTransactions: filteredData.length,
          };
        } else if (reportType === "opname") {
          // Handle different opname data structures
          let totalPositive = 0;
          let totalNegative = 0;
          let totalZero = 0;

          filteredData.forEach((item) => {
            // Get difference either directly or calculate it
            const difference =
              item.difference !== undefined
                ? item.difference
                : (item.physical_stock || 0) - (item.system_stock || 0);

            if (difference > 0) totalPositive++;
            else if (difference < 0) totalNegative++;
            else totalZero++;
          });

          summaryData = {
            totalPositive,
            totalNegative,
            totalZero,
            totalChecked: filteredData.length,
          };
        } else if (reportType === "orders") {
          // Handle different order data structures
          let completed = 0;
          let pending = 0;
          let cancelled = 0;

          filteredData.forEach((item) => {
            const status = (item.status || "").toLowerCase();
            if (status === "completed") completed++;
            else if (status === "pending") pending++;
            else if (status === "cancelled") cancelled++;
          });

          summaryData = {
            completed,
            pending,
            cancelled,
            totalOrders: filteredData.length,
          };
        } else if (reportType === "stock") {
          // Handle different stock data structures
          const totalStock = filteredData.reduce(
            (sum, item) =>
              sum + (item.current_stock || item.stock_quantity || 0),
            0
          );

          // Get unique product codes - more robust extraction of product data from various formats
          const productCodes = filteredData
            .map((item) => {
              // Check for nested product object (preferred structure)
              if (item.product && (item.product.code || item.product.name)) {
                return item.product.code || item.product.name;
              }
              // Fallback to flat properties if needed
              return item.code_product || item.product_code || null;
            })
            .filter(Boolean);

          // Calculate the unique products from our filtered data
          const uniqueProducts = new Set(productCodes);
          const totalProducts = uniqueProducts.size || 0;

          // If we have product data in the records, use the count
          // Otherwise the summary will just show 0 products

          // Count expired and valid items
          const expiredItems = filteredData.filter((item) => {
            if (item.status === "Expired") return true;
            if (item.exp_date) {
              return new Date(item.exp_date) < new Date();
            }
            return false;
          }).length;

          // Calculate total inventory value (purchase price * current stock)
          const totalValue = filteredData.reduce((sum, item) => {
            const stock = item.current_stock || item.stock_quantity || 0;
            const price = parseFloat(item.purchase_price || 0);
            return sum + stock * price;
          }, 0);

          summaryData = {
            totalStock,
            totalProducts,
            totalBatches: filteredData.length,
            expiredItems,
            validItems: filteredData.length - expiredItems,
            totalValue: Math.round(totalValue),
          };
        }
      } catch (error) {
        console.error("Error calculating summary:", error);
        summaryData = { error: "Failed to calculate summary" };
      }

      setSummary(summaryData);
    } else {
      setSummary({});
    }
  }, [filteredData, reportType, fetchTotalProductCount]);

  // Filter data client-side based on search query and category
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = data;

    // Backend should handle category filtering, so we skip client-side category filtering
    // if (selectedCategory) {
    //   ... client-side category filtering disabled - handled by backend
    // }

    // Apply search query filter
    if (!query.trim()) {
      setFilteredData(filtered);
    } else {
      try {
        const searchString = query.toLowerCase();

        const filtered = data.filter((item) => {
          if (!item) return false;

          // Safe value getter function to avoid excessive null checks
          const safeGet = (obj, path, defaultValue = "") => {
            return path.split(".").reduce((curr, key) => {
              return curr && curr[key] !== undefined ? curr[key] : defaultValue;
            }, obj);
          };

          // Different property access patterns for different report types
          switch (reportType) {
            case "stock":
              return (
                (
                  safeGet(item, "product.name") ||
                  safeGet(item, "product.name_product") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                (safeGet(item, "batch_code") || "")
                  .toString()
                  .toLowerCase()
                  .includes(searchString)
              );
            case "opname":
              return (
                // Search by product name from multiple possible sources
                (
                  safeGet(item, "batch_stock.product.name") ||
                  safeGet(item, "batch_stock.product.name_product") ||
                  safeGet(item, "batchStock.product.name_product") ||
                  safeGet(item, "BatchStock.product.name_product") ||
                  safeGet(item, "product_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by batch code from multiple possible sources
                (
                  safeGet(item, "batch_stock.batch_code") ||
                  safeGet(item, "batchStock.batch_code") ||
                  safeGet(item, "BatchStock.batch_code") ||
                  safeGet(item, "batch_code") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by user name from multiple possible sources
                (
                  safeGet(item, "user.name") ||
                  safeGet(item, "User.name") ||
                  safeGet(item, "User.username") ||
                  safeGet(item, "user_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString)
              );
            case "sales":
              return (
                // Search by product name from multiple possible sources
                (
                  safeGet(item, "batch_stock.product.name") ||
                  safeGet(item, "batch_stock.product.code") ||
                  safeGet(
                    item,
                    "SalesDetails.0.Batchstock.Product.name_product"
                  ) ||
                  safeGet(
                    item,
                    "SalesDetails.0.BatchStock.Product.name_product"
                  ) ||
                  safeGet(item, "product_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by batch code from multiple possible sources
                (
                  safeGet(item, "batch_stock.batch_code") ||
                  safeGet(item, "SalesDetails.0.Batchstock.batch_code") ||
                  safeGet(item, "SalesDetails.0.BatchStock.batch_code") ||
                  safeGet(item, "batch_code") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by user name from multiple possible sources
                (
                  safeGet(item, "user.name") ||
                  safeGet(item, "User.name") ||
                  safeGet(item, "user_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by date
                (
                  safeGet(item, "sales_date") ||
                  safeGet(item, "created_at") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString)
              );
            case "orders":
              return (
                // Search by product name from multiple possible sources
                (
                  safeGet(item, "batch_stock.product.name") ||
                  safeGet(item, "batch_stock.product.code") ||
                  safeGet(
                    item,
                    "OrderDetails.0.Batchstock.Product.name_product"
                  ) ||
                  safeGet(
                    item,
                    "OrderDetails.0.BatchStock.Product.name_product"
                  ) ||
                  safeGet(item, "product_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by batch code from multiple possible sources
                (
                  safeGet(item, "batch_stock.batch_code") ||
                  safeGet(item, "OrderDetails.0.Batchstock.batch_code") ||
                  safeGet(item, "OrderDetails.0.BatchStock.batch_code") ||
                  safeGet(item, "batch_code") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by user name from multiple possible sources
                (
                  safeGet(item, "user.name") ||
                  safeGet(item, "User.name") ||
                  safeGet(item, "user_name") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by status
                (safeGet(item, "status") || safeGet(item, "order_status") || "")
                  .toString()
                  .toLowerCase()
                  .includes(searchString) ||
                // Search by date
                (
                  safeGet(item, "created_at") ||
                  safeGet(item, "order_date") ||
                  ""
                )
                  .toString()
                  .toLowerCase()
                  .includes(searchString)
              );
            default:
              // Fallback search across common properties
              return Object.values(item).some(
                (val) =>
                  val !== null &&
                  val !== undefined &&
                  val.toString().toLowerCase().includes(searchString)
              );
          }
        });

        setFilteredData(filtered);
      } catch (error) {
        console.error("Error filtering data:", error);
        setFilteredData([]);
      }
    }
  }, [data, query, reportType, selectedCategory]);

  // Handle pagination
  useEffect(() => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    setTotalPages(totalPages);

    // Get the current page's data
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayData(filteredData.slice(start, end));
  }, [filteredData, currentPage, itemsPerPage]);

  // Check API status on load
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Try to ping the backend with the summary endpoint to verify it's working
        await api.get("/report/summary?type=stock");
        setApiStatus({
          status: "online",
          message: "API Server is online",
        });
      } catch (error) {
        // If there's an error, set the status accordingly
        if (error.response) {
          // We got a response, so the server is up, but returned an error
          setApiStatus({
            status: "error",
            message: `API responded with error: ${error.response.status}`,
          });
        } else if (error.request) {
          // No response received
          setApiStatus({
            status: "offline",
            message: "API Server appears to be offline or unreachable",
          });
        } else {
          // Something else went wrong
          setApiStatus({
            status: "error",
            message: `API connection error: ${error.message}`,
          });
        }
      }
    };

    checkApiStatus();
    fetchCategories(); // Fetch categories on component mount
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();

    // If we're on the stock report, fetch product count immediately
    if (reportType === "stock") {
      fetchTotalProductCount().then((productCount) => {
        if (productCount !== null) {
          setSummary((prevSummary) => ({
            ...prevSummary,
            totalProducts: productCount,
          }));
        }
      });
    }
  }, [fetchData, reportType, fetchTotalProductCount]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(0); // Reset to first page when items per page changes
  };

  const exportPDF = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Set up fonts and colors
    doc.setFont("helvetica", "bold");

    // Company Header - SIMSOP (centered, large)
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // Blue color
    const companyName = "SIMSOP";
    const companyNameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - companyNameWidth) / 2, yPosition);
    yPosition += 8;

    // Subtitle - Stock Information Management System (centered, smaller)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray color
    doc.setFont("helvetica", "normal");
    const subtitle = "System Information Management Stock Order and Opname";
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, yPosition);
    yPosition += 15;

    // Report Title (centered, bold)
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black
    doc.setFont("helvetica", "bold");
    const reportTitle = `${
      reportType.charAt(0).toUpperCase() + reportType.slice(1)
    } Report`;
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 15;

    // Filter Information (left aligned)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    // Date filter
    if (startDate || endDate) {
      const dateText = `Date: ${
        startDate ? format(new Date(startDate), "dd/MM/yyyy") : "Start"
      } - ${endDate ? format(new Date(endDate), "dd/MM/yyyy") : "End"}`;
      doc.text(dateText, 14, yPosition);
      yPosition += 6;
    }

    // Category filter
    if (selectedCategory) {
      const categoryName =
        categories.find((cat) => cat.code_categories === selectedCategory)
          ?.name_categories || selectedCategory;
      const categoryText = `Category: ${categoryName}`;
      doc.text(categoryText, 14, yPosition);
      yPosition += 6;
    }

    // Generated date and time (right aligned)
    const currentDate = new Date();
    const generatedText = `Generated: ${format(
      currentDate,
      "dd/MM/yyyy HH:mm"
    )}`;
    const generatedWidth = doc.getTextWidth(generatedText);
    doc.text(generatedText, pageWidth - generatedWidth - 14, yPosition);
    yPosition += 8;

    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 10;

    // Data summary (if available)
    if (Object.keys(summary).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Summary", 14, yPosition);
      yPosition += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      if (reportType === "sales") {
        doc.text(
          `Total Sales: Rp ${(summary.totalSales || 0).toLocaleString()}`,
          14,
          yPosition
        );
        doc.text(
          `Total Quantity: ${summary.totalQuantity || 0}`,
          100,
          yPosition
        );
        yPosition += 5;
        doc.text(
          `Total Transactions: ${summary.totalTransactions || 0}`,
          14,
          yPosition
        );
      } else if (reportType === "opname") {
        doc.text(`Stock Surplus: ${summary.totalPositive || 0}`, 14, yPosition);
        doc.text(
          `Stock Shortage: ${summary.totalNegative || 0}`,
          70,
          yPosition
        );
        doc.text(`Stock Match: ${summary.totalZero || 0}`, 130, yPosition);
        yPosition += 5;
        doc.text(`Total Checked: ${summary.totalChecked || 0}`, 14, yPosition);
      } else if (reportType === "stock") {
        doc.text(`Total Stock: ${summary.totalStock || 0}`, 14, yPosition);
        doc.text(
          `Total Products: ${summary.totalProducts || 0}`,
          70,
          yPosition
        );
        doc.text(`Total Batches: ${summary.totalBatches || 0}`, 130, yPosition);
        yPosition += 5;
        doc.text(`Expired Items: ${summary.expiredItems || 0}`, 14, yPosition);
        doc.text(`Valid Items: ${summary.validItems || 0}`, 70, yPosition);
        if (summary.totalValue) {
          doc.text(
            `Stock Value: Rp ${summary.totalValue.toLocaleString()}`,
            130,
            yPosition
          );
        }
      } else if (reportType === "orders") {
        doc.text(`Completed: ${summary.completed || 0}`, 14, yPosition);
        doc.text(`Pending: ${summary.pending || 0}`, 70, yPosition);
        doc.text(`Cancelled: ${summary.cancelled || 0}`, 130, yPosition);
        yPosition += 5;
        doc.text(`Total Orders: ${summary.totalOrders || 0}`, 14, yPosition);
      }
      yPosition += 10;
    }

    // Helper function to format batch code for PDF (shorter format)
    const formatBatchForPDF = (batchCode, index) => {
      if (!batchCode || batchCode === "-" || batchCode === "Unknown Batch") {
        return "-";
      }

      // If batch code already has a number pattern, extract it
      const numberMatch = batchCode.match(/(\d+)$/);
      if (numberMatch) {
        const number = numberMatch[1];
        return `${number.padStart(3, "0")}`; // e.g., -001, -002
      }

      // Otherwise, use index + 1 as the number
      return `-${String(index + 1).padStart(3, "0")}`;
    };

    // Prepare table data
    let headers, body;

    if (reportType === "opname") {
      headers = [
        [
          "Product",
          "Batch",
          "System Stock",
          "Physical Stock",
          "Expired",
          "Damaged",
          "Difference",
          "Status",
          "Notes",
          "Date",
          "User",
        ],
      ];
      body = filteredData.map((item, index) => [
        item.batch_stock?.product?.name || "-",
        formatBatchForPDF(
          item.batch_stock?.batch_code || item.batch_code,
          index
        ),
        item.system_stock || "-",
        item.physical_stock ?? "-",
        item.expired_stock ?? "-",
        item.damaged_stock ?? "-",
        item.status === "scheduled" ? "-" : item.difference ?? "-",
        item.status || "-",
        item.notes || "-",
        item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy") : "-",
        item.user?.name || "-",
      ]);
    } else if (reportType === "sales") {
      headers = [
        ["No.", "Product", "Batch", "Qty", "Price", "Subtotal", "Date", "User"],
      ];
      body = filteredData.map((item, index) => [
        item.indexNumber || index + 1,
        item.product_name || item.batch_stock?.product?.name || "-",
        formatBatchForPDF(
          item.batch_code || item.batch_stock?.batch_code,
          index
        ),
        item.quantity || "-",
        item.price ? `Rp ${item.price.toLocaleString()}` : "-",
        item.subtotal ? `Rp ${item.subtotal.toLocaleString()}` : "-",
        item.sales_date ? format(new Date(item.sales_date), "dd/MM/yyyy") : "-",
        item.user?.name || "-",
      ]);
    } else if (reportType === "orders") {
      headers = [
        [
          "No.",
          "Product",
          "Batch",
          "Qty",
          "Price",
          "Subtotal",
          "Status",
          "Date",
          "User",
        ],
      ];
      body = filteredData.map((item, index) => [
        item.indexNumber || index + 1,
        item.product_name || "-",
        formatBatchForPDF(item.batch_code, index),
        item.quantity || "-",
        item.price ? `Rp ${item.price.toLocaleString()}` : "-",
        item.subtotal ? `Rp ${item.subtotal.toLocaleString()}` : "-",
        item.status || "-",
        item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy") : "-",
        item.user?.name || "-",
      ]);
    } else if (reportType === "stock") {
      headers = [
        [
          "No.",
          "Product",
          "Batch",
          "Initial Stock",
          "Current Stock",
          "Purchase Price",
          "Selling Price",
          "Arrival Date",
          "Exp. Date",
          "Status",
        ],
      ];
      body = filteredData.map((item, index) => [
        item.indexNumber || index + 1,
        item.product?.name || "-",
        formatBatchForPDF(item.batch_code, index),
        item.initial_stock || "-",
        item.current_stock || "-",
        item.purchase_price
          ? `Rp ${item.purchase_price.toLocaleString()}`
          : "-",
        item.selling_price ? `Rp ${item.selling_price.toLocaleString()}` : "-",
        item.arrival_date
          ? format(new Date(item.arrival_date), "dd/MM/yyyy")
          : "-",
        item.exp_date ? format(new Date(item.exp_date), "dd/MM/yyyy") : "-",
        item.status || "-",
      ]);
    }

    // Generate table with professional styling
    autoTable(doc, {
      head: headers,
      body: body,
      startY: yPosition,
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185], // Blue header
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray for alternate rows
      },
      columnStyles: (() => {
        // Define column widths based on report type
        let columnConfig = {};

        if (reportType === "sales") {
          // Total: ~170 units (fits within page width)
          columnConfig = {
            0: { halign: "center", cellWidth: 10 }, // No. (10)
            1: { cellWidth: 45 }, // Product (45) - lebih lebar karena batch lebih pendek
            2: { halign: "center", cellWidth: 15 }, // Batch (15) - lebih kecil karena format -001
            3: { halign: "center", cellWidth: 12 }, // Qty (12)
            4: { halign: "right", cellWidth: 22 }, // Price (22)
            5: { halign: "right", cellWidth: 25 }, // Subtotal (25)
            6: { halign: "center", cellWidth: 20 }, // Date (20)
            7: { cellWidth: 21 }, // User (21)
          };
        } else if (reportType === "orders") {
          // Total: ~165 units
          columnConfig = {
            0: { halign: "center", cellWidth: 8 }, // No. (8)
            1: { cellWidth: 40 }, // Product (40) - lebih lebar
            2: { halign: "center", cellWidth: 15 }, // Batch (15) - lebih kecil
            3: { halign: "center", cellWidth: 10 }, // Qty (10)
            4: { halign: "right", cellWidth: 20 }, // Price (20)
            5: { halign: "right", cellWidth: 22 }, // Subtotal (22)
            6: { halign: "center", cellWidth: 18 }, // Status (18)
            7: { halign: "center", cellWidth: 16 }, // Date (16)
            8: { cellWidth: 16 }, // User (16)
          };
        } else if (reportType === "stock") {
          // Total: ~178 units
          columnConfig = {
            0: { halign: "center", cellWidth: 8 }, // No. (8)
            1: { cellWidth: 35 }, // Product (35) - lebih lebar
            2: { halign: "center", cellWidth: 12 }, // Batch (12) - lebih kecil
            3: { halign: "center", cellWidth: 15 }, // Initial Stock (15)
            4: { halign: "center", cellWidth: 15 }, // Current Stock (15)
            5: { halign: "right", cellWidth: 20 }, // Purchase Price (20)
            6: { halign: "right", cellWidth: 20 }, // Selling Price (20)
            7: { halign: "center", cellWidth: 18 }, // Arrival Date (18)
            8: { halign: "center", cellWidth: 17 }, // Exp. Date (17)
            9: { halign: "center", cellWidth: 18 }, // Status (18)
          };
        } else if (reportType === "opname") {
          // Total: ~178 units for opname (11 columns)
          columnConfig = {
            0: { cellWidth: 30 }, // Product (30) - lebih lebar
            1: { halign: "center", cellWidth: 15 }, // Batch (15) - lebih kecil
            2: { halign: "center", cellWidth: 15 }, // System Stock (15)
            3: { halign: "center", cellWidth: 15 }, // Physical Stock (15)
            4: { halign: "center", cellWidth: 12 }, // Expired (12)
            5: { halign: "center", cellWidth: 12 }, // Damaged (12)
            6: { halign: "center", cellWidth: 15 }, // Difference (15)
            7: { halign: "center", cellWidth: 18 }, // Status (18)
            8: { cellWidth: 15 }, // Notes (15)
            9: { halign: "center", cellWidth: 16 }, // Date (16)
            10: { cellWidth: 15 }, // User (15)
          };
        } else {
          // Default column config
          columnConfig = {
            0: { halign: "center", cellWidth: 15 }, // First column (usually No.)
          };
        }

        return columnConfig;
      })(),
      margin: { top: 10, left: 14, right: 14 },
      styles: {
        overflow: "linebreak",
        cellWidth: "auto",
        fontSize: 8,
      },
      didDrawPage: function (data) {
        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        // Page number at bottom center
        const pageText = `Page ${currentPage} of ${pageCount}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 10);

        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
      },
    });

    // Save the PDF with descriptive filename
    const filename = `SIMSOP_${reportType}_Report_${format(
      new Date(),
      "yyyyMMdd_HHmm"
    )}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen  p-4 sm:p-6">
      <div className="max-w-7xl mx-auto py-16">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-lg shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Report Management
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">
                  Generate and export system reports
                </p>
                {apiStatus.status !== "unknown" && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      apiStatus.status === "online"
                        ? "bg-green-100 text-green-800"
                        : apiStatus.status === "error"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                    title={apiStatus.message}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        apiStatus.status === "online"
                          ? "bg-green-500"
                          : apiStatus.status === "error"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    {apiStatus.status === "online"
                      ? "API Online"
                      : apiStatus.status === "error"
                      ? "API Error"
                      : "API Offline"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-400 mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <div className="flex-1">
                <span className="text-red-800 font-medium block mb-1">
                  Error:
                </span>
                <span className="text-red-800">{error}</span>
                {error.includes("API endpoint") && (
                  <div className="mt-2 p-3 bg-white rounded border border-red-200 text-sm">
                    <p className="font-semibold mb-1">Solution:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Make sure backend server is running properly</li>
                      <li>Implement report endpoint in ReportController.js</li>
                      <li>Check error logs in backend console</li>
                      <li>Meanwhile, use other working report types</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Report Filters
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="reportType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Report Type
              </label>
              <Select
                id="reportType"
                value={{
                  value: reportType,
                  label:
                    reportType === "opname"
                      ? "Stock Opname"
                      : reportType === "sales"
                      ? "Sales"
                      : reportType === "orders"
                      ? "Orders"
                      : "Stock",
                }}
                onChange={(selectedOption) => {
                  console.log("Changing report type to:", selectedOption.value);
                  setReportType(selectedOption.value);
                  // Reset errors when changing report type
                  setError("");
                }}
                options={[
                  { value: "opname", label: "Stock Opname" },
                  { value: "sales", label: "Sales" },
                  { value: "orders", label: "Orders" },
                  { value: "stock", label: "Stock" },
                ]}
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: "#D1D5DB",
                    minHeight: "42px",
                    "&:hover": {
                      borderColor: "#ef4444",
                    },
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? "#ef4444"
                      : isFocused
                      ? "#fecaca"
                      : undefined,
                    color: isSelected ? "white" : "black",
                  }),
                }}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: "#ef4444",
                    primary25: "#fecaca",
                  },
                })}
              />
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="categoryFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="categoryFilter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.code_categories}
                    value={category.code_categories}
                  >
                    {category.name_categories}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="searchQuery"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search
              </label>
              <input
                id="searchQuery"
                placeholder="Search product / user..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportPDF}
                disabled={loading || filteredData.length === 0}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {reportType === "sales" && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Sales
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        Rp {summary.totalSales?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Quantity
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalQuantity || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Transactions
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalTransactions || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {reportType === "opname" && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Stock Surplus
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalPositive || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Stock Shortage
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalNegative || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Stock Match
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalZero || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Checked
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalChecked || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {reportType === "orders" && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Completed
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.completed || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Pending
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.pending || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Cancelled
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.cancelled || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Orders
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {reportType === "stock" && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Stock
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalStock || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Products
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalProducts || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Batches
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalBatches || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Expired Items
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.expiredItems || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Valid Items
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.validItems || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Stock Value (Rp)
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {summary.totalValue
                          ? summary.totalValue.toLocaleString()
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Report Data{" "}
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredData.length} data found
                {query && ` (from ${data.length} total data)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Mobile Notice */}
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 lg:hidden">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="text-sm font-medium">
                Swipe left to see more columns
              </span>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <RefreshCw className="animate-spin w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-500 font-medium">
                  Loading report data...
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Please wait a moment
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                {error && error.includes("API endpoint") ? (
                  <>
                    <p className="text-red-500 font-medium">
                      API endpoint not yet implemented in backend
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose another report type or implement endpoint in
                      backend
                    </p>
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => fetchData()}
                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 font-medium">
                      {query
                        ? `No data matches "${query}"`
                        : "No data to display"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {query
                        ? "Try changing search keywords"
                        : "Please change filters or add new data"}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {reportType === "opname" && (
                        <>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sys.Stock
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phy.Stock
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expired
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Damaged
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diff.
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Notes
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            User
                          </th>
                        </>
                      )}
                      {reportType === "sales" && (
                        <>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            User
                          </th>
                        </>
                      )}
                      {reportType === "orders" && (
                        <>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            User
                          </th>
                        </>
                      )}
                      {reportType === "stock" && (
                        <>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Init.Stock
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Purch.Price
                          </th>
                          <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sell.Price
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Arrival
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exp.Date
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayData.map((item, index) => (
                      <tr
                        key={
                          item.id ||
                          (reportType === "stock" && item.batch_id) ||
                          (item.batch_stock?.id &&
                            `${item.batch_stock.id}-${index}`) ||
                          (item.sale_id && `sale-${item.sale_id}-${index}`) ||
                          (item.order_id &&
                            `order-${item.order_id}-${index}`) ||
                          `row-${index}-${Math.random()
                            .toString(36)
                            .substr(2, 9)}`
                        }
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {reportType === "opname" && (
                          <>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs">
                              <div
                                className="truncate"
                                title={
                                  item.batch_stock?.product?.name ||
                                  item.product_name ||
                                  "Unknown Product"
                                }
                              >
                                {item.batch_stock?.product?.name ||
                                  item.product_name ||
                                  "Unknown Product"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div
                                className="truncate text-xs"
                                title={
                                  item.batch_stock?.batch_code ||
                                  item.batch_code ||
                                  "Unknown Batch"
                                }
                              >
                                {(
                                  item.batch_stock?.batch_code ||
                                  item.batch_code ||
                                  "Unknown Batch"
                                )
                                  .split("-")
                                  .pop() || "N/A"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {typeof item.system_stock !== "undefined"
                                ? item.system_stock
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {typeof item.physical_stock !== "undefined"
                                ? item.physical_stock
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {typeof item.expired_stock !== "undefined"
                                ? item.expired_stock
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {typeof item.damaged_stock !== "undefined"
                                ? item.damaged_stock
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-sm font-semibold text-center">
                              {item.status === "scheduled" ? (
                                <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-500">
                                  -
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                                    parseFloat(item.difference) > 0
                                      ? "bg-blue-100 text-blue-800"
                                      : parseFloat(item.difference) < 0
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {parseFloat(item.difference) > 0
                                    ? `+${item.difference}`
                                    : item.difference}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <span
                                className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                                  item.status === "scheduled"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.status === "submitted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 max-w-xs truncate hidden lg:table-cell">
                              {item.notes || "-"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div className="text-xs">
                                {item.created_at
                                  ? format(new Date(item.created_at), "dd/MM")
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 hidden md:table-cell">
                              <div
                                className="truncate text-xs"
                                title={item.user?.name || "Unknown User"}
                              >
                                {item.user?.name || "Unknown"}
                              </div>
                            </td>
                          </>
                        )}
                        {reportType === "sales" && (
                          <>
                            <td className="px-2 py-3 text-sm font-medium text-gray-900 text-center">
                              {item.indexNumber || index + 1}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs">
                              <div
                                className="truncate"
                                title={item.product_name || "Unknown Product"}
                              >
                                {item.product_name || "Unknown Product"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div
                                className="truncate text-xs"
                                title={item.batch_code || "Unknown Batch"}
                              >
                                {(item.batch_code || "Unknown Batch")
                                  .split("-")
                                  .pop() || "N/A"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {item.quantity || "0"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 text-right">
                              <div className="text-xs">
                                {item.price
                                  ? `${(parseFloat(item.price) / 1000).toFixed(
                                      0
                                    )}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm font-semibold text-green-600 text-right">
                              <div className="text-xs">
                                {item.subtotal !== undefined
                                  ? `${(
                                      parseFloat(item.subtotal) / 1000
                                    ).toFixed(0)}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div className="text-xs">
                                {item.sales_date || item.created_at
                                  ? format(
                                      new Date(
                                        item.sales_date || item.created_at
                                      ),
                                      "dd/MM"
                                    )
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 hidden md:table-cell">
                              <div
                                className="truncate text-xs"
                                title={item.user?.name || "Unknown User"}
                              >
                                {item.user?.name || "Unknown"}
                              </div>
                            </td>
                          </>
                        )}
                        {reportType === "orders" && (
                          <>
                            <td className="px-2 py-3 text-sm font-medium text-gray-900 text-center">
                              {item.indexNumber || index + 1}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs">
                              <div
                                className="truncate"
                                title={item.product_name || "Unknown Product"}
                              >
                                {item.product_name || "Unknown Product"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div
                                className="truncate text-xs"
                                title={item.batch_code || "Unknown Batch"}
                              >
                                {(item.batch_code || "Unknown Batch")
                                  .split("-")
                                  .pop() || "N/A"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {item.quantity || "0"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 text-right">
                              <div className="text-xs">
                                {item.price
                                  ? `${(parseFloat(item.price) / 1000).toFixed(
                                      0
                                    )}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm font-semibold text-green-600 text-right">
                              <div className="text-xs">
                                {item.subtotal !== undefined
                                  ? `${(
                                      parseFloat(item.subtotal) / 1000
                                    ).toFixed(0)}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                                  item.status?.toLowerCase() === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : item.status?.toLowerCase() === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.status?.toLowerCase() === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {item.status || "Unknown"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div className="text-xs">
                                {item.created_at
                                  ? format(new Date(item.created_at), "dd/MM")
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 hidden md:table-cell">
                              <div
                                className="truncate text-xs"
                                title={item.user?.name || "Unknown User"}
                              >
                                {item.user?.name || "Unknown"}
                              </div>
                            </td>
                          </>
                        )}
                        {reportType === "stock" && (
                          <>
                            <td className="px-2 py-3 text-sm font-medium text-gray-900 text-center">
                              {item.indexNumber || index + 1}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs">
                              <div
                                className="truncate"
                                title={item.product?.name || "Unknown Product"}
                              >
                                {item.product?.name || "Unknown Product"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div
                                className="truncate text-xs"
                                title={item.batch_code || "Unknown Batch"}
                              >
                                {(item.batch_code || "Unknown Batch")
                                  .split("-")
                                  .pop() || "N/A"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {item.initial_stock || "0"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 font-medium text-center">
                              {item.current_stock || "0"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-900 text-right hidden lg:table-cell">
                              <div className="text-xs">
                                {item.purchase_price
                                  ? `${(item.purchase_price / 1000).toFixed(
                                      0
                                    )}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-green-600 font-medium text-right">
                              <div className="text-xs">
                                {item.selling_price
                                  ? `${(item.selling_price / 1000).toFixed(0)}k`
                                  : "0"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center hidden lg:table-cell">
                              <div className="text-xs">
                                {item.arrival_date
                                  ? format(new Date(item.arrival_date), "dd/MM")
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center">
                              <div className="text-xs">
                                {item.exp_date
                                  ? format(new Date(item.exp_date), "dd/MM")
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                                  item.status === "Expired"
                                    ? "bg-red-100 text-red-800"
                                    : item.status === "Valid"
                                    ? "bg-green-100 text-green-800"
                                    : item.status === "Near Expiry"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {item.status || "Unknown"}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={filteredData.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}
