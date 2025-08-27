import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ClipboardList } from "lucide-react";
import api from "../../../service/api";
import BatchExpDate from "../BatchExpDate";

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "scheduled":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Scheduled",
        };
      case "submitted":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Submitted",
        };
      case "adjusted":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Adjusted",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const OpnameDetail = () => {
  const { opnameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opnameData, setOpnameData] = useState(null);

  useEffect(() => {
    const fetchOpnameDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/opname/${opnameId}/details`);
        console.log("Opname detail response:", response.data);
        console.log("User data:", response.data.User);
        setOpnameData(response.data);
      } catch (err) {
        console.error("Error fetching opname detail:", err);
        setError(err.response?.data?.error || "Gagal memuat data opname");
      } finally {
        setLoading(false);
      }
    };

    if (opnameId) {
      fetchOpnameDetail();
    }
  }, [opnameId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStockDifferenceData = (systemStock, physicalStock) => {
    if (systemStock === undefined || physicalStock === undefined) {
      return { text: "N/A", class: "text-gray-500" };
    }

    const diff = physicalStock - systemStock;
    let diffText = diff.toString();
    let textColorClass = "";

    if (diff > 0) {
      diffText = `+${diff}`;
      textColorClass = "text-blue-600";
    } else if (diff < 0) {
      textColorClass = "text-red-600";
    } else {
      textColorClass = "text-green-600";
    }

    return {
      text: diffText,
      class: textColorClass,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading opname details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Go Back
        </button>
      </div>
    );
  }

  if (!opnameData) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
          <p>No opname data found.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Go Back
        </button>
      </div>
    );
  }

  // Extract data we need from the response
  const {
    status,
    batchStock,
    batch_stock,
    physical_stock,
    expired_stock,
    damaged_stock,
    notes,
    created_at,
    updated_at,
    scheduled_date,
    opname_date,
    allBatches,
    totalSystemStock,
    batchCount,
    debugInfo,
  } = opnameData;

  // Use batchStock or batch_stock, whichever is available
  const activeBatchStock = batchStock || batch_stock;

  // Create derived fields that the UI expects
  const submitted_at =
    status === "submitted" || status === "adjusted"
      ? opname_date || updated_at
      : null;
  const adjusted_at = status === "adjusted" ? updated_at : null;

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Desktop View */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClipboardList className="text-white mr-4" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Opname Details
                </h1>
                <p className="text-indigo-100">
                  Complete information about this stock opname
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-medium flex items-center transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <StatusBadge status={status} />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Input By
              </h3>
              <p
                className={`font-medium px-2 py-1 rounded-lg inline-block ${
                  opnameData.User?.role === "staff"
                    ? "text-blue-800 bg-blue-100"
                    : opnameData.User?.role === "admin"
                    ? "text-green-800 bg-green-100"
                    : "text-gray-800 bg-gray-100"
                }`}
              >
                {opnameData.User?.name || "Unknown"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Scheduled Date
              </h3>
              <p className="text-gray-800">
                {formatDate(scheduled_date || created_at)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800 flex items-center">
                <Package size={18} className="mr-2 text-indigo-600" />
                Product Details
              </h2>
            </div>
            <div className="p-4">
              {/* Show product info - use safe accessing */}
              {(activeBatchStock?.product || allBatches?.[0]?.product) && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Product
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {activeBatchStock?.product?.name_product ||
                        allBatches?.[0]?.product?.name_product ||
                        "Product name not available"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Product Code
                    </h3>
                    <p className="text-gray-800 font-mono">
                      {activeBatchStock?.product?.code_product ||
                        allBatches?.[0]?.product?.code_product ||
                        debugInfo?.productCode ||
                        "Product code not available"}
                    </p>
                  </div>
                </div>
              )}

              {/* Show all batches if available */}
              {allBatches && allBatches.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    All Batches for this Product ({batchCount} batches)
                    {debugInfo && (
                      <span className="ml-2 text-xs text-blue-600">
                        (Debug: {debugInfo.originalQuery} found)
                      </span>
                    )}
                  </h3>
                  <div className="grid gap-3">
                    {allBatches.map((batch, index) => (
                      <div
                        key={batch.batch_id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">
                              Batch Code
                            </h4>
                            <p className="text-gray-800 font-mono text-sm">
                              {batch.batch_code}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">
                              Current Stock
                            </h4>
                            <p className="text-gray-800 font-medium text-sm">
                              {batch.stock_quantity} pcs
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">
                              Expiry Date
                            </h4>
                            <BatchExpDate
                              expDate={batch.expired_date}
                              batchId={batch.batch_id}
                              showStatusOnly={true}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show debug info if available */}
                  {debugInfo && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <strong>Debug Info:</strong> Product Code:{" "}
                      {debugInfo.productCode}
                    </div>
                  )}
                </div>
              )}

              {/* Show single batch info if allBatches not available */}
              {(!allBatches || allBatches.length === 0) && activeBatchStock && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Batch Code
                    </h3>
                    <p className="text-gray-800 font-mono">
                      {activeBatchStock.batch_code}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Expiry Date
                    </h3>
                    <BatchExpDate
                      expDate={activeBatchStock.exp_date}
                      batchId={activeBatchStock.id}
                      showStatusOnly={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Stock Comparison</h2>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    System Stock
                  </h3>
                  <p className="text-gray-800 font-semibold">
                    {totalSystemStock || activeBatchStock?.stock_quantity || 0}{" "}
                    pcs
                  </p>
                  {totalSystemStock && batchCount > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total from {batchCount} batches
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <h3 className="text-xs font-medium text-blue-500 mb-1">
                    Physical Stock
                  </h3>
                  <p className="text-blue-800 font-semibold">
                    {physical_stock !== null && physical_stock !== undefined
                      ? physical_stock === 0
                        ? "0"
                        : physical_stock
                      : "Not counted"}{" "}
                    pcs
                  </p>
                </div>
                {status !== "scheduled" && (
                  <>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 mb-1">
                        Difference
                      </h3>
                      <p
                        className={`font-semibold ${
                          getStockDifferenceData(
                            totalSystemStock ||
                              activeBatchStock?.stock_quantity ||
                              0,
                            physical_stock
                          ).class
                        }`}
                      >
                        {
                          getStockDifferenceData(
                            totalSystemStock ||
                              activeBatchStock?.stock_quantity ||
                              0,
                            physical_stock
                          ).text
                        }{" "}
                        pcs
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 mb-1">
                        Final Stock
                      </h3>
                      <p
                        className={`font-semibold ${
                          physical_stock >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {physical_stock !== null && physical_stock !== undefined
                          ? physical_stock
                          : "N/A"}{" "}
                        pcs
                      </p>
                    </div>
                  </>
                )}
              </div>

              {status !== "scheduled" && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h3 className="text-xs font-medium text-red-500 mb-1">
                      Expired Stock
                    </h3>
                    <p className="text-red-800 font-semibold">
                      {expired_stock !== null && expired_stock !== undefined
                        ? expired_stock
                        : 0}{" "}
                      pcs
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <h3 className="text-xs font-medium text-orange-500 mb-1">
                      Damaged Stock
                    </h3>
                    <p className="text-orange-800 font-semibold">
                      {damaged_stock !== null && damaged_stock !== undefined
                        ? damaged_stock
                        : 0}{" "}
                      pcs
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {notes && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Notes</h2>
              </div>
              <div className="p-4">
                <p className="text-gray-700">{notes}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Timeline</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(created_at)}
                    </p>
                  </div>
                </div>

                {submitted_at && (
                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Submitted
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(submitted_at)}
                      </p>
                    </div>
                  </div>
                )}

                {adjusted_at && (
                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Adjusted
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(adjusted_at)}
                      </p>
                    </div>
                  </div>
                )}

                {updated_at && updated_at !== created_at && (
                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Last Updated
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpnameDetail;
