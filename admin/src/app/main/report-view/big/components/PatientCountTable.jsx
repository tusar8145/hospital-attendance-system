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

  // Calculate how many additional empty columns we need to reach 15 total columns
  const totalColumns = 15; // Fixed total columns
  const usedColumns = departments.length + 2; // Departments + empty + 患者数 column
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  
  // Generate additional empty columns
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({
    id: i + 1,
    label: `-`
  }));

  return (
    <div className="patient-count-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse " style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 - Headers */}
              <tr className="text-center align-middle">
                {/* Column 1: 患者数 - GRAY BACKGROUND, WHITE TEXT - VERY SMALL */}
                <td 
                  className="border border-gray-200 bg-blue-600 text-white p-0.5"
                  rowSpan={6}   
                  style={{ 
                    width: '20px',
                    height: '90px'  /* Increased height to accommodate 6 rows */
                  }}
                >
                  <div className="flex flex-col justify-center items-center h-full leading-none">
                    <span className="block text-[16px] p-1">患</span>
                    <span className="block text-[16px] p-1">者</span>
                    <span className="block text-[16px] p-1">数</span>
                  </div>
                </td>
                
                {/* Empty column - WHITE BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-white p-0.5"
                  rowSpan={2}
                  style={{ 
                    width: '40px',
                    height: '24px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                
                {/* Department headers - WHITE BACKGROUND, BLACK TEXT */}
                {departments.map((dept, index) => (
                  <td 
                    key={`dept-header-${index}`}
                    className="border border-gray-200 bg-white text-black font-bold p-0.5"
                    style={{ 
                      width: '40px',
                      height: '24px'
                    }}
                  >
                    <div className="text-[11px] leading-none font-bold">{index + 1}</div>
                  </td>
                ))}
                
                {/* Additional empty columns - WHITE BACKGROUND */}
                {additionalColumns.map((col) => (
                  <td
                    key={`empty-header-${col.id}`}
                    className="border border-gray-200 bg-white p-0.5"
                    style={{ 
                      width: '30px',
                      height: '24px'
                    }}
                  >
                    <div className="text-[9px] text-gray-500 leading-none">{col.id + departments.length}</div>
                  </td>
                ))}
                
                {/* Last column header - 合計 - GRAY BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-gray-300 text-black font-bold p-0.5"
                  rowSpan={2}
                  style={{ 
                    width: '30px',
                    height: '24px'
                  }}
                >
                  <div className="text-[10px] leading-tight font-bold text-center">合計</div>
                </td>
              </tr>
              
              {/* Row 2 - Sub-headers - GRAY BACKGROUND, BLACK TEXT */}
              <tr className="text-center align-middle">
                {departments.map((dept, index) => (
                  <td 
                    key={`subheader-${dept}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ 
                      width: '40px',
                      height: '24px'
                    }}
                  >
                    <div className="text-[10px] leading-tight font-semibold">{dept}</div>
                  </td>
                ))}
                
                {additionalColumns.map((col) => (
                  <td
                    key={`subheader-${col.id}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ 
                      width: '30px',
                      height: '24px'
                    }}
                  >
                    <div className="text-[10px] text-gray-600 leading-none">{col.label}</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 3: Morning Patients */}
              <tr className="text-center align-middle">
                {/* 午前診 header - LIGHT GRAY BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午前診</span>
                  </div>
                </td>
                
                {/* Department data for morning */}
                {departments.map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className="border border-gray-200 p-0.5 bg-blue-50"
                    style={{ 
                      width: '40px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.morning || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                
                {/* Total column for morning */}
                <td 
                  className="border border-gray-200 p-0.5 bg-blue-50"
                  style={{ 
                    width: '30px',
                    height: '30px'
                  }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.morning}</div>
                </td>
              </tr>
              
              {/* Row 4: Afternoon Patients */}
              <tr className="text-center align-middle">
                {/* 午後診 header - LIGHT GRAY BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午後診</span>
                  </div>
                </td>
                
                {/* Department data for afternoon */}
                {departments.map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className="border border-gray-200 p-0.5 bg-green-50"
                    style={{ 
                      width: '40px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.afternoon || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                
                {/* Total column for afternoon */}
                <td 
                  className="border border-gray-200 p-0.5 bg-green-50"
                  style={{ 
                    width: '30px',
                    height: '30px'
                  }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.afternoon}</div>
                </td>
              </tr>
              
              {/* Row 5: Night Patients */}
              <tr className="text-center align-middle">
                {/* 夜診 header - LIGHT GRAY BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">夜診</span>
                  </div>
                </td>
                
                {/* Department data for night */}
                {departments.map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className="border border-gray-200 p-0.5 bg-purple-50"
                    style={{ 
                      width: '40px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.night || 0}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                
                {/* Total column for night */}
                <td 
                  className="border border-gray-200 p-0.5 bg-purple-50"
                  style={{ 
                    width: '30px',
                    height: '30px'
                  }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.night}</div>
                </td>
              </tr>
              
              {/* Row 6: Totals */}
              <tr className="text-center align-middle">
                {/* 合計 header - MEDIUM GRAY BACKGROUND */}
                <td 
                  className="border border-gray-200 bg-gray-200 font-bold p-0.5"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-bold">合計</span>
                  </div>
                </td>
                
                {/* Department totals */}
                {departments.map((dept, index) => {
                  const deptTotal = (patientData[dept]?.morning || 0) + 
                                   (patientData[dept]?.afternoon || 0) + 
                                   (patientData[dept]?.night || 0);
                  return (
                    <td 
                      key={`total-${dept}`}
                      className="border border-gray-200 p-0.5 bg-gray-100"
                      style={{ 
                        width: '40px',
                        height: '30px'
                      }}
                    >
                      <div className="text-[11px] leading-none flex items-center justify-center h-full font-bold">
                        {deptTotal}
                      </div>
                    </td>
                  );
                })}
                
                {/* Additional empty columns */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-total-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                
                {/* Grand total */}
                <td 
                  className="border border-gray-200 p-0.5 bg-gray-200 font-bold"
                  style={{ 
                    width: '30px',
                    height: '30px'
                  }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full">{totals.total}</div>
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