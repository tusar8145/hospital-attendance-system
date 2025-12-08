import React, { useState } from 'react';

const DiagnosisTable = () => {
  const [data, setData] = useState({
    diagnosis1: {
      morning: 'x1',
      afternoon: 'x2',
      night: 'x3'
    },
    diagnosis2: {
      morning: 'x1',
      afternoon: 'x2',
      night: 'x3'
    }
  });

  const handleCellClick = (diagnosis, time) => {
    console.log(`Clicked ${diagnosis}.${time}`);
  };

  // Generate 25 additional columns with empty data
  const additionalColumns = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    label: `C${i + 5}`,
    data: { morning: '', afternoon: '', night: '' }
  }));

  return (
    <div className="diagnosis-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 */}
              <tr className="text-center">
                {/* Column 1: 診察担当医 (spans 5 rows) - 50% narrower */}
                <td 
                  className="border border-gray-200 bg-gray-800 text-white p-1"
                  rowSpan="5"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full">
                    <span className="block text-[10px] leading-tight">診</span>
                    <span className="block text-[10px] leading-tight">察</span>
                    <span className="block text-[10px] leading-tight">担</span>
                    <span className="block text-[10px] leading-tight">当</span>
                    <span className="block text-[10px] leading-tight">医</span>
                  </div>
                </td>
                
                {/* Column 2: Empty (spans 2 rows) */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  rowSpan="2"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                
                {/* Column 3: 診１ */}
                <td 
                  className="border border-gray-200 bg-blue-600 text-white font-bold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">診１</div>
                </td>
                
                {/* Column 4: 診２ */}
                <td 
                  className="border border-gray-200 bg-red-600 text-white font-bold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">診２</div>
                </td>
                
                {/* Additional 25 columns - Row 1 Headers */}
                {additionalColumns.map((col) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-purple-600 text-white font-bold p-1"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[10px]">{col.label}</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 2 */}
              <tr className="text-center">
                {/* Column 3: 内科 */}
                <td 
                  className="border border-gray-200 bg-blue-500 text-white font-semibold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">内科</div>
                </td>
                
                {/* Column 4: 準内 */}
                <td 
                  className="border border-gray-200 bg-red-500 text-white font-semibold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">準内</div>
                </td>
                
                {/* Additional 25 columns - Row 2 Sub-headers */}
                {additionalColumns.map((col) => (
                  <td
                    key={`subheader-${col.id}`}
                    className="border border-gray-200 bg-purple-500 text-white font-semibold p-1"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[10px]">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 3 */}
              <tr className="text-center">
                {/* Column 2: 午前診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午前診</span>
                  </div>
                </td>
                
                {/* Column 3: x1 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis1', 'morning')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis1.morning}
                  </div>
                </td>
                
                {/* Column 4: x1 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-red-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis2', 'morning')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis2.morning}
                  </div>
                </td>
                
                {/* Additional 25 columns - Row 3 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.morning || '-'}
                    </div>
                  </td>
                ))}
              </tr>
              
              {/* Row 4 */}
              <tr className="text-center">
                {/* Column 2: 午後診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午後診</span>
                  </div>
                </td>
                
                {/* Column 3: x2 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis1', 'afternoon')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis1.afternoon}
                  </div>
                </td>
                
                {/* Column 4: x2 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-red-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis2', 'afternoon')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis2.afternoon}
                  </div>
                </td>
                
                {/* Additional 25 columns - Row 4 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.afternoon || '-'}
                    </div>
                  </td>
                ))}
              </tr>
              
              {/* Row 5 */}
              <tr className="text-center">
                {/* Column 2: 夜診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">夜診</span>
                  </div>
                </td>
                
                {/* Column 3: x3 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis1', 'night')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis1.night}
                  </div>
                </td>
                
                {/* Column 4: x3 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-red-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('diagnosis2', 'night')}
                >
                  <div className="text-[11px] font-medium">
                    {data.diagnosis2.night}
                  </div>
                </td>
                
                {/* Additional 25 columns - Row 5 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.night || '-'}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisTable;