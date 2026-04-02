// "use client";

// import React from "react";
// import {
//   FaAngleDown,
//   FaChevronLeft,
//   FaChevronRight,
//   FaEllipsisH,
// } from "react-icons/fa";

// interface PaginationControlsProps {
//   limit: number;
//   setLimit: (newLimit: number) => void;
//   page: number;
//   setPage: (newPage: number) => void;
//   totalItems: number;
//   options?: number[];
//   maxPageButtons?: number;
// }

// export default function PaginationControls({
//   limit,
//   setLimit,
//   page,
//   setPage,
//   totalItems,
//   options = [10, 20, 50, 100],
//   maxPageButtons = 5,
// }: PaginationControlsProps) {
//   const totalPages = Math.ceil(totalItems / limit);

//   const goPrev = () => {
//     if (page > 1) setPage(page - 1);
//   };

//   const goNext = () => {
//     if (page < totalPages) setPage(page + 1);
//   };

//   const generatePageNumbers = () => {
//     const pages = [];
//     if (totalPages <= maxPageButtons) {
//       for (let i = 1; i <= totalPages; i++) pages.push(i);
//     } else {
//       pages.push(1);

//       const start = Math.max(2, page - Math.floor(maxPageButtons / 2) + 1);
//       const end = Math.min(
//         totalPages - 1,
//         page + Math.floor(maxPageButtons / 2) - 1
//       );

//       if (start > 2) pages.push("...");
//       for (let i = start; i <= end; i++) pages.push(i);
//       if (end < totalPages - 1) pages.push("...");
//       if (!pages.includes(totalPages)) pages.push(totalPages);
//     }
//     return Array.from(new Set(pages));
//   };

//   const pageNumbers = generatePageNumbers();

//   return (
//     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 px-4 bg-white rounded-xl shadow-lg border border-indigo-200 w-full">
//       {/* Left: Rows per page */}
//       <div className="flex items-center gap-2">
//         <label
//           htmlFor="rows-per-page"
//           className="text-sm font-medium text-indigo-600 whitespace-nowrap"
//         >
//           Rows per page:
//         </label>
//         <div className="relative inline-flex items-center">
//           <select
//             id="rows-per-page"
//             value={limit}
//             onChange={(e) => {
//               setLimit(Number(e.target.value));
//               setPage(1);
//             }}
//             className="appearance-none w-full min-w-[80px] py-2 pl-4 pr-10 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 cursor-pointer shadow-sm"
//           >
//             {options.map((n) => (
//               <option key={n} value={n}>
//                 {n}
//               </option>
//             ))}
//           </select>
//           <FaAngleDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
//         </div>
//       </div>

//       {/* Right: Page info + buttons */}
//       <div className="flex flex-col items-center xs:flex-row xs:justify-end gap-3 flex-wrap">
//         <span className="text-sm text-indigo-600 px-2 py-1 hidden sm:block whitespace-nowrap">
//           Page <span className="font-semibold">{page}</span> of{" "}
//           <span className="font-semibold">{totalPages}</span> (Total{" "}
//           <span className="font-semibold">{totalItems}</span> items)
//         </span>

//         <div className="flex items-center gap-1.5 sm:gap-2">
//           {/* Prev */}
//           <button
//             onClick={goPrev}
//             disabled={page === 1}
//             className="flex items-center justify-center h-9 px-3 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium shadow-sm
//                        hover:bg-indigo-50
//                        disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 min-w-[70px] sm:min-w-fit"
//           >
//             <FaChevronLeft className="mr-1" size={12} />
//             <span className="hidden xs:inline">Prev</span>
//           </button>

//           {/* Page buttons */}
//           <div className="flex items-center gap-1.5">
//             {pageNumbers.map((p, index) =>
//               p === "..." ? (
//                 <span
//                   key={`ellipsis-${index}`}
//                   className="px-2 py-1 text-indigo-400 text-sm"
//                 >
//                   <FaEllipsisH />
//                 </span>
//               ) : (
//                 <button
//                   key={p}
//                   onClick={() => setPage(Number(p))}
//                   className={`flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium shadow-sm transition-all duration-200 ${
//                     page === p
//                       ? "bg-indigo-600 text-white"
//                       : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
//                   }`}
//                   aria-label={`Go to page ${p}`}
//                 >
//                   {p}
//                 </button>
//               )
//             )}
//           </div>

//           {/* Next */}
//           <button
//             onClick={goNext}
//             disabled={page === totalPages}
//             className="flex items-center justify-center h-9 px-3 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium shadow-sm
//                        hover:bg-indigo-50
//                        disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 min-w-[70px] sm:min-w-fit"
//           >
//             <span className="hidden xs:inline">Next</span>
//             <FaChevronRight className="ml-1" size={12} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




















"use client";

import React from "react";
import { FaAngleDown, FaChevronLeft, FaChevronRight, FaEllipsisH } from "react-icons/fa";

interface PaginationControlsProps {
  limit: number;
  setLimit: (newLimit: number) => void;
  page: number;
  setPage: (newPage: number) => void;
  totalItems: number;
  options?: number[];
  maxPageButtons?: number;
}

export default function PaginationControls({
  limit,
  setLimit,
  page,
  setPage,
  totalItems,
  options = [10, 20, 50, 100],
  maxPageButtons = 5,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / limit);

  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const goNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, page - Math.floor(maxPageButtons / 2));
      let end = Math.min(totalPages - 1, page + Math.floor(maxPageButtons / 2));

      if (page - 1 <= Math.floor(maxPageButtons / 2)) {
        start = 2;
        end = maxPageButtons - 1;
      } else if (totalPages - page <= Math.floor(maxPageButtons / 2)) {
        start = totalPages - (maxPageButtons - 2);
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 px-4 bg-white rounded-xl shadow-lg border border-indigo-200 w-full">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="rows-per-page"
          className="text-sm font-medium text-indigo-600 whitespace-nowrap"
        >
          Rows per page:
        </label>
        <div className="relative inline-flex items-center">
          <select
            id="rows-per-page"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="appearance-none w-full min-w-[80px] py-2 pl-4 pr-10 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 cursor-pointer shadow-sm"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <FaAngleDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
        </div>
      </div>

      {/* Page info and controls */}
      <div className="flex flex-col items-center xs:flex-row xs:justify-end gap-3 flex-wrap">
        <span className="text-sm text-indigo-600 px-2 py-1 hidden sm:block whitespace-nowrap">
          Page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span> (Total{" "}
          <span className="font-semibold">{totalItems}</span> items)
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="flex items-center justify-center h-9 px-3 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium shadow-sm
                       hover:bg-indigo-50
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 min-w-[70px] sm:min-w-fit"
          >
            <FaChevronLeft className="mr-1" size={12} />
            <span className="hidden xs:inline">Prev</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-indigo-400 text-sm flex items-center justify-center"
                  aria-hidden="true"
                >
                  <FaEllipsisH />
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(Number(p))}
                  className={`flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium shadow-sm transition-all duration-200 ${
                    page === p
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                  }`}
                  aria-label={`Go to page ${p}`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="flex items-center justify-center h-9 px-3 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium shadow-sm
                       hover:bg-indigo-50
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 min-w-[70px] sm:min-w-fit"
          >
            <span className="hidden xs:inline">Next</span>
            <FaChevronRight className="ml-1" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}


