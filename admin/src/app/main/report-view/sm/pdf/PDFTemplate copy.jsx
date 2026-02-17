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
  cellTextLeft: {
    fontSize: 7,
    textAlign: 'left',
    paddingLeft: 4,
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
  
  // Conference section styles
  conferenceRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 30,
  },
  conferenceLabel: {
    width: '20%',
    backgroundColor: '#f5f5f5',
    padding: 5,
    fontWeight: 700,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  conferenceContent: {
    width: '80%',
    padding: 5,
    fontSize: 8,
  },
  
  // Text content for notes
  notesText: {
    fontSize: 7,
    lineHeight: 1.4,
  },
});

// Helper function to render circles (as dashes for PDF)
const renderCirclesPDF = (count) => {
  return '-';
};

// 1. Conference and Special Notes Section - UPDATED to single row with two columns
const ConferenceSpecialNotesPDF = ({ welfareData }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Single row with two columns */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          {/* Conference Events Column */}
          <View style={[styles.tableCell, { flex: 2, backgroundColor: '#f5f5f5' }]}>
            <Text style={styles.cellTextBold}>会議・行事等</Text>
          </View>
          <View style={[styles.tableCell, { flex: 3, padding: 5 }]}>
            <Text style={styles.cellTextLeft}>
              {welfareData?.conference_events || renderCirclesPDF(60)}
            </Text>
          </View>
          
          {/* Special Notes Column */}
          <View style={[styles.tableCell, { flex: 2, backgroundColor: '#f5f5f5' }]}>
            <Text style={styles.cellTextBold}>特記事項</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 3, padding: 5 }]}>
            <Text style={styles.cellTextLeft}>
              {welfareData?.special_notes_section || renderCirclesPDF(60)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 2. Daily Visitors Section (入所者状況) - UPDATED with ケアハウス column using section3 data
const DailyVisitorsPDF = ({ welfareData, capacities }) => {
  const sectionNames = ['入所', '短期入所', 'ケアハウス'];
  
  const section1Capacity = capacities?.section1_capacity || 0;
  const section2Capacity = capacities?.section2_capacity || 0;
  const section3Capacity = capacities?.section3_capacity || 0;

  const dailyVisitorRows = [
    { 
      label: '定員', 
      values: [
        `${section1Capacity}`,
        `${section2Capacity}`,
        `${section3Capacity}`
      ]
    },
    { 
      label: '前日 入所者数', 
      values: [
        `${welfareData?.section1_admission_count || 0}`,
        `${welfareData?.section2_admission_count || 0}`,
        `${welfareData?.section3_admission_count || 0}`
      ]
    },
    { 
      label: '当日 入所者数', 
      values: [
        `${welfareData?.section1_admission_treated || 0}`,
        `${welfareData?.section2_admission_treated || 0}`,
        `${welfareData?.section3_admission_count || 0}`
      ]
    },
    { 
      label: '当日 退所者数', 
      values: [
        `${welfareData?.section1_discharge_treated || 0}`,
        `${welfareData?.section2_discharge_treated || 0}`,
        `${welfareData?.section3_discharge_count || 0}`
      ]
    },
    { 
      label: '外泊・入院者数（入所扱い）', 
      values: [
        `${welfareData?.section1_outside_hospital || 0}`,
        `${welfareData?.section2_outside_hospital || 0}`,
        `${welfareData?.section3_outside_hospital || 0}`
      ]
    },
    { 
      label: '入院者数（退所扱い）', 
      values: [
        `${welfareData?.section1_hospitalization_count || 0}`,
        `${welfareData?.section2_hospitalization_count || 0}`,
        `${welfareData?.section3_hospitalization_count || 0}`
      ]
    },
    { 
      label: '当日末 入所者数', 
      values: [
        `${welfareData?.section1_today_end_users || 0}`,
        `${welfareData?.section2_today_end_users || 0}`,
        `${welfareData?.section3_today_end_users || 0}`
      ],
      bold: true
    }
  ];

  const monthlyDataRows = [
    { 
      label: '当月 入所者数', 
      values: [
        `${welfareData?.section1_monthly_admission || 0}`,
        `${welfareData?.section2_monthly_admission || 0}`,
        `${welfareData?.section3_monthly_admission || 0}`
      ]
    },
    { 
      label: '当月 平均入所者数', 
      values: [
        `${welfareData?.section1_monthly_avg || 0}`,
        `${welfareData?.section2_monthly_avg || 0}`,
        `${welfareData?.section3_monthly_avg || 0}`
      ]
    },
    { 
      label: '当月 稼働率', 
      values: [
        `${welfareData?.section1_monthly_utilization || 0}%`,
        `${welfareData?.section2_monthly_utilization || 0}%`,
        `${welfareData?.section3_monthly_utilization || 0}%`
      ]
    }
  ];

  const annualDataRows = [
    { 
      label: '年度 延入所者数', 
      values: [
        `${welfareData?.section1_annual_users || 0}`,
        `${welfareData?.section2_annual_users || 0}`,
        `${welfareData?.section3_annual_users || 0}`
      ]
    },
    { 
      label: '年度 平均入所者数', 
      values: [
        `${welfareData?.section1_annual_avg || 0}`,
        `${welfareData?.section2_annual_avg || 0}`,
        `${welfareData?.section3_annual_avg || 0}`
      ]
    },
    { 
      label: '年度 稼働率', 
      values: [
        `${welfareData?.section1_annual_utilization || 0}%`,
        `${welfareData?.section2_annual_utilization || 0}%`,
        `${welfareData?.section3_annual_utilization || 0}%`
      ]
    }
  ];

  return (
    <>
      {/* Daily Visitors Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 3 }]}>
              <Text style={styles.tableSubHeaderText}></Text>
            </View>
            {sectionNames.map((name, index) => (
              <View 
                key={`header-${index}`} 
                style={[styles.tableCell, { flex: 3 }, index === 2 && styles.lastTableCell]}
              >
                <Text style={styles.tableSubHeaderText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {dailyVisitorRows.map((row, rowIndex) => (
            <View 
              key={`daily-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === dailyVisitorRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 3, backgroundColor: row.bold ? '#f5f5f5' : 'white' }]}>
                <Text style={row.bold ? styles.cellTextBold : styles.cellText}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`daily-val-${rowIndex}-${colIndex}`} 
                  style={[
                    styles.tableCell, 
                    { flex: 3, backgroundColor: row.bold ? '#f5f5f5' : 'white' },
                    colIndex === 2 && styles.lastTableCell
                  ]}
                >
                  <Text style={row.bold ? styles.cellTextBold : styles.cellText}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Monthly Data Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 3 }]}>
              <Text style={styles.tableSubHeaderText}>当月統計</Text>
            </View>
            {sectionNames.map((name, index) => (
              <View 
                key={`monthly-header-${index}`} 
                style={[styles.tableCell, { flex: 3 }, index === 2 && styles.lastTableCell]}
              >
                <Text style={styles.tableSubHeaderText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {monthlyDataRows.map((row, rowIndex) => (
            <View 
              key={`monthly-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === monthlyDataRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 3 }]}>
                <Text style={styles.cellText}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`monthly-val-${rowIndex}-${colIndex}`} 
                  style={[styles.tableCell, { flex: 3 }, colIndex === 2 && styles.lastTableCell]}
                >
                  <Text style={styles.cellText}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Annual Data Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 3 }]}>
              <Text style={styles.tableSubHeaderText}>年度統計</Text>
            </View>
            {sectionNames.map((name, index) => (
              <View 
                key={`annual-header-${index}`} 
                style={[styles.tableCell, { flex: 3 }, index === 2 && styles.lastTableCell]}
              >
                <Text style={styles.tableSubHeaderText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {annualDataRows.map((row, rowIndex) => (
            <View 
              key={`annual-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === annualDataRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 3 }]}>
                <Text style={styles.cellText}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`annual-val-${rowIndex}-${colIndex}`} 
                  style={[styles.tableCell, { flex: 3 }, colIndex === 2 && styles.lastTableCell]}
                >
                  <Text style={styles.cellText}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

// 3. Daily Users Section (利用者状況)
const DailyUsersPDF = ({ welfareData, sectionNames, capacities }) => {
  const sections = ['section4', 'section5', 'section6', 'section7'];
  
  // Get section capacities
  const getCapacity = (section) => {
    switch(section) {
      case 'section4': return capacities?.section4_capacity || 0;
      case 'section5': return capacities?.section5_capacity || 0;
      case 'section6': return capacities?.section6_capacity || 0;
      case 'section7': return capacities?.section7_capacity || 0;
      default: return 0;
    }
  };

  const dailyUserRows = [
    { 
      label: '定員', 
      getValue: (section) => `${getCapacity(section)}`
    },
    { 
      label: '当日 利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_daily_users`] || 0}`,
      bold: true
    },
    { 
      label: '当月 利用者数累計', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_users_cumulative`] || 0}`
    },
    { 
      label: '当月 平均利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_avg`] || 0}`
    },
    { 
      label: '当月 稼働率', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_utilization`] || 0}%`
    },
  ];

  const yearlyUserRows = [
    { 
      label: '年度 利用者数累計', 
      getValue: (section) => `${welfareData?.[`${section}_annual_users`] || 0}`
    },
    { 
      label: '年度 平均利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_annual_avg`] || 0}`
    },
    { 
      label: '年度 稼働率', 
      getValue: (section) => `${welfareData?.[`${section}_annual_utilization`] || 0}%`
    },
  ];

  return (
    <>
      {/* Daily Users Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={styles.tableSubHeaderText}></Text>
            </View>
            {sections.map((section, index) => (
              <View 
                key={`user-header-${index}`} 
                style={[styles.tableCell, { flex: 2 }, index === 3 && styles.lastTableCell]}
              >
                <Text style={styles.tableSubHeaderText}>
                  {sectionNames?.[section] || `セクション${index + 4}`}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {dailyUserRows.map((row, rowIndex) => (
            <View 
              key={`user-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === dailyUserRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 2, backgroundColor: row.bold ? '#f5f5f5' : 'white' }]}>
                <Text style={row.bold ? styles.cellTextBold : styles.cellText}>{row.label}</Text>
              </View>
              {sections.map((section, colIndex) => (
                <View 
                  key={`user-val-${rowIndex}-${colIndex}`} 
                  style={[
                    styles.tableCell, 
                    { flex: 2, backgroundColor: row.bold ? '#f5f5f5' : 'white' },
                    colIndex === 3 && styles.lastTableCell
                  ]}
                >
                  <Text style={row.bold ? styles.cellTextBold : styles.cellText}>
                    {row.getValue(section)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Yearly Users Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={styles.tableSubHeaderText}>年度統計</Text>
            </View>
            {sections.map((section, index) => (
              <View 
                key={`yearly-header-${index}`} 
                style={[styles.tableCell, { flex: 2 }, index === 3 && styles.lastTableCell]}
              >
                <Text style={styles.tableSubHeaderText}>
                  {sectionNames?.[section] || `セクション${index + 4}`}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {yearlyUserRows.map((row, rowIndex) => (
            <View 
              key={`yearly-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === yearlyUserRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text style={styles.cellText}>{row.label}</Text>
              </View>
              {sections.map((section, colIndex) => (
                <View 
                  key={`yearly-val-${rowIndex}-${colIndex}`} 
                  style={[styles.tableCell, { flex: 2 }, colIndex === 3 && styles.lastTableCell]}
                >
                  <Text style={styles.cellText}>{row.getValue(section)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

// 4. Vacant Bed Section
const VacantBedPDF = ({ welfareData }) => {
  const vacantBedNotes = welfareData?.vacant_bed_notes || '';
  const responseNotes = welfareData?.response_notes || '';

  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.tableRow, styles.tableSubHeader]}>
          <View style={[styles.tableCell, { flex: 5 }]}>
            <Text style={styles.tableSubHeaderText}>空床発生事由</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 5 }]}>
            <Text style={styles.tableSubHeaderText}>対応</Text>
          </View>
        </View>
        
        {/* Data Row */}
        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 40 }]}>
          <View style={[styles.tableCell, { flex: 5, padding: 5 }]}>
            <Text style={styles.cellTextLeft}>
              {vacantBedNotes || renderCirclesPDF(40)}
            </Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 5, padding: 5 }]}>
            <Text style={styles.cellTextLeft}>
              {responseNotes || renderCirclesPDF(40)}
            </Text>
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

  return (
    <Document>
      {/* First Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>福祉施設日報</Text>
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

        {/* Conference and Special Notes Section */}
        <ConferenceSpecialNotesPDF welfareData={reportData.welfare_data} />

        {/* Daily Visitors Section */}
        <Text style={styles.sectionTitle}>入所者状況</Text>
        <DailyVisitorsPDF 
          welfareData={reportData.welfare_data} 
          capacities={reportData.capacities}
        />

        {/* Footer for first page */}
        <View style={styles.footer}>
          <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
          <Text>ページ 1/3</Text>
          <Text>最終更新: {reportData?.report?.updated_at ? new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') : reportDate}</Text>
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Daily Users Section */}
        <Text style={styles.sectionTitle}>利用者状況</Text>
        <DailyUsersPDF 
          welfareData={reportData.welfare_data}
          sectionNames={reportData.section_names}
          capacities={reportData.capacities}
        />

        {/* Vacant Bed Section */}
        <Text style={[styles.sectionTitle, styles.pageBreak]}>空床状況</Text>
        <VacantBedPDF welfareData={reportData.welfare_data} />

        {/* Status Confirmation Section */}
        <Text style={styles.sectionTitle}>確認状態一覧</Text>
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

        {/* Footer for second page */}
        <View style={styles.footer}>
          <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
          <Text>ページ 2/3</Text>
          <Text>承認者: {reportData?.report?.approved_by_admin?.name || '未承認'}</Text>
        </View>
      </Page>

      {/* Third Page - Management Comments */}
      {managementComments.length > 0 && (
        <Page size="A4" orientation="landscape" style={styles.page}>
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

          {/* Footer for third page */}
          <View style={styles.footer}>
            <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
            <Text>ページ 3/3</Text>
            <Text>承認者: {reportData?.report?.approved_by_admin?.name || '未承認'}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};