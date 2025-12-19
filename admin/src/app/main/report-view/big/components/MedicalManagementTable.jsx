import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../../../configs/apiConfig';

const MedicalManagementTable = () => {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('id');
  
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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reportId) {
      fetchMedicalDataById(reportId);
    } else {
      // Fallback: try to get from date if no ID (for backward compatibility)
      fetchMedicalDataByDate();
    }
  }, [reportId]);

  const fetchMedicalDataById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-id`, {
        report_id: id
      });
      
      if (response.data.success && response.data.data) {
        const reportData = response.data.data;
        
        // Extract emergency data from report
        const emergencyTransport = reportData.report?.emergency_transport || 0;
        const postTransportAdmission = reportData.report?.post_transport_admission || 0;
        const monthlyStats = reportData.monthlyStats || {};
        
        setEmergencyData({
          current: emergencyTransport,
          hospitalization: postTransportAdmission,
          monthly: monthlyStats.emergency_transport || 0,
          cumulative: monthlyStats.post_transport_admission || 0
        });
        
        // Extract nurse data from shift_nurses
        const shiftNurses = reportData.report?.shift_nurses || [];
        const quasiNightNurses = shiftNurses
          .filter(nurse => nurse.shift_type === 0)
          .map(nurse => nurse.nurse_name);
        const midnightNurses = shiftNurses
          .filter(nurse => nurse.shift_type === 1)
          .map(nurse => nurse.nurse_name);
        
        setNurseData({
          quasiNight: quasiNightNurses,
          midnight: midnightNurses
        });
      } else {
        setError('Failed to load report data');
      }
    } catch (error) {
      console.error('Error fetching medical data by ID:', error);
      setError('Error loading report data');
      
      // Fallback to date-based fetch
      fetchMedicalDataByDate();
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalDataByDate = async () => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-date-table`, {
        date: dateStr,
        hospital_id: 10
      });
      
      if (response.data.success && response.data.data.tableData) {
        setEmergencyData(response.data.data.tableData.emergencyData || {});
        setNurseData(response.data.data.tableData.nurseData || {});
      } else {
        setError('No data available for today');
      }
    } catch (error) {
      console.error('Error fetching medical data by date:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="medical-management-table w-full h-full rounded-md mt-10 mb-10">
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-2"></div>
            <span className="text-sm text-gray-600">データを読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-management-table w-full h-full rounded-md mt-10 mb-10">
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center text-red-600">
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-management-table w-full h-full rounded-md mt-10 mb-10">
      <div className="overflow-hidden rounded-md mb-10 mt-10  h-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed  bg-white border border-gray-300">
            <thead>
              {/* Changed: Blue background and unified font size */}
              <tr className="text-center">
                <th className="bg-blue-600 text-white font-bold p-2 align-middle w-1/2" rowSpan="2">
                  <div className="text-md">緊急搬入数</div>
                </th>
                <th className="bg-blue-600 text-white font-bold p-2 w-1/2" colSpan="2">
                  <div className="text-md">外来看護師</div>
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
                    {nurseData.quasiNight && nurseData.quasiNight.length > 0 ? (
                      nurseData.quasiNight.map((nurse, index) => (
                        <span key={index} className="text-xs sm:text-sm">
                          {nurse}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
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
                      <span className="block text-base text-center sm:text-lg lg:text-xl font-bold text-red-700">
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
                    {nurseData.midnight && nurseData.midnight.length > 0 ? (
                      nurseData.midnight.map((nurse, index) => (
                        <span key={index} className="text-xs sm:text-sm">
                          {nurse}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
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