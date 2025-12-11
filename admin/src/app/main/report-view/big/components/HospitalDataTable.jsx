import React from 'react';

const HospitalDataTable = ({ data = {} }) => {
  // Default values
  const hospitalData = {
    inpatient: {
      admission: data?.inpatient?.admission || 0,
      discharge: data?.inpatient?.discharge || 0,
      current: data?.inpatient?.current || 0
    },
    outpatient: {
      morning: data?.outpatient?.morning || 0,
      afternoon: data?.outpatient?.afternoon || 0,
      night: data?.outpatient?.night || 0,
      total: data?.outpatient?.total || 0
    }
  };

  return (
    <div className="hospital-data-table w-full h-full rounded-md mt-10 mb-10">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="text-center">
                <th className="bg-gray-800 text-white font-bold p-3 border-r-2 border-gray-600 w-3/7" colSpan="3">
                  <div className="text-sm lg:text-base">入院</div>
                </th>
                <th className="bg-gray-800 text-white font-bold p-3 w-4/7" colSpan="4">
                  <div className="text-sm lg:text-base">外来</div>
                </th>
              </tr>
              
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
              <tr className="text-center">
                {/* Inpatient data */}
                <td className="border border-gray-300 p-2 sm:p-3 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.inpatient.admission}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 sm:p-3 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.inpatient.discharge}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 sm:p-3 border-r-2 border-gray-300 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.inpatient.current}
                  </div>
                </td>
                
                {/* Outpatient data */}
                <td className="border border-gray-300 p-2 sm:p-3 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.outpatient.morning}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 sm:p-3 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.outpatient.afternoon}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 sm:p-3 w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">
                    {hospitalData.outpatient.night}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 sm:p-3 bg-gray-50 font-bold w-1/7">
                  <div className="text-sm sm:text-base lg:text-lg">
                    {hospitalData.outpatient.total}
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