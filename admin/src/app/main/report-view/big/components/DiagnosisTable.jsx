import React from 'react';

const DiagnosisTable = ({ diagnosisData = {} }) => {
  // Get unique department names
  const departments = Object.keys(diagnosisData);

  // Generate additional empty columns
  const additionalColumns = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    label: `${i}`,
    data: { morning: [], afternoon: [], night: [] }
  }));

  // Color classes for departments
  const getColorClass = (index) => {
    const colors = ['bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600'];
    return colors[index % colors.length];
  };

  const getLightColorClass = (index) => {
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="diagnosis-table w-full h-full rounded-md mt-10 mb-10">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* Row 1 - Headers */}
              <tr className="text-center">
                {/* Column 1: 診察担当医 */}
                <td 
                  className="border border-gray-200 bg-gray-800 text-white p-1"
                  rowSpan="5"
                  style={{ width: '30px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full">
                    <span className="block text-[10px] leading-tight">診</span>
                    <span className="block text-[10px] leading-tight">察</span>
                    <span className="block text-[10px] leading-tight">担</span>
                    <span className="block text-[10px] leading-tight">当</span>
                    <span className="block text-[10px] leading-tight">医</span>
                  </div>
                </td>
                
                {/* Empty column - WHITE BACKGROUND, BLACK TEXT */}
                <td 
                  className="border border-gray-200 bg-white text-black p-1"
                  rowSpan="2"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                
                {/* Department headers - WHITE BACKGROUND, BLACK TEXT */}
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`dept-${index}`}
                    className="border border-gray-200 bg-white text-black font-bold p-1"
                    style={{ width: '40px' }}
                  >
                    <div className="text-[10px]">1</div>
                  </td>
                ))}
                
                {/* Additional columns - WHITE BACKGROUND, BLACK TEXT */}
                {additionalColumns.map((col) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-white text-black font-bold p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[10px]">{col.id + 1}</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 2 - Sub-headers - GRAY BACKGROUND */}
              <tr className="text-center">
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`subheader-${dept}`}
                    className="border border-gray-200 bg-gray-400 font-semibold p-1"
                    style={{ width: '40px' }}
                  >
                    <div className="text-[10px]">{dept}</div>
                  </td>
                ))}
                
                {additionalColumns.map((col) => (
                  <td
                    key={`subheader-${col.id}`}
                    className="border border-gray-200 bg-gray-400 font-semibold p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[10px]">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 3: Morning Diagnosis */}
              <tr className="text-center">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午前診</span>
                  </div>
                </td>
                
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '40px' }}
                  >
                    <div className="text-[9px] leading-tight">
                      {diagnosisData[dept]?.morning?.map((doctor, i) => (
                        <div key={i}>{doctor}</div>
                      )) || '-'}
                    </div>
                  </td>
                ))}
                
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[9px]">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 4: Afternoon Diagnosis */}
              <tr className="text-center">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">午後診</span>
                  </div>
                </td>
                
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '40px' }}
                  >
                    <div className="text-[9px] leading-tight">
                      {diagnosisData[dept]?.afternoon?.map((doctor, i) => (
                        <div key={i}>{doctor}</div>
                      )) || '-'}
                    </div>
                  </td>
                ))}
                
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[9px]">-</div>
                  </td>
                ))}
              </tr>
              
              {/* Row 5: Night Diagnosis */}
              <tr className="text-center">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1"
                  style={{ width: '40px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]">夜診</span>
                  </div>
                </td>
                
                {departments.slice(0, 2).map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '40px' }}
                  >
                    <div className="text-[9px] leading-tight">
                      {diagnosisData[dept]?.night?.map((doctor, i) => (
                        <div key={i}>{doctor}</div>
                      )) || '-'}
                    </div>
                  </td>
                ))}
                
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-1"
                    style={{ width: '30px' }}
                  >
                    <div className="text-[9px]">-</div>
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