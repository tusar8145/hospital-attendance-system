import React, { useState } from 'react';

const HospitalDataTable = () => {
  const [data, setData] = useState({
    inpatient: {
      admission: 22,
      discharge: 12,
      current: 37
    },
    outpatient: {
      morning: 54,
      afternoon: 99,
      night: 88,
      total: 77
    }
  });

  const calculateTotal = () => {
    const total = data.outpatient.morning + data.outpatient.afternoon + data.outpatient.night;
    setData(prev => ({
      ...prev,
      outpatient: { ...prev.outpatient, total }
    }));
  };

  const handleCellClick = (section, field) => {
    console.log(`Clicked ${section}.${field}`);
  };

  return (
    <div className="hospital-data-table w-full h-full   rounded-md mt-10 mb-10 ">
      <div className="  overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            {/* Row 1: Main Categories */}
            <thead>
              <tr className="text-center">
                <th className="bg-gray-800 text-white font-bold p-3 border-r-2 border-gray-600 w-3/7" colSpan="3">
                  <div className="text-sm lg:text-base">入院</div>
                </th>
                <th className="bg-gray-800 text-white font-bold p-3 w-4/7" colSpan="4">
                  <div className="text-sm lg:text-base">外来</div>
                </th>
              </tr>
              
              {/* Row 2: Subcategories */}
              <tr className="text-center">
                {/* Inpatient subcategories */}
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm w-1/7">
                  入院数
                </th>
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm w-1/7">
                  退院数
                </th>
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm border-r-2 border-gray-300 w-1/7">
                  入院患者数
                </th>
                
                {/* Outpatient subcategories */}
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm w-1/7">
                  朝診
                </th>
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm w-1/7">
                  午後診
                </th>
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm w-1/7">
                  当直
                </th>
                <th className="bg-gray-100 text-gray-800 font-semibold p-2 text-xs sm:text-sm bg-gray-50 font-bold w-1/7">
                  合計
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Row 3: Data */}
              <tr className="text-center">
                {/* Inpatient data */}
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 w-1/7"
                  onClick={() => handleCellClick('inpatient', 'admission')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.inpatient.admission}
                  </div>
                </td>
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 w-1/7"
                  onClick={() => handleCellClick('inpatient', 'discharge')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.inpatient.discharge}
                  </div>
                </td>
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 border-r-2 border-gray-300 w-1/7"
                  onClick={() => handleCellClick('inpatient', 'current')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.inpatient.current}
                  </div>
                </td>
                
                {/* Outpatient data */}
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 w-1/7"
                  onClick={() => handleCellClick('outpatient', 'morning')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.outpatient.morning}
                  </div>
                </td>
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 w-1/7"
                  onClick={() => handleCellClick('outpatient', 'afternoon')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.outpatient.afternoon}
                  </div>
                </td>
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 w-1/7"
                  onClick={() => handleCellClick('outpatient', 'night')}
                >
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {data.outpatient.night}
                  </div>
                </td>
                <td 
                  className="border border-gray-300 p-2 sm:p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 bg-gray-50 font-bold w-1/7"
                  onClick={calculateTotal}
                >
                  <div className="text-sm sm:text-base lg:text-lg">
                    {data.outpatient.total}
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

export default HospitalDataTable;