import React from 'react';

const VisitTable = ({ visitCount = 0 }) => {
  return (
    <div className="visit-table w-full h-full">
      <div className="overflow-hidden rounded-md mb-10 mt-10 h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed  bg-white border border-gray-300">
            <thead>
              {/* Row 1: Main header */}
              <tr>
                <th className="bg-blue-600 text-white font-bold p-2 text-center">
                  <div className="text-md">訪問</div>
                </th>
              </tr>
    
            </thead>
            
            <tbody>
              {/* Data row */}
              <tr>
                <td className="border border-gray-300 p-4 text-center" style={{ height: '75px' }}>
                  <div className="flex items-center justify-center h-full">
                    <span className="text-2xl font-bold text-gray-800">
                      {visitCount.toLocaleString()}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitTable;