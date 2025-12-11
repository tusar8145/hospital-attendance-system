import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiConfig from '../../../../configs/apiConfig';

const MedicalManagementTable = () => {
  const [emergencyData, setEmergencyData] = useState({
    current: 0,
    hospitalization: 0,
    monthly: 0,
    cumulative: 0
  });
  const [nurseData, setNurseData] = useState({
    quasiNight: [],
    midnight: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicalData();
  }, []);

  const fetchMedicalData = async () => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const response = await axios.post(`${apiConfig.baseURL}report/get-by-date-table`, {
        date: dateStr,
        hospital_id: 10
      });
      
      if (response.data.success && response.data.data.tableData) {
        setEmergencyData(response.data.data.tableData.emergencyData || {});
        setNurseData(response.data.data.tableData.nurseData || {});
      }
    } catch (error) {
      console.error('Error fetching medical data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="medical-management-table w-full h-full rounded-md mt-10 mb-10">
      <div className="overflow-hidden h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="text-center">
                <th className="bg-red-700 text-white font-bold p-3 align-middle w-1/2" rowSpan="2">
                  <div className="text-xs sm:text-sm lg:text-base">緊急搬入数</div>
                </th>
                <th className="bg-blue-700 text-white font-bold p-3 w-1/2" colSpan="2">
                  <div className="text-xs sm:text-sm lg:text-base">外来看護師</div>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Row 1 */}
              <tr className="text-center">
                {/* Emergency data */}
                <td className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] w-1/2">
                  <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2">
                    <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-700 mb-1 sm:mb-2">
                      {emergencyData.current}
                    </span>
                    <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight mb-1 sm:mb-2">
                      搬入後入院件数
                    </span>
                    <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-gray-800">
                      {emergencyData.hospitalization}
                    </span>
                  </div>
                </td>
                
                {/* Nurse: 準夜 */}
                <td className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] w-1/4">
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 leading-tight">
                      準<br />夜
                    </span>
                  </div>
                </td>
                
                {/* Nurse names for 準夜 */}
                <td className="border border-gray-300 p-2 min-h-[80px] sm:min-h-[100px] w-1/4">
                  <div className="flex flex-col items-center justify-center h-full">
                    {nurseData.quasiNight.map((nurse, index) => (
                      <span key={index} className="text-xs sm:text-sm">
                        {nurse}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="text-center">
                {/* Monthly emergency data */}
                <td className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] w-1/2">
                  <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2">
                    <div className="border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2 w-full">
                      <span className="block text-[10px] xs:text-xs sm:text-sm text-gray-600 mb-1">
                        当月緊急搬入数
                      </span>
                      <span className="block text-base sm:text-lg lg:text-xl font-bold text-red-700">
                        {emergencyData.monthly}
                      </span>
                    </div>
                    <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 mb-1">
                      搬入後入院者累計
                    </span>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">
                      {emergencyData.cumulative}
                    </span>
                  </div>
                </td>
                
                {/* Nurse: 深夜 */}
                <td className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] w-1/4">
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 leading-tight">
                      深<br />夜
                    </span>
                  </div>
                </td>
                
                {/* Nurse names for 深夜 */}
                <td className="border border-gray-300 p-2 min-h-[100px] sm:min-h-[120px] w-1/4">
                  <div className="flex flex-col items-center justify-center h-full">
                    {nurseData.midnight.map((nurse, index) => (
                      <span key={index} className="text-xs sm:text-sm">
                        {nurse}
                      </span>
                    ))}
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

export default MedicalManagementTable;