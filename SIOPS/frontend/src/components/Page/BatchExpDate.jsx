import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../service/api";

const BatchExpDate = ({
  expDate,
  batchId,
  showOnlyDate = false,
  showStatusOnly = false,
}) => {
  const [localExpDate, setLocalExpDate] = useState(expDate);

  // Fetch data jika expDate tidak disediakan
  useEffect(() => {
    const fetchBatchData = async () => {
      if (!expDate && batchId) {
        try {
          const response = await api.get(`/batch/${batchId}`);
          const batchData = response.data.result || {};
          setLocalExpDate(batchData.exp_date || batchData.expired_date);
        } catch (error) {
          console.error("Error fetching batch data:", error);
        }
      }
    };

    fetchBatchData();
  }, [expDate, batchId]);

  // Format expiration date
  if (!localExpDate) {
    if (showStatusOnly) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-50 inline-flex items-center justify-center">
          No expiration date
        </span>
      );
    }

    return showOnlyDate ? (
      "Not set"
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-50 inline-flex items-center justify-center">
        No expiration date
      </span>
    );
  }

  const exp = new Date(localExpDate);
  const today = new Date();
  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = exp.toLocaleDateString("id-ID");

  if (showOnlyDate) {
    return formattedDate;
  }

  let expText, expColor;
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

  // Return status badge
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${expColor} inline-flex items-center justify-center`}
    >
      {expText}
    </span>
  );
};

BatchExpDate.propTypes = {
  expDate: PropTypes.string,
  batchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showOnlyDate: PropTypes.bool,
  showStatusOnly: PropTypes.bool,
};

export default BatchExpDate;
