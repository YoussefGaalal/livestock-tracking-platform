import { MaterialSymbol } from 'react-material-symbols';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  perPage, 
  total, 
  onPageChange, 
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100]
}) {
  const showNav = totalPages > 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#717973]">Show</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="bg-[#f4f4ef] border-none rounded-lg px-3 py-2 text-sm font-medium text-[#002819]"
        >
          {perPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span className="text-sm text-[#717973]">of {total} entries</span>
      </div>

      {showNav && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-[#f4f4ef] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialSymbol icon="first_page" size={20} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-[#f4f4ef] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialSymbol icon="chevron_left" size={20} />
          </button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#002819] text-white'
                      : 'hover:bg-[#f4f4ef] text-[#404943]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-[#f4f4ef] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialSymbol icon="chevron_right" size={20} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-[#f4f4ef] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MaterialSymbol icon="last_page" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
