import React from 'react';

const DetailedDutyTable = ({ dutyStaff = [] }) => {
  // Filter only the first 7 items and map to header structure
  const firstSevenItems = dutyStaff.slice(0, 7);
  
  // Create headers dynamically from staff_name_1 values
  const headers = firstSevenItems.map((item, index) => ({
    key: `field_group_${index + 1}`,
    label: item.staff_name_1 || `-`,
    staffData: item
  }));

  // If there are less than 7 items, fill with empty headers
  while (headers.length < 7) {
    headers.push({
      key: `empty_${headers.length}`,
      label: '-',
      staffData: null
    });
  }

  return (
    <div className="detailed-duty-table w-full h-full">
      <div className="overflow-hidden rounded-md mb-10 mt-10 h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed bg-white border border-gray-300">
            <thead>
              {/* Row 1: 当直 header spanning 7 columns */}
              <tr>
                <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="7">
                  <div className="text-md">当直</div>
                </th>
              </tr>
              
              {/* Row 2: Department headers (staff_name_1 values) */}
              <tr>
                {headers.map((header) => (
                  <th 
                    key={`header-${header.key}`}
                    className="bg-gray-300 text-black font-bold p-2 text-center w-1/7"
                  >
                    <div className="text-xs whitespace-nowrap">
                      {header.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* Row 3: Second staff member (staff_name_2) */}
              <tr>
                {headers.map((header) => {
                  const staffData = header.staffData;
                  return (
                    <td 
                      key={`${header.key}-2`}
                      className="border border-gray-300 p-2 text-center w-1/7"
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
              
              {/* Row 4: Third staff member (staff_name_3) */}
              <tr>
                {headers.map((header) => {
                  const staffData = header.staffData;
                  return (
                    <td 
                      key={`${header.key}-3`}
                      className="border border-gray-300 p-2 text-center w-1/7"
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
          
          {/* Display warning if there are more than 7 items */}
 
        </div>
      </div>
    </div>
  );
};

export default DetailedDutyTable;