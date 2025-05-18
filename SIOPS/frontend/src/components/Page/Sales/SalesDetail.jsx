import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag, Calendar, DollarSign, Package, ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../service/api";
import AlertModal from "../../modal/AlertModal";
import LoadingComponent from "../../LoadingComponent";

// Animation variants
const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const contentVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    scale: 0.95, 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const SalesDetail = () => {
  const [sale, setSale] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      const response = await api.get(`/sales/${id}`);
      setSale(response.data);
    } catch (error) {
      setAlertMessage(
        error.response?.data?.msg || "Error fetching sale details"
      );
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading || !sale) {
    return <LoadingComponent />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="modal-backdrop"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            key="modal-content"
            variants={contentVariants}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
              <h4 className="text-xl font-bold text-gray-900 flex items-center">
                Sale Details
                <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  #{sale.sales_id}
                </span>
              </h4>
              <button
                onClick={() => navigate("/sales")}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Sale Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Sale ID Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Tag size={18} />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sale ID</h6>
                      <p className="mt-1 text-sm font-semibold text-gray-900">#{sale.sales_id}</p>
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
                        {new Date(sale.sales_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Amount Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</h6>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(sale.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale Items */}
              <div className="mb-8">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Sale Items
                  <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {sale.sales_details.length}
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
                      {sale.sales_details.map((detail) => (
                        <tr key={detail.sales_detail_id} className="hover:bg-blue-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                                <Package size={16} />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{detail.code_product}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{detail.batch_id || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-800">
                              {detail.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(detail.selling_price)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(detail.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {sale.sales_details.map((detail) => (
                    <div
                      key={detail.sales_detail_id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                          <Package size={20} />
                        </div>
                        <h6 className="text-sm font-semibold text-gray-900">{detail.code_product}</h6>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Batch</p>
                          <p className="text-sm font-medium text-gray-900">{detail.batch_id || "N/A"}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="text-sm font-medium text-gray-900">{detail.quantity}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="text-sm font-medium text-gray-900">{formatPrice(detail.selling_price)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                          <p className="text-sm font-medium text-gray-900">{formatPrice(detail.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount Section */}
              <div className="border-t border-gray-200 pt-6 mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-xl font-bold text-gray-900">{sale.sales_details.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">{formatPrice(sale.total_amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Error"
        message={alertMessage}
      />
    </>
  );
};

export default SalesDetail;
