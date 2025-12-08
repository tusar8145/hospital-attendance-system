import React, { useState } from 'react';

const DetailedDutyTable = () => {
  const [dutyData, setDutyData] = useState({
    security: '',
    administrative: '',
    internal: '',
    surgery: '',
    pediatric: '',
    circulatory1: '',
    circulatory2: '',
    neurosurgery: '',
    obstetrics: ''
  });

  const handleCellClick = (field) => {
    console.log(`Clicked ${field}`);
    // You can add edit functionality here if needed
  };

  const headers = [
    { key: 'security', label: '保安当直', color: 'bg-red-600' },
    { key: 'administrative', label: '医事当直', color: 'bg-gray-800' },
    { key: 'internal', label: '内科', color: 'bg-green-600' },
    { key: 'surgery', label: '外科', color: 'bg-green-600' },
    { key: 'pediatric', label: '小児', color: 'bg-green-600' },
    { key: 'circulatory1', label: '循環', color: 'bg-green-600' },
    { key: 'circulatory2', label: '循環', color: 'bg-green-600' },
    { key: 'neurosurgery', label: '脳外', color: 'bg-green-600' },
    { key: 'obstetrics', label: '産婦', color: 'bg-green-600' }
  ];

  return (
    <div className="detailed-duty-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            {/* Row 1: 当直 header spanning 9 columns */}
            <thead>
              <tr>
                <th className="bg-blue-600 text-white font-bold p-3 text-center" colSpan="9">
                  <div className="text-sm sm:text-base lg:text-lg">当直</div>
                </th>
              </tr>
              
              {/* Row 2: Column headers */}
              <tr>
                {headers.map((header) => (
                  <th 
                    key={header.key}
                    className={`text-white font-bold p-2 text-center ${header.color} w-1/9`}
                  >
                    <div className="text-xs xs:text-sm sm:text-base whitespace-nowrap">
                      {header.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* Row 3: Data row - Display cells only, no inputs */}
              <tr>
                {headers.map(header => (
                  <td 
                    key={`data-${header.key}`}
                    className="border border-gray-300 p-3 sm:p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 w-1/9"
                    onClick={() => handleCellClick(header.key)}
                  >
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-800">
                      {dutyData[header.key] || (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
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

export default DetailedDutyTable;