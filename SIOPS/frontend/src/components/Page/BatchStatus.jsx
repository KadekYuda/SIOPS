import React, { useState, useEffect } from "react";
import api from "../../service/api";

const BatchStatus = ({ stockQuantity, expDate, batchId }) => {
  const [localStockQuantity, setLocalStockQuantity] = useState(stockQuantity);
  const [localExpDate, setLocalExpDate] = useState(expDate);

  // Fetch data jika stockQuantity atau expDate tidak disediakan
  useEffect(() => {
    const fetchBatchData = async () => {
      if (!stockQuantity || !expDate) {
        try {
          const response = await api.get(`/batch/${batchId}`);
          const batchData = response.data.result || {};
          setLocalStockQuantity(batchData.stock_quantity);
          setLocalExpDate(batchData.exp_date);
        } catch (error) {
          console.error("Error fetching batch data:", error);
        }
      }
    };

    if (batchId) fetchBatchData();
  }, [stockQuantity, expDate, batchId]);

  // Status untuk Stock Quantity
  const stockValue = parseInt(localStockQuantity || 0);
  let stockColor, stockText;
  if (stockValue === 0) {
    stockColor = "bg-red-50 text-red-500";
    stockText = `${stockValue} pcs`;
  } else if (stockValue < 10) {
    stockColor = "bg-amber-50 text-amber-500";
    stockText = `${stockValue} pcs`;
  } else {
    stockColor = "bg-green-50 text-green-500";
    stockText = `${stockValue} pcs`;
  }

  // Status untuk Expiration Date
  let expText, expColor;
  if (!localExpDate) {
    expText = "-";
    expColor = "";
  } else {
    const exp = new Date(localExpDate);
    const today = new Date();
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = exp.toLocaleDateString();

    if (diffDays <= 0) {
      expText = `Expired (${formattedDate})`;
      expColor = "text-red-500 bg-red-50";
    } else if (diffDays <= 30) {
      expText = `${diffDays} days left (${formattedDate})`;
      expColor = "text-amber-500 bg-amber-50";
    } else if (diffDays <= 90) {
      expText = `${diffDays} days left (${formattedDate})`;
      expColor = "text-blue-500 bg-blue-50";
    } else {
      expText = formattedDate;
      expColor = "text-green-500 bg-green-50";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${stockColor}`}
      >
        {stockText}
      </span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${expColor}`}
      >
        {expText}
      </span>
    </div>
  );
};

export default BatchStatus;
