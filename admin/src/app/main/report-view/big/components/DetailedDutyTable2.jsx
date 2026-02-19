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

  const COL_WIDTH = 61;
  const fixedColClass = `w-[${COL_WIDTH}px] min-w-[${COL_WIDTH}px] max-w-[${COL_WIDTH}px]`;

  return (
    <div className="detailed-duty-table w-full h-full mt-10">
      {remainingItems.length > 0 && (
        <div className="overflow-hidden rounded-md mb-10 h-full">
          <div className="overflow-x-auto">
            <table
              className="border-collapse table-fixed bg-white border border-gray-300"
              style={{ width: remainingHeaders.length * COL_WIDTH }}
            >
              {/* Lock equal width */}
              <colgroup>
                {remainingHeaders.map((_, i) => (
                  <col key={i} style={{ width: `${COL_WIDTH}px` }} />
                ))}
              </colgroup>

              <thead>
                {/* Header Title Row */}
                <tr>
                  <th
                    className="bg-blue-600 text-white font-bold p-2 text-center"
                    colSpan={remainingHeaders.length}
                  >
                    <div className="text-md">当直</div>
                  </th>
                </tr>

                {/* Header Names Row */}
                <tr>
                  {remainingHeaders.map((header) => (
                    <th
                      key={`remaining-header-${header.key}`}
                      className={`bg-gray-300 text-black font-bold p-2 text-center ${fixedColClass}`}
                    >
                      <div className="text-xs break-words">
                        {header.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* staff_name_2 Row */}
                <tr>
                  {remainingHeaders.map((header) => {
                    const staffData = header.staffData;
                    return (
                      <td
                        key={`${header.key}-2`}
                        className={`border border-gray-300 p-2 text-center align-top ${fixedColClass}`}
                      >
                        <div className="text-sm font-medium text-gray-800 break-words">
                          {staffData?.staff_name_2 || (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* staff_name_3 Row */}
                <tr>
                  {remainingHeaders.map((header) => {
                    const staffData = header.staffData;
                    return (
                      <td
                        key={`${header.key}-3`}
                        className={`border border-gray-300 p-2 text-center align-top ${fixedColClass}`}
                      >
                        <div className="text-sm font-medium text-gray-800 break-words">
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