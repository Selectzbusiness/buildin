import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      {/* Desktop View */}
      <table className="min-w-full divide-y divide-gray-200 hidden md:table">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {column.render
                    ? column.render(row[column.accessor])
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className="px-4 py-3 border-b border-gray-200 last:border-b-0"
              >
                <div className="text-xs font-medium text-gray-500">
                  {column.header}
                </div>
                <div className="mt-1 text-sm text-gray-900">
                  {column.render
                    ? column.render(row[column.accessor])
                    : row[column.accessor]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable; 