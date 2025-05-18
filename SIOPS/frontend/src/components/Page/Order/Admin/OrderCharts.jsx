import React, { useState, useEffect, useMemo } from "react";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Clock,
  Check,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  XCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  PieChart,
  BarChart,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OrderCharts = ({ orderStats }) => {
  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("6months");
  const [activeStatus, setActiveStatus] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState("count"); // "count" or "value"

  // Trigger animation on mount
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate totals and percentages
  const totals = useMemo(() => {
    const orderCount =
      (orderStats?.pendingOrders || 0) +
      (orderStats?.approvedOrders || 0) +
      (orderStats?.receivedOrders || 0) +
      (orderStats?.cancelledOrders || 0);

    // Use totalValue directly since individual status values aren't provided
    const orderValue = orderStats?.totalValue || 0;

    return {
      count: orderCount,
      value: orderValue,
    };
  }, [orderStats]);

  const getPercentage = (value, type = "count") => {
    const total = totals[type];
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Format currency
  const formatCurrency = (value) => {
    // Check if value is a valid number
    if (value === null || value === undefined || isNaN(Number(value))) {
      return "Rp 0";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate growth trend
  const getGrowthTrend = useMemo(() => {
    if (!orderStats?.monthlyStats || orderStats.monthlyStats.length < 2) {
      return { value: 0, isPositive: true, valueChange: 0 };
    }

    const sortedStats = [...orderStats.monthlyStats].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const lastMonth = sortedStats[sortedStats.length - 1] || {};
    const prevMonth = sortedStats[sortedStats.length - 2] || {};

    const lastCount = lastMonth?.count || 0;
    const prevCount = prevMonth?.count || 0;
    const lastValue = lastMonth?.value || 0;
    const prevValue = prevMonth?.value || 0;

    const countChange =
      prevCount === 0
        ? lastCount > 0
          ? 100
          : 0
        : ((lastCount - prevCount) / prevCount) * 100;

    const valueChange =
      prevValue === 0
        ? lastValue > 0
          ? 100
          : 0
        : ((lastValue - prevValue) / prevValue) * 100;

    return {
      count: {
        value: Math.abs(Math.round(countChange)),
        isPositive: countChange >= 0,
      },
      value: {
        value: Math.abs(Math.round(valueChange)),
        isPositive: valueChange >= 0,
        raw: lastValue - prevValue,
      },
    };
  }, [orderStats]);

  // Get time range data
  const getTimeRangeData = useMemo(() => {
    const now = new Date();
    let numMonths;
    switch (timeRange) {
      case "3months":
        numMonths = 3;
        break;
      case "12months":
        numMonths = 12;
        break;
      default:
        numMonths = 6;
    }

    const labels = [];
    const countData = new Array(numMonths).fill(0);
    const valueData = new Array(numMonths).fill(0);

    // Generate month labels first
    for (let i = numMonths - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(month.toLocaleString("default", { month: "short" }));
    }

    // Use the monthly stats from orderStats if available
    if (orderStats?.monthlyStats && orderStats.monthlyStats.length > 0) {
      orderStats.monthlyStats.forEach((stat) => {
        const date = new Date(stat.date);
        const monthLabel = date.toLocaleString("default", { month: "short" });
        const monthIndex = labels.indexOf(monthLabel);

        if (monthIndex >= 0) {
          countData[monthIndex] = stat.count || 0;

          // Estimate value based on total value proportion if not provided
          if (stat.value !== undefined) {
            valueData[monthIndex] = stat.value;
          } else if (orderStats.totalValue && orderStats.totalOrders > 0) {
            // Estimate value based on count proportion
            valueData[monthIndex] =
              (stat.count / orderStats.totalOrders) * orderStats.totalValue;
          }
        }
      });
    }

    return { labels, countData, valueData };
  }, [orderStats, timeRange]);

  // Calculate moving average
  const getMovingAverage = (data) => {
    const window = 2;
    if (data.length < window) return data;

    return data.map((val, idx, arr) => {
      if (idx < window - 1) return null;
      let sum = 0;
      for (let i = 0; i < window; i++) {
        sum += arr[idx - i];
      }
      return Math.round((sum / window) * 10) / 10;
    });
  };

  // Chart data
  const statusLabels = ["Pending", "Approved", "Received", "Cancelled"];
  const statusColors = {
    background: ["#FEF3C7", "#DBEAFE", "#D1FAE5", "#FEE2E2"],
    border: ["#F59E0B", "#3B82F6", "#10B981", "#EF4444"],
    hover: ["#FBBF24", "#60A5FA", "#34D399", "#F87171"],
  };

  const statusIcons = [
    <Clock size={18} className="text-amber-500" />,
    <Check size={18} className="text-blue-500" />,
    <Package size={18} className="text-emerald-500" />,
    <XCircle size={18} className="text-red-500" />,
  ];

  // Calculate values for each status based on proportions
  const calculateStatusValues = useMemo(() => {
    const totalCount =
      (orderStats?.pendingOrders || 0) +
      (orderStats?.approvedOrders || 0) +
      (orderStats?.receivedOrders || 0) +
      (orderStats?.cancelledOrders || 0);

    const totalValue = orderStats?.totalValue || 0;

    // Calculate proportional values based on order counts
    const pendingValue =
      totalCount > 0
        ? ((orderStats?.pendingOrders || 0) / totalCount) * totalValue
        : 0;

    const approvedValue =
      totalCount > 0
        ? ((orderStats?.approvedOrders || 0) / totalCount) * totalValue
        : 0;

    const receivedValue =
      totalCount > 0
        ? ((orderStats?.receivedOrders || 0) / totalCount) * totalValue
        : 0;

    const cancelledValue =
      totalCount > 0
        ? ((orderStats?.cancelledOrders || 0) / totalCount) * totalValue
        : 0;

    return {
      pendingValue,
      approvedValue,
      receivedValue,
      cancelledValue,
    };
  }, [orderStats]);

  const pieChartData = {
    count: {
      labels: statusLabels,
      datasets: [
        {
          data: [
            orderStats?.pendingOrders || 0,
            orderStats?.approvedOrders || 0,
            orderStats?.receivedOrders || 0,
            orderStats?.cancelledOrders || 0,
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
    value: {
      labels: statusLabels,
      datasets: [
        {
          data: [
            calculateStatusValues.pendingValue,
            calculateStatusValues.approvedValue,
            calculateStatusValues.receivedValue,
            calculateStatusValues.cancelledValue,
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

  const timeSeriesData = {
    count: {
      labels,
      datasets: [
        {
          label: "Orders",
          data: countData,
          fill: chartType === "line" ? true : false,
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
          label: "Order Value",
          data: valueData,
          fill: chartType === "line" ? true : false,
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
            const value = context.raw;
            const isValueTab = activeTab === "value";
            const percentage = getPercentage(value, activeTab);

            if (isValueTab) {
              return `${context.label}: ${formatCurrency(
                value
              )} (${percentage}%)`;
            } else {
              return `${context.label}: ${value} (${percentage}%)`;
            }
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
            if (activeTab === "value") {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
            return `${context.dataset.label}: ${context.raw}`;
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
              return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                notation: "compact",
                compactDisplay: "short",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
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

  // Status Card component
  const StatusCard = ({
    title,
    count,
    value,
    icon,
    percentage,
    color,
    onClick,
    isActive,
  }) => (
    <div
      className={`bg-white p-4 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer
        ${
          isActive
            ? `border-${color}-400 ring-2 ring-${color}-100`
            : "border-gray-100 hover:border-gray-200 hover:shadow-md"
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <span className={`p-2 rounded-full bg-${color}-50`}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-900 mb-1">{count}</span>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">
            {percentage}% of total
          </span>
          <span className="text-xs font-medium text-emerald-600">
            {value !== undefined && value !== null
              ? formatCurrency(value)
              : "Rp 0"}
          </span>
        </div>
      </div>
    </div>
  );

  // Get current period
  const { month, year } = useMemo(() => {
    const now = new Date();
    return {
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
    };
  }, []);

  // ValueCard component
  const ValueCard = ({
    title,
    value,
    subvalue,
    icon,
    trend,
    color = "indigo",
  }) => (
    <div className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-${color}-100`}>{icon}</div>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-900 mb-1">{value}</span>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{subvalue}</span>
          {trend && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
                trend.isPositive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight size={14} className="mr-1" />
              ) : (
                <ArrowDownRight size={14} className="mr-1" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-2 sm:p-4 bg-gray-50">
      {/* Header */}
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Orders Overview
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Performance and status analysis
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
            <Calendar size={16} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">
              {month} {year}
            </span>
          </div>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {" "}
          <ValueCard
            title="Total Orders"
            value={orderStats.totalOrders}
            subvalue={`${orderStats.totalOrders} orders this period`}
            icon={<BarChart size={20} className="text-indigo-500" />}
            trend={{ isPositive: true, value: 0 }}
            color="indigo"
          />
          <ValueCard
            title="Total Value"
            value={formatCurrency(orderStats.totalValue || 0)}
            subvalue={`Average: ${formatCurrency(
              (orderStats.totalValue || 0) / (orderStats.totalOrders || 1)
            )} per order`}
            icon={<DollarSign size={20} className="text-emerald-500" />}
            trend={{ isPositive: true, value: 0 }}
            color="emerald"
          />
          <ValueCard
            title="Monthly Change"
            value={formatCurrency(orderStats.totalValue || 0)}
            subvalue="Current Month"
            icon={<TrendingUp size={20} className="text-blue-500" />}
            color="blue"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {statusLabels.map((label, index) => {
          // Ensure values are valid numbers
          const countValue = pieChartData.count.datasets[0].data[index] || 0;
          const valueAmount = pieChartData.value.datasets[0].data[index] || 0;

          // Calculate percentage based on count
          const percentageValue = getPercentage(countValue);

          return (
            <StatusCard
              key={label}
              title={`${label} Orders`}
              count={countValue}
              value={valueAmount}
              icon={statusIcons[index]}
              percentage={percentageValue}
              color={["amber", "blue", "emerald", "red"][index]}
              onClick={() =>
                setActiveStatus(
                  activeStatus === label.toLowerCase()
                    ? null
                    : label.toLowerCase()
                )
              }
              isActive={activeStatus === label.toLowerCase()}
            />
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Order Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6 gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900 text-lg">
                {activeTab === "count" ? "Order Trends" : "Value Trends"}
              </h3>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              <div className="flex rounded-md overflow-hidden border border-gray-200 bg-white mr-2 sm:mr-4">
                <button
                  onClick={() => setActiveTab("count")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                    activeTab === "count"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <BarChart3 size={14} className="mr-1" />
                  Count
                </button>
                <button
                  onClick={() => setActiveTab("value")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                    activeTab === "value"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <DollarSign size={14} className="mr-1" />
                  Value
                </button>
              </div>
              <div className="flex rounded-md overflow-hidden border border-gray-200 bg-white mr-2">
                {["3months", "6months", "12months"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      timeRange === range
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {range === "3months"
                      ? "3M"
                      : range === "6months"
                      ? "6M"
                      : "1Y"}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md overflow-hidden border border-gray-200 bg-white">
                {["line", "bar"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                      chartType === type
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type === "line" ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : (
                      <BarChart size={14} className="mr-1" />
                    )}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[250px] sm:h-[280px] md:h-[300px]">
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

        {/* Status Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                Order Status Distribution
              </h3>
            </div>
            <div className="flex rounded-md overflow-hidden border border-gray-200 bg-white">
              <button
                onClick={() => setActiveTab("count")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "count"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <BarChart3 size={14} className="mr-1" />
                Count
              </button>
              <button
                onClick={() => setActiveTab("value")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "value"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <DollarSign size={14} className="mr-1" />
                Value
              </button>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center relative">
            <Pie data={pieChartData[activeTab]} options={pieChartOptions} />
            <div className="absolute text-center">
              <span className="block text-2xl font-bold text-gray-900">
                {activeTab === "count"
                  ? totals.count
                  : formatCurrency(totals.value)}
              </span>
              <span className="block text-sm text-gray-500">
                {activeTab === "count" ? "Total Orders" : "Total Value"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Information */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {statusLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full bg-${
                  ["amber", "blue", "emerald", "red"][index]
                }-500`}
              ></div>
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-medium text-gray-800">
                {activeTab === "count"
                  ? `${pieChartData.count.datasets[0].data[index]} orders`
                  : formatCurrency(pieChartData.value.datasets[0].data[index])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderCharts;
