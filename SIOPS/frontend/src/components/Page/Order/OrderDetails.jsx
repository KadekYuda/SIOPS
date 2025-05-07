import React, { useState } from "react";
import { X, Package, CheckCircle, TrendingUp, Calendar, User, Tag, Clock } from "lucide-react";

const OrderDetails = ({ selectedOrder, orderDetails, setShowOrderDetail, formatPrice, isAdmin, onReceive }) => {
  // Status style handler
  const getStatusStyles = (status) => {
    const baseStyles = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    switch (status.toLowerCase()) {
      case "completed":
      case "received":
        return {
          className: `${baseStyles} bg-green-100 text-green-800 border border-green-200`,
          icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        };
      case "approved":
        return {
          className: `${baseStyles} bg-blue-100 text-blue-800 border border-blue-200`,
          icon: <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
        };
      case "cancelled":
        return {
          className: `${baseStyles} bg-red-100 text-red-800 border border-red-200`,
          icon: <X className="mr-1.5 h-3.5 w-3.5" />
        };
      default:
        return {
          className: `${baseStyles} bg-yellow-100 text-yellow-800 border border-yellow-200`,
          icon: <Clock className="mr-1.5 h-3.5 w-3.5" />
        };
    }
  };

  // Sample data if none provided
  const mockSelectedOrder = selectedOrder || {
    order_id: "2",
    created_at: "2025-05-03T00:00:00Z",
    user: { name: "Agik" },
    user_id: "USR001",
    order_status: "cancelled",
    total_amount: 243000
  };

  const mockOrderDetails = orderDetails?.length ? orderDetails : [
    {
      order_detail_id: "DET001",
      product_name: "Unknown Product",
      code_product: "8997016060802",
      batch_code: "A SATU BOLD-002",
      quantity: 9,
      ordered_price: 27000,
      subtotal: 243000
    }
  ];

  const statusInfo = getStatusStyles(mockSelectedOrder.order_status);
  
  // Formatting helper if not provided
  const formatPriceHelper = formatPrice || ((price) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price).replace("IDR", "Rp");
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
          <h4 className="text-xl font-bold text-gray-900 flex items-center">
            Order Details
            <div className="ml-3">
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              </span>
            </div>
            
          </h4>
          <button
            onClick={() => setShowOrderDetail(false)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Order ID Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Tag size={18} />
                </div>
                <div>
                  <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order ID</h6>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{mockSelectedOrder.order_id}</p>
                </div>
              </div>
            </div>
            
            {/* Date Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</h6>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {new Date(mockSelectedOrder.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* User Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <User size={18} />
                </div>
                <div>
                  <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">User</h6>
                  <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
                    {mockSelectedOrder.user?.name || mockSelectedOrder.user_id}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Status Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Clock size={18} />
                </div>
                <div>
                  <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</h6>
                  <div className="mt-1">
                    <span className={statusInfo.className}>
                      {statusInfo.icon}
                      {mockSelectedOrder.order_status.charAt(0).toUpperCase() +
                        mockSelectedOrder.order_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Order Items
              <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {mockOrderDetails.length}
              </span>
            </h5>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {mockOrderDetails.map((item, index) => {
                    const detailKey = item.order_detail_id || `item-${index}`;
                    return (
                      <tr
                        key={detailKey}
                        className="hover:bg-blue-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                              <Package size={16} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.product_name || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.code_product || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.batch_code || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-800">
                            {item.quantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatPriceHelper(item.ordered_price || 0)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPriceHelper(item.subtotal || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {mockOrderDetails.map((item, index) => {
                const detailKey = item.order_detail_id || `item-${index}`;
                return (
                  <div
                    key={detailKey}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                        <Package size={20} />
                      </div>
                      <h6 className="text-sm font-semibold text-gray-900">{item.product_name || "N/A"}</h6>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Code</span>
                        <p className="text-sm font-medium text-gray-800 truncate">{item.code_product || "N/A"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Batch</span>
                        <p className="text-sm font-medium text-gray-800 truncate">{item.batch_code || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Quantity</span>
                        <p className="text-sm font-medium text-gray-800">{item.quantity || 0}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Price</span>
                        <p className="text-sm font-medium text-gray-800">{formatPriceHelper(item.ordered_price || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-700">Subtotal</span>
                        <span className="text-sm font-bold text-blue-800">{formatPriceHelper(item.subtotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-blue-500 p-4 rounded-xl mb-6 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">Total Amount</span>
              <span className="text-2xl font-bold text-white">{formatPriceHelper(mockSelectedOrder.total_amount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => setShowOrderDetail(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {isAdmin && mockSelectedOrder.order_status === "approved" && (
              <button
                onClick={onReceive}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Received
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default OrderDetails;