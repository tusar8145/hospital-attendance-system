import React from 'react';

const DetailedDutyTable2 = ({ dutyStaff = [] }) => {
  // Split items into two groups
  const firstSevenItems = dutyStaff.slice(0, 7);
  const remainingItems = dutyStaff.slice(7);
  
  // Create headers for first table (items 1-7)
  const firstHeaders = firstSevenItems.map((item, index) => ({
    key: `field_group_${index + 1}`,
    label: item.staff_name_1 || `-`,
    staffData: item
  }));

  // If there are less than 7 items, fill with empty headers
  while (firstHeaders.length < 7) {
    firstHeaders.push({
      key: `empty_${firstHeaders.length}`,
      label: '-',
      staffData: null
    });
  }

  // Create headers for second table (items 8 and beyond)
  const remainingHeaders = remainingItems.map((item, index) => ({
    key: `remaining_${index}`,
    label: item.staff_name_1 || `-`,
    staffData: item
  }));

  return (
    <div className="detailed-duty-table w-full mt-10">
      {/* Second Table - Items 8 and beyond (only if there are remaining items) */}
      {remainingItems.length > 0 && (
        <div className="overflow-hidden rounded-md">
          <div className="overflow-x-auto">
 
            <table className="w-full border-collapse bg-white border border-gray-300 min-w-max">
              <thead>
                <tr>
                  <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan={remainingHeaders.length}>
                    <div className="text-md">当直</div>
                  </th>
                </tr>
                
                <tr>
                  {remainingHeaders.map((header) => (
                    <th 
                      key={`remaining-header-${header.key}`}
                      className="bg-gray-300 text-black font-bold p-2 text-center min-w-[120px]"
                    >
                      <div className="text-xs whitespace-nowrap">
                        {header.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                <tr>
                  {remainingHeaders.map((header) => {
                    const staffData = header.staffData;
                    return (
                      <td 
                        key={`${header.key}-2`}
                        className="border border-gray-300 p-2 text-center min-w-[120px]"
                      >
                        <div className="text-sm font-medium text-gray-800 min-h-[24px]">
                          {staffData?.staff_name_2 || (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                
                <tr>
                  {remainingHeaders.map((header) => {
                    const staffData = header.staffData;
                    return (
                      <td 
                        key={`${header.key}-3`}
                        className="border border-gray-300 p-2 text-center min-w-[120px]"
                      >
                        <div className="text-sm font-medium text-gray-800 min-h-[24px]">
                          {staffData?.staff_name_3 || (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedDutyTable2;