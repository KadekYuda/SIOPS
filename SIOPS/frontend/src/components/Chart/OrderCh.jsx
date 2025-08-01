import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
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
  dataType = "universal",
  title = "Status Distribution",
  trendsTitle = "Trends"
}) => {
  const [chartType] = useState("line");
  const [animate, setAnimate] = useState(false);

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
      (chartData.receivedOrders || chartData.received || chartData.completed || 0) +
      (chartData.cancelledOrders || chartData.cancelled || 0);

    const value =
      (chartData.pendingValue || 0) +
      (chartData.approvedValue || 0) +
      (chartData.receivedValue || chartData.completedValue || 0) +
      (chartData.cancelledValue || 0);

    return { count, value };
  }, [chartData]);

  const getPercentage = (value, type = "count") => {
    const total = totals[type];
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get time range data
  const getTimeRangeData = useMemo(() => {
    if (!chartData?.monthlyData) {
      return {
        labels: [],
        countData: [],
        valueData: [],
      };
    }

    const data = chartData.monthlyData || [];
    const months =
      timeFilter === "yearly" ? 12 : timeFilter === "monthly" ? 6 : 3;
    const recentData = data.slice(-months);

    return {
      labels: recentData.map((item) => {
        const date = new Date(item.month);
        return date.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });
      }),
      countData: recentData.map((item) => item.orders || item.count || 0),
      valueData: recentData.map((item) => item.totalValue || item.value || 0),
    };
  }, [chartData, timeFilter]);

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
    if (dataType === "sales") return ["Completed", "Pending", "Cancelled", "Returned"];
    if (dataType === "products") return ["In Stock", "Low Stock", "Out of Stock", "Reserved"];
    if (dataType === "opname") return ["Completed", "In Progress", "Pending", "Cancelled"];
    return ["Pending", "Approved", "Received", "Cancelled"]; // default for orders
  };

  const statusLabels = getStatusLabels();
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

    // Dynamic mapping based on data type
    if (dataType === "sales") {
      return {
        firstValue: chartData.completedValue || 0,
        secondValue: chartData.pendingValue || 0,
        thirdValue: chartData.cancelledValue || 0,
        fourthValue: chartData.returnedValue || 0,
      };
    } else if (dataType === "products") {
      return {
        firstValue: chartData.inStockValue || 0,
        secondValue: chartData.lowStockValue || 0,
        thirdValue: chartData.outOfStockValue || 0,
        fourthValue: chartData.reservedValue || 0,
      };
    } else if (dataType === "opname") {
      return {
        firstValue: chartData.completedValue || 0,
        secondValue: chartData.inProgressValue || 0,
        thirdValue: chartData.pendingValue || 0,
        fourthValue: chartData.cancelledValue || 0,
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

  // Get chart data based on data type
  const getChartData = () => {
    if (dataType === "sales") {
      return [
        chartData?.completed || chartData?.completedSales || 0,
        chartData?.pending || chartData?.pendingSales || 0,
        chartData?.cancelled || chartData?.cancelledSales || 0,
        chartData?.returned || chartData?.returnedSales || 0,
      ];
    } else if (dataType === "products") {
      return [
        chartData?.inStock || chartData?.inStockProducts || 0,
        chartData?.lowStock || chartData?.lowStockProducts || 0,
        chartData?.outOfStock || chartData?.outOfStockProducts || 0,
        chartData?.reserved || chartData?.reservedProducts || 0,
      ];
    } else if (dataType === "opname") {
      return [
        chartData?.completed || chartData?.completedOpname || 0,
        chartData?.inProgress || chartData?.inProgressOpname || 0,
        chartData?.pending || chartData?.pendingOpname || 0,
        chartData?.cancelled || chartData?.cancelledOpname || 0,
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
    count: {
      labels: statusLabels,
      datasets: [
        {
          data: getChartData(),
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          hoverBackgroundColor: statusColors.hover,
          borderWidth: 2,
          hoverOffset: 12,
          borderRadius: 3,
        },
      ],
    },
    value: {
      labels: statusLabels,
      datasets: [
        {
          data: [
            calculateStatusValues.firstValue,
            calculateStatusValues.secondValue,
            calculateStatusValues.thirdValue,
            calculateStatusValues.fourthValue,
          ],
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          hoverBackgroundColor: statusColors.hover,
          borderWidth: 2,
          hoverOffset: 12,
          borderRadius: 3,
        },
      ],
    },
  };

  const { labels, countData, valueData } = getTimeRangeData;
  const countMovingAverage = getMovingAverage(countData);
  const valueMovingAverage = getMovingAverage(valueData);

  // Get dynamic labels for time series
  const getTimeSeriesLabel = () => {
    if (dataType === "sales") return { count: "Sales", value: "Sales Value" };
    if (dataType === "products") return { count: "Products", value: "Product Value" };
    if (dataType === "opname") return { count: "Opnames", value: "Opname Value" };
    return { count: "Orders", value: "Order Value" }; // default
  };

  const timeLabels = getTimeSeriesLabel();

  const timeSeriesData = {
    count: {
      labels,
      datasets: [
        {
          label: timeLabels.count,
          data: countData,
          fill: chartType === "line",
          backgroundColor:
            chartType === "line"
              ? "rgba(99, 102, 241, 0.15)"
              : "rgba(99, 102, 241, 0.7)",
          borderColor: "#6366F1",
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#6366F1",
          pointBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBorderWidth: 2,
          barThickness: 24,
          borderRadius: 4,
        },
        {
          label: "Trend",
          data: countMovingAverage,
          borderColor: "#C7D2FE",
          borderWidth: 2,
          borderDash: [6, 4],
          fill: false,
          pointRadius: 0,
          tension: 0.4,
          hidden: chartType === "bar",
        },
      ],
    },
    value: {
      labels,
      datasets: [
        {
          label: timeLabels.value,
          data: valueData,
          fill: chartType === "line",
          backgroundColor:
            chartType === "line"
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(16, 185, 129, 0.7)",
          borderColor: "#10B981",
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#10B981",
          pointBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBorderWidth: 2,
          barThickness: 24,
          borderRadius: 4,
        },
        {
          label: "Value Trend",
          data: valueMovingAverage,
          borderColor: "#A7F3D0",
          borderWidth: 2,
          borderDash: [6, 4],
          fill: false,
          pointRadius: 0,
          tension: 0.4,
          hidden: chartType === "bar",
        },
      ],
    },
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          padding: 24,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 14, weight: "bold", family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            const percentage = getPercentage(value, activeTab);

            if (activeTab === "value") {
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
            return `${label}: ${value} orders (${percentage}%)`;
          },
        },
      },
    },
    cutout: "75%",
    animation: {
      animateScale: animate,
      animateRotate: animate,
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
          boxWidth: 6,
          padding: 16,
          font: { size: 11, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 13, weight: "bold", family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        bodySpacing: 6,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (activeTab === "value") {
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
            return `${context.dataset.label}: ${value} orders`;
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
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#6B7280",
          padding: 8,
          callback: function (value) {
            if (activeTab === "value") {
              return formatCurrency(value);
            }
            return value;
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#6B7280",
          padding: 8,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: animate ? 1000 : 0,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Status Distribution
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`w-3 h-3 rounded-full ${
                  activeTab === "count" ? "bg-indigo-500" : "bg-emerald-500"
                }`}
              ></span>
              {activeTab === "count" ? "Count" : "Value"}
            </div>
          </div>
          <div className="relative h-64">
            <Doughnut
              data={pieChartData[activeTab]}
              options={pieChartOptions}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {activeTab === "count"
                    ? totals.count
                    : formatCurrency(totals.value)}
                </div>
                <div className="text-sm text-gray-500">
                  Total {activeTab === "count" ? "Orders" : "Value"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Trends
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`w-3 h-3 rounded-full ${
                  chartType === "line" ? "bg-indigo-500" : "bg-indigo-600"
                }`}
              ></span>
              {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
            </div>
          </div>
          <div className="h-64">
            {chartType === "line" ? (
              <Line
                data={timeSeriesData[activeTab]}
                options={timeSeriesOptions}
              />
            ) : (
              <Bar
                data={timeSeriesData[activeTab]}
                options={timeSeriesOptions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

OrderCh.propTypes = {
  orderStats: PropTypes.shape({
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
};

export default OrderCh;
