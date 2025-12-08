import React, { useState } from 'react';

const MedicalManagementTable = () => {
  const [data, setData] = useState({
    emergency: {
      current: 10,
      hospitalization: 10,
      monthly: 10,
      cumulative: 10
    },
    nurse: {
      quasiNight: 'xxx',
      midnight: 'xxx'
    }
  });

  const handleEmergencyUpdate = () => {
    setData(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        current: 15,
        hospitalization: 15,
        monthly: 15,
        cumulative: 15
      }
    }));
  };

  const handleNurseUpdate = () => {
    setData(prev => ({
      ...prev,
      nurse: {
        quasiNight: '25',
        midnight: '25'
      }
    }));
  };

  return (
    <div className="medical-management-table w-full h-full  rounded-md mt-10 mb-10 ">
      <div className="  overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              {/* Header Row */}
              <tr className="text-center">
                {/* 緊急搬入数 header with rowspan=2 */}
                <th 
                  className="bg-red-700 text-white font-bold p-3 align-middle w-1/2"
                  rowSpan="2"
                >
                  <div className="text-xs sm:text-sm lg:text-base">緊急搬入数</div>
                </th>
                
                {/* 外来看護師 header spanning columns 2-3 */}
                <th 
                  className="bg-blue-700 text-white font-bold p-3 w-1/2"
                  colSpan="2"
                >
                  <div className="text-xs sm:text-sm lg:text-base">外来看護師</div>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Data Row 1 */}
              <tr className="text-center">
                {/* Row 1, Column 1 - 3 lines */}
                <td 
                  className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer hover:bg-red-50 transition-colors duration-200 w-1/2"
                  onClick={handleEmergencyUpdate}
                >
                  <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2">
                    <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-700 mb-1 sm:mb-2">
                      {data.emergency.current}
                    </span>
                    <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight mb-1 sm:mb-2">
                      搬入後入院件数
                    </span>
                    <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-gray-800">
                      {data.emergency.hospitalization}
                    </span>
                  </div>
                </td>
                
                {/* Row 1, Column 2 - 2 lines */}
                <td 
                  className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] w-1/4"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 leading-tight">
                      準<br />夜
                    </span>
                  </div>
                </td>
                
                {/* Row 1, Column 3 - 1 line */}
                <td 
                  className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer hover:bg-green-50 transition-colors duration-200 w-1/4"
                  onClick={handleNurseUpdate}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                      {data.nurse.quasiNight}
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Data Row 2 */}
              <tr className="text-center">
                {/* Row 2, Column 1 - 4 lines */}
                <td 
                  className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] cursor-pointer hover:bg-red-50 transition-colors duration-200 w-1/2"
                  onClick={handleEmergencyUpdate}
                >
                  <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2">
                    <div className="border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2 w-full">
                      <span className="block text-[10px] xs:text-xs sm:text-sm text-gray-600 mb-1">
                        当月緊急搬入数
                      </span>
                      <span className="block text-base sm:text-lg lg:text-xl font-bold text-red-700">
                        {data.emergency.monthly}
                      </span>
                    </div>
                    <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 mb-1">
                      搬入後入院者累計
                    </span>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">
                      {data.emergency.cumulative}
                    </span>
                  </div>
                </td>
                
                {/* Row 2, Column 2 - 2 lines */}
                <td 
                  className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] w-1/4"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 leading-tight">
                      深<br />夜
                    </span>
                  </div>
                </td>
                
                {/* Row 2, Column 3 - 1 line */}
                <td 
                  className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] cursor-pointer hover:bg-green-50 transition-colors duration-200 w-1/4"
                  onClick={handleNurseUpdate}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                      {data.nurse.midnight}
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

export default MedicalManagementTable;