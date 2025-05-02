import React, { useState, useEffect, useCallback } from "react";
import Pagination from "./Pagination";
import api from "../../../service/api";
import { Search } from "lucide-react";

const BatchStok = () => {
  const [batchStok, setBatchStok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0); // Add new state for total items

  const fetchBatchStok = useCallback(async () => {
    try {
      setLoading(true);
      // No need to manually include the token as it will be sent automatically in the cookies
      const response = await api.get(
        `/batch/stock?page=${page}&limit=${limit}&search=${encodeURIComponent(
          searchTerm
        )}`
      );
      setBatchStok(response.data.result || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalItems(response.data.totalRows || 0); // Add this line
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batch stock:", error);
      setLoading(false);
    }
  }, [page, limit, searchTerm]);

  useEffect(() => {
    fetchBatchStok();
  }, [fetchBatchStok]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const formatLargeNumber = (number) => {
    if (!number) return "";

    // Convert to string and remove any scientific notation
    const str = String(number);
    if (str.includes("E+")) {
      const [mantissa, exponent] = str.split("E+");
      const decimalPoints = mantissa.includes(".")
        ? mantissa.split(".")[1].length
        : 0;
      const num = parseFloat(mantissa);
      const exp = parseInt(exponent);

      // Convert to full number string
      let result = num.toString().replace(".", "");
      const zerosToAdd = exp - decimalPoints;
      result += "0".repeat(Math.max(0, zerosToAdd));

      return result;
    }

    return str;
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Batch Stock</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by product name, or code."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="flex md:hidden justify-end mb-4">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arrival Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiration Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(() => {
              if (loading) {
                return (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (batchStok.length > 0) {
                return batchStok.map((batch, index) => (
                  <tr key={batch.batch_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1 + page * limit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatLargeNumber(
                        batch.code_product ||
                          (batch.Product && batch.Product.code_product)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.batch_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {Number(batch.purchase_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseInt(batch.stock_quantity || 0) +
                        parseInt(batch.initial_stock || 0)}{" "}
                      pcs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.arrival_date
                        ? new Date(batch.arrival_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.exp_date
                        ? new Date(batch.exp_date).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ));
              }

              return (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No batch stock found
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
      <div className="mt-4 hidden md:flex justify-between items-center">
        <div>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0); // Reset to first page when changing limit
            }}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={limit}
        totalItems={totalItems}
      />
    </div>
  );
};

export default BatchStok;
