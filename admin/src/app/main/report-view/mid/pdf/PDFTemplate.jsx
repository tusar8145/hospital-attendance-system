// D:\Projects\trans\hospital-attendance-system\admin\src\app\main\report-view\PDFTemplate.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Japanese fonts
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 8,
    fontFamily: 'NotoSansJP',
    fontSize: 5,
    flexDirection: 'column',
  },
  headerSection: {
    marginBottom: 5,
    borderBottom: '0.5 solid #ccc',
    paddingBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 1,
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 6,
    color: '#4b5563',
    marginBottom: 1,
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  reportNo: {
    fontSize: 5,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    padding: '1 3',
    borderRadius: 8,
    fontSize: 5,
    color: '#1e40af',
  },
  
  // Table styles
  tableContainer: {
    marginBottom: 6,
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    minHeight: 12,
  },
  tableHeader: {
    backgroundColor: '#2563eb',
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: 700,
    fontSize: 5,
    padding: 1,
    textAlign: 'center',
  },
  tableSubHeader: {
    backgroundColor: '#e5e7eb',
  },
  tableSubHeaderText: {
    color: '#111827',
    fontWeight: 700,
    fontSize: 4.5,
    padding: 1,
    textAlign: 'center',
  },
  tableCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastTableCell: {
    borderRightWidth: 0,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 4.5,
    textAlign: 'center',
  },
  cellTextBold: {
    fontSize: 4.5,
    fontWeight: 700,
    textAlign: 'center',
  },
  cellTextLarge: {
    fontSize: 6,
    fontWeight: 700,
    textAlign: 'center',
  },
  
  // Vertical text for rotated headers
  verticalText: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalTextChar: {
    fontSize: 4,
    lineHeight: 1,
    marginVertical: 0.2,
  },
  
  // Section title
  sectionTitle: {
    fontSize: 7,
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 2,
    color: '#1f2937',
    borderLeft: '2 solid #2563eb',
    paddingLeft: 2,
  },
  
  // Main content rows
  mainRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  
  // Footer styles
  footer: {
    fontSize: 3,
    color: '#9ca3af',
    borderTop: '0.5 solid #e5e7eb',
    paddingTop: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  
  // Flex row for two-column layout
  flexRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  flexCol1: {
    flex: 1,
  },
  flexCol2: {
    flex: 2,
  },
  
  // External consultation table styles
  externalTable: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    marginBottom: 3,
  },
  externalHeader: {
    backgroundColor: '#2563eb',
    padding: 2,
    alignItems: 'center',
  },
  externalSubHeader: {
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
  },
  externalSubHeaderCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  externalDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    minHeight: 18,
  },
  externalDataCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  externalTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  externalTotalCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    fontWeight: 700,
  },
  
  // Spacing utilities
  contentContainer: {
    padding: 12,
  },
  verticalSpacing: {
    marginBottom: 8,
  },

  // New styles for Status Confirmation section (PDF version)
  statusContainer: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusHeader: {
    backgroundColor: 'lightgray',
    padding: 4,
  },
  statusHeaderText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: 700,
  },
  statusContent: {
    padding: 6,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  statusItem: {
    width: '12%', // Approximately 8 items per row
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 3,
  },
  statusItemHeader: {
    padding: 2,
    backgroundColor: '#3b82f6', // Default blue
  },
  statusItemHeaderBlue: {
    backgroundColor: '#2563eb',
  },
  statusItemHeaderGreen: {
    backgroundColor: '#16a34a',
  },
  statusItemHeaderPurple: {
    backgroundColor: '#9333ea',
  },
  statusItemHeaderText: {
    color: '#ffffff',
    fontSize: 4.5,
    fontWeight: 700,
    textAlign: 'center',
  },
  statusItemBody: {
    padding: 3,
  },
  statusPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusAvatar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusAvatarText: {
    color: '#ffffff',
    fontSize: 4,
    fontWeight: 700,
  },
  statusPersonName: {
    fontSize: 4.5,
    color: '#1f2937',
    flex: 1,
  },
  statusCheckbox: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  statusCheckmark: {
    color: '#ffffff',
    fontSize: 5,
  },
  statusIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 1,
  },
  statusIconGreen: {
    backgroundColor: '#22c55e',
  },
  statusIconOrange: {
    backgroundColor: '#f97316',
  },
  statusIconText: {
    fontSize: 4,
    color: '#22c55e',
  },
  statusIconTextOrange: {
    color: '#f97316',
  },
  statusText: {
    fontSize: 4,
    color: '#22c55e',
  },
  statusTextOrange: {
    color: '#f97316',
  },
  statusDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusTimeIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginRight: 1,
  },
  statusDateText: {
    fontSize: 4,
    color: '#6b7280',
  },
  statusApproverRow: {
    marginTop: 2,
    paddingTop: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  statusApproverText: {
    fontSize: 3.5,
    color: '#6b7280',
  },
  statusSummary: {
    marginTop: 4,
    padding: 4,
    backgroundColor: '#f9fafb',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusSummaryLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSummaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  statusSummaryDotGreen: {
    backgroundColor: '#22c55e',
  },
  statusSummaryDotOrange: {
    backgroundColor: '#f97316',
  },
  statusSummaryDotBlue: {
    backgroundColor: '#3b82f6',
  },
  statusSummaryText: {
    fontSize: 4,
    color: '#4b5563',
  },
  statusSummaryBold: {
    fontWeight: 700,
  },
  statusSummaryDate: {
    fontSize: 4,
    color: '#9ca3af',
  },
  statusEmptyState: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    alignItems: 'center',
  },
  statusEmptyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    marginBottom: 4,
  },
  statusEmptyText: {
    fontSize: 5,
    color: '#6b7280',
    marginBottom: 2,
  },
  statusEmptySubText: {
    fontSize: 4,
    color: '#9ca3af',
  },
});

