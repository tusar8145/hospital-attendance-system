import React from 'react';

const DiagnosisTable = ({ diagnosisData = {} }) => {
  // Get unique department names
  const departments = Object.keys(diagnosisData);
  
  // Calculate how many additional empty columns we need to reach 15 total columns
  const totalColumns = 15; // Fixed total columns
  const usedColumns = departments.length + 2; // Departments + empty + 診察担当医
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  
  // Generate additional empty columns
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({
    id: i + 1,
    label: `C${i + 1}`
  }));

  return (
    <div className="diagnosis-table w-full h-full ">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto ">
          <table className="w-full border-collapse " style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 - Headers */}
              <tr className="text-center align-middle">
                {/* Column 1: 診察担当医 - GRAY BACKGROUND, WHITE TEXT - VERY SMALL */}
                <td 
                  className="border border-gray-200 bg-blue-600 text-white p-0.5"
                  rowSpan="5"
                  style={{ 
                    width: '20px', // Reduced from 30px to 20px
                    height: '60px'
                  }}
                >
                  <div className="flex flex-col justify-center items-center h-full leading-none">
                    <span className="block text-[16px] p-1">診</span>
                    <span className="block text-[16px] p-1">察</span>
                    <span className="block text-[16px] p-1">担</span>
                    <span className="block text-[16px] p-1">当</span>
                    <span className="block text-[16px] p-1">医</span>
                  </div>
                </td>
                
                {/* Empty column - WHITE BACKGROUND, BLACK TEXT */}
                <td 
                  className="border border-gray-200 bg-white text-black p-0.5"
                  rowSpan="2"
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
                
                {/* Additional columns - WHITE BACKGROUND, BLACK TEXT */}
                {additionalColumns.map((col) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-white text-black font-bold p-0.5"
                    style={{ 
                      width: '30px',
                      height: '24px'
                    }}
                  >
                    <div className="text-[11px] leading-none font-bold">{col.id + departments.length}</div>
                  </td>
                ))}
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
              
              {/* Row 3: Morning Diagnosis */}
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
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.morning?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns for morning */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 4: Afternoon Diagnosis */}
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
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.afternoon?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns for afternoon */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 5: Night Diagnosis */}
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
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.night?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                
                {/* Additional empty columns for night */}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ 
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full leading-none">-</div>
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