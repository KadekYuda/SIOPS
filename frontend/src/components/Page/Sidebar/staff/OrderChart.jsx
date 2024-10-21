import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController
);

const OrderChart = () => {
  const [orders, setOrders] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchOrderData();
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const fetchOrderData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/orders');
      const orders = response.data;
      setOrders(orders);

      // Group by date and sum the jumlahBeli
      const groupedOrders = orders.reduce((acc, order) => {
        const date = new Date(order.date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += parseInt(order.jumlahBeli, 10); // Sum jumlahBeli
        return acc;
      }, {});

      const dates = Object.keys(groupedOrders);
      const quantities = dates.map(date => groupedOrders[date]);

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(75, 192, 192, 0.2)');
      gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

      chartInstance.current = new ChartJS(chartRef.current, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Jumlah Beli per Tanggal',
              data: quantities,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: gradient,
              fill: true,
              pointBackgroundColor: 'rgba(75, 192, 192, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.4, // Add curvature to the line
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Tanggal: ${context.label}, Jumlah Beli: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: 'rgba(200, 200, 200, 0.2)',
              },
            },
            y: {
              grid: {
                display: true,
                color: 'rgba(200, 200, 200, 0.2)',
              },
              beginAtZero: true, // Ensure the y-axis starts at 0
            },
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuad',
          },
        },
      });
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };

  return (
    <div className="container mx-auto p-5 mt-5">
      <h2 className="text-2xl font-bold mb-4">Order Chart</h2>
      <div>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default OrderChart;
