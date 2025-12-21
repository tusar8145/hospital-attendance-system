import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { Box, Stack, Typography, Paper, CircularProgress, TextField, IconButton } from '@mui/material';
import HeaderSection from '../HeaderSection';
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import { useAppSelector } from 'app/store/hooks';
import { useNavigate } from 'react-router-dom';

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

// 1. Patient Count Table Component
const PatientCountTable = ({ reportData }) => {
  if (!reportData?.report) return null;
  
  const { admission_count = 0, discharge_count = 0, external_duty = 0 } = reportData.report;
  const total = admission_count + discharge_count + external_duty;
  
  const patientCountData = [
    ['午前診', '午後診', '夜診', '合計'],
    [admission_count.toString(), discharge_count.toString(), external_duty.toString(), total.toString()]
  ];

  return (
    <Paper 
      elevation={2} 
      className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th 
                className="border border-gray-300 p-3 sm:p-4 text-center font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                colSpan="4"
              >
                患　者　数
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {patientCountData[0].map((header, index) => (
                <td
                  key={`header-${index}`}
                  className={`
                    border border-gray-300 p-3 sm:p-4 text-center
                    ${index < 3 ? 'border-r border-gray-300' : ''}
                    ${index === patientCountData[0].length - 1 ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="text-sm sm:text-base font-medium text-gray-700">
                    {header}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              {patientCountData[1].map((value, index) => (
                <td
                  key={`value-${index}`}
                  className={`
                    border border-gray-300 p-3 sm:p-4 text-center
                    ${index < 3 ? 'border-r border-gray-300' : ''}
                    ${index === patientCountData[1].length - 1 ? 'bg-blue-50 font-bold text-blue-700' : 'font-semibold text-gray-800'}
                  `}
                >
                  <div className="text-lg sm:text-xl">
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
    </Paper>
  );
};

// 2. Treatment Time Table Component
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
      if (detail.doctor1?.name) names.push(detail.doctor1.name);
      if (detail.doctor2?.name) names.push(detail.doctor2.name);
      if (detail.doctor3?.name) names.push(detail.doctor3.name);
      return names.join(' / ');
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
  
  const floors = Object.values(groupedData);
  
  const consultationTypes = [
    { key: 'morning', label: '午前診' },
    { key: 'afternoon', label: '午後診' },
    { key: 'night', label: '夜診' }
  ];

  return (
    <Paper 
      elevation={2} 
      className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {/* Header row */}
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600">
              <td 
                className="border border-gray-300 p-2 text-center text-white font-bold"
                rowSpan="4"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <div className="transform rotate-180 text-sm sm:text-base">
                  診療時間
                </div>
              </td>
              <td className="border border-gray-300 p-3 text-center bg-indigo-50"></td>
              {floors.map((floorData, index) => (
                <td
                  key={`floor-${index}`}
                  className={`
                    border border-gray-300 p-3 text-center
                    ${index < floors.length - 1 ? 'border-r border-gray-300' : ''}
                    bg-indigo-50 text-gray-700 font-medium
                  `}
                >
                  <div className="text-sm sm:text-base">
                    診{index + 1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{floorData.floor}</div>
                </td>
              ))}
            </tr>
            
            {/* Data rows */}
            {consultationTypes.map((type, rowIndex) => (
              <tr key={`row-${type.key}`}>
                <td className="border border-gray-300 p-3 text-center bg-gray-50">
                  <div className="text-sm sm:text-base font-medium text-gray-700">
                    {type.label}
                  </div>
                </td>
                {floors.map((floorData, colIndex) => (
                  <td
                    key={`cell-${type.key}-${colIndex}`}
                    className={`
                      border border-gray-300 p-3 text-center
                      ${colIndex < floors.length - 1 ? 'border-r border-gray-300' : ''}
                      hover:bg-blue-50 transition-colors duration-200
                    `}
                  >
                    <div className="text-sm text-gray-600 min-h-[40px] flex items-center justify-center">
                      {floorData[type.key].join(', ') || '-'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Paper>
  );
};

// 3. Diagnosis Table Component
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

  return (
    <Paper 
      elevation={2} 
      className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600">
              <th className="border border-gray-300 p-3 text-center text-white font-bold"></th>
              {departments.map((dept, index) => (
                <th 
                  key={`dept-${index}`}
                  className={`
                    border border-gray-300 p-3 text-center text-white font-bold
                    ${index < departments.length - 1 ? 'border-r border-white/30' : ''}
                  `}
                >
                  {dept}
                </th>
              ))}
              <th className="border border-gray-300 p-3 text-center text-white font-bold bg-teal-700">
                合 計
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { key: 'morning', label: '午前診' },
              { key: 'afternoon', label: '午後診' },
              { key: 'night', label: '夜診' }
            ].map((type, rowIndex) => (
              <tr key={type.key} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="border border-gray-300 p-3 text-center bg-gray-50 font-medium text-gray-700">
                  {type.label}
                </td>
                {departments.map((dept, colIndex) => (
                  <td
                    key={`${type.key}-${dept}`}
                    className={`
                      border border-gray-300 p-3 text-center
                      ${colIndex < departments.length - 1 ? 'border-r border-gray-300' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center min-h-[50px]">
                      <span className="text-sm font-semibold text-gray-800">
                        {groupedData[dept][type.key].total}
                      </span>
                      <span className="text-xs text-gray-500">
                        （{groupedData[dept][type.key].new}）
                      </span>
                    </div>
                  </td>
                ))}
                <td className="border border-gray-300 p-3 text-center bg-emerald-50">
                  <div className="flex flex-col items-center justify-center min-h-[50px]">
                    <span className="text-sm font-bold text-gray-900">
                      {rowTotals[type.key]}
                    </span>
                    <span className="text-xs text-gray-500">
                      （合計{rowTotals[type.key]}）
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Paper>
  );
};

// 4. External Consultation Summary Table
const ExternalConsultationSummary = ({ externalConsultationDetails }) => {
  if (!externalConsultationDetails) return null;
  
  const calculateCategoryTotal = (category) => {
    if (!externalConsultationDetails[category]) return 0;
    
    return Object.values(externalConsultationDetails[category]).reduce((sum, item) => {
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

  return (
    <Paper 
      elevation={2} 
      className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 mt-8"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th 
                className="border border-gray-300 p-3 sm:p-4 text-center font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                colSpan="5"
              >
                患者数
              </th>
            </tr>
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-3 text-center font-medium text-gray-700"></th>
              <th className="border border-gray-300 p-3 text-center font-medium text-gray-700">PET</th>
              <th className="border border-gray-300 p-3 text-center font-medium text-gray-700">MR</th>
              <th className="border border-gray-300 p-3 text-center font-medium text-gray-700">CT</th>
              <th className="border border-gray-300 p-3 text-center font-medium text-gray-700 bg-purple-100">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3 text-center bg-gray-50 font-medium text-gray-700">
                患者数
              </td>
              <td className="border border-gray-300 p-3 text-center font-semibold text-gray-800">
                {petTotal}
              </td>
              <td className="border border-gray-300 p-3 text-center font-semibold text-gray-800">
                {mrTotal}
              </td>
              <td className="border border-gray-300 p-3 text-center font-semibold text-gray-800">
                {ctTotal}
              </td>
              <td className="border border-gray-300 p-3 text-center font-bold text-purple-700 bg-purple-50">
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Paper>
  );
};

// 5. Detailed External Consultation Table (Updated with dynamic data)
const DetailedExternalConsultationTable = ({ externalConsultationDetails }) => {
  if (!externalConsultationDetails) return null;
  
  const headerData = [
    { label: "PET-CT", left: 70, top: 30 },
    { label: "PET", left: 195, top: 6 },
    { label: "MR", left: 497, top: 6 },
    { label: "CT", left: 801, top: 6 },
  ];

  // Extract sub-items from data
  const getSubItems = () => {
    const subItems = [];
    
    // PET sub-items
    if (externalConsultationDetails.PET) {
      Object.keys(externalConsultationDetails.PET).forEach(key => {
        subItems.push({
          label: key,
          left: getLeftPositionForSubItem('PET', key),
          top: 30,
          fontSize: key.length > 5 ? 10.6 : 13.6
        });
      });
    }
    
    // Add totals
    subItems.push({ 
      label: "合計", 
      left: 1000, 
      top: 30, 
      letterSpacing: 6.8 
    });
    
    return subItems;
  };

  // Helper function to calculate position (simplified version)
  const getLeftPositionForSubItem = (category, itemName) => {
    const positions = {
      'PET': {
        'PET-CT': 106,
        'エグゼクティブ': 181,
        '保険': 257,
        '〇〇〇〇': 289
      },
      'MR': {
        '頭蓋骨盤': 406,
        'エコー': 482,
        '脳ドック': 558,
        '保険': 632
      },
      'CT': {
        '〇〇〇〇': 712,
        '〇〇〇〇2': 790,
        '〇〇〇〇3': 866,
        '〇〇〇〇4': 920
      }
    };
    
    return positions[category]?.[itemName] || 200;
  };

  // Get data points
  const getDataPoints = () => {
    const dataPoints = [];
    
    // Patient count row
    if (externalConsultationDetails.PET) {
      Object.entries(externalConsultationDetails.PET).forEach(([key, item]) => {
        if (item.enabled) {
          const left = getLeftPositionForSubItem('PET', key);
          dataPoints.push({
            value: item.value,
            left: left,
            top: 57
          });
        }
      });
    }
    
    if (externalConsultationDetails.MR) {
      Object.entries(externalConsultationDetails.MR).forEach(([key, item]) => {
        if (item.enabled) {
          const left = getLeftPositionForSubItem('MR', key);
          dataPoints.push({
            value: item.value,
            left: left,
            top: 57
          });
        }
      });
    }
    
    if (externalConsultationDetails.CT) {
      Object.entries(externalConsultationDetails.CT).forEach(([key, item]) => {
        if (item.enabled) {
          const left = getLeftPositionForSubItem('CT', key);
          dataPoints.push({
            value: item.value,
            left: left,
            top: 57
          });
        }
      });
    }
    
    // Total row calculations
    const petTotal = Object.values(externalConsultationDetails.PET || {}).reduce((sum, item) => 
      item.enabled ? sum + (parseInt(item.value) || 0) : sum, 0
    );
    const mrTotal = Object.values(externalConsultationDetails.MR || {}).reduce((sum, item) => 
      item.enabled ? sum + (parseInt(item.value) || 0) : sum, 0
    );
    const ctTotal = Object.values(externalConsultationDetails.CT || {}).reduce((sum, item) => 
      item.enabled ? sum + (parseInt(item.value) || 0) : sum, 0
    );
    const grandTotal = petTotal + mrTotal + ctTotal;
    
    // Add total row data points
    dataPoints.push({ value: petTotal.toString(), left: 181, top: 91 });
    dataPoints.push({ value: mrTotal.toString(), left: 482, top: 91 });
    dataPoints.push({ value: ctTotal.toString(), left: 802, top: 91 });
    dataPoints.push({ value: grandTotal.toString(), left: 1018, top: 95 });
    
    return dataPoints;
  };

  const subHeaderData = getSubItems();
  const dataPoints = getDataPoints();
  
  const verticalLines = [
    { left: 53, top: 0, height: 119, width: 3 },
    { left: 130, top: 26, height: 57, width: 2 },
    { left: 583, top: 26, height: 59, width: 2 },
    { left: 357, top: 0.5, height: 118, width: 2 },
    { left: 810, top: 26, height: 59, width: 2 },
    { left: 205, top: 26, height: 57, width: 2 },
    { left: 659, top: 0, height: 119, width: 2 },
    { left: 432, top: 26, height: 59, width: 2 },
    { left: 885, top: 26, height: 59, width: 2 },
    { left: 281, top: 26, height: 59, width: 2 },
    { left: 734, top: 26, height: 59, width: 2 },
    { left: 508, top: 26, height: 57, width: 2 },
    { left: 961, top: 0, height: 119, width: 2 },
  ];

  const horizontalBorders = [
    { top: 24, height: 26, borderWidth: 1.51 },
    { top: 0, height: 26, borderWidth: 1.51 },
    { top: 48, height: 36, borderWidth: 1.51 },
    { top: 83, height: 36, borderWidth: 1.51 },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        width: 1068,
        height: 119,
        marginTop: 4,
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 1136,
          height: 119,
        }}
      >
        {/* Row Labels */}
        {[
          { label: '患者数', left: 8, top: 57 },
          { label: '合計', left: 8, top: 91 },
        ].map((item, index) => (
          <Typography
            key={`row-label-${index}`}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              fontFamily: 'Inter-Regular, Helvetica',
              fontWeight: 400,
              color: 'black',
              fontSize: 13.6,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Typography>
        ))}

        {/* Main Headers */}
        {headerData.map((item, index) => (
          <Typography
            key={`header-${index}`}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              fontFamily: 'Inter-Regular, Helvetica',
              fontWeight: 400,
              color: 'black',
              fontSize: 13.6,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Typography>
        ))}

        {/* Sub Headers */}
        {subHeaderData.map((item, index) => (
          <Typography
            key={`subheader-${index}`}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              fontFamily: 'Inter-Regular, Helvetica',
              fontWeight: 400,
              color: 'black',
              fontSize: item.fontSize || 13.6,
              whiteSpace: 'nowrap',
              letterSpacing: item.letterSpacing || 0,
            }}
          >
            {item.label}
          </Typography>
        ))}

        {/* Data Points */}
        {dataPoints.map((item, index) => (
          <Typography
            key={`data-${index}`}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              fontFamily: 'Inter-Regular, Helvetica',
              fontWeight: 400,
              color: 'black',
              fontSize: 13.6,
              whiteSpace: 'nowrap',
            }}
          >
            {item.value}
          </Typography>
        ))}

        {/* Vertical Lines */}
        {verticalLines.map((line, index) => (
          <Box
            key={`vline-${index}`}
            sx={{
              position: 'absolute',
              top: line.top,
              left: line.left,
              width: line.width,
              height: line.height,
              backgroundColor: 'black',
            }}
          />
        ))}

        {/* Horizontal Borders */}
        {horizontalBorders.map((border, index) => (
          <Box
            key={`hborder-${index}`}
            sx={{
              position: 'absolute',
              top: border.top,
              left: 0,
              width: 1068,
              height: border.height,
              border: `${border.borderWidth}px solid #484848`,
            }}
          />
        ))}
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

  useEffect(() => {
    const createDefaultStatusData = () => {
      return [
        { 
          id: 1, 
          title: '理事長', 
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
          title: '専務', 
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
          title: '医師長', 
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
          title: '看護部', 
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
          title: '事務部', 
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
    <div className="flex flex-col flex-1 w-full p-4 sm:p-6 lg:p-8">
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
        primaryButtonColor={reportData.report?.status === 'approved' ? 'secondary' : 'success'}
        secondaryButtonColor="warning"
        onPrimaryButtonClick={reportData.report?.status === 'approved' ? null : handleApproval}
        onSecondaryButtonClick={handleEdit}
        showDate={true}
        customDate={reportDate}
        variant="gradient"
        loading={loading}
        reportNo={reportData.report?.report_no}
      >
        <div className="mt-2">
          <StatusBadge status={reportData.report?.status} />
        </div>
      </HeaderSection>

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
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <PatientCountTable reportData={reportData} />
        <TreatmentTimeTable 
          reportDetails={reportData.report?.report_details} 
          doctors={reportData.doctors}
        />
      </Box>

      {/* Diagnosis Table */}
      <div className="mt-8">
        <DiagnosisTable reportDetailsMid={reportData.report?.report_details_mid} />
      </div>

      {/* External Consultation Summary */}
      <ExternalConsultationSummary 
        externalConsultationDetails={reportData.report?.external_consultation_details}
      />

      {/* Detailed External Consultation Table */}
      {reportData.report?.external_consultation_details && (
        <div className="mt-8">
          <Typography variant="h6" className="font-bold mb-4">
            詳細外部診療データ
          </Typography>
          <DetailedExternalConsultationTable 
            externalConsultationDetails={reportData.report.external_consultation_details}
          />
        </div>
      )}
      
      {/* Add Comment Section */}
      <Paper elevation={2} className="border border-gray-300 rounded-xl overflow-hidden mt-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
          <Typography variant="h6" className="font-bold text-white">
            コメントを追加
          </Typography>
        </div>
        
        <div className="p-4">
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
        </div>
      </Paper>
      
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
                        特記事項
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
      <Paper elevation={1} className="p-4 mt-6 bg-gray-50 border border-gray-200">
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
      </Paper>

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