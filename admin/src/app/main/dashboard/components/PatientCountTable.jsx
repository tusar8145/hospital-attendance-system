import React, { useState } from 'react';

const PatientCountTable = () => {
  const [data, setData] = useState({
    internal1: {
      morning: 'x0',
      afternoon: 'x1',
      night: 'x2',
      total: 'x3'
    },
    internal2: {
      morning: 'x0',
      afternoon: 'x1',
      night: 'x2',
      total: 'x3'
    }
  });

  const handleCellClick = (section, field) => {
    console.log(`Clicked ${section}.${field}`);
  };

  // Generate 20 additional columns with empty data
  const additionalColumns = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    label: `C${i + 5}`,
    data: { 
      morning: '', 
      afternoon: '', 
      night: '', 
      total: '' 
    }
  }));

  return (
    <div className="patient-count-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 */}
              <tr className="text-center">
                {/* Column 1: Empty */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                
                {/* Column 2: Empty */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                
                {/* Column 3: 内科 */}
                <td 
                  className="border border-gray-200 bg-blue-600 text-white font-bold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">内科</div>
                </td>
                
                {/* Column 4: 内科 */}
                <td 
                  className="border border-gray-200 bg-green-600 text-white font-bold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="text-[10px]">内科</div>
                </td>
                
                {/* Additional 20 columns - Row 1 Headers */}
                {additionalColumns.map((col, index) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-gray-100 p-1"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[10px]"></div>
                  </td>
                ))}
                
                {/* Last column: Empty for Row 1 */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="text-[10px]"></div>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="text-center">
                {/* Column 1: 患者数 (spans 4 rows) */}
                <td 
                  className="border border-gray-200 bg-gray-800 text-white p-1"
                  rowSpan="4"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full">
                    <span className="block text-[10px] leading-tight">患</span>
                    <span className="block text-[10px] leading-tight">者</span>
                    <span className="block text-[10px] leading-tight">数</span>
                  </div>
                </td>
                
                {/* Column 2: 午前診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午前診</span>
                  </div>
                </td>
                
                {/* Column 3: x0 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal1', 'morning')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal1.morning}
                  </div>
                </td>
                
                {/* Column 4: x0 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-green-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal2', 'morning')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal2.morning}
                  </div>
                </td>
                
                {/* Additional 20 columns - Row 2 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.morning || '-'}
                    </div>
                  </td>
                ))}
                
                {/* Last column: x1 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="text-[11px] font-medium">x1</div>
                </td>
              </tr>
              
              {/* Row 3 */}
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
                
                {/* Column 3: x1 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal1', 'afternoon')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal1.afternoon}
                  </div>
                </td>
                
                {/* Column 4: x1 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-green-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal2', 'afternoon')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal2.afternoon}
                  </div>
                </td>
                
                {/* Additional 20 columns - Row 3 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.afternoon || '-'}
                    </div>
                  </td>
                ))}
                
                {/* Last column: x2 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="text-[11px] font-medium">x2</div>
                </td>
              </tr>
              
              {/* Row 4 */}
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
                
                {/* Column 3: x2 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal1', 'night')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal1.night}
                  </div>
                </td>
                
                {/* Column 4: x2 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-green-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal2', 'night')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal2.night}
                  </div>
                </td>
                
                {/* Additional 20 columns - Row 4 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.night || '-'}
                    </div>
                  </td>
                ))}
                
                {/* Last column: x3 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="text-[11px] font-medium">x3</div>
                </td>
              </tr>
              
              {/* Row 5 */}
              <tr className="text-center">
                {/* Column 2: 合計 */}
                <td 
                  className="border border-gray-200 bg-gray-200 font-bold p-1"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">合計</span>
                  </div>
                </td>
                
                {/* Column 3: x3 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal1', 'total')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal1.total}
                  </div>
                </td>
                
                {/* Column 4: x3 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-green-50 transition-colors duration-200"
                  style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  onClick={() => handleCellClick('internal2', 'total')}
                >
                  <div className="text-[11px] font-medium">
                    {data.internal2.total}
                  </div>
                </td>
                
                {/* Additional 20 columns - Row 5 Data */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-total-${col.id}`}
                    className="border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {col.data.total || '-'}
                    </div>
                  </td>
                ))}
                
                {/* Last column: x4 */}
                <td 
                  className="border border-gray-200 p-1 cursor-pointer hover:bg-purple-50 transition-colors duration-200"
                  style={{ width: '30px', minWidth: '30px', maxWidth: '30px' }}
                >
                  <div className="text-[11px] font-medium">x4</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientCountTable;