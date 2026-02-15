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
});

// Helper function to create vertical text
const VerticalText = ({ chars }) => (
  <View style={styles.verticalText}>
    {chars.split('').map((char, index) => (
      <Text key={index} style={styles.verticalTextChar}>{char}</Text>
    ))}
  </View>
);

// HospitalDataTable component
const HospitalDataPDF = ({ data, outpatient, totalAdmittedPatient }) => {
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

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header Row 1 */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.tableHeaderText}>入院</Text></View>
          <View style={[styles.lastTableCell, { flex: 4 }]}><Text style={styles.tableHeaderText}>外来</Text></View>
        </View>
        
        {/* Header Row 2 */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>入院数</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>退院数</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>入院患者数</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>朝診</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>午後診</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>当直</Text></View>
          <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableSubHeaderText}>合計</Text></View>
        </View>
        
        {/* Data Row */} 
        <View style={[styles.tableRow, { borderBottomWidth: 0, height: 71 }]}>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.inpatient.admission}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.inpatient.discharge}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{totalAdmittedPatient || 0}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.outpatient.morning}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.outpatient.afternoon}</Text></View>
          <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.outpatient.night}</Text></View>
          <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.cellTextLarge}>{hospitalData.outpatient.total}</Text></View>
        </View>
      </View>
    </View>
  );
};

// MedicalManagementTable component
const MedicalManagementPDF = ({ emergencyData, nurseData }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, { flex: 2 }]}><Text style={styles.tableHeaderText}>緊急搬入数</Text></View>
          <View style={[styles.lastTableCell, { flex: 2 }]}><Text style={styles.tableHeaderText}>外来看護師</Text></View>
        </View>
        
        {/* Row 1 */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 2 }]}>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={styles.cellTextLarge}>{emergencyData?.current || 0}</Text>
              <Text style={[styles.cellText, { marginTop: 1 }]}>搬入後入院件数</Text>
              <Text style={styles.cellTextBold}>{emergencyData?.hospitalization || 0}</Text>
            </View>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <VerticalText chars="準夜" />
          </View>
          <View style={[styles.lastTableCell, { flex: 1 }]}>
            {nurseData?.quasiNight?.length > 0 ? 
              nurseData.quasiNight.map((name, i) => (
                <Text key={i} style={styles.cellText}>{name}</Text>
              )) : <Text style={styles.cellText}>-</Text>
            }
          </View>
        </View>
        
        {/* Row 2 */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 2 }]}>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              <Text style={[styles.cellText, { marginBottom: 1 }]}>当月緊急搬入数</Text>
              <Text style={styles.cellTextLarge}>{emergencyData?.monthly || 0}</Text>
              <Text style={[styles.cellText, { marginTop: 1, marginBottom: 1 }]}>搬入後入院者累計</Text>
              <Text style={styles.cellTextBold}>{emergencyData?.cumulative || 0}</Text>
            </View>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <VerticalText chars="深夜" />
          </View>
          <View style={[styles.lastTableCell, { flex: 1 }]}>
            {nurseData?.midnight?.length > 0 ? 
              nurseData.midnight.map((name, i) => (
                <Text key={i} style={styles.cellText}>{name}</Text>
              )) : <Text style={styles.cellText}>-</Text>
            }
          </View>
        </View>
      </View>
    </View>
  );
};

// DetailedDutyTable component
const DetailedDutyPDF = ({ dutyStaff = [], title = "当直", showFirst = true }) => {
  const items = showFirst ? dutyStaff.slice(0, 7) : dutyStaff.slice(7);
  const headers = items.map((item, index) => ({
    key: index,
    label: item?.staff_name_1 || '-',
    staffData: item
  }));

  // Fill empty headers to maintain 7 columns for first table
  if (showFirst) {
    while (headers.length < 7) {
      headers.push({ key: `empty-${headers.length}`, label: '-', staffData: null });
    }
  }

  if (headers.length === 0) return null;

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Title Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.lastTableCell, { flex: headers.length }]}>
            <Text style={styles.tableHeaderText}>{title}</Text>
          </View>
        </View>
        
        {/* Header Row - Staff names */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          {headers.map((header, idx) => (
            <View key={header.key} style={[styles.tableCell, { flex: 1 }, idx === headers.length - 1 && styles.lastTableCell]}>
              <Text style={styles.tableSubHeaderText}>{header.label}</Text>
            </View>
          ))}
        </View>
        
        {/* Staff Name 2 Row */}
        <View style={styles.tableRow}>
          {headers.map((header, idx) => (
            <View key={`${header.key}-2`} style={[styles.tableCell, { flex: 1 }, idx === headers.length - 1 && styles.lastTableCell]}>
              <Text style={styles.cellText}>{header.staffData?.staff_name_2 || '-'}</Text>
            </View>
          ))}
        </View>
        
        {/* Staff Name 3 Row */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          {headers.map((header, idx) => (
            <View key={`${header.key}-3`} style={[styles.tableCell, { flex: 1 }, idx === headers.length - 1 && styles.lastTableCell]}>
              <Text style={styles.cellText}>{header.staffData?.staff_name_3 || '-'}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// VisitTable component
const VisitPDF = ({ visitCount = 0 }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.lastTableCell}><Text style={styles.tableHeaderText}>訪問</Text></View>
        </View>
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.lastTableCell, { padding: 8 }]}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>{visitCount.toLocaleString()}</Text>
          </View>
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
              <Text style={[styles.cellTextBold, { fontSize: 8 }]}>{idx + 1}</Text>
            </View>
          ))}
          {additionalColumns.map(col => (
            <View key={`add-num-${col.id}`} style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.cellTextBold, { fontSize: 8 }]}>{col.id + departments.length}</Text>
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

// Main PDF Document Component with multiple pages
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

        {/* Main Tables - First Row */}
        <View style={styles.mainRow}>
          <View style={{ flex: 6 }}>
            <HospitalDataPDF 
              data={reportData?.hospitalData || reportData?.tableData?.hospitalData}
              outpatient={reportData?.report?.report_details}
              totalAdmittedPatient={reportData?.cumulativeStats?.total_admitted_patient}
            />
          </View>
          <View style={{ flex: 2 }}>
            <MedicalManagementPDF 
              emergencyData={reportData?.emergencyData || reportData?.tableData?.emergencyData}
              nurseData={reportData?.nurseData || reportData?.tableData?.nurseData}
            />
          </View>
          <View style={{ flex: 4 }}>
            <View style={{ flexDirection: 'column', gap: 3 }}>
              <DetailedDutyPDF 
                dutyStaff={reportData?.report?.duty_staff}
                title="当直 (1-7)"
                showFirst={true}
              />
              <View style={{ flexDirection: 'row', gap: 3 }}>
                <View style={{ flex: 4 }}>
                  <DetailedDutyPDF 
                    dutyStaff={reportData?.report?.duty_staff}
                    title="当直 (8-)"
                    showFirst={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <VisitPDF visitCount={reportData?.visitCount || reportData?.tableData?.visitCount || 0} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Diagnosis Table */}
        <Text style={styles.sectionTitle}>診察担当医</Text>
        <DiagnosisPDF diagnosisData={reportData?.diagnosisData || reportData?.tableData?.diagnosisData || {}} />

        {/* Footer for first page */}
        <View style={styles.footer}>
          <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
          <Text>ページ 1/2</Text>
          <Text>最終更新: {reportData?.report?.updated_at ? new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') : reportDate}</Text>
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Patient Count Table */}
        <Text style={styles.sectionTitle}>患者数</Text>
        <PatientCountPDF patientData={reportData?.patientCountData || reportData?.tableData?.patientCountData || {}} />

        {/* Status Confirmation Section */}
        <Text style={[styles.sectionTitle, styles.pageBreak]}>確認状態一覧</Text>
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