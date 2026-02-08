import React from 'react';

const HospitalDataTable = ({ data = {}, outpatient = [], total_admitted_patient }) => {
  // Calculate outpatient totals from the outpatient array
  const calculateOutpatientTotals = () => {
    let morningTotal = 0;
    let afternoonTotal = 0;
    let nightTotal = 0;
    
    if (Array.isArray(outpatient)) {
      outpatient.forEach(item => {
        const patientCount = item.patient_count || 0;
        
        switch(item.consultation_type) {
          case 'morning':
            morningTotal += patientCount;
            break;
          case 'afternoon':
            afternoonTotal += patientCount;
            break;
          case 'night':
            nightTotal += patientCount;
            break;
          default:
            break;
        }
      });
    }
    
    const total = morningTotal + afternoonTotal + nightTotal;
    
    return {
      morning: morningTotal,
      afternoon: afternoonTotal,
      night: nightTotal,
      total: total
    };
  };

  // Get calculated outpatient data
  const outpatientTotals = calculateOutpatientTotals();

  // Default values with calculated outpatient data
  const hospitalData = {
    inpatient: {
      admission: data?.inpatient?.admission || 0,
      discharge: data?.inpatient?.discharge || 0,
      current: data?.inpatient?.current || 0
    },
    outpatient: {
      morning: outpatientTotals.morning,
      afternoon: outpatientTotals.afternoon,
      night: outpatientTotals.night,
      total: outpatientTotals.total
    }
  };

  return (
    <div className="hospital-data-table w-full h-full">{}
      <div className="overflow-hidden rounded-md mb-10 mt-10 h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed  bg-white border border-gray-300">
            <thead>
              {/* Row 1: Main headers spanning multiple columns */}
              <tr>
                <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="3">
                  <div className="text-md">入院</div>
                </th>
                <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="4">
                  <div className="text-md">外来</div>
                </th>
              </tr>
              
              {/* Row 2: Subheaders with GRAY BACKGROUND */}
              <tr>
                {/* Inpatient subcategories */}
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    入院数
                  </div>
                </th>
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    退院数
                  </div>
                </th>
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    入院患者数
                  </div>
                </th>
                
                {/* Outpatient subcategories */}
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    朝診
                  </div>
                </th>
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    午後診
                  </div>
                </th>
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    当直
                  </div>
                </th>
                <th className="bg-gray-300 text-black font-bold p-2 text-center w-1/7">
                  <div className="text-xs whitespace-nowrap">
                    合計
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Single data row */}
              <tr>
                {/* Inpatient data */}
                <td className="border border-gray-300 p-2 text-center w-1/7" style={{ "height": "218px" }}>
                  <div className="text-sm font-medium text-gray-800">
                    {hospitalData.inpatient.admission}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-medium text-gray-800">
                    {hospitalData.inpatient.discharge}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-medium text-gray-800">
                    {total_admitted_patient}
                  </div>
                </td>
                
                {/* Outpatient data */}
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-medium text-gray-800">
                    {hospitalData.outpatient.morning}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-medium text-gray-800">
                    {hospitalData.outpatient.afternoon}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-medium text-gray-800">
                    {hospitalData.outpatient.night}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center w-1/7">
                  <div className="text-sm font-bold text-gray-800">
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