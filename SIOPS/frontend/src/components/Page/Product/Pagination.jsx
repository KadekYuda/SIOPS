import React, { useMemo, useState, useEffect } from "react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const paginationInfo = useMemo(() => {
    const start = currentPage * itemsPerPage + 1;
    const end = Math.min((currentPage + 1) * itemsPerPage, totalItems);
    return { start, end };
  }, [currentPage, itemsPerPage, totalItems]);

  const paginationButtons = useMemo(() => {
    const buttons = [];
    const maxVisibleButtons = windowWidth < 768 ? 3 : 5;
    const showFirstLastButtons = true;

    // Tombol First (<<)
    if (showFirstLastButtons && currentPage > 2) {
      buttons.push(
        <button
          key="first"
          onClick={() => onPageChange(0)}
          className="px-2 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 md:px-3"
          title="First"
        >
          &laquo;
        </button>
      );
    }

    // Tombol Previous (<)
    buttons.push(
      <button
        key="prev"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="px-2 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 md:px-3"
        title="Previous"
      >
        &lt;
      </button>
    );

    // Logika tampilan nomor halaman
    let startPage = Math.max(
      0,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons);

    if (endPage - startPage < maxVisibleButtons) {
      startPage = Math.max(0, endPage - maxVisibleButtons);
    }

    for (let i = startPage; i < endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-2 py-1 rounded text-sm ${
            currentPage === i
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } md:px-3`}
        >
          {i + 1}
        </button>
      );
    }

    // Tombol Next (>)
    buttons.push(
      <button
        key="next"
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className="px-2 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 md:px-3"
        title="Next"
      >
        &gt;
      </button>
    );

    // Tombol Last (>>)
    if (showFirstLastButtons && currentPage < totalPages - 3) {
      buttons.push(
        <button
          key="last"
          onClick={() => onPageChange(totalPages - 1)}
          className="px-2 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 md:px-3"
          title="Last"
        >
          &raquo;
        </button>
      );
    }

    return buttons;
  }, [currentPage, totalPages, onPageChange, windowWidth]);

  return (
    <div className="flex flex-col items-center gap-3 mt-4 bg-white p-4  shadow w-full border-t">
      <div className="flex flex-col gap-2 items-center justify-between w-full px-4 py-2 sm:flex-row">
        <div className="text-sm text-gray-700 whitespace-nowrap">
          {totalItems > 0 ? (
            <>
              Showing{" "}
              <span className="font-medium">{paginationInfo.start}</span> to{" "}
              <span className="font-medium">{paginationInfo.end}</span> of{" "}
              <span className="font-medium">{totalItems}</span> entries
            </>
          ) : (
            "No entries found"
          )}
        </div>
        <div className="flex gap-1 items-center justify-center flex-wrap md:gap-2">
          {totalPages > 1 && paginationButtons}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
