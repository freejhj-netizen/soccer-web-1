import React from 'react';

export const PAGE_SIZE_OPTIONS = [30, 50, 100] as const;

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  pageSizeOptions?: readonly number[];
  showTopBar?: boolean;
  showPageNumbers?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  showTopBar = true,
  showPageNumbers = true,
}) => {
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      {showTopBar && (
        <div
          className={`flex justify-between items-center flex-wrap gap-2 ${
            !showPageNumbers || totalPages <= 1 ? 'mb-6' : 'mb-4'
          }`}
        >
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <label className="text-sm text-white whitespace-nowrap">표시 개수:</label>
            <select
              className="input-field text-sm py-1 px-2"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}개
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-400 whitespace-nowrap">
            총 {totalItems}개 중 {startIndex}-{endIndex}개 표시
          </div>
        </div>
      )}

      {showPageNumbers && totalPages > 1 && (
        <div className="flex justify-center items-center flex-wrap gap-2 mt-4 mb-6">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded min-w-[2.25rem] ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
};

export default PaginationControls;
