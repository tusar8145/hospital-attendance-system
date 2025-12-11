import React from 'react';

const PatientCountTable = ({ patientData = {} }) => {
  // Get unique department names
  const departments = Object.keys(patientData);

  // Calculate totals
  const calculateTotals = () => {
    const totals = { morning: 0, afternoon: 0, night: 0 };
    
    departments.forEach(dept => {
      totals.morning += patientData[dept]?.morning || 0;
      totals.afternoon += patientData[dept]?.afternoon || 0;
      totals.night += patientData[dept]?.night || 0;
    });
    
    totals.total = totals.morning + totals.afternoon + totals.night;
    return totals;
  };

  const totals = calculateTotals();

  // Generate additional empty columns
  const additionalColumns = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    label: `C${i + 5}`
  }));

  // Color classes for departments
  const getColorClass = (index) => {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600'];
    return colors[index % colors.length];
  };

  const getHoverColorClass = (index) => {
    const colors = ['hover:bg-blue-50', 'hover:bg-green-50', 'hover:bg-yellow-50', 'hover:bg-purple-50'];
    return colors[index % colors.length];
  };

  return (
    <div className="patient-count-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 - Headers */}
              <tr className="text-center">
                {/* Empty column */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '30px' }}
                ></td>
                
                {/* Empty column */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '40px' }}
                ></td>
                
                {/* Department headers */}
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`dept-header-${index}`}
                    className={`border border-gray-200 ${getColorClass(index)} text-white font-bold p-1`}
                    style={{ width: '40px' }}
                  >
                    <div className="text-[10px]">{dept}</div>
                  </td>
                ))}
                
                {/* Additional columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-gray-100 p-1"
                    style={{ width: '30px' }}
                  ></td>
                ))}
                
                {/* Last empty column */}
                <td 
                  className="border border-gray-200 bg-gray-100 p-1"
                  style={{ width: '30px' }}
                ></td>
              </tr>
              
              {/* Row 2: Morning Patients */}
              <tr className="text-center">
                {/* 患者数 header */}
                <td 
                  className="border border-gray-200 bg-gray-800 text-white p-1"
                  rowSpan="4"
                  style={{ width: '30px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full">
                    <span className="block text-[10px] leading-tight">患</span>
                    <span className="block text-[10px] leading-tight">者</span>
                    <span className="block text-[10px] leading-tight">数</span>
                  </div>
                </td>
                
                {/* 午前診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午前診</span>
                  </div>
                </td>
                
                {/* Department data */}
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className={`border border-gray-200 p-1 ${getHoverColorClass(index)}`}
                    style={{ width: '40px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {patientData[dept]?.morning || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[11px]">-</div>
                  </td>
                ))}
                
                {/* Total column */}
                <td 
                  className="border border-gray-200 p-1 bg-purple-50"
                  style={{ width: '30px' }}
                >
                  <div className="text-[11px] font-medium">{totals.morning}</div>
                </td>
              </tr>
              
              {/* Row 3: Afternoon Patients */}
              <tr className="text-center">
                {/* 午後診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午後診</span>
                  </div>
                </td>
                
                {/* Department data */}
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className={`border border-gray-200 p-1 ${getHoverColorClass(index)}`}
                    style={{ width: '40px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {patientData[dept]?.afternoon || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[11px]">-</div>
                  </td>
                ))}
                
                {/* Total column */}
                <td 
                  className="border border-gray-200 p-1 bg-purple-50"
                  style={{ width: '30px' }}
                >
                  <div className="text-[11px] font-medium">{totals.afternoon}</div>
                </td>
              </tr>
              
              {/* Row 4: Night Patients */}
              <tr className="text-center">
                {/* 夜診 */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">夜診</span>
                  </div>
                </td>
                
                {/* Department data */}
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className={`border border-gray-200 p-1 ${getHoverColorClass(index)}`}
                    style={{ width: '40px' }}
                  >
                    <div className="text-[11px] font-medium">
                      {patientData[dept]?.night || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[11px]">-</div>
                  </td>
                ))}
                
                {/* Total column */}
                <td 
                  className="border border-gray-200 p-1 bg-purple-50"
                  style={{ width: '30px' }}
                >
                  <div className="text-[11px] font-medium">{totals.night}</div>
                </td>
              </tr>
              
              {/* Row 5: Totals */}
              <tr className="text-center">
                {/* 合計 */}
                <td 
                  className="border border-gray-200 bg-gray-200 font-bold p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">合計</span>
                  </div>
                </td>
                
                {/* Department totals */}
                {departments.slice(0, 2).map((dept, index) => {
                  const deptTotal = (patientData[dept]?.morning || 0) + 
                                   (patientData[dept]?.afternoon || 0) + 
                                   (patientData[dept]?.night || 0);
                  return (
                    <td 
                      key={`total-${dept}`}
                      className={`border border-gray-200 p-1 ${getHoverColorClass(index)}`}
                      style={{ width: '40px' }}
                    >
                      <div className="text-[11px] font-medium">
                        {deptTotal}
                      </div>
                    </td>
                  );
                })}
                
                {/* Additional columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-total-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[11px]">-</div>
                  </td>
                ))}
                
                {/* Grand total */}
                <td 
                  className="border border-gray-200 p-1 bg-purple-100 font-bold"
                  style={{ width: '30px' }}
                >
                  <div className="text-[11px]">{totals.total}</div>
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