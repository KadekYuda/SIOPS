import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { BarChart3, BarChart, LineChart, DollarSign } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OrderCh = ({
  chartData,
  timeFilter = "6months",
  activeTab = "count",
  dataType = "orders",
  title = "Status Distribution",
  trendsTitle = "Trends",
}) => {
  const [chartType, setChartType] = useState("line");
  const [activeDataTab, setActiveDataTab] = useState(activeTab);
  const [animate, setAnimate] = useState(false);
  // Add state for hidden/crossed out statuses
  const [hiddenStatuses, setHiddenStatuses] = useState([]);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate totals and percentages
  const totals = useMemo(() => {
    if (!chartData) return { count: 0, value: 0 };

    const count =
      (chartData.pendingOrders || chartData.pending || 0) +
      (chartData.approvedOrders || chartData.approved || 0) +
      (chartData.receivedOrders ||
        chartData.received ||
        chartData.completed ||
        0) +
      (chartData.cancelledOrders || chartData.cancelled || 0);

    const value =
      (chartData.pendingValue || 0) +
      (chartData.approvedValue || 0) +
      (chartData.receivedValue || chartData.completedValue || 0) +
      (chartData.cancelledValue || 0);

    // Debug log for opname total calculation
    if (dataType === "opname") {
      console.log("=== OrderCh Total Calculation Debug ===");
      console.log("chartData:", chartData);
      console.log("pendingOrders:", chartData.pendingOrders);
      console.log("pending:", chartData.pending);
      console.log("approvedOrders:", chartData.approvedOrders);
      console.log("approved:", chartData.approved);
      console.log("receivedOrders:", chartData.receivedOrders);
      console.log("received:", chartData.received);
      console.log("cancelledOrders:", chartData.cancelledOrders);
      console.log("cancelled:", chartData.cancelled);
      console.log("Calculated total count:", count);
      console.log("=======================================");
    }

    // Debug log for opname total calculation
    if (dataType === "opname") {
      console.log("=== OrderCh Total Calculation Debug ===");
      console.log("chartData:", chartData);
      console.log("pendingOrders:", chartData.pendingOrders);
      console.log("pending:", chartData.pending);
      console.log("approvedOrders:", chartData.approvedOrders);
      console.log("approved:", chartData.approved);
      console.log("receivedOrders:", chartData.receivedOrders);
      console.log("received:", chartData.received);
      console.log("cancelledOrders:", chartData.cancelledOrders);
      console.log("cancelled:", chartData.cancelled);
      console.log("Calculated total count:", count);
      console.log("=======================================");
    }

    return { count, value };
  }, [chartData, dataType]);

  // Calculate filtered totals based on visible (non-hidden) statuses
  const displayTotals = useMemo(() => {
    if (!chartData) return { count: 0, value: 0, visibleStatuses: [] };

    // Get status labels based on data type
    const getLabels = () => {
      if (dataType === "sales") {
        const userNames = chartData?.userNames || [];
        return userNames.length > 0 ? userNames : ["No Users"];
      }
      if (dataType === "products")
        return ["Low Stock", "Expiring Soon", "Expired", "Min Stock"];
      if (dataType === "opname")
        return ["Scheduled", "Submitted", "Adjusted", "Overdue"]; // Changed "Pending" to "Scheduled" to match database terminology
      return ["Pending", "Approved", "Received", "Cancelled"];
    };

    // Get chart data based on data type
    const getDataValues = () => {
      // Debug for opname data type
      if (dataType === "opname") {
        console.log("=== OrderCh Opname Data Debug ===");
        console.log("chartData.scheduledOrders:", chartData?.scheduledOrders); // Added
        console.log("chartData.pendingOrders:", chartData?.pendingOrders);
        console.log("chartData.pending:", chartData?.pending);
        console.log("chartData.adjustedOrders:", chartData?.adjustedOrders);
        console.log("chartData.receivedOrders:", chartData?.receivedOrders);
        console.log("chartData.received:", chartData?.received);
        console.log("chartData.submittedOrders:", chartData?.submittedOrders);
        console.log("chartData.approvedOrders:", chartData?.approvedOrders);
        console.log("chartData.approved:", chartData?.approved);
        console.log("chartData.overdueOrders:", chartData?.overdueOrders);
        console.log("chartData.cancelledOrders:", chartData?.cancelledOrders);
        console.log("chartData.cancelled:", chartData?.cancelled);
        console.log("================================");
      }

      if (dataType === "sales") {
        return [
          chartData?.pendingOrders ||
            chartData?.pending ||
            chartData?.salesPending ||
            0,
          chartData?.approvedOrders ||
            chartData?.approved ||
            chartData?.salesApproved ||
            0,
          chartData?.receivedOrders ||
            chartData?.received ||
            chartData?.salesCompleted ||
            0,
          chartData?.cancelledOrders ||
            chartData?.cancelled ||
            chartData?.salesCancelled ||
            0,
        ];
      } else if (dataType === "products") {
        return [
          chartData?.lowStock ||
            chartData?.pendingOrders ||
            chartData?.pending ||
            0,
          chartData?.expiringSoon ||
            chartData?.approvedOrders ||
            chartData?.approved ||
            0,
          chartData?.expired ||
            chartData?.receivedOrders ||
            chartData?.received ||
            0,
          chartData?.minStock ||
            chartData?.cancelledOrders ||
            chartData?.cancelled ||
            0,
        ];
      } else if (dataType === "opname") {
        const opnameArray = [
          chartData?.scheduledOrders || // Use scheduledOrders as first priority
            chartData?.pendingOrders ||
            chartData?.pending ||
            0,
          chartData?.submittedOrders ||
            chartData?.approvedOrders ||
            chartData?.approved ||
            0,
          chartData?.adjustedOrders ||
            chartData?.receivedOrders ||
            chartData?.received ||
            0,
          chartData?.overdueOrders ||
            chartData?.cancelledOrders ||
            chartData?.cancelled ||
            0,
        ];
        console.log("=== Final Opname Array ===");
        console.log("Position 0 (Scheduled):", opnameArray[0]);
        console.log("Position 1 (Submitted):", opnameArray[1]);
        console.log("Position 2 (Adjusted):", opnameArray[2]);
        console.log("Position 3 (Overdue):", opnameArray[3]);
        console.log(
          "Array total:",
          opnameArray.reduce((a, b) => a + b, 0)
        );
        console.log("==========================");
        return opnameArray;
      } else {
        return [
          chartData?.pendingOrders || chartData?.pending || 0,
          chartData?.approvedOrders || chartData?.approved || 0,
          chartData?.receivedOrders || chartData?.received || 0,
          chartData?.cancelledOrders || chartData?.cancelled || 0,
        ];
      }
    };

    // Get status values
    const getStatusValues = () => {
      if (dataType === "sales") {
        return [
          chartData?.pendingValue ||
            chartData?.pendingOrders ||
            chartData?.salesPendingValue ||
            0,
          chartData?.approvedValue ||
            chartData?.approvedOrders ||
            chartData?.salesApprovedValue ||
            0,
          chartData?.receivedValue ||
            chartData?.receivedOrders ||
            chartData?.salesCompletedValue ||
            0,
          chartData?.cancelledValue ||
            chartData?.cancelledOrders ||
            chartData?.salesCancelledValue ||
            0,
        ];
      } else if (dataType === "products") {
        return [
          chartData?.lowStockValue || chartData?.pendingValue || 0,
          chartData?.expiringSoonValue || chartData?.approvedValue || 0,
          chartData?.expiredValue || chartData?.receivedValue || 0,
          chartData?.minStockValue || chartData?.cancelledValue || 0,
        ];
      } else if (dataType === "opname") {
        return [
          chartData?.pendingValue || chartData?.pendingOrders || 0,
          chartData?.submittedValue ||
            chartData?.approvedValue ||
            chartData?.approvedOrders ||
            0,
          chartData?.adjustedValue ||
            chartData?.receivedValue ||
            chartData?.receivedOrders ||
            0,
          chartData?.overdueValue ||
            chartData?.cancelledValue ||
            chartData?.cancelledOrders ||
            0,
        ];
      } else {
        return [
          chartData?.pendingValue || 0,
          chartData?.approvedValue || 0,
          chartData?.receivedValue || 0,
          chartData?.cancelledValue || 0,
        ];
      }
    };

    const statusLabels = getLabels();
    const chartDataValues = getDataValues();
    const statusValues = getStatusValues();

    let visibleCount = 0;
    let visibleValue = 0;
    const visibleStatuses = [];

    statusLabels.forEach((label, index) => {
      const countValue = chartDataValues[index] || 0;
      const valueAmount = statusValues[index] || 0;
      const hasData = countValue > 0;
      const isNotHidden = !hiddenStatuses.includes(label);

      if (hasData && isNotHidden) {
        visibleStatuses.push(label);
        visibleCount += countValue;
        visibleValue += valueAmount;
      }
    });

    // If no filters applied, show all statuses with data and return original totals
    if (hiddenStatuses.length === 0) {
      const allStatusesWithData = [];
      statusLabels.forEach((label, index) => {
        const countValue = chartDataValues[index] || 0;
        if (countValue > 0) {
          allStatusesWithData.push(label);
        }
      });

      return {
        count: totals.count,
        value: totals.value,
        visibleStatuses: allStatusesWithData,
      };
    }

    // When there are hidden statuses, return filtered totals
    return {
      count: visibleCount,
      value: visibleValue,
      visibleStatuses,
    };
  }, [hiddenStatuses, totals, chartData, dataType]);

  const getPercentage = (value, type = "count") => {
    const total = totals[type];
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return "Rp 0";

    // Convert to number if it's a string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Use Indonesian locale formatting
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(numValue)
      .replace(/IDR/, "Rp");
  };

  // Get time range data with filtering support
  const getTimeRangeData = useMemo(() => {
    if (
      !chartData?.monthlyData &&
      !chartData?.weeklyData &&
      !chartData?.dailyData &&
      !chartData?.yearlyData
    ) {
      return {
        labels: [],
        countData: [],
        valueData: [],
        hasData: false,
        filteredData: null,
      };
    }

    // Try different data sources based on timeFilter
    let data = [];
    if (timeFilter === "daily" && chartData.dailyData) {
      data = chartData.dailyData;
    } else if (timeFilter === "weekly" && chartData.weeklyData) {
      data = chartData.weeklyData;
    } else if (timeFilter === "yearly" && chartData.yearlyData) {
      data = chartData.yearlyData;
    } else if (chartData.monthlyData) {
      data = chartData.monthlyData;
    } else {
      // Fallback: create dummy data if no time series data available
      data = [];
    }

    // Check if all data points are empty (for daily view)
    const allEmpty =
      data.length === 0 || data.every((item) => item.isEmpty === true);

    const baseData = {
      labels:
        data.length > 0
          ? data.map(
              (item) =>
                item.month || item.week || item.day || item.year || "N/A"
            )
          : [],
      countData:
        data.length > 0
          ? data.map(
              (item) =>
                item.orders ||
                item.count ||
                item.sales ||
                item.products ||
                item.opname ||
                0
            )
          : [],
      valueData:
        data.length > 0
          ? data.map(
              (item) => item.totalValue || item.value || item.amount || 0
            )
          : [],
      hasData: !allEmpty && data.length > 0,
    };

    // If no statuses are hidden, return base data
    if (hiddenStatuses.length === 0) {
      return {
        ...baseData,
        filteredData: null,
      };
    }

    // Calculate filtered data based on hidden statuses
    // This is a simplified approach - in a real scenario, you'd need detailed monthly data per status

    // Get current data values to calculate filtering ratio
    const currentChartData = (() => {
      if (dataType === "sales") {
        return [
          chartData?.pendingOrders ||
            chartData?.pending ||
            chartData?.salesPending ||
            0,
          chartData?.approvedOrders ||
            chartData?.approved ||
            chartData?.salesApproved ||
            0,
          chartData?.receivedOrders ||
            chartData?.received ||
            chartData?.salesCompleted ||
            0,
          chartData?.cancelledOrders ||
            chartData?.cancelled ||
            chartData?.salesCancelled ||
            0,
        ];
      } else if (dataType === "products") {
        return [
          chartData?.lowStock ||
            chartData?.pendingOrders ||
            chartData?.pending ||
            0,
          chartData?.expiringSoon ||
            chartData?.approvedOrders ||
            chartData?.approved ||
            0,
          chartData?.expired ||
            chartData?.receivedOrders ||
            chartData?.received ||
            0,
          chartData?.minStock ||
            chartData?.cancelledOrders ||
            chartData?.cancelled ||
            0,
        ];
      } else if (dataType === "opname") {
        return [
          chartData?.scheduledOrders || // Use scheduledOrders as first priority
            chartData?.pendingOrders ||
            chartData?.pending ||
            0,
          chartData?.submittedOrders ||
            chartData?.approvedOrders ||
            chartData?.approved ||
            0,
          chartData?.adjustedOrders ||
            chartData?.receivedOrders ||
            chartData?.received ||
            0,
          chartData?.overdueOrders ||
            chartData?.cancelledOrders ||
            chartData?.cancelled ||
            0,
        ];
      } else {
        return [
          chartData?.pendingOrders || chartData?.pending || 0,
          chartData?.approvedOrders || chartData?.approved || 0,
          chartData?.receivedOrders || chartData?.received || 0,
          chartData?.cancelledOrders || chartData?.cancelled || 0,
        ];
      }
    })();

    const currentValueData = (() => {
      if (dataType === "sales") {
        return [
          chartData?.pendingValue ||
            chartData?.pendingOrders ||
            chartData?.salesPendingValue ||
            0,
          chartData?.approvedValue ||
            chartData?.approvedOrders ||
            chartData?.salesApprovedValue ||
            0,
          chartData?.receivedValue ||
            chartData?.receivedOrders ||
            chartData?.salesCompletedValue ||
            0,
          chartData?.cancelledValue ||
            chartData?.cancelledOrders ||
            chartData?.salesCancelledValue ||
            0,
        ];
      } else if (dataType === "products") {
        return [
          chartData?.lowStockValue || chartData?.pendingValue || 0,
          chartData?.expiringSoonValue || chartData?.approvedValue || 0,
          chartData?.expiredValue || chartData?.receivedValue || 0,
          chartData?.minStockValue || chartData?.cancelledValue || 0,
        ];
      } else if (dataType === "opname") {
        return [
          chartData?.scheduledValue || // Use scheduledValue as first priority
            chartData?.pendingValue ||
            chartData?.pendingOrders ||
            0,
          chartData?.submittedValue ||
            chartData?.approvedValue ||
            chartData?.approvedOrders ||
            0,
          chartData?.adjustedValue ||
            chartData?.receivedValue ||
            chartData?.receivedOrders ||
            0,
          chartData?.overdueValue ||
            chartData?.cancelledValue ||
            chartData?.cancelledOrders ||
            0,
        ];
      } else {
        return [
          chartData?.pendingValue || chartData?.pendingOrders || 0,
          chartData?.approvedValue || chartData?.approvedOrders || 0,
          chartData?.receivedValue || chartData?.receivedOrders || 0,
          chartData?.cancelledValue || chartData?.cancelledOrders || 0,
        ];
      }
    })();

    const statusNames = (() => {
      if (dataType === "sales") {
        const userNames = chartData?.userNames || [];
        return userNames.length > 0 ? userNames : ["No Users"];
      } else if (dataType === "products") {
        return ["Low Stock", "Expiring Soon", "Expired", "Min Stock"];
      } else if (dataType === "opname") {
        return ["Scheduled", "Submitted", "Adjusted", "Overdue"];
      } else {
        return ["Pending", "Approved", "Received", "Cancelled"];
      }
    })();

    // Calculate visible percentage
    let visibleCount = 0;
    let visibleValue = 0;
    let totalCount = 0;
    let totalValue = 0;

    statusNames.forEach((label, index) => {
      const countValue = currentChartData[index] || 0;
      const valueAmount = currentValueData[index] || 0;

      totalCount += countValue;
      totalValue += valueAmount;

      if (!hiddenStatuses.includes(label)) {
        visibleCount += countValue;
        visibleValue += valueAmount;
      }
    });

    const countRatio = totalCount > 0 ? visibleCount / totalCount : 0;
    const valueRatio = totalValue > 0 ? visibleValue / totalValue : 0;

    // Apply ratio to historical data
    return {
      ...baseData,
      filteredData:
        hiddenStatuses.length > 0
          ? {
              countData: baseData.countData.map((value) =>
                Math.round(value * countRatio)
              ),
              valueData: baseData.valueData.map((value) =>
                Math.round(value * valueRatio)
              ),
              hasData: baseData.hasData && (countRatio > 0 || valueRatio > 0),
            }
          : null,
    };
  }, [chartData, hiddenStatuses, dataType, timeFilter]);

  // Calculate moving average
  const getMovingAverage = (data) => {
    if (data.length < 3) return data;
    return data.map((_, index, arr) => {
      if (index < 2) return arr[index];
      const sum = arr[index - 2] + arr[index - 1] + arr[index];
      return Math.round(sum / 3);
    });
  };

  // Chart data - Dynamic labels based on data type
  const getStatusLabels = () => {
    if (dataType === "sales") {
      // Use actual user names from chartData
      const userNames = chartData?.userNames || [];
      return userNames.length > 0 ? userNames : ["No Users"];
    }
    if (dataType === "products")
      return ["Low Stock", "Expiring Soon", "Expired", "Min Stock"];
    if (dataType === "opname")
      return ["Scheduled", "Submitted", "Adjusted", "Overdue"]; // Changed from "Pending" to "Scheduled" to match database terminology
    return ["Pending", "Approved", "Received", "Cancelled"]; // default for orders
  };

  const getTitles = () => {
    if (dataType === "sales")
      return {
        distribution: "Sales by User Distribution",
        trends: "Sales Trends",
        total: "Total Sales",
      };
    if (dataType === "products")
      return {
        distribution: "Product Stock Distribution",
        trends: "Product Trends",
        total: "Total Products",
      };
    if (dataType === "opname")
      return {
        distribution: "Opname Status Distribution",
        trends: "Opname Trends",
        total: "Total Opnames",
      };
    return {
      distribution: "Order Status Distribution",
      trends: "Order Trends",
      total: "Total Orders",
    }; // default for orders
  };

  const statusLabels = getStatusLabels();
  const titles = getTitles();
  const statusColors = {
    background: ["#FEF3C7", "#DBEAFE", "#D1FAE5", "#FEE2E2"],
    border: ["#F59E0B", "#3B82F6", "#10B981", "#EF4444"],
    hover: ["#FBBF24", "#60A5FA", "#34D399", "#F87171"],
  };

  // Calculate values for each status based on proportions
  const calculateStatusValues = useMemo(() => {
    if (!chartData) {
      return {
        firstValue: 0,
        secondValue: 0,
        thirdValue: 0,
        fourthValue: 0,
      };
    }

    // Dynamic mapping based on data type - match the order of getStatusLabels
    if (dataType === "sales") {
      return {
        firstValue:
          chartData.pendingValue ||
          chartData.pendingOrders ||
          chartData.salesPendingValue ||
          0,
        secondValue:
          chartData.approvedValue ||
          chartData.approvedOrders ||
          chartData.salesApprovedValue ||
          0,
        thirdValue:
          chartData.receivedValue ||
          chartData.receivedOrders ||
          chartData.salesCompletedValue ||
          0,
        fourthValue:
          chartData.cancelledValue ||
          chartData.cancelledOrders ||
          chartData.salesCancelledValue ||
          0,
      };
    } else if (dataType === "products") {
      // For products, use special handling in value mode
      return {
        firstValue: chartData.lowStockValue || chartData.pendingValue || 0,
        secondValue:
          chartData.expiringSoonValue || chartData.approvedValue || 0,
        thirdValue: chartData.expiredValue || chartData.receivedValue || 0,
        fourthValue: chartData.minStockValue || chartData.cancelledValue || 0,
      };
    } else if (dataType === "opname") {
      // For opname, value makes sense as it represents inventory value adjustments
      return {
        firstValue:
          chartData.scheduledValue ||
          chartData.pendingValue ||
          chartData.pendingOrders ||
          0,
        secondValue:
          chartData.submittedValue ||
          chartData.approvedValue ||
          chartData.approvedOrders ||
          0,
        thirdValue:
          chartData.adjustedValue ||
          chartData.receivedValue ||
          chartData.receivedOrders ||
          0,
        fourthValue:
          chartData.overdueValue ||
          chartData.cancelledValue ||
          chartData.cancelledOrders ||
          0,
      };
    } else {
      // Default for orders
      return {
        firstValue: chartData.pendingValue || 0,
        secondValue: chartData.approvedValue || 0,
        thirdValue: chartData.receivedValue || 0,
        fourthValue: chartData.cancelledValue || 0,
      };
    }
  }, [chartData, dataType]);

  // Get chart data based on data type - match the order of getStatusLabels
  const getChartData = () => {
    if (dataType === "sales") {
      return [
        chartData?.pendingOrders ||
          chartData?.pending ||
          chartData?.salesPending ||
          0,
        chartData?.approvedOrders ||
          chartData?.approved ||
          chartData?.salesApproved ||
          0,
        chartData?.receivedOrders ||
          chartData?.received ||
          chartData?.salesCompleted ||
          0,
        chartData?.cancelledOrders ||
          chartData?.cancelled ||
          chartData?.salesCancelled ||
          0,
      ];
    } else if (dataType === "products") {
      return [
        chartData?.lowStock ||
          chartData?.pendingOrders ||
          chartData?.pending ||
          0,
        chartData?.expiringSoon ||
          chartData?.approvedOrders ||
          chartData?.approved ||
          0,
        chartData?.expired ||
          chartData?.receivedOrders ||
          chartData?.received ||
          0,
        chartData?.minStock ||
          chartData?.cancelledOrders ||
          chartData?.cancelled ||
          0,
      ];
    } else if (dataType === "opname") {
      return [
        chartData?.scheduledOrders || // Use scheduledOrders as first priority
          chartData?.pendingOrders ||
          chartData?.pending ||
          0,
        chartData?.submittedOrders ||
          chartData?.approvedOrders ||
          chartData?.approved ||
          0,
        chartData?.adjustedOrders ||
          chartData?.receivedOrders ||
          chartData?.received ||
          0,
        chartData?.overdueOrders ||
          chartData?.cancelledOrders ||
          chartData?.cancelled ||
          0,
      ];
    } else {
      // Default for orders
      return [
        chartData?.pendingOrders || chartData?.pending || 0,
        chartData?.approvedOrders || chartData?.approved || 0,
        chartData?.receivedOrders || chartData?.received || 0,
        chartData?.cancelledOrders || chartData?.cancelled || 0,
      ];
    }
  };

  const pieChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: (activeDataTab === "count"
          ? getChartData()
          : [
              calculateStatusValues.firstValue,
              calculateStatusValues.secondValue,
              calculateStatusValues.thirdValue,
              calculateStatusValues.fourthValue,
            ]
        ).map((value, index) =>
          hiddenStatuses.includes(statusLabels[index]) ? 0 : value
        ),
        backgroundColor: statusColors.background,
        borderColor: statusColors.border,
        hoverBackgroundColor: statusColors.hover,
        borderWidth: 2,
        hoverOffset: 12,
        borderRadius: 3,
      },
    ],
  };

  const { labels, countData, valueData, filteredData } = getTimeRangeData;

  // Use filtered data if available, otherwise use original data
  const activeCountData = filteredData ? filteredData.countData : countData;
  const activeValueData = filteredData ? filteredData.valueData : valueData;
  const activeHasData = activeCountData.some((value) => value > 0);

  const countMovingAverage = getMovingAverage(activeCountData);
  const valueMovingAverage = getMovingAverage(activeValueData);

  // Get dynamic labels for time series
  const getTimeSeriesLabel = () => {
    if (dataType === "sales")
      return { count: "Sales Count", value: "Sales Value" };
    if (dataType === "products")
      return { count: "Product Count", value: "Product Value" };
    if (dataType === "opname")
      return { count: "Opname Count", value: "Opname Value" };
    return { count: "Orders Count", value: "Order Value" }; // default
  };

  const timeLabels = getTimeSeriesLabel();

  const timeSeriesData = {
    labels,
    datasets: [
      {
        label: timeLabels[activeDataTab],
        data: activeDataTab === "count" ? activeCountData : activeValueData,
        fill: chartType === "line",
        backgroundColor:
          chartType === "line"
            ? activeDataTab === "count"
              ? "rgba(99, 102, 241, 0.15)"
              : "rgba(16, 185, 129, 0.15)"
            : activeDataTab === "count"
            ? "rgba(99, 102, 241, 0.7)"
            : "rgba(16, 185, 129, 0.7)",
        borderColor: activeDataTab === "count" ? "#6366F1" : "#10B981",
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: activeDataTab === "count" ? "#6366F1" : "#10B981",
        pointBorderColor: "#fff",
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        barThickness: 24,
        borderRadius: 4,
      },
      {
        label: "Trend",
        data:
          activeDataTab === "count" ? countMovingAverage : valueMovingAverage,
        borderColor: activeDataTab === "count" ? "#C7D2FE" : "#A7F3D0",
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        tension: 0.4,
        hidden: chartType === "bar",
      },
    ],
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 6,
          font: { size: 10, family: "'Inter', sans-serif" },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const isHidden = hiddenStatuses.includes(label);
                const originalData =
                  activeDataTab === "count"
                    ? getChartData()
                    : [
                        calculateStatusValues.firstValue,
                        calculateStatusValues.secondValue,
                        calculateStatusValues.thirdValue,
                        calculateStatusValues.fourthValue,
                      ];

                const hasData = originalData[i] > 0;

                return {
                  text: label,
                  fillStyle: isHidden
                    ? "rgba(200, 200, 200, 0.3)"
                    : statusColors.background[i],
                  strokeStyle: isHidden
                    ? "rgba(200, 200, 200, 0.5)"
                    : statusColors.border[i],
                  lineWidth: 1,
                  hidden: false, // Keep visible in legend
                  index: i,
                  fontColor:
                    isHidden || !hasData
                      ? "rgba(107, 114, 128, 0.5)"
                      : "#374151",
                  textDecoration: isHidden ? "line-through" : "none",
                };
              });
            }
            return [];
          },
        },
        onClick: (e, legendItem, legend) => {
          const chart = legend.chart;
          const index = legendItem.index;

          // Handle legend click to hide/show data
          const statusLabel = statusLabels[index];
          setHiddenStatuses((prev) => {
            if (prev.includes(statusLabel)) {
              // Show the status (remove from hidden)
              return prev.filter((status) => status !== statusLabel);
            } else {
              // Hide the status (add to hidden)
              return [...prev, statusLabel];
            }
          });

          // Force chart update with animation
          chart.update("active");
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 12, weight: "bold", family: "'Inter', sans-serif" },
        bodyFont: { size: 11, family: "'Inter', sans-serif" },
        padding: 8,
        boxPadding: 4,
        filter: (tooltipItem) => {
          // Don't show tooltip for hidden segments
          const label = statusLabels[tooltipItem.dataIndex];
          return !hiddenStatuses.includes(label);
        },
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            if (value === 0) return null; // Don't show tooltip for hidden segments

            const percentage = getPercentage(value, activeDataTab);
            const itemType =
              dataType === "orders"
                ? "orders"
                : dataType === "sales"
                ? "sales"
                : dataType === "products"
                ? "products"
                : "items";

            if (activeDataTab === "value") {
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
            return `${label}: ${value} ${itemType} (${percentage}%)`;
          },
          afterLabel: (context) => {
            // Additional information on hover
            const total = context.dataset.data.reduce(
              (sum, value) => sum + value,
              0
            );
            const percentage =
              total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `Total: ${total} | Share: ${percentage}%`;
          },
        },
      },
    },
    cutout: "70%",
    animation: {
      animateScale: animate,
      animateRotate: animate,
      duration: 800,
      easing: "easeInOutQuart",
    },
    // Add click event handler for pie chart segments
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const statusLabel = statusLabels[elementIndex];

        // Toggle hidden status (hide/show on click)
        setHiddenStatuses((prev) => {
          if (prev.includes(statusLabel)) {
            // Show the status (remove from hidden)
            return prev.filter((status) => status !== statusLabel);
          } else {
            // Hide the status (add to hidden)
            return [...prev, statusLabel];
          }
        });

        // Force chart update with animation
        chart.update("active");
      }
    },
    // Add hover event handler for better interactivity
    onHover: (event, elements, chart) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor =
          elements.length > 0 ? "pointer" : "default";
      }
    },
  };

  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === "line",
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 4,
          padding: 12,
          font: { size: 9, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 11, weight: "bold", family: "'Inter', sans-serif" },
        bodyFont: { size: 10, family: "'Inter', sans-serif" },
        padding: 8,
        bodySpacing: 4,
        boxPadding: 4,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const itemType =
              dataType === "orders"
                ? "orders"
                : dataType === "sales"
                ? "sales"
                : dataType === "products"
                ? "products"
                : "items";
            if (activeDataTab === "value") {
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
            return `${context.dataset.label}: ${value} ${itemType}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(229, 231, 235, 0.5)",
          drawBorder: false,
          borderDash: [4, 4],
        },
        ticks: {
          font: { size: 9, family: "'Inter', sans-serif" },
          color: "#6B7280",
          padding: 6,
          callback: function (value) {
            if (activeDataTab === "value") {
              return formatCurrency(value);
            }
            return value;
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, family: "'Inter', sans-serif" },
          color: "#6B7280",
          padding: 6,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: animate ? 800 : 0,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Chart Controls - Compact horizontal layout */}
      <div className="flex justify-between items-center">
        {/* Data Type Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
              activeDataTab === "count"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveDataTab("count")}
          >
            <BarChart3 size={14} className="mr-1" />
            Count
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
              activeDataTab === "value"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveDataTab("value")}
          >
            <DollarSign size={14} className="mr-1" />
            Value
          </button>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
              chartType === "line"
                ? "bg-purple-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setChartType("line")}
          >
            <LineChart size={14} className="mr-1" />
            Line
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
              chartType === "bar"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setChartType("bar")}
          >
            <BarChart size={14} className="mr-1" />
            Bar
          </button>
        </div>
      </div>

      {/* Charts Grid - Side by side layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Chart - Doughnut */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              {titles.distribution}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeDataTab === "count" ? "bg-blue-500" : "bg-orange-500"
                }`}
              ></span>
              {activeDataTab === "count" ? "Count" : "Value"}
            </div>
          </div>

          <div className="relative h-48">
            {totals[activeDataTab] > 0 ? (
              <>
                <Doughnut data={pieChartData} options={pieChartOptions} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {activeDataTab === "value"
                        ? formatCurrency(displayTotals[activeDataTab] || 0)
                        : displayTotals[activeDataTab] || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {hiddenStatuses.length === 0
                        ? titles.total
                        : displayTotals.visibleStatuses?.length > 0
                        ? displayTotals.visibleStatuses.length === 1
                          ? `${displayTotals.visibleStatuses[0]}`
                          : `${displayTotals.visibleStatuses.join(" & ")}`
                        : "No Data"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center flex-col">
                <p className="text-gray-500 text-sm">No data available</p>
                <p className="text-gray-400 text-xs mt-2">
                  Try switching data type or time filter
                </p>
              </div>
            )}
          </div>

          {/* Legend Information */}
          {totals[activeDataTab] > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 items-center justify-center">
                {statusLabels.map((label, index) => {
                  const isHidden = hiddenStatuses.includes(label);

                  // Get original data (not the modified data with 0 for hidden items)
                  const originalCountData = getChartData();
                  const originalValueData = [
                    calculateStatusValues.firstValue,
                    calculateStatusValues.secondValue,
                    calculateStatusValues.thirdValue,
                    calculateStatusValues.fourthValue,
                  ];

                  const countValue = originalCountData[index];
                  const valueAmount = originalValueData[index];
                  const hasData = countValue > 0;

                  return (
                    <div key={label} className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isHidden ? "opacity-50" : ""
                        }`}
                        style={{
                          backgroundColor: statusColors.background[
                            index
                          ].replace("FE", "DD"),
                        }}
                      ></div>
                      <span
                        className={`text-xs text-gray-600 ${
                          isHidden ? "line-through opacity-50" : ""
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-xs font-medium text-gray-800 ${
                          isHidden ? "line-through opacity-50" : ""
                        }`}
                      >
                        {hasData ? (
                          activeDataTab === "count" ? (
                            countValue
                          ) : (
                            formatCurrency(valueAmount).replace("Rp ", "Rp")
                          )
                        ) : (
                          <span className="text-gray-400 italic">0</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Chart - Line/Bar */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              {titles.trends}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
            </div>
          </div>

          <div className="h-48">
            {activeHasData ? (
              chartType === "line" ? (
                <Line data={timeSeriesData} options={timeSeriesOptions} />
              ) : (
                <Bar data={timeSeriesData} options={timeSeriesOptions} />
              )
            ) : (
              <div className="h-full flex items-center justify-center flex-col">
                <p className="text-gray-500 text-sm">
                  No data available for {timeFilter} view
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Try changing the time filter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

OrderCh.propTypes = {
  chartData: PropTypes.shape({
    pendingOrders: PropTypes.number,
    approvedOrders: PropTypes.number,
    receivedOrders: PropTypes.number,
    cancelledOrders: PropTypes.number,
    pendingValue: PropTypes.number,
    approvedValue: PropTypes.number,
    receivedValue: PropTypes.number,
    cancelledValue: PropTypes.number,
    monthlyData: PropTypes.arrayOf(
      PropTypes.shape({
        month: PropTypes.string,
        orders: PropTypes.number,
        totalValue: PropTypes.number,
      })
    ),
  }),
  timeFilter: PropTypes.string,
  activeTab: PropTypes.string,
  dataType: PropTypes.string,
  title: PropTypes.string,
  trendsTitle: PropTypes.string,
};

export default OrderCh;
