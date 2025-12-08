import React from 'react';

const VisitTable = () => {
  const visitCount = 56546;

  return (
    <div className="visit-table w-full h-full   rounded-md mt-10 mb-10 ">
      <div className="  overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="bg-purple-700 text-white font-bold p-3 text-center">
                  <div className="text-sm sm:text-base lg:text-lg">訪問</div>
                </th>
              </tr>
            </thead>
            
            {/* Data Rows - 2 rows matching SimpleDutyTable structure */}
            <tbody>
              <tr>
                <td 
                  className="border border-gray-300 text-center align-middle h-full"
                  rowSpan="2"
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm sm:text-base lg:text-lg font-medium">
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