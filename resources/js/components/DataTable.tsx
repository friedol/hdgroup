import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  pagination?: {
    current: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
  };
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearch,
  onSort,
  pagination,
  actions,
  keyExtractor,
  emptyMessage = "No data found"
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 ${col.width || ''} ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(actions?.onView || actions?.onEdit || actions?.onDelete) && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={keyExtractor(row)} className="border-b hover:bg-slate-50 transition">
                  {columns.map(col => (
                    <td key={`${keyExtractor(row)}-${col.key}`} className="px-4 py-3 text-sm text-slate-700">
                      {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                    </td>
                  ))}
                  {(actions?.onView || actions?.onEdit || actions?.onDelete) && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {actions.onView && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => actions.onView!(row)}
                          >
                            View
                          </Button>
                        )}
                        {actions.onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => actions.onEdit!(row)}
                          >
                            Edit
                          </Button>
                        )}
                        {actions.onDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => actions.onDelete!(row)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing page {pagination.current} of {Math.ceil(pagination.total / pagination.perPage)}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.perPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
