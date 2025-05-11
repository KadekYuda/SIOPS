import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../service/api";
import AlertModal from "../../modal/AlertModal";

const SalesDetail = () => {
  const [sale, setSale] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
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
    }
  };

  if (!sale) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sale Details #{sale.sales_id}</h1>
        <button
          onClick={() => navigate("/sales")}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Back to Sales
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            Transaction Information
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Date:</span>{" "}
              {new Date(sale.sales_date).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Total Amount:</span>{" "}
              {sale.total_amount.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border p-2">Product Code</th>
                <th className="border p-2">Batch ID</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.sales_details.map((detail) => (
                <tr key={detail.sales_detail_id}>
                  <td className="border p-2">{detail.code_product}</td>
                  <td className="border p-2">{detail.batch_id}</td>
                  <td className="border p-2">{detail.quantity}</td>
                  <td className="border p-2">
                    {detail.selling_price.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })}
                  </td>
                  <td className="border p-2">
                    {detail.subtotal.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertModal
        isOpen={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
};

export default SalesDetail;
