import { X, Package, Tag, Calendar, User, TrendingUp } from "lucide-react";
import api from "../../../service/api";
import { useState, useEffect, useCallback } from "react";
import LoadingComponent from "../../LoadingComponent";
import AlertModal from "../../modal/AlertModal";

const SalesDetails = ({ isOpen, saleId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const fetchSaleDetails = useCallback(async () => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      if (response.data?.user_id) {
        // Fetch user details
        const userResponse = await api.get(`/users/${response.data.user_id}`);
        response.data.user = userResponse.data;
      }
      setSale(response.data);
    } catch (error) {
      setAlertMessage(
        error.response?.data?.msg || "Error fetching sale details"
      );
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
    }
  }, [isOpen, saleId, fetchSaleDetails]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {loading || !sale ? (
          <LoadingComponent />
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
              <h4 className="text-xl font-bold text-gray-900 flex items-center">
                Sale Details #{sale.sales_id}
              </h4>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Sale Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* User Info Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <User size={18} />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        User Info
                      </h6>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {sale?.user?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sale Info Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Tag size={18} />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Sale ID
                      </h6>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        #{sale?.sales_id}
                      </p>
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
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Date
                      </h6>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {new Date(sale?.sales_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Amount Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Total
                      </h6>
                      <p className="mt-1 text-sm font-semibold text-indigo-600">
                        {formatPrice(sale?.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale Details Table */}
              <div className="mt-8">
                <h5 className="text-base font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  Sale Items
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
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
                        <tr
                          key={detail.sales_detail_id}
                          className="hover:bg-blue-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                                <Package size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {detail.code_product}
                                </p>
                                {detail.product && (
                                  <p className="text-sm text-gray-500">
                                    {detail.product.name_product}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {detail.batch_id && detail.batch_stock ? (
                              <div className="text-sm">
                                <p className="text-gray-900 font-medium">
                                  {detail.batch_stock.batch_code}
                                </p>
                                <p className="text-gray-500">
                                  Exp:{" "}
                                  {new Date(
                                    detail.batch_stock.exp_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-800">
                              {detail.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatPrice(detail.selling_price)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {formatPrice(detail.subtotal)}
                          </td>
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
                        <div>
                          <h6 className="text-sm font-semibold text-gray-900">
                            {detail.code_product}
                          </h6>
                          {detail.product && (
                            <p className="text-sm text-gray-500">
                              {detail.product.name_product}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Batch</p>
                          {detail.batch_id && detail.batch_stock ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {detail.batch_stock.batch_code}
                              </p>
                              <p className="text-xs text-gray-500">
                                Exp:{" "}
                                {new Date(
                                  detail.batch_stock.exp_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              N/A
                            </p>
                          )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="text-sm font-medium text-gray-900">
                            {detail.quantity}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(detail.selling_price)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(detail.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AlertModal
        isOpen={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
};

export default SalesDetails;
