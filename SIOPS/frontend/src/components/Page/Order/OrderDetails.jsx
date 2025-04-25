import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

const OrderDetails = ({
  selectedOrder,
  orderDetails,
  setShowOrderDetail,
  formatPrice,
  isAdmin,
  onReceive,
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-bold">Order Details</h4>
        <button
          onClick={() => setShowOrderDetail(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-1">Order ID</h5>
          <p className="text-gray-900">{selectedOrder.order_id}</p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-1">Date</h5>
          <p className="text-gray-900">
            {new Date(selectedOrder.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-1">User</h5>
          <p className="text-gray-900">
            {selectedOrder.user?.name || selectedOrder.user_id}
          </p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-1">Status</h5>
          <p
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${
              selectedOrder.order_status === "completed" ||
              selectedOrder.order_status === "received"
                ? "bg-green-100 text-green-800"
                : selectedOrder.order_status === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {selectedOrder.order_status.charAt(0).toUpperCase() +
              selectedOrder.order_status.slice(1)}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h5 className="text-lg font-medium mb-4">Order Items</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Batch
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderDetails.length > 0 ? (
                orderDetails.map((item) => {
                  const detailKey =
                    item.order_detail_id ||
                    `${item.code_product}-${item.batch_id}`;
                  return (
                    <tr key={detailKey}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.product_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.code_product || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.batch_code || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(item.ordered_price || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(item.subtotal || 0)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    No items data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex justify-between font-medium">
          <span>Total Amount:</span>
          <span>{formatPrice(selectedOrder.total_amount)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setShowOrderDetail(false)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
        {isAdmin && selectedOrder.order_status === "approved" && (
          <button
            onClick={onReceive}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Mark as Received
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default OrderDetails;
