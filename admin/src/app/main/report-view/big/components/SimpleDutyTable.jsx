import React, { useState } from 'react';

const SimpleDutyTable = () => {
  const [data, setData] = useState([
    [12, 12, 12],
    [45, 66, 78]
  ]);

  const handleCellClick = (rowIndex, colIndex) => {
    console.log(`Clicked [${rowIndex}][${colIndex}]`);
  };

  return (
    <div className="simple-duty-table w-full h-full   rounded-md mt-10 mb-10 ">
      <div className="  overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            {/* Row 1: 当直 header spanning 3 columns */}
            <thead>
              <tr>
                <th 
                  className="bg-blue-600 text-white font-bold p-3 text-center"
                  colSpan="3"
                >
                  <div className="text-sm sm:text-base lg:text-lg">当直</div>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Data rows - 2 rows with 3 columns each */}
              {data.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="border border-gray-300 p-3 sm:p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 w-1/3"
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      <div className="text-sm sm:text-base lg:text-lg font-medium">
                        {cell}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimpleDutyTable;