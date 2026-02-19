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
    marginBottom: 3,
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    marginBottom: 2,
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
    marginTop: 2,
    marginBottom: 1,
    color: '#1f2937',
    borderLeft: '2 solid #2563eb',
    paddingLeft: 2,
  },
  
  // Main content rows
  mainRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  
  // Footer styles
  footer: {
    fontSize: 4,
    color: '#9ca3af',
    borderTop: '0.5 solid #e5e7eb',
    paddingTop: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  
  // New layout styles for the top section
  topSection: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 2,
  },
  leftColumn: {
    flex: 12, // CombinedHospitalMedicalPDF takes 12 parts
  },
  rightColumn: {
    flex: 8, // Right column takes 8 parts total
    flexDirection: 'column',
    gap: 2,
  },
  dutyRowContainer: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  dutyTableContainer: {
    flex: 7, // Takes 7 parts of the right column
  },
  visitTableContainer: {
    flex: 1, // Takes 1 part of the right column
    justifyContent: 'flex-start',
  },
  
  // Duty table specific styles
  dutyTable: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  dutyTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    minHeight: 12,
  },
  dutyTableCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  dutyLastTableCell: {
    borderRightWidth: 0,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  
  // Emergency data styles
  emergencyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  emergencyNumber: {
    fontSize: 7,
    fontWeight: 700,
    color: '#b91c1c',
    marginBottom: 1,
  },
  emergencyLabel: {
    fontSize: 3.5,
    color: '#4b5563',
    marginBottom: 0.5,
  },
  emergencySubNumber: {
    fontSize: 5,
    fontWeight: 700,
    color: '#111827',
  },
  emergencyMonthlyContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    borderStyle: 'dashed',
    paddingBottom: 1,
    marginBottom: 1,
    width: '100%',
    alignItems: 'center',
  },
  
  // Nurse data styles
  nurseContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  nurseItem: {
    fontSize: 4,
    marginBottom: 0.5,
  },
  
  // Vertical text for nurse headers
  verticalNurseText: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalNurseChar: {
    fontSize: 4.5,
    lineHeight: 1.2,
    fontWeight: 700,
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

// Helper function for vertical nurse text (with different styling)
const VerticalNurseText = ({ chars }) => (
  <View style={styles.verticalNurseText}>
    {chars.split('').map((char, index) => (
      <Text key={index} style={styles.verticalNurseChar}>{char}</Text>
    ))}
  </View>
);

// Combined Hospital and Medical Management Table
const CombinedHospitalMedicalPDF = ({ 
  data, 
  outpatient, 
  totalAdmittedPatient,
  emergencyData,
  nurseData 
}) => {
  // Calculate outpatient totals
  const calculateOutpatientTotals = () => {
    let morning = 0, afternoon = 0, night = 0;
    if (Array.isArray(outpatient)) {
      outpatient.forEach(item => {
        const count = item.patient_count || 0;
        if (item.consultation_type === 'morning') morning += count;
        else if (item.consultation_type === 'afternoon') afternoon += count;
        else if (item.consultation_type === 'night') night += count;
      });
    }
    return { morning, afternoon, night, total: morning + afternoon + night };
  };

  const outpatientTotals = calculateOutpatientTotals();
  const hospitalData = {
    inpatient: {
      admission: data?.inpatient?.admission || 0,
      discharge: data?.inpatient?.discharge || 0,
      current: data?.inpatient?.current || 0
    },
    outpatient: outpatientTotals
  };

  const emergency = {
    current: emergencyData?.current || 0,
    hospitalization: emergencyData?.hospitalization || 0,
    monthly: emergencyData?.monthly || 0,
    cumulative: emergencyData?.cumulative || 0
  };

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Row 1: Main headers spanning multiple columns */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, { flex: 3 }]}>
            <Text style={styles.tableHeaderText}>入院</Text>
          </View>
          <View style={[styles.tableCell, { flex: 4 }]}>
            <Text style={styles.tableHeaderText}>外来</Text>
          </View>
          <View style={[styles.tableCell, { flex: 4 }]}>
            <Text style={styles.tableHeaderText}>緊急搬入数</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 4 }]}>
            <Text style={styles.tableHeaderText}>外来看護師</Text>
          </View>
        </View>

        {/* Row 2: Subheaders */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          {/* Inpatient subcategories */}
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>入院数</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>退院数</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>入院患者数</Text>
          </View>
          
          {/* Outpatient subcategories */}
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>朝診</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>午後診</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>当直</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.tableSubHeaderText}>合計</Text>
          </View>

          {/* Emergency subheaders (empty for now, will be filled in data rows) */}
          <View style={[styles.tableCell, { flex: 4 }]}>
            <Text style={styles.tableSubHeaderText}></Text>
          </View>

          {/* Nurse subheaders */}
          <View style={[styles.tableCell, { flex: 1 }]}>
           <Text style={styles.tableSubHeaderText}></Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 3 }]}>
            <Text style={styles.tableSubHeaderText}></Text>
          </View>
        </View>

        {/* Row 3: First data row with rowspan equivalent */}
        <View style={styles.tableRow}>
          {/* Inpatient data (rowspan=2) */}
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.inpatient.admission}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.inpatient.discharge}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{totalAdmittedPatient || 0}</Text>
          </View>
          
          {/* Outpatient data (rowspan=2) */}
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.outpatient.morning}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.outpatient.afternoon}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.outpatient.night}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <Text style={styles.cellTextLarge}>{hospitalData.outpatient.total}</Text>
          </View>

          {/* Emergency data - first part (current/hospitalization) */}
          <View style={[styles.tableCell, { flex: 4, minHeight: 40 }]}>
            <View style={styles.emergencyContainer}>
              <Text style={styles.emergencyNumber}>{emergency.current}</Text>
              <Text style={styles.emergencyLabel}>搬入後入院件数</Text>
              <Text style={styles.emergencySubNumber}>{emergency.hospitalization}</Text>
            </View>
          </View>

          {/* Nurse data - quasi night (準夜) */}
          <View style={[styles.tableCell, { flex: 1, minHeight: 40 }]}>
            <VerticalNurseText chars="準夜" />
          </View>
          <View style={[styles.lastTableCell, { flex: 3, minHeight: 40 }]}>
            <View style={styles.nurseContainer}>
              {nurseData?.quasiNight?.length > 0 ? 
                nurseData.quasiNight.map((name, i) => (
                  <Text key={i} style={styles.nurseItem}>{name}</Text>
                )) : <Text style={styles.nurseItem}>-</Text>
              }
            </View>
          </View>
        </View>

        {/* Row 4: Second data row */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          {/* Inpatient and Outpatient cells are skipped (rowspan effect) */}
          {/* Empty cells to maintain structure */}
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text></Text></View>

          {/* Emergency data - second part (monthly/cumulative) */}
          <View style={[styles.tableCell, { flex: 4 }]}>
            <View style={styles.emergencyContainer}>
              <View style={styles.emergencyMonthlyContainer}>
                <Text style={styles.emergencyLabel}>当月緊急搬入数</Text>
                <Text style={styles.emergencyNumber}>{emergency.monthly}</Text>
              </View>
              <Text style={styles.emergencyLabel}>搬入後入院者累計</Text>
              <Text style={styles.emergencySubNumber}>{emergency.cumulative}</Text>
            </View>
          </View>

          {/* Nurse data - midnight (深夜) */}
          <View style={[styles.tableCell, { flex: 1 }]}>
            <VerticalNurseText chars="深夜" />
          </View>
          <View style={[styles.lastTableCell, { flex: 3 }]}>
            <View style={styles.nurseContainer}>
              {nurseData?.midnight?.length > 0 ? 
                nurseData.midnight.map((name, i) => (
                  <Text key={i} style={styles.nurseItem}>{name}</Text>
                )) : <Text style={styles.nurseItem}>-</Text>
              }
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Duty Table Component - Can be split into two parts
const DutyTableSection = ({ dutyStaff = [], startIndex = 0, endIndex = 7 }) => {
  if (!dutyStaff || dutyStaff.length === 0) {
    // Create empty columns if no data
    const emptyColumns = Array.from({ length: endIndex - startIndex }, (_, i) => null);
    return renderDutyColumns(emptyColumns);
  }
  
  // Get the slice of duty staff for this section
  const columns = dutyStaff.slice(startIndex, endIndex);
  
  // Fill with null if less than expected columns
  while (columns.length < (endIndex - startIndex)) {
    columns.push(null);
  }
  
  return renderDutyColumns(columns);
};

// Helper function to render duty columns
const renderDutyColumns = (columns) => {
  return (
    <View style={styles.dutyTable}>
      {/* Title Row - Shows range */}
      <View style={[styles.dutyTableRow, styles.tableHeader]}>
        <View style={[styles.dutyLastTableCell, { flex: columns.length }]}>
          <Text style={styles.tableHeaderText}>当直 ({columns.length}名)</Text>
        </View>
      </View>
      
      {/* Header Row - Staff names (Row 1) */}
      <View style={[styles.dutyTableRow, styles.tableSubHeader]}>
        {columns.map((item, idx) => (
          <View 
            key={`header-${idx}`} 
            style={[
              styles.dutyTableCell, 
              idx === columns.length - 1 && styles.dutyLastTableCell
            ]}
          >
            <Text style={styles.tableSubHeaderText}>{item?.staff_name_1 || '-'}</Text>
          </View>
        ))}
      </View>
      
      {/* Staff Name 2 Row */}
      <View style={styles.dutyTableRow}>
        {columns.map((item, idx) => (
          <View 
            key={`name2-${idx}`} 
            style={[
              styles.dutyTableCell, 
              idx === columns.length - 1 && styles.dutyLastTableCell
            ]}
          >
            <Text style={styles.cellText}>{item?.staff_name_2 || '-'}</Text>
          </View>
        ))}
      </View>
      
      {/* Staff Name 3 Row */}
      <View style={[styles.dutyTableRow, { borderBottomWidth: 0 }]}>
        {columns.map((item, idx) => (
          <View 
            key={`name3-${idx}`} 
            style={[
              styles.dutyTableCell, 
              idx === columns.length - 1 && styles.dutyLastTableCell
            ]}
          >
            <Text style={styles.cellText}>{item?.staff_name_3 || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// VisitTable component
const VisitPDF = ({ visitCount = 0 }) => {
  return (
    <View style={[styles.dutyTable, { height: '49px' }]}>
      <View style={[styles.dutyTableRow, styles.tableHeader]}>
        <View style={styles.dutyLastTableCell}><Text style={styles.tableHeaderText}>訪問</Text></View>
      </View>
      <View style={[styles.dutyTableRow, { borderBottomWidth: 0, minHeight: 36, flex: 1 }]}>
        <View style={[styles.dutyLastTableCell, { 
          padding: 4,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          display: 'flex'
        }]}>
          <Text style={{ fontSize: 8, fontWeight: 700, textAlign: 'center' }}>{visitCount.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

// DiagnosisTable component
const DiagnosisPDF = ({ diagnosisData = {} }) => {
  const departments = Object.keys(diagnosisData);
  const totalColumns = 15;
  const usedColumns = departments.length + 2;
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({ id: i + 1 }));

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Row 1 - Department Names */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>診療科</Text>
          </View>
          {departments.map(dept => (
            <View key={`dept-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellTextBold}>{dept}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-dept-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
        </View>
        
        {/* Row 2 - Morning */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午前診</Text>
          </View>
          {departments.map(dept => (
            <View key={`morning-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
              <View style={{ flexDirection: 'column' }}>
                {diagnosisData[dept]?.morning?.map((doctor, i) => (
                  <Text key={i} style={styles.cellText}>{doctor}</Text>
                )) || <Text style={styles.cellText}>-</Text>}
              </View>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-morning-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
        </View>
        
        {/* Row 3 - Afternoon */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午後診</Text>
          </View>
          {departments.map(dept => (
            <View key={`afternoon-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f0fdf4' }]}>
              <View style={{ flexDirection: 'column' }}>
                {diagnosisData[dept]?.afternoon?.map((doctor, i) => (
                  <Text key={i} style={styles.cellText}>{doctor}</Text>
                )) || <Text style={styles.cellText}>-</Text>}
              </View>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-afternoon-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
        </View>
        
        {/* Row 4 - Night */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>夜診</Text>
          </View>
          {departments.map(dept => (
            <View key={`night-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#faf5ff' }]}>
              <View style={{ flexDirection: 'column' }}>
                {diagnosisData[dept]?.night?.map((doctor, i) => (
                  <Text key={i} style={styles.cellText}>{doctor}</Text>
                )) || <Text style={styles.cellText}>-</Text>}
              </View>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-night-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// PatientCountTable component
const PatientCountPDF = ({ patientData = {} }) => {
  const departments = Object.keys(patientData);
  
  // Calculate totals
  const totals = departments.reduce((acc, dept) => {
    acc.morning += patientData[dept]?.morning || 0;
    acc.afternoon += patientData[dept]?.afternoon || 0;
    acc.night += patientData[dept]?.night || 0;
    return acc;
  }, { morning: 0, afternoon: 0, night: 0 });
  totals.total = totals.morning + totals.afternoon + totals.night;

  const totalColumns = 15;
  const usedColumns = departments.length + 2;
  const additionalColumnsCount = Math.max(0, totalColumns - usedColumns);
  const additionalColumns = Array.from({ length: additionalColumnsCount }, (_, i) => ({ id: i + 1 }));

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Row 1 - Numbers */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={styles.cellText}></Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.cellText}></Text>
          </View>
          {departments.map((_, idx) => (
            <View key={`num-${idx}`} style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.cellTextBold, { fontSize: 5 }]}>{idx + 1}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-num-${col.id}`} style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.cellTextBold, { fontSize: 5 }]}>{col.id + departments.length}</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1 }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
        </View>
        
        {/* Row 2 - Department Names */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6', borderRightWidth: 0 }]}>
            <Text style={styles.cellTextBold}>診療科</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>時間</Text>
          </View>
          {departments.map(dept => (
            <View key={`dept-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellTextBold}>{dept}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-dept-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
        </View>
        
        {/* Row 3 - Morning */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={styles.cellTextBold}>患者数</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午前診</Text>
          </View>
          {departments.map(dept => (
            <View key={`morning-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
              <Text style={styles.cellTextBold}>{patientData[dept]?.morning || 0}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-morning-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#eff6ff' }]}>
            <Text style={styles.cellTextBold}>{totals.morning}</Text>
          </View>
        </View>
        
        {/* Row 4 - Afternoon */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={styles.cellText}></Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>午後診</Text>
          </View>
          {departments.map(dept => (
            <View key={`afternoon-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.cellTextBold}>{patientData[dept]?.afternoon || 0}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-afternoon-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.cellTextBold}>{totals.afternoon}</Text>
          </View>
        </View>
        
        {/* Row 5 - Night */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={styles.cellText}></Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cellTextBold}>夜診</Text>
          </View>
          {departments.map(dept => (
            <View key={`night-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#faf5ff' }]}>
              <Text style={styles.cellTextBold}>{patientData[dept]?.night || 0}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-night-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#faf5ff' }]}>
            <Text style={styles.cellTextBold}>{totals.night}</Text>
          </View>
        </View>
        
        {/* Row 6 - Totals */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={styles.cellText}></Text>
          </View>
          <View style={[styles.tableCell, { flex: 1, backgroundColor: '#e5e7eb' }]}>
            <Text style={styles.cellTextBold}>合計</Text>
          </View>
          {departments.map(dept => {
            const deptTotal = (patientData[dept]?.morning || 0) + 
                             (patientData[dept]?.afternoon || 0) + 
                             (patientData[dept]?.night || 0);
            return (
              <View key={`total-${dept}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f3f4f6' }]}>
                <Text style={styles.cellTextBold}>{deptTotal}</Text>
              </View>
            );
          })}
          {additionalColumns.map(col => (
            <View key={`add-total-${col.id}`} style={[styles.tableCell, { flex: 1, backgroundColor: '#f9fafb' }]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          ))}
          <View style={[styles.lastTableCell, { flex: 1, backgroundColor: '#e5e7eb' }]}>
            <Text style={styles.cellTextBold}>{totals.total}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

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

// Main PDF Document Component - Now with updated layout and Status Confirmation at top
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

  const dutyStaff = reportData?.report?.duty_staff || [];

  return (
    <Document>
      {/* Single Page - All content combined */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Main content container with padding */}
        <View style={{ padding: 12 }}>
          {/* Header */}
{/* Header - Compact Design */}
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

          {/* NEW: Status Confirmation Section at the TOP */}
          <StatusConfirmationPDF 
            statusData={statusData}
            title="確認状態一覧"
            showSummary={true}
            showDate={true}
          />

          {/* Top Section with new layout */}
          <View style={styles.topSection}>
            {/* Left Column - CombinedHospitalMedicalPDF */}
            <View style={styles.leftColumn}>
              <CombinedHospitalMedicalPDF 
                data={reportData?.hospitalData || reportData?.tableData?.hospitalData}
                outpatient={reportData?.report?.report_details}
                totalAdmittedPatient={reportData?.cumulativeStats?.total_admitted_patient}
                emergencyData={reportData?.emergencyData || reportData?.tableData?.emergencyData}
                nurseData={reportData?.nurseData || reportData?.tableData?.nurseData}
              />
            </View>

            {/* Right Column - Duty Tables and Visit */}
            <View style={styles.rightColumn}>
              {/* First Duty Row - First 7 columns */}
              <View style={{ flex: 1 }}>
                <DutyTableSection dutyStaff={dutyStaff} startIndex={0} endIndex={7} />
              </View>
              
              {/* Second Duty Row with Visit */}
              <View style={styles.dutyRowContainer}>
                <View style={styles.dutyTableContainer}>
                  <DutyTableSection dutyStaff={dutyStaff} startIndex={7} endIndex={14} />
                </View>
                <View style={styles.visitTableContainer}>
                  <VisitPDF visitCount={reportData?.visitCount || reportData?.tableData?.visitCount || 0} />
                </View>
              </View>
            </View>
          </View>

          {/* Diagnosis Table */}
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>診察担当医</Text>
          <View style={{ marginBottom: 8 }}>
            <DiagnosisPDF diagnosisData={reportData?.diagnosisData || reportData?.tableData?.diagnosisData || {}} />
          </View>

          {/* Patient Count Table */}
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>患者数</Text>
          <View style={{ marginBottom: 8 }}>
            <PatientCountPDF patientData={reportData?.patientCountData || reportData?.tableData?.patientCountData || {}} />
          </View>

          {/* Management Comments */}
          {managementComments.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>管理事項</Text>
              <View style={[styles.table, { marginBottom: 8 }]}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.tableHeaderText}>コメント</Text></View>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>報告者</Text></View>
                  <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>日時</Text></View>
                </View>
                {managementComments.slice(0, 3).map((comment, idx) => (  
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