// Helper function to create vertical text
const VerticalText = ({ chars }) => (
  <View style={styles.verticalText}>
    {chars.split('').map((char, index) => (
      <Text key={index} style={styles.verticalTextChar}>{char}</Text>
    ))}
  </View>
);

// New StatusConfirmationPDF Component (PDF version of StatusConfirmationSection)
const StatusConfirmationPDF = ({ 
  statusData = [],
  title = "確認状態一覧",
  showSummary = true,
  showDate = true
}) => {
  // Get current date in Japanese format
  const getCurrentJapaneseDateWithoutWeekday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日`;
  };

  // Safe date formatting function
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      // Try to parse the date string
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        // Return only the date part (YYYY-MM-DD format)
        const dateStr = date.split(' ')[0];
        return dateStr;
      }
    }
    return date;
  };

  // Get header color based on title
  const getHeaderStyle = (title) => {
    if (title === '理事長') return styles.statusItemHeaderBlue;
    if (title === '専務') return styles.statusItemHeaderGreen;
    if (title === '事務長') return styles.statusItemHeaderPurple;
    return styles.statusItemHeader; // Default blue
  };

  // Get avatar initial
  const getAvatarInitial = (person) => {
    if (!person) return '#';
    return person.charAt(0);
  };

  const checkedCount = statusData.filter(item => item.checked).length;
  const totalCount = statusData.length;

  return (
    <View style={styles.statusContainer}>
      {/* Header */}
      <View style={styles.statusHeader}>
        <Text style={styles.statusHeaderText}>{title}</Text>
      </View>
      
      {/* Content */}
      <View style={styles.statusContent}>
        {/* Grid of Confirmation Boxes */}
        <View style={styles.statusGrid}>
          {statusData.map((item) => (
            <View key={item.id} style={styles.statusItem}>
              {/* Header with role-specific color */}
              <View style={[styles.statusItemHeader, getHeaderStyle(item.title)]}>
                <Text style={styles.statusItemHeaderText}>{item.title || '未設定'}</Text>
              </View>
              
              {/* Body */}
              <View style={styles.statusItemBody}>
                {/* Person Row */}
                <View style={styles.statusPersonRow}>
                  <View style={[styles.statusAvatar, { backgroundColor: item.color || '#6b7280' }]}>
                    <Text style={styles.statusAvatarText}>
                      {getAvatarInitial(item.person)}
                    </Text>
                  </View>
                  <Text style={styles.statusPersonName}>
                    {item.person ? item.person.split(' ')[0] : '未設定'}
                  </Text>
                  
                  {/* Checkbox indicator */}
                  <View style={[styles.statusCheckbox, item.checked && styles.statusChecked]}>
                    {item.checked && <Text style={styles.statusCheckmark}>✓</Text>}
                  </View>
                </View>
                
                {/* Status Row */}
                <View style={styles.statusIconRow}>
                  <View style={[styles.statusIcon, item.checked ? styles.statusIconGreen : styles.statusIconOrange]} />
                  <Text style={[styles.statusText, !item.checked && styles.statusTextOrange]}>
                    {item.status || (item.checked ? '確認済み' : '未確認')}
                  </Text>
                </View>
                
                {/* Date Row */}
                <View style={styles.statusDateRow}>
                  <View style={styles.statusTimeIcon} />
                  <Text style={styles.statusDateText}>
                    {formatDateForDisplay(item.date)}
                  </Text>
                </View>
                
                {/* Approver Information */}
                {item.checked && item.approver && (
                  <View style={styles.statusApproverRow}>
                    <Text style={styles.statusApproverText}>
                      承認者: {item.approver || item.person || '未設定'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
        
        {/* Summary */}
        {showSummary && totalCount > 0 && (
          <View style={styles.statusSummary}>
            <View style={styles.statusSummaryLeft}>
              <View style={styles.statusSummaryItem}>
                <View style={[styles.statusSummaryDot, styles.statusSummaryDotGreen]} />
                <Text style={styles.statusSummaryText}>
                  確認済み: <Text style={styles.statusSummaryBold}>{checkedCount}</Text>
                </Text>
              </View>
              <View style={styles.statusSummaryItem}>
                <View style={[styles.statusSummaryDot, styles.statusSummaryDotOrange]} />
                <Text style={styles.statusSummaryText}>
                  未確認: <Text style={styles.statusSummaryBold}>{totalCount - checkedCount}</Text>
                </Text>
              </View>
              <View style={styles.statusSummaryItem}>
                <View style={[styles.statusSummaryDot, styles.statusSummaryDotBlue]} />
                <Text style={styles.statusSummaryText}>
                  合計: <Text style={styles.statusSummaryBold}>{totalCount}</Text>
                </Text>
              </View>
            </View>
            
            {showDate && (
              <Text style={styles.statusSummaryDate}>
                最終更新: {getCurrentJapaneseDateWithoutWeekday()}
              </Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {totalCount === 0 && (
          <View style={styles.statusEmptyState}>
            <View style={styles.statusEmptyIcon} />
            <Text style={styles.statusEmptyText}>承認履歴はまだありません</Text>
            <Text style={styles.statusEmptySubText}>
              最初の承認が行われるとここに表示されます
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// 1. Patient Count Table Component
const PatientCountPDF = ({ reportData }) => {
  if (!reportData?.report) return null;
  
  const { admission_count = 0, discharge_count = 0, external_duty = 0 } = reportData.report;
  const total = admission_count + discharge_count + external_duty;

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.lastTableCell, { flex: 4 }]}>
            <Text style={styles.tableHeaderText}>患　者　数</Text>
          </View>
        </View>
        
        {/* Sub-header row */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>午前診</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>午後診</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>夜診</Text></View>
          <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>合計</Text></View>
        </View>
        
        {/* Data row */}
        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 24 }]}>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{admission_count}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{discharge_count}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{external_duty}</Text></View>
          <View style={[styles.lastTableCell, { flex: 1 }]}>
            <Text style={styles.cellTextLarge}>{total}</Text>
            <Text style={styles.cellText}>合計患者数</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 2. Treatment Time Table Component
const TreatmentTimePDF = ({ reportDetails }) => {
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
      if (detail.doctor1?.license_no) names.push(detail.doctor1.license_no);
      if (detail.doctor2?.license_no) names.push(detail.doctor2.license_no);
      if (detail.doctor3?.license_no) names.push(detail.doctor3.license_no);
      return names.join('\n');
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

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header Row with floor headers */}
        <View style={styles.tableRow}>
          {/* Empty cell for vertical text column */}
          <View style={[styles.tableCell, { flex: 0.8, backgroundColor: '#2563eb' }]}>
            <Text style={[styles.cellText, { color: 'white' }]}>診療時間</Text>
          </View>

          {/* Floor headers */}
          {floors.map((floorData, index) => (
            <View 
              key={`floor-${index}`} 
              style={[styles.tableCell, { flex: 1, backgroundColor: '#e5e7eb' }]}
            >
              <Text style={styles.cellTextBold}>{floorData.floor}</Text>
             </View>
          ))}
        </View>
        
        {/* First row - Morning */}
        <View style={styles.tableRow}>
          {/* Row label */}
          <View style={[styles.tableCell, { flex: 0.8, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午前診</Text>
          </View>
          
          {/* Data cells */}
          {floors.map((floorData, colIndex) => (
            <View key={`morning-${colIndex}`} style={[styles.tableCell, { flex: 1 }]}>
              {floorData.morning && floorData.morning.length > 0 ? (
                floorData.morning.map((item, idx) => (
                  <Text key={idx} style={styles.cellText}>{item}</Text>
                ))
              ) : (
                <Text style={styles.cellText}>-</Text>
              )}
            </View>
          ))}
        </View>
        
        {/* Second row - Afternoon */}
        <View style={styles.tableRow}>
          {/* Row label */}
          <View style={[styles.tableCell, { flex: 0.8, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午後診</Text>
          </View>
          
          {/* Data cells */}
          {floors.map((floorData, colIndex) => (
            <View key={`afternoon-${colIndex}`} style={[styles.tableCell, { flex: 1 }]}>
              {floorData.afternoon && floorData.afternoon.length > 0 ? (
                floorData.afternoon.map((item, idx) => (
                  <Text key={idx} style={styles.cellText}>{item}</Text>
                ))
              ) : (
                <Text style={styles.cellText}>-</Text>
              )}
            </View>
          ))}
        </View>
        
        {/* Third row - Night */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          {/* Row label */}
          <View style={[styles.tableCell, { flex: 0.8, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>夜診</Text>
          </View>
          
          {/* Data cells */}
          {floors.map((floorData, colIndex) => (
            <View key={`night-${colIndex}`} style={[styles.tableCell, { flex: 1 }]}>
              {floorData.night && floorData.night.length > 0 ? (
                floorData.night.map((item, idx) => (
                  <Text key={idx} style={styles.cellText}>{item}</Text>
                ))
              ) : (
                <Text style={styles.cellText}>-</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// 3. Diagnosis Table Component
const DiagnosisPDF = ({ reportDetailsMid }) => {
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
  const rowTotals = {
    morning: departments.reduce((sum, dept) => sum + groupedData[dept].morning.total, 0),
    afternoon: departments.reduce((sum, dept) => sum + groupedData[dept].afternoon.total, 0),
    night: departments.reduce((sum, dept) => sum + groupedData[dept].night.total, 0),
    grandTotal: departments.reduce((sum, dept) => {
      const data = groupedData[dept];
      return sum + data.morning.total + data.afternoon.total + data.night.total;
    }, 0)
  };

  const totalColumns = 15;
  const usedColumns = departments.length + 2;
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Main Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.lastTableCell, { flex: totalColumns + 1 }]}>
            <Text style={styles.tableHeaderText}>診療科別患者数</Text>
          </View>
        </View>
        
        {/* Row 1 - Department numbers */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]} />
          
          {departments.map((_, index) => (
            <View key={`num-${index}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellTextBold}>{index + 1}</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-num-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellText}>{i + departments.length + 1}</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
        </View>
        
        {/* Row 2 - Department names */}
        <View style={styles.tableRow}>

          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]} />
          
          {departments.map(dept => (
            <View key={`dept-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellTextBold}>{dept}</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-dept-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}></Text>
          </View>
        </View>
        
        {/* Row 3 - Morning */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午前診</Text>
          </View>
          
          {departments.map(dept => (
            <View key={`morning-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
              <Text style={styles.cellTextBold}>{groupedData[dept]?.morning.total || 0}</Text>
              <Text style={styles.cellText}>({groupedData[dept]?.morning.new || 0})</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-morning-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
            <Text style={styles.cellTextBold}>{rowTotals.morning}</Text>
          </View>
        </View>
        
        {/* Row 4 - Afternoon */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午後診</Text>
          </View>
          
          {departments.map(dept => (
            <View key={`afternoon-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.cellTextBold}>{groupedData[dept]?.afternoon.total || 0}</Text>
              <Text style={styles.cellText}>({groupedData[dept]?.afternoon.new || 0})</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-afternoon-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.cellTextBold}>{rowTotals.afternoon}</Text>
          </View>
        </View>
        
        {/* Row 5 - Night */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>夜診</Text>
          </View>
          
          {departments.map(dept => (
            <View key={`night-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#faf5ff' }]}>
              <Text style={styles.cellTextBold}>{groupedData[dept]?.night.total || 0}</Text>
              <Text style={styles.cellText}>({groupedData[dept]?.night.new || 0})</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-night-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#faf5ff' }]}>
            <Text style={styles.cellTextBold}>{rowTotals.night}</Text>
          </View>
        </View>
        
        {/* Row 6 - Grand total */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#e5e7eb' }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
          
          {departments.map(dept => {
            const deptTotal = (groupedData[dept]?.morning.total || 0) + 
                              (groupedData[dept]?.afternoon.total || 0) + 
                              (groupedData[dept]?.night.total || 0);
            return (
              <View key={`total-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
                <Text style={styles.cellTextBold}>{deptTotal}</Text>
              </View>
            );
          })}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-total-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#e5e7eb' }]}>
            <Text style={styles.cellTextBold}>{rowTotals.grandTotal}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 4. External Consultation Summary Table
const ExternalConsultationSummaryPDF = ({ externalConsultationDetails }) => {
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
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.lastTableCell, { flex: 5 }]}>
            <Text style={styles.tableHeaderText}>患者数（外部診療）</Text>
          </View>
        </View>
        
        {/* Sub Header */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}></Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>PET</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>MR</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>CT</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>合計</Text>
          </View>
        </View>
        
        {/* Data Row - FIXED with alignSelf stretch and minHeight */}
        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 20 }]}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6', alignSelf: 'stretch' }]}>
            <Text style={styles.cellTextBold}>患者数</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, alignSelf: 'stretch' }]}>
            <Text style={styles.cellTextBold}>{petTotal}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, alignSelf: 'stretch' }]}>
            <Text style={styles.cellTextBold}>{mrTotal}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, alignSelf: 'stretch' }]}>
            <Text style={styles.cellTextBold}>{ctTotal}</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#eff6ff', alignSelf: 'stretch' }]}>
            <Text style={styles.cellTextBold}>{grandTotal}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 5. Detailed External Consultation Table
const DetailedExternalConsultationPDF = ({ externalConsultationDetails }) => {
  if (!externalConsultationDetails) return null;

  const categories = [
    { key: 'PET', label: 'PET' },
    { key: 'MR', label: 'MR' },
    { key: 'CT', label: 'CT' }
  ];

  const getSubItems = (category) => {
    if (!externalConsultationDetails[category]) return [];
    return Object.keys(externalConsultationDetails[category]);
  };

  const calculateCategoryTotal = (category) => {
    if (!externalConsultationDetails[category]) return 0;
    return Object.values(externalConsultationDetails[category])
      .reduce((sum, item) => item.enabled ? sum + (parseInt(item.value) || 0) : sum, 0);
  };

  const getSubItemValue = (category, subItemKey) => {
    const item = externalConsultationDetails[category]?.[subItemKey];
    return item?.enabled ? item.value : '0';
  };

  const petTotal = calculateCategoryTotal('PET');
  const mrTotal = calculateCategoryTotal('MR');
  const ctTotal = calculateCategoryTotal('CT');
  const grandTotal = calculateCategoryTotal('PET') + calculateCategoryTotal('MR') + calculateCategoryTotal('CT');

  const petSubItems = getSubItems('PET');
  const mrSubItems = getSubItems('MR');
  const ctSubItems = getSubItems('CT');

  return (
    <View style={styles.tableContainer}>
      <View style={styles.externalTable}>
        {/* Main Header */}
        <View style={styles.externalHeader}>
          <Text style={styles.tableHeaderText}>詳細外部診療データ</Text>
        </View>
        
        {/* Category Headers Row */}
        <View style={styles.externalSubHeader}>
          <View style={[styles.externalSubHeaderCell, { flex: 1 }]} />
          <View style={[styles.externalSubHeaderCell, { flex: 4 }]}><Text style={styles.tableSubHeaderText}>PET</Text></View>
          <View style={[styles.externalSubHeaderCell, { flex: 4 }]}><Text style={styles.tableSubHeaderText}>MR</Text></View>
          <View style={[styles.externalSubHeaderCell, { flex: 4, borderRightWidth: 0 }]}><Text style={styles.tableSubHeaderText}>CT</Text></View>
        </View>
        
        {/* Sub-items Header Row */}
        <View style={styles.externalSubHeader}>
          <View style={[styles.externalSubHeaderCell, { flex: 1 }]} />
          
          {/* PET Sub-items */}
          {petSubItems.map((subItem, index) => (
            <View key={`pet-header-${subItem}`} style={[styles.externalSubHeaderCell, { flex: 1 }]}>
              <Text style={styles.tableSubHeaderText}>{subItem}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - petSubItems.length }).map((_, i) => (
            <View key={`pet-empty-header-${i}`} style={[styles.externalSubHeaderCell, { flex: 1 }]} />
          ))}
          
          {/* MR Sub-items */}
          {mrSubItems.map((subItem, index) => (
            <View key={`mr-header-${subItem}`} style={[styles.externalSubHeaderCell, { flex: 1 }]}>
              <Text style={styles.tableSubHeaderText}>{subItem}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - mrSubItems.length }).map((_, i) => (
            <View key={`mr-empty-header-${i}`} style={[styles.externalSubHeaderCell, { flex: 1 }]} />
          ))}
          
          {/* CT Sub-items */}
          {ctSubItems.map((subItem, index) => (
            <View key={`ct-header-${subItem}`} style={[styles.externalSubHeaderCell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={styles.tableSubHeaderText}>{subItem}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - ctSubItems.length }).map((_, i) => (
            <View key={`ct-empty-header-${i}`} style={[styles.externalSubHeaderCell, { flex: 1, borderRightWidth: 0 }]} />
          ))}
        </View>
        
        {/* Data Row - Patient Count */}
        <View style={styles.externalDataRow}>
          <View style={[styles.externalDataCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>患者数</Text>
          </View>
          
          {/* PET Data */}
          {petSubItems.map((subItem, index) => (
            <View key={`pet-data-${subItem}`} style={[styles.externalDataCell, { flex: 1 }]}>
              <Text style={styles.cellText}>{getSubItemValue('PET', subItem)}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - petSubItems.length }).map((_, i) => (
            <View key={`pet-empty-data-${i}`} style={[styles.externalDataCell, { flex: 1 }]} />
          ))}
          
          {/* MR Data */}
          {mrSubItems.map((subItem, index) => (
            <View key={`mr-data-${subItem}`} style={[styles.externalDataCell, { flex: 1 }]}>
              <Text style={styles.cellText}>{getSubItemValue('MR', subItem)}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - mrSubItems.length }).map((_, i) => (
            <View key={`mr-empty-data-${i}`} style={[styles.externalDataCell, { flex: 1 }]} />
          ))}
          
          {/* CT Data */}
          {ctSubItems.map((subItem, index) => (
            <View key={`ct-data-${subItem}`} style={[styles.externalDataCell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={styles.cellText}>{getSubItemValue('CT', subItem)}</Text>
            </View>
          ))}
          {Array.from({ length: 4 - ctSubItems.length }).map((_, i) => (
            <View key={`ct-empty-data-${i}`} style={[styles.externalDataCell, { flex: 1, borderRightWidth: 0 }]} />
          ))}
        </View>
        
        {/* Totals Row */}
        <View style={[styles.externalDataRow, styles.externalTotalRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.externalTotalCell, { flex: 1 }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
          
          <View style={[styles.externalTotalCell, { flex: 4 }]}>
            <Text style={styles.cellTextBold}>{petTotal}</Text>
          </View>
          
          <View style={[styles.externalTotalCell, { flex: 4 }]}>
            <Text style={styles.cellTextBold}>{mrTotal}</Text>
          </View>
          
          <View style={[styles.externalTotalCell, { flex: 4, borderRightWidth: 0 }]}>
            <Text style={styles.cellTextBold}>{ctTotal}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Main PDF Document Component - Now Single Page with improved header and status section
export const PDFDocument = ({ 
  reportData, 
  reportDate, 
  hospitalInfo,
  statusData = [],
  managementComments = []
}) => {
  const status = reportData?.report?.status || 'draft';
  const statusText = {
    approved: '承認済み',
    submitted: '提出済み',
    draft: '下書き',
    rejected: '却下済み'
  }[status] || '不明';

  const hasExternalData = reportData.report?.emergency_transport > 0 || 
                         reportData.report?.post_transport_admission > 0 || 
                         reportData.report?.visit_count > 0 ||
                         (reportData.report?.external_consultation_details && 
                          Object.keys(reportData.report.external_consultation_details).length > 0);

  return (
    <Document>
      {/* Single Page - All content combined */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Main content container with padding */}
        <View style={styles.contentContainer}>
          {/* Header - Compact Design from first example */}
          <View style={styles.headerSection}>
            {/* Top row with title and status badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.title}>管理日誌レポート</Text>
              <View style={[styles.statusBadge, { 
                backgroundColor: status === 'approved' ? '#dcfce7' : 
                                 status === 'submitted' ? '#dbeafe' : 
                                 status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                paddingVertical: 2,
                paddingHorizontal: 6,
              }]}>
                <Text style={[styles.cellTextBold, { 
                  color: status === 'approved' ? '#166534' : 
                         status === 'submitted' ? '#1e40af' : 
                         status === 'rejected' ? '#991b1b' : '#4b5563',
                  fontSize: 5
                }]}>
                  {statusText}
                </Text>
              </View>
            </View>
            
            {/* Second row with date and hospital info - horizontal layout */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={[styles.cellText, { fontSize: 4.5, color: '#1f2937', marginLeft: 1 }]}>{reportDate}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={[styles.cellText, { fontSize: 4.5, color: '#1f2937', marginLeft: 1 }]}>{hospitalInfo.name}</Text>
              </View>
            </View>
            
            {/* Third row with report number and address */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.cellText, { fontSize: 4, color: '#6b7280' }]}>No.{reportData?.report?.report_no || '-'}</Text>
              </View>
              <Text style={[styles.cellText, { fontSize: 4, color: '#9ca3af' }]}>{hospitalInfo.address}</Text>
            </View>
          </View>

          {/* Status Confirmation Section at the TOP - from first example */}
          <StatusConfirmationPDF 
            statusData={statusData}
            title="確認状態一覧"
            showSummary={true}
            showDate={true}
          />

          {/* Patient Count and Treatment Time Tables Side by Side */}
          <View style={styles.flexRow}>
            <View style={styles.flexCol1}>
              <PatientCountPDF reportData={reportData} />
            </View>
            <View style={styles.flexCol2}>
              <TreatmentTimePDF reportDetails={reportData.report?.report_details} />
            </View>
          </View>

          {/* Diagnosis Table */}
          <Text style={styles.sectionTitle}>診療科別患者数</Text>
          <DiagnosisPDF reportDetailsMid={reportData.report?.report_details_mid} />

          {/* External Consultation Tables (if data exists) */}
          {hasExternalData && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 6 }]}>外部診療データ</Text>
              <ExternalConsultationSummaryPDF 
                externalConsultationDetails={reportData.report?.external_consultation_details}
              />
              <View style={{ marginBottom: 4 }}>
                <DetailedExternalConsultationPDF 
                  externalConsultationDetails={reportData.report?.external_consultation_details}
                />
              </View>
            </>
          )}

          {/* Management Comments */}
          {managementComments.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>管理事項</Text>
              <View style={[styles.table, { marginBottom: 4 }]}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.tableHeaderText}>コメント</Text></View>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>報告者</Text></View>
                  <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>日時</Text></View>
                </View>
                {managementComments.slice(0, 5).map((comment, idx) => (
                  <View key={idx} style={[styles.tableRow, idx === managementComments.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.cellText}>{comment.text}</Text></View>
                    <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellText}>{comment.author}</Text></View>
                    <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.cellText}>{comment.date} {comment.time}</Text></View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Footer for single page */}
          <View style={styles.footer}>
            <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
            <Text>ページ 1/1</Text>
            <Text>承認者: {reportData?.report?.approved_by_admin?.name || '未承認'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};