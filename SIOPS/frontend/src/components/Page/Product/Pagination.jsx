import React, { useMemo, useState, useEffect } from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paginationButtons = useMemo(() => {
    const buttons = [];
    const maxVisibleButtons = windowWidth < 768 ? 3 : 5;
    const showFirstLastButtons = windowWidth >= 480;

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
    let startPage = Math.max(0, currentPage - Math.floor(maxVisibleButtons / 2));
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
    <div className="flex gap-1 items-center justify-center flex-wrap md:gap-2">
      {totalPages > 1 && paginationButtons}
    </div>
  );
};

export default Pagination;