import React from 'react';
import Spinner from './Spinner';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-6 py-3.5 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                <Spinner size="lg" className="text-indigo-600 mb-2 inline-block" />
                <p className="text-sm font-medium text-slate-500">Loading data...</p>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-slate-50/80 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
