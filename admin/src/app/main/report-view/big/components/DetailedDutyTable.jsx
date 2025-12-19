import React from 'react';

const DetailedDutyTable = ({ dutyStaff = [] }) => {
  // Define the headers - 7 columns with department names only
  const headers = [
    { key: 'security', label: '保安当直' },
    { key: 'administrative', label: '医事当直' },
    { key: 'internal', label: '内科' },
    { key: 'surgery', label: '外科' },
    { key: 'pediatric', label: '小児' },
    { key: 'circulatory', label: '循環' },
    { key: 'other', label: '他科' }
  ];

  // Function to get staff data for a specific position
  const getStaffData = (positionKey) => {
    const staffItem = dutyStaff.find(item => {
      // Map header keys to position field groups
      const positionMap = {
        'security': 'field_group_1',
        'administrative': 'field_group_2',
        'internal': 'field_group_3',
        'surgery': 'field_group_4',
        'pediatric': 'field_group_5',
        'circulatory': 'field_group_6',
        'other': 'field_group_7'
      };
      
      return item.position === positionMap[positionKey];
    });
    
    return staffItem || null;
  };

  return (
    <div className="detailed-duty-table w-full h-full ">
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
              
 
            </thead>
            
            <tbody>
              {/* Row 3: First staff member (staff_name_1) */}
              <tr>
                {headers.map((header) => {
                  const staffData = getStaffData(header.key);
                  return (
                                      <th 
                    key={`header-${header.key}`}
                    className="bg-gray-300 text-black font-bold p-2 text-center w-1/7"
                  >
                    <div className="text-xs whitespace-nowrap">
                        {staffData?.staff_name_1 || (
                          <span className="text-gray-400">-</span>
                        )}
                    </div>
                  </th>
                  );
                })}
              </tr>
              
              {/* Row 4: Second staff member (staff_name_2) */}
              <tr>
                {headers.map((header) => {
                  const staffData = getStaffData(header.key);
                  return (
                    <td 
                      key={`${header.key}-2`}
                      className="border border-gray-300 p-2 text-center w-1/7"
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {staffData?.staff_name_2 || (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                                            <div className="text-sm font-medium text-gray-800">
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
    </div>
  );
};

export default DetailedDutyTable;