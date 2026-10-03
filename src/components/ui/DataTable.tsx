import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  highlightRowIndex?: number;
  emptyText?: string;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  highlightRowIndex = 0,
  emptyText = 'No data available',
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[rgba(248,244,233,0.08)] text-[rgba(248,244,233,0.5)] font-bold uppercase tracking-wider">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-3.5 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(248,244,233,0.04)] font-medium">
          {data.length > 0 ? (
            data.map((row, idx) => {
              const isHighlighted = idx === highlightRowIndex;

              return (
                <tr
                  key={row.id ? String(row.id) : idx}
                  onClick={() => onRowClick?.(row, idx)}
                  className={`transition-all duration-200 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isHighlighted
                      ? 'bg-[rgba(248,244,233,0.12)] border-[rgba(246,219,192,0.35)] shadow-[0_0_15px_rgba(246,219,192,0.1)] text-[#F8F4E9]'
                      : 'hover:bg-[rgba(147,80,115,0.15)] text-[rgba(248,244,233,0.85)]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-3.5 ${
                        col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : (row as any)[col.key] !== undefined
                        ? String((row as any)[col.key])
                        : '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-[rgba(248,244,233,0.45)]">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
