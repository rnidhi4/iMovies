import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// pagination = { page, totalPages } as returned by the API
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) pages.push(p);

  return (
    <nav aria-label="Pagination" className="mt-4">
      <ul className="pagination justify-content-center flex-wrap mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
            <FaChevronLeft aria-hidden="true" />
          </button>
        </li>
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPageChange(p)} aria-current={p === page ? 'page' : undefined}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
            <FaChevronRight aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
