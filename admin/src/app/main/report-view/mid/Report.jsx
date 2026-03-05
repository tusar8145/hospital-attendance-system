import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { 
  Box, 
  Stack, 
  Typography, 
  Paper, 
  CircularProgress, 
  TextField, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import HeaderSection from '../HeaderSection';
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import { useAppSelector } from 'app/store/hooks';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportToPDF } from './pdf/exportUtils';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

// 1. Patient Count Table Component - UPDATED DESIGN
const PatientCountTable = ({ reportData }) => {
  if (!reportData?.report) return null;
  
  const { admission_count = 0, discharge_count = 0, external_duty = 0 } = reportData.report;
  const total = admission_count + discharge_count + external_duty;
  
  const patientCountData = [
    ['午前診', '午後診', '夜診', '合計'],
    [admission_count.toString(), discharge_count.toString(), external_duty.toString(), total.toString()]
  ];

  return (
    <div className="detailed-duty-table w-full h-full">
      <div className="overflow-hidden rounded-md mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="4">
                  <div className="text-md">患　者　数</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Headers row */}
              <tr>
                {patientCountData[0].map((header, index) => (
                  <th 
                    key={`header-${index}`}
                    className="bg-gray-300 text-black font-bold p-2 text-center w-1/4"
                  >
                    <div className="text-sm">{header}</div>
                  </th>
                ))}
              </tr>
              
              {/* Values row */}
              <tr style={{ height: '122px' }}>
                {patientCountData[1].map((value, index) => (
                  <td 
                    key={`value-${index}`}
                    className="border border-gray-300 p-3 text-center w-1/4"
                  >
                    <div className="text-base font-medium text-gray-800">
                      {value}
                    </div>
                    {index === patientCountData[1].length - 1 && (
                      <div className="text-xs text-gray-500 mt-1">合計患者数</div>
                    )}
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

// 2. Treatment Time Table Component - UPDATED DESIGN
// 2. Treatment Time Table Component - UPDATED DESIGN - ALWAYS 6 COLUMNS
// 2. Treatment Time Table Component - UPDATED DESIGN - ALWAYS 6 COLUMNS - NO HOVER
const TreatmentTimeTable = ({ reportDetails, doctors }) => {
  if (!reportDetails || reportDetails.length === 0) return null;
  
  // Group by floor and sequence_no
  const groupedData = {};
  reportDetails.forEach(detail => {
    const key = `${detail.floor}_${detail.sequence_no}`;
    if (!groupedData[key]) {
      groupedData[key] = {
        floor: detail.floor,
        morning: [],
        afternoon: [],
        night: []
      };
    }
    
    // Get doctor names for each time slot
    const getDoctorNames = () => {
      const names = [];
      if (detail.doctor1?.name) names.push(detail.doctor1.license_no);
      if (detail.doctor2?.name) names.push(detail.doctor2.license_no);
      if (detail.doctor3?.name) names.push(detail.doctor3.license_no);
      return names.join(' <br>');
    };
    
    const doctorNames = getDoctorNames();
    
    switch (detail.consultation_type) {
      case 'morning':
        groupedData[key].morning.push(doctorNames);
        break;
      case 'afternoon':
        groupedData[key].afternoon.push(doctorNames);
        break;
      case 'night':
        groupedData[key].night.push(doctorNames);
        break;
    }
  });
  
  // Convert grouped data to array and sort by floor
  let floors = Object.values(groupedData).sort((a, b) => {
    // Extract numeric part from floor for sorting (e.g., "1F" -> 1)
    const aNum = parseInt(a.floor) || 0;
    const bNum = parseInt(b.floor) || 0;
    return aNum - bNum;
  });
  
  // Always ensure we have exactly 6 columns
  const TOTAL_COLUMNS = 6;
  const displayFloors = [];
  
  // First, add all existing floors
  for (let i = 0; i < floors.length; i++) {
    displayFloors.push(floors[i]);
  }
  
  // Then add empty placeholders until we reach TOTAL_COLUMNS
  const emptyFloorsNeeded = Math.max(0, TOTAL_COLUMNS - displayFloors.length);
  for (let i = 0; i < emptyFloorsNeeded; i++) {
    displayFloors.push({
      floor: `-`,
      morning: [],
      afternoon: [],
      night: []
    });
  }
  
  const consultationTypes = [
    { key: 'morning', label: '午前診' },
    { key: 'afternoon', label: '午後診' },
    { key: 'night', label: '夜診' }
  ];

  return (
    <div className="detailed-duty-table w-full h-full ml-48">
      <div className="overflow-hidden rounded-md mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed bg-white border border-gray-300 shadow-lg">
            <thead>
              <tr>
                {/* Empty header for vertical text column */}
                <th 
                  className="bg-gradient-to-b from-blue-700 to-blue-600 border-r-2 border-gray-400"
                  style={{ width: '50px' }}
                />
                
                {/* Empty header for row labels column */}
                <th 
                  className="bg-gray-100 border-r border-gray-300"
                  style={{ width: '80px' }}
                />
                
                {/* Floor headers - Always 6 columns */}
                {displayFloors.map((floorData, index) => (
                  <th
                    key={`floor-${index}`}
                    className="bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800 font-bold p-3 text-center border border-gray-400"
                    style={{ width: `${100/TOTAL_COLUMNS}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-md text-gray-700">{floorData.floor}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* First row with vertical text and first row label */}
              <tr className="bg-white">
                {/* Vertical text cell - spans all rows */}
                <td 
                  className="bg-gradient-to-b from-blue-700 to-blue-600 text-white font-bold border-r-2 border-gray-400"
                  rowSpan={consultationTypes.length}
                >
                  <div className="h-full flex items-center justify-center p-0">
                    <div className="text-center">
                      <span className="block leading-tight text-gray-800 " style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        letterSpacing: '4px',
                        lineHeight: '1.4',
                       
                      }}>
                        診<br/>療<br/>担<br/>当<br/>医<br/>
                      </span>
                    </div>
                  </div>
                </td>
                
                {/* First row label (午前診) */}
                <td className="bg-gray-100 font-bold text-gray-800 p-3 text-center border-r border-gray-300 align-middle">
                  午前診
                </td>
                
                {/* First row data cells - Always 6 columns */}
                {displayFloors.map((floorData, colIndex) => (
                  <td
                    key={`cell-morning-${colIndex}`}
                    className="border border-gray-200 p-3 text-left align-middle"
                  >
                    <div className="text-sm text-gray-800 min-h-[40px] flex flex-wrap items-center justify-left gap-1">
                      {floorData['morning'] && floorData['morning'].length > 0 ? (
                        floorData['morning'].map((item, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-left justify-center px-3 py-1 rounded-full text-purple-800 text-sm font-medium shadow-sm"
                          >
                            <div dangerouslySetInnerHTML={{ __html: item }} /> 
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              
              {/* Second row (午後診) */}
              <tr className="bg-gray-50">
                {/* No first cell - covered by rowSpan from first row */}
                
                {/* Second row label */}
                <td className="bg-gray-100 font-bold text-gray-800 p-3 text-center border-r border-gray-300 align-middle">
                  午後診
                </td>
                
                {/* Second row data cells - Always 6 columns */}
                {displayFloors.map((floorData, colIndex) => (
                  <td
                    key={`cell-afternoon-${colIndex}`}
                    className="border border-gray-200 p-3 text-left align-middle"
                  >
                    <div className="text-sm text-gray-800 min-h-[40px] flex flex-wrap items-center justify-left gap-1">
                      {floorData['afternoon'] && floorData['afternoon'].length > 0 ? (
                        floorData['afternoon'].map((item, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-left justify-center px-3 py-1 rounded-full text-purple-800 text-sm font-medium shadow-sm"
                          >
                            <div dangerouslySetInnerHTML={{ __html: item }} /> 
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              
              {/* Third row (夜診) */}
              <tr className="bg-white">
                {/* No first cell - covered by rowSpan from first row */}
                
                {/* Third row label */}
                <td className="bg-gray-100 font-bold text-gray-800 p-3 text-center border-r border-gray-300 align-middle">
                  夜診
                </td>
                
                {/* Third row data cells - Always 6 columns */}
                {displayFloors.map((floorData, colIndex) => (
                  <td
                    key={`cell-night-${colIndex}`}
                    className="border border-gray-200 p-3 text-left align-middle"
                  >
                    <div className="text-sm text-gray-800 min-h-[40px] flex flex-wrap items-center justify-left gap-1">
                      {floorData['night'] && floorData['night'].length > 0 ? (
                        floorData['night'].map((item, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-left justify-center px-3 py-1 rounded-full text-purple-800 text-sm font-medium shadow-sm"
                          >
                            <div dangerouslySetInnerHTML={{ __html: item }} /> 
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">-</span>
                      )}
                    </div>
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

// 3. Diagnosis Table Component - UPDATED DESIGN
const DiagnosisTable = ({ reportDetailsMid }) => {
  if (!reportDetailsMid || reportDetailsMid.length === 0) return null;
  
  // Group by department
  const groupedData = {};
  reportDetailsMid.forEach(detail => {
    const deptName = detail.department?.name || '不明';
    if (!groupedData[deptName]) {
      groupedData[deptName] = {
        morning: { total: 0, new: 0 },
        afternoon: { total: 0, new: 0 },
        night: { total: 0, new: 0 }
      };
    }
    
    switch (detail.consultation_type) {
      case 'morning':
        groupedData[deptName].morning = {
          total: detail.total_patients,
          new: detail.new_patients
        };
        break;
      case 'afternoon':
        groupedData[deptName].afternoon = {
          total: detail.total_patients,
          new: detail.new_patients
        };
        break;
      case 'night':
        groupedData[deptName].night = {
          total: detail.total_patients,
          new: detail.new_patients
        };
        break;
    }
  });
  
  const departments = Object.keys(groupedData);
  
  // Calculate totals
  const totalByDept = departments.map(dept => {
    const data = groupedData[dept];
    return {
      morning: data.morning.total,
      afternoon: data.afternoon.total,
      night: data.night.total,
      total: data.morning.total + data.afternoon.total + data.night.total
    };
  });
  
  // Calculate row totals
  const rowTotals = {
    morning: departments.reduce((sum, dept) => sum + groupedData[dept].morning.total, 0),
    afternoon: departments.reduce((sum, dept) => sum + groupedData[dept].afternoon.total, 0),
    night: departments.reduce((sum, dept) => sum + groupedData[dept].night.total, 0),
    grandTotal: departments.reduce((sum, dept) => {
      const data = groupedData[dept];
      return sum + data.morning.total + data.afternoon.total + data.night.total;
    }, 0)
  };

  // Calculate how many additional empty columns we need
  const totalColumns = 15; // Fixed total columns like in the example
  const usedColumns = departments.length + 2; // Departments + time header + total column
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);

  return (
    <div className="diagnosis-table w-full h-full">
      <div className="overflow-hidden rounded-md mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th 
                  className="bg-blue-600 text-white font-bold p-2 text-center" 
                  colSpan={totalColumns+1}
                >
                  <div className="text-md">診療科別患者数</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Department headers row */}
              <tr>
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1 text-center"
                  rowSpan="5"
                  style={{ 
                    width: '40px',
                    height: '60px'
                  }}
                >
                  <div className="flex flex-col justify-center items-center h-full leading-none">
                    <span className="block text-sm">診</span>
                    <span className="block text-sm">療</span>
                    <span className="block text-sm">時</span>
                    <span className="block text-sm">間</span>
                  </div>
                </td>
                
                <td 
                  className="border border-gray-200 bg-white text-black p-1 text-center"
                  rowSpan="2"
                  style={{ 
                    width: '40px',
                    height: '24px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs"></span>
                  </div>
                </td>
                
                {/* Department headers */}
                {departments.map((dept, index) => (
                  <td 
                    key={`dept-header-${index}`}
                    className="border border-gray-200 bg-white text-black font-bold p-1 text-center"
                    style={{ 
                      width: '50px',
                      height: '24px'
                    }}
                  >
                    <div className="text-xs leading-none font-bold">{index + 1}</div>
                  </td>
                ))}
                
                {/* Empty columns if needed */}
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-${i}`}
                    className="border border-gray-200 bg-white text-black p-1 text-center"
                    style={{ 
                      width: '50px',
                      height: '24px'
                    }}
                  >
                    <div className="text-xs text-gray-400">{i + departments.length + 1}</div>
                  </td>
                ))}
                
                {/* Total column header */}
                <td 
                  className="border border-gray-200 bg-white  font-bold p-1 text-center"
                  style={{ 
                    width: '60px',
                    height: '24px'
                  }}
                >
                  <div className="text-xs leading-none">合計</div>
                </td>
              </tr>
              
              {/* Sub-headers row (department names) */}
              <tr>
                {departments.map((dept, index) => (
                  <td 
                    key={`subheader-${dept}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-1 text-center"
                    style={{ 
                      width: '50px',
                      height: '24px'
                    }}
                  >
                    <div className="text-xs leading-tight font-semibold">{dept}</div>
                  </td>
                ))}
                
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-sub-${i}`}
                    className="border border-gray-200 bg-gray-300 font-semibold p-1 text-center"
                    style={{ 
                      width: '50px',
                      height: '24px'
                    }}
                  >
                    <div className="text-xs text-gray-600">-</div>
                  </td>
                ))}
                
                <td 
                  className="border border-gray-200 bg-white font-bold p-1 text-center"
                  style={{ 
                    width: '60px',
                    height: '24px'
                  }}
                >
                  <div className="text-xs leading-none"></div>
                </td>
              </tr>
              
              {/* Morning diagnosis row */}
              <tr>
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1 text-center"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs font-medium">午前診</span>
                  </div>
                </td>
                
                {departments.map((dept, index) => (
                  <td 
                    key={`morning-${dept}`}
                    className="border border-gray-200 p-1 text-center bg-blue-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs leading-tight flex flex-col justify-center h-full">
                      <span className="font-semibold text-gray-900 ml-10">
                        {groupedData[dept]?.morning.total || 0}
                      </span>
                      <span className="font-semibold text-[12px] text-gray-900">
                        （ {groupedData[dept]?.morning.new || 0} ）
                      </span>
                    </div>
                  </td>
                ))}
                
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-morning-${i}`}
                    className="border border-gray-200 p-1 text-center bg-gray-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
                
                <td className="border border-gray-200 p-1 text-center bg-blue-100">
                  <div className="text-xs leading-tight flex flex-col justify-center h-full">
                    <span className="font-bold text-gray-900 ml-32">
                      {rowTotals.morning}
                    </span>
                    <span className="text-[12px] text-gray-900">
                      （合計{rowTotals.morning}）
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Afternoon diagnosis row */}
              <tr>
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1 text-center"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs font-medium">午後診</span>
                  </div>
                </td>
                
                {departments.map((dept, index) => (
                  <td 
                    key={`afternoon-${dept}`}
                    className="border border-gray-200 p-1 text-center bg-green-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs leading-tight flex flex-col justify-center h-full">
                      <span className="font-semibold text-gray-900 ml-10">
                        {groupedData[dept]?.afternoon.total || 0}
                      </span>
                      <span className="font-semibold text-[12px] text-gray-900">
                        （ {groupedData[dept]?.afternoon.new || 0} ）
                      </span>
                    </div>
                  </td>
                ))}
                
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-afternoon-${i}`}
                    className="border border-gray-200 p-1 text-center bg-gray-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
                
                <td className="border border-gray-200 p-1 text-center bg-green-100">
                  <div className="text-xs leading-tight flex flex-col justify-center h-full">
                    <span className="font-bold text-gray-900 ml-32">
                      {rowTotals.afternoon}
                    </span>
                    <span className="text-[12px] text-gray-900">
                      （合計{rowTotals.afternoon}）
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Night diagnosis row */}
              <tr>
                <td 
                  className="border border-gray-200 bg-gray-100 font-medium p-1 text-center"
                  style={{ 
                    width: '40px',
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs font-medium">夜診</span>
                  </div>
                </td>
                
                {departments.map((dept, index) => (
                  <td 
                    key={`night-${dept}`}
                    className="border border-gray-200 p-1 text-center bg-purple-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs leading-tight flex flex-col justify-center h-full">
                      <span className="font-semibold text-gray-900 ml-10">
                        {groupedData[dept]?.night.total || 0}
                      </span>
                      <span className="font-semibold text-[12px] text-gray-900">
                        （ {groupedData[dept]?.night.new || 0} ）
                      </span>
                    </div>
                  </td>
                ))}
                
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-night-${i}`}
                    className="border border-gray-200 p-1 text-center bg-gray-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs text-gray-400 flex items-center justify-center h-full leading-none">-</div>
                  </td>
                ))}
                
                <td className="border border-gray-200 p-1 text-center bg-purple-100">
                  <div className="text-xs leading-tight flex flex-col justify-center h-full">
                    <span className="font-bold text-gray-900 ml-32">
                      {rowTotals.night}
                    </span>
                    <span className="text-[12px] text-gray-900">
                      （ 合計{rowTotals.night} ）
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Grand total row */}
              <tr>
                <td 
                  className="border border-gray-200 bg-gray-100 font-bold p-1 text-center"
                  colSpan={2}
                  style={{ 
                    height: '30px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs font-bold">合計</span>
                  </div>
                </td>
                
                {departments.map((dept, index) => {
                  const deptTotal = (groupedData[dept]?.morning.total || 0) + 
                                    (groupedData[dept]?.afternoon.total || 0) + 
                                    (groupedData[dept]?.night.total || 0);
                  return (
                    <td 
                      key={`total-${dept}`}
                      className="border border-gray-200 p-1 text-center bg-gray-50 font-bold"
                      style={{ 
                        width: '50px',
                        height: '30px'
                      }}
                    >
                      <div className="text-xs font-bold text-gray-900">
                        {deptTotal}
                      </div>
                    </td>
                  );
                })}
                
                {Array.from({ length: additionalColumnsCount }).map((_, i) => (
                  <td
                    key={`empty-total-${i}`}
                    className="border border-gray-200 p-1 text-center bg-gray-50"
                    style={{ 
                      width: '50px',
                      height: '30px'
                    }}
                  >
                    <div className="text-xs text-gray-400">-</div>
                  </td>
                ))}
                
                <td className="border border-gray-200 p-1 text-center bg-gray-200 font-bold">
                  <div className="text-xs font-bold text-gray-900">
                    {rowTotals.grandTotal}
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

// 4. External Consultation Summary Table - UPDATED DESIGN
const ExternalConsultationSummary = ({ externalConsultationDetails }) => {
  if (!externalConsultationDetails) return null;
  
const calculateCategoryTotal = (category) => {
  if (!externalConsultationDetails[category]) return 0;
  
  // Define which MR fields should be included in total calculation
  const MR_FIELDS_TO_INCLUDE = ['頭蓋骨盤', '脳ドック', '保険'];
  
  if (category === 'MR') {
    // For MR, only include specific fields
    return Object.entries(externalConsultationDetails[category]).reduce((sum, [fieldKey, item]) => {
      if (MR_FIELDS_TO_INCLUDE.includes(fieldKey) && item.enabled) {
        const value = parseInt(item.value) || 0;
        return sum + value;
      }
      return sum;
    }, 0);
  } else {
    // For PET and CT, include all fields
    return Object.values(externalConsultationDetails[category]).reduce((sum, item) => {
      if (item.enabled) {
        const value = parseInt(item.value) || 0;
        return sum + value;
      }
      return sum;
    }, 0);
  }
};
  
  const petTotal = calculateCategoryTotal('PET');
  const mrTotal = calculateCategoryTotal('MR');
  const ctTotal = calculateCategoryTotal('CT');
  const grandTotal = petTotal + mrTotal + ctTotal;

  return (
    <div className="detailed-duty-table w-full h-full mt-8">
      <div className="overflow-hidden rounded-md mb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="5">
                  <div className="text-md">患者数（外部診療）</div>
                </th>
              </tr>
              <tr className="bg-gray-300">
                <th className="border border-gray-300 p-2 text-center font-bold text-black"></th>
                <th className="border border-gray-300 p-2 text-center font-bold text-black">PET</th>
                <th className="border border-gray-300 p-2 text-center font-bold text-black">MR</th>
                <th className="border border-gray-300 p-2 text-center font-bold text-black">CT</th>
                <th className="border border-gray-300 p-2 text-center font-bold text-black">合計</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-100 font-bold text-gray-800">
                  患者数
                </td>
                <td className="border border-gray-300 p-2 text-center font-semibold text-gray-800">
                  {petTotal}
                </td>
                <td className="border border-gray-300 p-2 text-center font-semibold text-gray-800">
                  {mrTotal}
                </td>
                <td className="border border-gray-300 p-2 text-center font-semibold text-gray-800">
                  {ctTotal}
                </td>
                <td className="border border-gray-300 p-2 text-center font-bold text-gray-900 bg-blue-50">
                  {grandTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. Detailed External Consultation Table (Updated for better scaling)

const DetailedExternalConsultationTable = ({ externalConsultationDetails }) => {
  if (!externalConsultationDetails) return null;

  // Header data
  const categories = [
    { key: 'PET', label: 'PET' },
    { key: 'MR', label: 'MR' },
    { key: 'CT', label: 'CT' }
  ];

  // Get sub-items for each category
  const getSubItems = (category) => {
    if (!externalConsultationDetails[category]) return [];
    return Object.keys(externalConsultationDetails[category]);
  };

  // Calculate totals
  const calculateCategoryTotal = (category) => {
    if (!externalConsultationDetails[category]) return 0;
    return Object.values(externalConsultationDetails[category])
      .reduce((sum, item) => item.enabled ? sum + (parseInt(item.value) || 0) : sum, 0);
  };

  const calculateGrandTotal = () => {
    return categories.reduce((total, category) => 
      total + calculateCategoryTotal(category.key), 0
    );
  };

  // Get the value for a specific sub-item
  const getSubItemValue = (category, subItemKey) => {
    const item = externalConsultationDetails[category]?.[subItemKey];
    return item?.enabled ? item.value : '0';
  };

  const petTotal = calculateCategoryTotal('PET');
  const mrTotal = calculateCategoryTotal('MR');
  const ctTotal = calculateCategoryTotal('CT');
  const grandTotal = calculateGrandTotal();

  // Get all unique sub-item keys for each category
  const petSubItems = getSubItems('PET');
  const mrSubItems = getSubItems('MR');
  const ctSubItems = getSubItems('CT');
  
  // Find the maximum number of sub-items among all categories
  const maxSubItems = Math.max(petSubItems.length, mrSubItems.length, ctSubItems.length);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', py: 3 }}>
      {/* Beautiful Header */}
 
   
          <Box>
            <Typography
              sx={{
                fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
                fontWeight: 700,
                color: 'white',
                fontSize: '14px',
                letterSpacing: '0.5px',
                marginBottom: '4px',
                textAlign: 'center',
                padding: '2px',
                background: 'linear-gradient(135deg, #667eea 0%, #8a6da8ff 100%)',
                textShadow: '0 2px 4px rgba(146, 122, 122, 0.6)'
              }}
            >
              詳細外部診療データ
            </Typography>
          </Box>
 
 

      {/* Table Container */}
      <Box
        sx={{
          width: '100%',
          margin: '0 auto',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          background: 'white',
        }}
      >
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 1000, borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              {/* Main Header Row */}
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{
                    width: '100px',
                    borderRight: '2px solid #e5e7eb',
                    borderBottom: '2px solid #e5e7eb',
                    background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 600,
                    color: '#374151',
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  {/* Empty for row labels */}
                </TableCell>
                
                {categories.map((category) => (
                  <TableCell
                    key={category.key}
                    colSpan={4}
                    sx={{
                      borderRight: '2px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1e40af',
                      background: 'linear-gradient(to right, rgba(37, 99, 235, 0.05), rgba(147, 51, 234, 0.05))',
                      fontFamily: "'Noto Sans JP', sans-serif",
                      padding: '12px 8px',
                    }}
                  >
                    {category.label}
                  </TableCell>
                ))}
                
                <TableCell
                  rowSpan={2}
                  sx={{
                    width: '100px',
                    borderBottom: '2px solid #e5e7eb',
                    background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 600,
                    color: '#1e40af',
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  合計
                </TableCell>
              </TableRow>

              {/* Sub-header Row */}
              <TableRow>
                {/* PET Sub-headers */}
                {petSubItems.map((subItem, index) => (
                  <TableCell
                    key={`pet-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 500,
                      color: '#4b5563',
                      background: '#f9fafb',
                      fontFamily: "'Noto Sans JP', sans-serif",
                      padding: '8px 4px',
                      fontSize: subItem.length > 5 ? '12px' : '13px',
                    }}
                  >
                    {subItem}
                  </TableCell>
                ))}
                
                {/* Fill empty cells if PET has less than 4 sub-items */}
                {Array.from({ length: 4 - petSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`pet-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - petSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      background: '#f9fafb',
                    }}
                  />
                ))}

                {/* MR Sub-headers */}
                {mrSubItems.map((subItem, index) => (
                  <TableCell
                    key={`mr-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 500,
                      color: '#4b5563',
                      background: '#f9fafb',
                      fontFamily: "'Noto Sans JP', sans-serif",
                      padding: '8px 4px',
                      fontSize: subItem.length > 5 ? '12px' : '13px',
                    }}
                  >
                    {subItem}
                  </TableCell>
                ))}
                
                {/* Fill empty cells if MR has less than 4 sub-items */}
                {Array.from({ length: 4 - mrSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`mr-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - mrSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      background: '#f9fafb',
                    }}
                  />
                ))}

                {/* CT Sub-headers */}
                {ctSubItems.map((subItem, index) => (
                  <TableCell
                    key={`ct-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: 500,
                      color: '#4b5563',
                      background: '#f9fafb',
                      fontFamily: "'Noto Sans JP', sans-serif",
                      padding: '8px 4px',
                      fontSize: subItem.length > 5 ? '12px' : '13px',
                    }}
                  >
                    {subItem}
                  </TableCell>
                ))}
                
                {/* Fill empty cells if CT has less than 4 sub-items */}
                {Array.from({ length: 4 - ctSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`ct-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - ctSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '2px solid #e5e7eb',
                      background: '#f9fafb',
                    }}
                  />
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Patient Count Row */}
              <TableRow>
                <TableCell
                  sx={{
                    borderRight: '2px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                    color: '#374151',
                    background: '#f8fafc',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    textAlign: 'center',
                  }}
                >
                  患者数
                </TableCell>
                
                {/* PET Data */}
                {petSubItems.map((subItem, index) => (
                  <TableCell
                    key={`pet-data-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontFamily: "'Inter', monospace",
                      fontWeight: 500,
                      color: '#1f2937',
                      background: '#ffffff',
                      padding: '12px 4px',
                      '&:hover': {
                        background: 'rgba(37, 99, 235, 0.05)',
                      }
                    }}
                  >
                    {getSubItemValue('PET', subItem)}
                  </TableCell>
                ))}
                
                {/* Fill empty cells for PET */}
                {Array.from({ length: 4 - petSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`pet-data-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - petSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#ffffff',
                    }}
                  />
                ))}

                {/* MR Data */}
                {mrSubItems.map((subItem, index) => (
                  <TableCell
                    key={`mr-data-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontFamily: "'Inter', monospace",
                      fontWeight: 500,
                      color: '#1f2937',
                      background: '#ffffff',
                      padding: '12px 4px',
                      '&:hover': {
                        background: 'rgba(37, 99, 235, 0.05)',
                      }
                    }}
                  >
                    {getSubItemValue('MR', subItem)}
                  </TableCell>
                ))}
                
                {/* Fill empty cells for MR */}
                {Array.from({ length: 4 - mrSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`mr-data-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - mrSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#ffffff',
                    }}
                  />
                ))}

                {/* CT Data */}
                {ctSubItems.map((subItem, index) => (
                  <TableCell
                    key={`ct-data-${subItem}`}
                    sx={{
                      borderRight: index === 3 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontFamily: "'Inter', monospace",
                      fontWeight: 500,
                      color: '#1f2937',
                      background: '#ffffff',
                      padding: '12px 4px',
                      '&:hover': {
                        background: 'rgba(37, 99, 235, 0.05)',
                      }
                    }}
                  >
                    {getSubItemValue('CT', subItem)}
                  </TableCell>
                ))}
                
                {/* Fill empty cells for CT */}
                {Array.from({ length: 4 - ctSubItems.length }).map((_, index) => (
                  <TableCell
                    key={`ct-data-empty-${index}`}
                    sx={{
                      borderRight: index === (3 - ctSubItems.length) ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#ffffff',
                    }}
                  />
                ))}

                {/* Grand Total for Patient Count Row (empty) */}
                <TableCell
                  sx={{
                    borderBottom: '1px solid #e5e7eb',
                    background: '#ffffff',
                  }}
                >
                  {/* Empty for patient count row */}
                </TableCell>
              </TableRow>

              {/* Totals Row */}
              <TableRow>
                <TableCell
                  sx={{
                    borderRight: '2px solid #e5e7eb',
                    fontWeight: 600,
                    color: '#1e40af',
                    background: '#f8fafc',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    textAlign: 'center',
                  }}
                >
                  合計
                </TableCell>
                
                {/* PET Total */}
                <TableCell
                  colSpan={4}
                  sx={{
                    borderRight: '2px solid #e5e7eb',
                    textAlign: 'center',
                    fontFamily: "'Inter', monospace",
                    fontWeight: 600,
                    color: '#1e40af',
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '12px 4px',
                  }}
                >
                  {petTotal}
                </TableCell>
                
                {/* MR Total */}
                <TableCell
                  colSpan={4}
                  sx={{
                    borderRight: '2px solid #e5e7eb',
                    textAlign: 'center',
                    fontFamily: "'Inter', monospace",
                    fontWeight: 600,
                    color: '#1e40af',
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '12px 4px',
                  }}
                >
                  {mrTotal}
                </TableCell>
                
                {/* CT Total */}
                <TableCell
                  colSpan={4}
                  sx={{
                    borderRight: '2px solid #e5e7eb',
                    textAlign: 'center',
                    fontFamily: "'Inter', monospace",
                    fontWeight: 600,
                    color: '#1e40af',
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '12px 4px',
                  }}
                >
                  {ctTotal}
                </TableCell>
                
                {/* Grand Total */}
                <TableCell
                  sx={{
                    textAlign: 'center',
                    fontFamily: "'Inter', monospace",
                    fontWeight: 700,
                    color: '#1d4ed8',
                    background: 'rgba(37, 99, 235, 0.12)',
                    fontSize: '14px',
                    padding: '12px 4px',
                  }}
                >
                  {grandTotal}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
 
    </Box>
  );
};


// Main Report Component
function Report({ reportId, initialData, hospitalType, onRefresh }) {
  const { t } = useTranslation('shared-components');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(!initialData);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { hospital, toggleHospital } = useTheme();
  const user = useAppSelector(selectUser);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    actionType: '' // 'approval' or 'draft'
  });

  const [reportData, setReportData] = useState(() => {
    if (initialData) {
      return initialData;
    }
    
    return {
      report: null,
      departments: [],
      doctors: [],
      exists: false,
      report_comments: []
    };
  });

  useEffect(() => {
    if (initialData) {
      setReportData(initialData);
      setReportLoading(false);
    } else if (reportId) {
      fetchReportById();
    } else {
      setReportLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReportById = async () => {
    if (!reportId) {
      setReportLoading(false);
      return;
    }
    
    try {
      setReportLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report-mid/get-by-id`, {
        report_id: reportId
      });
      
      if (response.data.success) {
        const reportData = response.data.data;
        
        // Process special notes as first comment if it exists
        if (reportData.report?.special_notes) {
          const specialNotesComment = {
            id: -1,
            comment: reportData.report.special_notes,
            created_at: reportData.report.created_at,
            admin: reportData.report.created_by_admin,
            admin_id: reportData.report.created_by,
            can_edit: false,
            is_special_notes: true
          };
          
          if (!reportData.report_comments) {
            reportData.report_comments = [];
          }
          
          const hasSpecialNotes = reportData.report_comments.some(
            comment => comment.is_special_notes === true
          );
          
          if (!hasSpecialNotes) {
            reportData.report_comments.unshift(specialNotesComment);
          }
        }
        
        setReportData(reportData);
      } else {
        console.error('Failed to fetch report by ID');
      }
    } catch (error) {
      console.error('Error fetching report by ID:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const [statusData, setStatusData] = useState([]);


  
// Inside the Report component, add these handler functions:

const handleExportPDF = async () => {
  try {
    setLoading(true);
    const hospitalInfo = getHospitalInfo();
    const reportDate = getReportJapaneseDate();
    
    await exportToPDF(
      reportData, 
      reportDate, 
      hospitalInfo,
      statusData,
      managementComments
    );    
    setSuccessAlert('PDFをダウンロードしました');
    setTimeout(() => setSuccessAlert(null), 3000);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    setFailAlert('PDFのダウンロードに失敗しました');
    setTimeout(() => setFailAlert(null), 3000);
  } finally {
    setLoading(false);
  }
};

const handleExportMenuClick = () => {
  handleExportPDF();
};


  useEffect(() => {
    const createDefaultStatusData = () => {
      return [
        { 
          id: 1, 
          title: 'システム管理者', 
          role: 'superAdmin', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-blue-500',
          disabled: true
        },
        { 
          id: 2, 
          title: '責任管理者', 
          role: 'admin', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-green-500',
          disabled: true
        },
        { 
          id: 3, 
          title: '主任管理者', 
          role: 'hospitalAssistant', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-purple-500',
          disabled: true
        },
        { 
          id: 4, 
          title: 'マネージャー', 
          role: 'staff', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-orange-500',
          disabled: true
        },
        { 
          id: 5, 
          title: 'データ入力者', 
          role: 'operator', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-pink-500',
          disabled: true
        }
      ];
    };

    if (reportData.approvals && reportData.approvals.length > 0) {
      const formattedStatusData = reportData.approvals.map(approval => {
        let title = '';
        switch (approval.admin?.role) {
          case 'superAdmin':
            title = '理事長';
            break;
          case 'admin':
            title = '専務';
            break;
          case 'ヘッドマネージャー':
            title = '部長';
            break;
          case 'staff':
            title = 'マネージャー';
            break;
          case 'operator':
            title = 'オペレーター';
            break;
          default:
            title = approval.admin?.role || 'Unknown';
        }

        const getColorForRole = (role) => {
          switch (role) {
            case 'superAdmin': return 'bg-blue-500';
            case 'admin': return 'bg-green-500';
            case 'hospitalAssistant': return 'bg-purple-500';
            case 'staff': return 'bg-orange-500';
            case 'operator': return 'bg-pink-500';
            default: return 'bg-gray-500';
          }
        };

        const formatDate = (date) => {
          if (!date) return '';
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toLocaleDateString('ja-JP') + ' ' + 
                     dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
          return '';
        };

        return {
          id: approval.id,
          title: title,
          checked: approval.approval_status === 'approved',
          status: approval.approval_status === 'approved' ? '確認済み' : '未確認',
          date: formatDate(approval.created_at),
          person: approval.admin?.name || '',
          avatar: approval.admin?.name ? approval.admin.name.charAt(0) : '?',
          approver: approval.admin?.name || '',
          color: getColorForRole(approval.admin?.role),
          disabled: true,
          bypassed: approval.bypassed_lower_roles,
          role: approval.admin?.role
        };
      });

      const allRoles = ['superAdmin', 'admin', 'hospitalAssistant', 'staff', 'operator'];
      const existingRoles = reportData.approvals.map(a => a.admin?.role).filter(Boolean);
      const missingRoles = allRoles.filter(role => !existingRoles.includes(role));

      const defaultStatusData = [
        { id: 1, title: 'システム管理者', role: 'superAdmin', checked: false, status: '未確認', date: '', color: 'bg-blue-500', disabled: true },
        { id: 2, title: '責任管理者', role: 'admin', checked: false, status: '未確認', date: '', color: 'bg-green-500', disabled: true },
        { id: 3, title: '主任管理者', role: 'hospitalAssistant', checked: false, status: '未確認', date: '', color: 'bg-purple-500', disabled: true },
        { id: 4, title: 'マネージャー', role: 'staff', checked: false, status: '未確認', date: '', color: 'bg-orange-500', disabled: true },
        { id: 5, title: 'データ入力者', role: 'operator', checked: false, status: '未確認', date: '', color: 'bg-pink-500', disabled: true }
      ];

      missingRoles.forEach(role => {
        const defaultRole = defaultStatusData.find(d => d.role === role);
        if (defaultRole && !formattedStatusData.some(s => s.role === role)) {
          formattedStatusData.push({
            ...defaultRole,
            disabled: true
          });
        }
      });

      const roleOrder = ['superAdmin', 'admin', 'hospitalAssistant', 'staff', 'operator'];
      formattedStatusData.sort((a, b) => {
        const aIndex = roleOrder.indexOf(a.role);
        const bIndex = roleOrder.indexOf(b.role);
        return aIndex - bIndex;
      });

      setStatusData(formattedStatusData);
    } else {
      setStatusData(createDefaultStatusData());
    }
  }, [reportData.approvals]);

  const [managementComments, setManagementComments] = useState([]);

  useEffect(() => {
    const reportCommentsData = reportData.report_comments || [];
    const commentsData = reportData.comments || [];
    
    let allComments = [...reportCommentsData, ...commentsData];
    
    const uniqueComments = [];
    const seenIds = new Set();
    
    allComments.forEach(comment => {
      if (!seenIds.has(comment.id)) {
        seenIds.add(comment.id);
        uniqueComments.push(comment);
      }
    });
    
    allComments = uniqueComments;
    
    if (reportData.report?.special_notes) {
      const specialNotesExists = allComments.some(comment => 
        comment.is_special_notes === true || 
        comment.comment === reportData.report.special_notes ||
        comment.text === reportData.report.special_notes
      );
      
      if (!specialNotesExists) {
        const specialNotesComment = {
          id: -1,
          text: reportData.report.special_notes,
          comment: reportData.report.special_notes,
          time: reportData.report.created_at ? 
            new Date(reportData.report.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : 
            '00:00',
          author: reportData.report.created_by_admin?.name || 'システム',
          date: reportData.report.created_at ? 
            new Date(reportData.report.created_at).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          created_at: reportData.report.created_at,
          admin_id: reportData.report.created_by,
          can_edit: false,
          is_special_notes: true
        };
        
        allComments.unshift(specialNotesComment);
      }
    }

    if (allComments.length > 0) {
      const formattedComments = allComments.map((comment) => {
        const formatTime = (date) => {
          if (!date) return '00:00';
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (error) {
            console.error('Error formatting time:', error);
          }
          return '00:00';
        };

        const formatDate = (date) => {
          if (!date) return new Date().toISOString().split('T')[0];
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
          return new Date().toISOString().split('T')[0];
        };

        const checkCanEdit = () => {
          if (comment.is_special_notes) return false;
          if (comment.id === -1) return false;
          if (!comment.can_edit) return false;
          if (comment.admin_id !== user?.id) return false;
          if (!comment.created_at) return false;
          
          const createdDate = new Date(comment.created_at);
          const now = new Date();
          const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
          
          return createdDate >= sixHoursAgo;
        };

        const getAuthorName = () => {
          if (comment.is_special_notes && comment.id === -1) {
            return reportData.report?.created_by_admin?.name || 'システム';
          }
          return comment.admin?.name || comment.author || 'Unknown';
        };

        return {
          id: comment.id || Date.now() + Math.random(),
          text: comment.text || comment.comment || '',
          time: formatTime(comment.created_at),
          author: getAuthorName(),
          date: formatDate(comment.created_at),
          created_at: comment.created_at,
          admin_id: comment.admin_id,
          can_edit: checkCanEdit(),
          is_special_notes: comment.is_special_notes || false
        };
      });
      
      setManagementComments(formattedComments);
    } else {
      setManagementComments([]);
    }
  }, [reportData.report_comments, reportData.comments, reportData.report?.special_notes, user]);

  // Handle approval
  const handleApproval = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report/approve`, {
        report_id: reportId
      });
      
      if (response.data.success) {
        setSuccessAlert('レポートを承認しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || '承認に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error approving report:', error);
      setFailAlert(error.response?.data?.message || '承認に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDraft = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report/draft`, {
        report_id: reportId
      });
      
      if (response.data.success) {
        setSuccessAlert('レポートを下書き保存しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || '下書き保存に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error saving as draft:', error);
      setFailAlert(error.response?.data?.message || '下書き保存に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle primary button click with confirmation
  const handlePrimaryButtonClick = () => {
    if (reportData.report?.status === 'approved') return;
    
    setConfirmDialog({
      open: true,
      title: '管理日誌レポートを承認しますか？',
      message: reportData.exists 
        ? '既存のレポートを承認します。この操作は取り消せません。'
        : '新しいレポートを承認します。この操作は取り消せません。',
      action: handleApproval,
      actionType: 'approval'
    });
  };

  // Handle make draft click with confirmation
  const handleMakeDraftClick = () => {
    setConfirmDialog({
      open: true,
      title: '管理日誌レポートを下書き保存しますか？',
      message: reportData.exists 
        ? '既存のレポートを下書きとして保存します。'
        : '新しいレポートを下書きとして保存します。',
      action: handleMakeDraft,
      actionType: 'draft'
    });
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // Handle confirmation dialog action
  const handleConfirmDialogAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    handleConfirmDialogClose();
  };

  // Get report status text
  const getReportStatusText = () => {
    const status = reportData.report?.status;
    switch (status) {
      case 'approved': return '承認済み';
      case 'submitted': return '提出済み';
      case 'draft': return '下書き';
      case 'rejected': return '却下済み';
      default: return '不明';
    }
  };

  const getReportStatusColor = () => {
    const status = reportData.report?.status;
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleEdit = () => {
    if (!reportData.report) return;
    
    const reportDate = new Date(reportData.report.report_date);
    const year = reportDate.getFullYear();
    const month = String(reportDate.getMonth() + 1).padStart(2, '0');
    const day = String(reportDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const medicalCenterId = reportData.report.medical_center_id;
    
    navigate(`/report-entry?hospitalId=${medicalCenterId}&type=${hospitalType}&date=${formattedDate}&fromView=true&reportId=${reportId}`);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setFailAlert('コメントを入力してください');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report/comment`, {
        report_id: reportId,
        comment: newComment,
        is_internal: false
      });
      
      if (response.data.success) {
        setNewComment('');
        setSuccessAlert('コメントを追加しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの追加に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの追加に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    if (comment.is_special_notes) return;
    
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleSaveEditedComment = async () => {
    if (!editCommentText.trim()) {
      setFailAlert('コメントを入力してください');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`${apiConfig.baseURL}/report/comment/${editingCommentId}`, {
        comment: editCommentText
      });
      
      if (response.data.success) {
        setEditingCommentId(null);
        setEditCommentText('');
        setSuccessAlert('コメントを更新しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの更新に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの更新に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const comment = managementComments.find(c => c.id === commentId);
    if (comment?.is_special_notes || commentId === -1) {
      setFailAlert('特記事項は削除できません');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }
    
    if (!window.confirm('このコメントを削除してもよろしいですか？')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${apiConfig.baseURL}/report/comment/${commentId}`);
      
      if (response.data.success) {
        setSuccessAlert('コメントを削除しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの削除に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの削除に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Get report Japanese date
  const getReportJapaneseDate = () => {
    if (reportData.report?.report_date) {
      try {
        const date = new Date(reportData.report.report_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = days[date.getDay()];
        return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日（${dayOfWeek}）`;
      } catch (error) {
        console.error('Error formatting report date:', error);
      }
    }
    return '日付不明';
  };

  const getHospitalInfo = () => {
    if (reportData.report?.medical_center) {
      const mc = reportData.report.medical_center;
      return {
        name: mc.name || '医療機関名',
        address: mc.address || '住所情報なし'
      };
    }
    return {
      name: '医療機関名',
      address: '住所情報なし'
    };
  };

  const StatusBadge = ({ status }) => {
    const statusText = getReportStatusText();
    const colorClass = getReportStatusColor();
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
        <span className="mr-2">ステータス:</span>
        <span className="font-bold">{statusText}</span>
      </div>
    );
  };

  const hospitalInfo = getHospitalInfo();
  const reportDate = getReportJapaneseDate();

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
        <Typography className="ml-4">レポートデータを読み込み中...</Typography>
      </div>
    );
  }

  if (!reportData.report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert severity="warning" sx={{ mb: 2 }}>
          レポートが見つかりません
        </Alert>
        <Button variant="contained" onClick={() => window.history.back()}>
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Alerts */}
      {successAlert && (
        <Alert severity="success" className="text-sm mb-4 animate-fade-in" onClose={() => setSuccessAlert(null)}>
          {successAlert}
        </Alert>
      )}
      {failAlert && (
        <Alert severity="error" className="text-sm mb-4 animate-fade-in" onClose={() => setFailAlert(null)}>
          {failAlert}
        </Alert>
      )}

      {/* Header Section */}
      <HeaderSection
        title={`管理日誌レポート - ${reportDate}`}
        subtitle={`${hospitalInfo.name}　　${hospitalInfo.address}`}
        primaryButtonText={reportData.report?.status === 'approved' ? '承認済み' : '承認する'}
        secondaryButtonText="編集"
        showSecondaryButton={true}
        showTertiaryButton={true}
        tertiaryButtonText="ダウンロード"
        tertiaryButtonIcon={<DownloadIcon />}
        primaryButtonColor={reportData.report?.status === 'approved' ? 'secondary' : 'success'}
        secondaryButtonColor="warning"
        tertiaryButtonColor="info"
        onPrimaryButtonClick={handlePrimaryButtonClick}
        onSecondaryButtonClick={handleEdit}
        onTertiaryButtonClick={handleExportMenuClick}
        onMakeDraft={handleMakeDraftClick}
        showDate={true}
        customDate={reportDate}
        variant="gradient"
        loading={loading}
        reportNo={reportData.report?.report_no}
        status={reportData.report?.status}
        userRole={user?.role}
        reportExists={reportData.exists}
        approval={reportData.approvals?.some(
          (a) => a.admin_id === user?.uid
        ) ?? false}  
      >
        <div className="mt-2">
          <StatusBadge status={reportData.report?.status} />
        </div>
      </HeaderSection>

      {/* Main content with scrolling */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Status Confirmation Section */}
        <StatusConfirmationSection
          statusData={statusData}
          onStatusChange={() => {}}
          title="確認状態一覧"
          showSummary={true}
          showDate={true}
          compact={true}
        />

        {/* Patient Count and Treatment Time Tables */}
        <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
          <div className="lg:col-span-1">
            <PatientCountTable reportData={reportData} />
          </div>
          <div className="lg:col-span-2">
            <TreatmentTimeTable 
              reportDetails={reportData.report?.report_details} 
              doctors={reportData.doctors}
            />
          </div>
        </Box>

        {/* Diagnosis Table */}
        <div className="mt-20">
          <DiagnosisTable reportDetailsMid={reportData.report?.report_details_mid} />
        </div>
 
        {/* External Consultation Sections - Only show if grand total > 0 */}
        {reportData.report?.external_consultation_details && 
          (() => {
            // Calculate grand total to check if it's 0
            const externalDetails = reportData.report.external_consultation_details;
            
            const calculateCategoryTotal = (category) => {
              if (!externalDetails[category]) return 0;
              return Object.values(externalDetails[category]).reduce((sum, item) => {
                if (item.enabled) {
                  const value = parseInt(item.value) || 0;
                  return sum + value;
                }
                return sum;
              }, 0);
            };
            
            const petTotal = calculateCategoryTotal('PET');
            const mrTotal = calculateCategoryTotal('MR');
            const ctTotal = calculateCategoryTotal('CT');
            const grandTotal = petTotal + mrTotal + ctTotal;
            
            // Only show if grand total is greater than 0
            return grandTotal > 0 ? (
              <>
                <div className="mt-20">
                  <ExternalConsultationSummary 
                    externalConsultationDetails={externalDetails}
                  />
                </div>

                {/* Detailed External Consultation Table */}
                <div className="mt-20">
                  <DetailedExternalConsultationTable 
                    externalConsultationDetails={externalDetails}
                  />
                </div>
              </>
            ) : null;
          })()
        }
        <br></br>
        {/* Add Comment Section */}
        <div className="detailed-duty-table w-full mt-8">
          <div className="overflow-hidden rounded-md mb-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="bg-blue-600 text-white font-bold p-2 text-center" colSpan="1">
                      <div className="text-md">コメントを追加</div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
        
        <Box sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              variant="outlined"
              size="small"
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              startIcon={<SendIcon />}
              sx={{ minWidth: '100px', height: '40px' }}
            >
              {loading ? '送信中...' : '追加'}
            </Button>
          </Box>
        </Box>
        
        {/* Management Comments Section */}
        <div className="mt-8">
          <ManagementComments
            comments={managementComments}
            title="管理事項"
            showSummary={true}
            summaryMessage={managementComments.length > 0 ? managementComments[0].text : "管理事項はありません。"}
            showActionButtons={false}
            renderComment={(comment, index) => (
              <Box key={comment.id} className="relative group">
                {editingCommentId === comment.id ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={loading}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => setEditingCommentId(null)}
                        disabled={loading}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveEditedComment}
                        disabled={loading}
                      >
                        保存
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" className="text-gray-700 leading-relaxed">
                      {comment.text}
                      {comment.is_special_notes && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          インデックス
                        </span>
                      )}
                    </Typography>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <Typography variant="caption" className="text-gray-500">
                          報告者: {comment.author} | {comment.date} {comment.time}
                        </Typography>
                        {comment.can_edit && !comment.is_special_notes && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditComment(comment)}
                              className="text-blue-500 hover:bg-blue-50"
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:bg-red-50"
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </div>
                    </div>
                  </Box>
                )}
              </Box>
            )}
          />
        </div>

        {/* Footer */}
        <Box sx={{ 
          p: 3, 
          mt: 6, 
          bgcolor: 'grey.50', 
          border: '1px solid', 
          borderColor: 'grey.200',
          borderRadius: '0.75rem'
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
            <div>
              <span className="font-medium">作成者:</span> {reportData.report?.created_by_admin?.name || '不明'}
              <span className="mx-2">|</span>
              <span className="font-medium">承認者:</span> {reportData.report?.approved_by_admin?.name || '未承認'}
              <span className="mx-2">|</span>
              <span className="font-medium">コメント数:</span> {managementComments.length}
              <span className="mx-2">|</span>
              <span className="font-medium">ステータス:</span> {getReportStatusText()}
            </div>
            <div className="mt-2 sm:mt-0">
              最終更新: {reportData.report?.updated_at ? 
                new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') + ' ' + 
                new Date(reportData.report.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : reportDate + ' 00:00'}
            </div>
          </div>
        </Box>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose} color="primary" disabled={loading}>
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmDialogAction} 
            color={confirmDialog.actionType === 'approval' ? 'success' : 'primary'}
            variant="contained"
            disabled={loading}
            autoFocus
          >
            {loading ? '処理中...' : '確認'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <CircularProgress />
            <Typography className="mt-4">処理中...</Typography>
          </div>
        </div>
      )}
    </div>
  );
}

export default Report;