import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from './Button.tsx';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  pageSize?: number;
  rowActions?: (row: T) => React.ReactNode;
  filterComponent?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchField,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No records found.',
  emptyAction,
  pageSize = 10,
  rowActions,
  filterComponent,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchField) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) => searchField(item).toLowerCase().includes(q));
  }, [data, searchQuery, searchField]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      const compare = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className={`bg-white rounded-[16px] border border-[#E3EAE6] overflow-hidden shadow-[0_1px_2px_rgba(16,37,31,0.06)] ${className}`}>
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-[#E3EAE6] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6B66]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-[#F6F9F6] border border-[#E3EAE6] rounded-[10px] text-[#10251F] placeholder-[#5B6B66] focus:outline-none focus:ring-2 focus:ring-[#1F4D3F] focus:border-transparent transition-all"
          />
        </div>
        {filterComponent && <div className="w-full sm:w-auto flex items-center gap-2">{filterComponent}</div>}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[220px]">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#F6F9F6] animate-pulse rounded-[8px]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#B91C1C] mb-2" />
            <p className="text-sm font-semibold text-[#10251F]">Failed to load records</p>
            <p className="text-xs text-[#5B6B66] mt-1 max-w-sm">{error}</p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="mt-4">
                Retry
              </Button>
            )}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-[#10251F]">{emptyMessage}</p>
            {emptyAction && (
              <Button size="sm" variant="primary" onClick={emptyAction.onClick} className="mt-4">
                {emptyAction.label}
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F9F6] border-b border-[#E3EAE6] text-xs font-semibold text-[#5B6B66]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-4 py-3.5 select-none ${
                      col.sortable ? 'cursor-pointer hover:text-[#10251F]' : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={`inline-flex items-center gap-1 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.key && (
                        <span>
                          {sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3.5 text-right w-24">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE6] text-xs md:text-sm text-[#10251F]">
              {paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-[#F6F9F6]/80 transition-colors h-14"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && !error && paginatedData.length > 0 && (
        <div className="p-3.5 border-t border-[#E3EAE6] bg-[#F6F9F6] flex items-center justify-between text-xs text-[#5B6B66]">
          <span className="font-mono tabular-nums">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[8px] border border-[#E3EAE6] bg-white text-[#10251F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6F9F6] transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono tabular-nums font-medium text-[#10251F]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[8px] border border-[#E3EAE6] bg-white text-[#10251F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6F9F6] transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
