import React from 'react';

const DiagnosisTable = ({ diagnosisData = {} }) => {
  const departments = Object.keys(diagnosisData);
  const totalColumns = 16;
  const usedColumns = departments.length + 2;
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({
    id: i + 1,
    label: `-`
  }));

  const regularColWidth = '40px';
  const firstColWidth = '12px'; // 30% of 40px

  return (
    <div className="diagnosis-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: firstColWidth }} />
              <col style={{ width: regularColWidth }} />
              {departments.map((_, i) => (
                <col key={`col-dept-${i}`} style={{ width: regularColWidth }} />
              ))}
              {additionalColumns.map((col) => (
                <col key={`col-add-${col.id}`} style={{ width: regularColWidth }} />
              ))}
            </colgroup>
            <tbody>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-blue-600 text-white p-0.5"
                  rowSpan="5"
                  style={{ height: '60px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full leading-none">
                    <span className="block text-[16px] p-1">診</span>
                    <span className="block text-[16px] p-1">察</span>
                    <span className="block text-[16px] p-1">担</span>
                    <span className="block text-[16px] p-1">当</span>
                    <span className="block text-[16px] p-1">医</span>
                  </div>
                </td>
                <td 
                  className="border border-gray-200 bg-white text-black p-0.5"
                  rowSpan="2"
                  style={{ height: '24px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`dept-header-${index}`}
                    className="border border-gray-200 bg-white text-black font-bold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[11px] leading-none font-bold">{index + 1}</div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`header-${col.id}`}
                    className="border border-gray-200 bg-white text-black font-bold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[11px] leading-none font-bold">{col.id + departments.length}</div>
                  </td>
                ))}
              </tr>
              <tr className="text-center align-middle">
                {departments.map((dept, index) => (
                  <td 
                    key={`subheader-${dept}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[10px] leading-tight font-semibold">{dept}</div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`subheader-${col.id}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[10px] text-gray-600 leading-none">{col.label}</div>
                  </td>
                ))}
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午前診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className="border border-gray-200 p-0.5 bg-blue-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.morning?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午後診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className="border border-gray-200 p-0.5 bg-green-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.afternoon?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">夜診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className="border border-gray-200 p-0.5 bg-purple-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] leading-tight flex flex-col justify-center h-full">
                      {diagnosisData[dept]?.night?.map((doctor, i) => (
                        <div key={i} className="leading-none mb-0.5 last:mb-0 font-medium">{doctor}</div>
                      )) || <div className="text-gray-400 leading-none">-</div>}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
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

const PatientCountTable = ({ patientData = {} }) => {
  const departments = Object.keys(patientData);
  
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
  const totalColumns = 15;
  const usedColumns = departments.length + 2;
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({
    id: i + 1,
    label: `-`
  }));

  const regularColWidth = '40px';
  const firstColWidth = '12px'; // 30% of 40px

  return (
    <div className="patient-count-table w-full h-full">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: firstColWidth }} />
              <col style={{ width: regularColWidth }} />
              {departments.map((_, i) => (
                <col key={`col-dept-${i}`} style={{ width: regularColWidth }} />
              ))}
              {additionalColumns.map((col) => (
                <col key={`col-add-${col.id}`} style={{ width: regularColWidth }} />
              ))}
              <col style={{ width: regularColWidth }} />
            </colgroup>
            <tbody>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-blue-600 text-white p-0.5"
                  rowSpan={6}   
                  style={{ height: '90px' }}
                >
                  <div className="flex flex-col justify-center items-center h-full leading-none">
                    <span className="block text-[16px] p-1">患</span>
                    <span className="block text-[16px] p-1">者</span>
                    <span className="block text-[16px] p-1">数</span>
                  </div>
                </td>
                <td 
                  className="border border-gray-200 bg-white p-0.5"
                  rowSpan={2}
                  style={{ height: '24px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px]"></span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`dept-header-${index}`}
                    className="border border-gray-200 bg-white text-black font-bold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[11px] leading-none font-bold">{index + 1}</div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`empty-header-${col.id}`}
                    className="border border-gray-200 bg-white p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[9px] text-gray-500 leading-none">{col.id + departments.length}</div>
                  </td>
                ))}
                <td 
                  className="border border-gray-200 bg-gray-300 text-black font-bold p-0.5"
                  rowSpan={2}
                  style={{ height: '24px' }}
                >
                  <div className="text-[10px] leading-tight font-bold text-center">合計</div>
                </td>
              </tr>
              <tr className="text-center align-middle">
                {departments.map((dept, index) => (
                  <td 
                    key={`subheader-${dept}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[10px] leading-tight font-semibold">{dept}</div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`subheader-${col.id}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-0.5"
                    style={{ height: '24px' }}
                  >
                    <div className="text-[10px] text-gray-600 leading-none">{col.label}</div>
                  </td>
                ))}
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午前診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className="border border-gray-200 p-0.5 bg-blue-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.morning || 0}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-morning-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                <td 
                  className="border border-gray-200 p-0.5 bg-blue-50"
                  style={{ height: '30px' }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.morning}</div>
                </td>
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">午後診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className="border border-gray-200 p-0.5 bg-green-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.afternoon || 0}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-afternoon-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                <td 
                  className="border border-gray-200 p-0.5 bg-green-50"
                  style={{ height: '30px' }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.afternoon}</div>
                </td>
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-medium">夜診</span>
                  </div>
                </td>
                {departments.map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className="border border-gray-200 p-0.5 bg-purple-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">
                      {patientData[dept]?.night || 0}
                    </div>
                  </td>
                ))}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-night-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                <td 
                  className="border border-gray-200 p-0.5 bg-purple-50"
                  style={{ height: '30px' }}
                >
                  <div className="text-[11px] leading-none flex items-center justify-center h-full font-medium">{totals.night}</div>
                </td>
              </tr>
              <tr className="text-center align-middle">
                <td 
                  className="border border-gray-200 bg-gray-200 font-bold p-0.5"
                  style={{ height: '30px' }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-bold">合計</span>
                  </div>
                </td>
                {departments.map((dept, index) => {
                  const deptTotal = (patientData[dept]?.morning || 0) + 
                                   (patientData[dept]?.afternoon || 0) + 
                                   (patientData[dept]?.night || 0);
                  return (
                    <td 
                      key={`total-${dept}`}
                      className="border border-gray-200 p-0.5 bg-gray-100"
                      style={{ height: '30px' }}
                    >
                      <div className="text-[11px] leading-none flex items-center justify-center h-full font-bold">
                        {deptTotal}
                      </div>
                    </td>
                  );
                })}
                {additionalColumns.map((col) => (
                  <td
                    key={`data-total-empty-${col.id}`}
                    className="border border-gray-200 p-0.5 bg-gray-50"
                    style={{ height: '30px' }}
                  >
                    <div className="text-[10px] text-gray-400 leading-none flex items-center justify-center h-full">-</div>
                  </td>
                ))}
                <td 
                  className="border border-gray-200 p-0.5 bg-gray-200 font-bold"
                  style={{ height: '30px' }}
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

export { DiagnosisTable, PatientCountTable };