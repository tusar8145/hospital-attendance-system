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
    padding: 15,
    fontFamily: 'NotoSansJP',
    fontSize: 8,
    flexDirection: 'column',
  },
  headerSection: {
    marginBottom: 10,
    borderBottom: '1 solid #ccc',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 3,
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  reportNo: {
    fontSize: 8,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    padding: '2 6',
    borderRadius: 12,
    fontSize: 8,
    color: '#1e40af',
  },
  
  // Table styles
  tableContainer: {
    marginBottom: 8,
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 20,
  },
  tableHeader: {
    backgroundColor: '#2563eb',
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: 700,
    fontSize: 8,
    padding: 3,
  },
  tableSubHeader: {
    backgroundColor: '#e5e7eb',
  },
  tableSubHeaderText: {
    color: '#111827',
    fontWeight: 700,
    fontSize: 7,
    padding: 3,
  },
  tableCell: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastTableCell: {
    borderRightWidth: 0,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 7,
    textAlign: 'center',
  },
  cellTextBold: {
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
  },
  cellTextLarge: {
    fontSize: 9,
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
    fontSize: 6,
    lineHeight: 1.2,
    marginVertical: 0.5,
  },
  
  // Section title
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 5,
    marginBottom: 3,
    color: '#1f2937',
    borderLeft: '3 solid #2563eb',
    paddingLeft: 4,
  },
  
  // Main content rows
  mainRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  
  // Footer styles
  footer: {
    fontSize: 6,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  
  // Page break marker
  pageBreak: {
    marginTop: 15,
  },
  
  // Flex row for two-column layout
  flexRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 5,
  },
  externalHeader: {
    backgroundColor: '#2563eb',
    padding: 4,
    alignItems: 'center',
  },
  externalSubHeader: {
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  externalSubHeaderCell: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  externalDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 25,
  },
  externalDataCell: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  externalTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  externalTotalCell: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    fontWeight: 700,
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
        <View style={[styles.tableRow, { borderBottomWidth: 0, height: 38 }]}>
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
  
  const consultationTypes = [
    { key: 'morning', label: '午前診' },
    { key: 'afternoon', label: '午後診' },
    { key: 'night', label: '夜診' }
  ];

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header Row with floor headers */}
        <View style={styles.tableRow}>
          {/* Empty cell for vertical text column */}
          <View style={[styles.tableCell, { flex: 0.8, backgroundColor: '#2563eb', color: 'white' }]}>
             <Text style={[styles.cellText,]}>診療時間  </Text>
            </View>

          {/* Empty cell for row labels column */}
           
          {/* Floor headers */}
          {floors.map((floorData, index) => (
            <View 
              key={`floor-${index}`} 
              style={[styles.tableCell, { flex: 1, backgroundColor: '#e5e7eb' }]}
            >
              <Text style={styles.cellTextBold}>診{index + 1}</Text>
              <Text style={[styles.cellText, { fontSize: 6 }]}>{floorData.floor}</Text>
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
          {/* No first cell - covered by rowSpan from first row */}
          
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
          {/* No first cell - covered by rowSpan from first row */}
          
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
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6', borderRightWidth: 0 }]} />
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
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6', borderRightWidth: 0 }]}>
            <VerticalText chars="診療時間" />
          </View>
          <View style={[styles.tableCell, { flex: 0.5, backgroundColor: '#f3f4f6' }]} />
          
          {departments.map(dept => (
            <View key={`dept-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellTextBold}>{dept}</Text>
            </View>
          ))}
          
          {Array.from({ length: additionalColumnsCount }).map((_, i) => (
            <View key={`empty-dept-${i}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellText}>空欄</Text>
            </View>
          ))}
          
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>全体</Text>
          </View>
        </View>
        
        {/* Row 3 - Morning */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 0.5, borderRightWidth: 0 }]} />
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
          <View style={[styles.tableCell, { flex: 0.5, borderRightWidth: 0 }]} />
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
          <View style={[styles.tableCell, { flex: 0.5, borderRightWidth: 0 }]} />
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
          <View style={[styles.tableCell, { flex: 0.5, borderRightWidth: 0 }]} />
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
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.lastTableCell, { flex: 5 }]}>
            <Text style={styles.tableHeaderText}>患者数（外部診療）</Text>
          </View>
        </View>
        
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>PET</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>MR</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>CT</Text></View>
          <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>合計</Text></View>
        </View>
        
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>患者数</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextBold}>{petTotal}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextBold}>{mrTotal}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextBold}>{ctTotal}</Text></View>
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
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

// Main PDF Document Component
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
                         reportData.report?.visit_count > 0;

  return (
    <Document>
      {/* First Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>管理日誌レポート</Text>
          <Text style={styles.subtitle}>{reportDate}</Text>
          <Text style={styles.subtitle}>{hospitalInfo.name}</Text>
          <Text style={styles.subtitle}>{hospitalInfo.address}</Text>
          
          <View style={styles.reportInfo}>
            <Text style={styles.reportNo}>レポート番号: {reportData?.report?.report_no || '-'}</Text>
            <View style={styles.statusBadge}>
              <Text>ステータス: {statusText}</Text>
            </View>
          </View>
        </View>

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

        {/* Footer for first page */}
        <View style={styles.footer}>
          <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
          <Text>ページ 1/2</Text>
          <Text>最終更新: {reportData?.report?.updated_at ? new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') : reportDate}</Text>
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* External Consultation Tables (if data exists) */}
        {hasExternalData && (
          <>
            <Text style={styles.sectionTitle}>外部診療データ</Text>
            <ExternalConsultationSummaryPDF 
              externalConsultationDetails={reportData.report?.external_consultation_details}
            />
            <DetailedExternalConsultationPDF 
              externalConsultationDetails={reportData.report?.external_consultation_details}
            />
          </>
        )}

        {/* Status Confirmation Section */}
        <Text style={[styles.sectionTitle, hasExternalData ? styles.pageBreak : {}]}>確認状態一覧</Text>
        <View style={[styles.table, { marginBottom: 5 }]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>役割</Text></View>
            <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>状態</Text></View>
            <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>確認者</Text></View>
            <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>確認日時</Text></View>
          </View>
          {statusData.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx === statusData.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellText}>{item.title}</Text></View>
              <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellText}>{item.status}</Text></View>
              <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellText}>{item.person || '-'}</Text></View>
              <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.cellText}>{item.date || '-'}</Text></View>
            </View>
          ))}
        </View>

        {/* Management Comments */}
        {managementComments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>管理事項</Text>
            <View style={[styles.table, { marginBottom: 5 }]}>
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

        {/* Footer for second page */}
        <View style={styles.footer}>
          <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
          <Text>ページ 2/2</Text>
          <Text>承認者: {reportData?.report?.approved_by_admin?.name || '未承認'}</Text>
        </View>
      </Page>
    </Document>
  );
};