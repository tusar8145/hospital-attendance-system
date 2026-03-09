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
    textAlign: 'left',
    paddingLeft: 2,
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
  cellTextLeft: {
    fontSize: 4.5,
    textAlign: 'left',
    paddingLeft: 2,
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

  // New styles for Status Confirmation section
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
    textAlign: 'left',
    paddingLeft: 2,
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
    width: '12%',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 3,
  },
  statusItemHeader: {
    padding: 2,
    backgroundColor: '#3b82f6',
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
  invisibleCell: {
    borderRightWidth: 0.5,
    borderRightColor: '#d1d5db',
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'transparent',
    backgroundColor: '#ffffff',
  },
  invisibleText: {
    fontSize: 4.5,
    textAlign: 'center',
    color: 'transparent',
  },
});

// Helper function to render circles (as dashes for PDF)
const renderCirclesPDF = (count) => {
  return '-';
};

// Status Confirmation Component
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
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
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
    return styles.statusItemHeader;
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
                    {item.person ? item.person : '未設定'}
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
        
        {/* Summary - Commented out as in original */}
        {/*
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
        */}

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

// 1. Conference and Special Notes Section - UPDATED to single row with two columns
const ConferenceSpecialNotesPDF = ({ welfareData }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.table}>
        {/* Single row with two columns */}
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          {/* Conference Events Column */}
          <View style={[styles.tableCell, { flex: 2, backgroundColor: '#f5f5f5' }]}>
            <Text style={[styles.cellTextBold, { textAlign: 'left', paddingLeft: 2 }]}>会議・行事等</Text>
          </View>
          <View style={[styles.tableCell, { flex: 3, padding: 1 }]}>
            <Text style={styles.cellTextLeft}>
              {welfareData?.conference_events || renderCirclesPDF(60)}
            </Text>
          </View>
          
          {/* Special Notes Column */}
          <View style={[styles.tableCell, { flex: 2, backgroundColor: '#f5f5f5' }]}>
            <Text style={[styles.cellTextBold, { textAlign: 'left', paddingLeft: 2 }]}>特記事項</Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 3, padding: 1 }]}>
            <Text style={styles.cellTextLeft}>
              {welfareData?.special_notes_section || renderCirclesPDF(60)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 2. Daily Visitors Section (入所者状況) - UPDATED with 合計 column and left-aligned labels
const DailyVisitorsPDF = ({ welfareData, capacities }) => {
  const sectionNames = ['入所', '短期入所', '合計', 'ケアハウス'];
  
  const section1Capacity = capacities?.section1_capacity || 0;
  const section2Capacity = capacities?.section2_capacity || 0;
  const section3Capacity = capacities?.section3_capacity || 0;

  const dailyVisitorRows = [
    { 
      label: '定員', 
      values: [
        `${section1Capacity}`,
        `${section2Capacity}`,
        `${section1Capacity + section2Capacity}`,
        `${section3Capacity}`
      ]
    },
    { 
      label: '前日 入所者数', 
      values: [
        `${welfareData?.section1_admission_count || 0}`,
        `${welfareData?.section2_admission_count || 0}`,
        `${(welfareData?.section1_admission_count || 0) + (welfareData?.section2_admission_count || 0)}`,
        `${welfareData?.section3_admission_count || 0}`
      ]
    },
    { 
      label: '当日 入所者数', 
      values: [
        `${welfareData?.section1_admission_treated || 0}`,
        `${welfareData?.section2_admission_treated || 0}`,
        `${(welfareData?.section1_admission_treated || 0) + (welfareData?.section2_admission_treated || 0)}`,
        `${welfareData?.section3_admission_count || 0}`
      ]
    },
    { 
      label: '当日 退所者数', 
      values: [
        `${welfareData?.section1_discharge_treated || 0}`,
        `${welfareData?.section2_discharge_treated || 0}`,
        `${(welfareData?.section1_discharge_treated || 0) + (welfareData?.section2_discharge_treated || 0)}`,
        `${welfareData?.section3_discharge_count || 0}`
      ]
    },
    { 
      label: '外泊・入院者数（入所扱い）', 
      values: [
        `${welfareData?.section1_outside_hospital || 0}`,
        `${welfareData?.section2_outside_hospital || 0}`,
        `${(welfareData?.section1_outside_hospital || 0) + (welfareData?.section2_outside_hospital || 0)}`,
        `${welfareData?.section3_outside_hospital || 0}`
      ]
    },
    { 
      label: '入院者数（退所扱い）', 
      values: [
        `${welfareData?.section1_hospitalization_count || 0}`,
        `${welfareData?.section2_hospitalization_count || 0}`,
        `${(welfareData?.section1_hospitalization_count || 0) + (welfareData?.section2_hospitalization_count || 0)}`,
        `${welfareData?.section3_hospitalization_count || 0}`
      ]
    },
    { 
      label: '当日末 入所者数', 
      values: [
        `${welfareData?.section1_today_end_users || 0}`,
        `${welfareData?.section2_today_end_users || 0}`,
        `${(welfareData?.section1_today_end_users || 0) + (welfareData?.section2_today_end_users || 0)}`,
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
        `${(welfareData?.section1_monthly_admission || 0) + (welfareData?.section2_monthly_admission || 0)}`,
        `${welfareData?.section3_monthly_admission || 0}`
      ]
    },
    { 
      label: '当月 平均入所者数', 
      values: [
        `${welfareData?.section1_monthly_avg || 0}`,
        `${welfareData?.section2_monthly_avg || 0}`,
        `${((welfareData?.section1_monthly_avg || 0) + (welfareData?.section2_monthly_avg || 0)).toFixed(1)}`,
        `${welfareData?.section3_monthly_avg || 0}`
      ]
    },
    { 
      label: '当月 稼働率', 
      values: [
        `${welfareData?.section1_monthly_utilization || 0}%`,
        `${welfareData?.section2_monthly_utilization || 0}%`,
        section1Capacity + section2Capacity > 0 
          ? `${Math.round((((welfareData?.section1_monthly_avg || 0) + (welfareData?.section2_monthly_avg || 0)) / (section1Capacity + section2Capacity)) * 100)}%`
          : '0%',
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
        `${(welfareData?.section1_annual_users || 0) + (welfareData?.section2_annual_users || 0)}`,
        `${welfareData?.section3_annual_users || 0}`
      ]
    },
    { 
      label: '年度 平均入所者数', 
      values: [
        `${welfareData?.section1_annual_avg || 0}`,
        `${welfareData?.section2_annual_avg || 0}`,
        `${((welfareData?.section1_annual_avg || 0) + (welfareData?.section2_annual_avg || 0)).toFixed(1)}`,
        `${welfareData?.section3_annual_avg || 0}`
      ]
    },
    { 
      label: '年度 稼働率', 
      values: [
        `${welfareData?.section1_annual_utilization || 0}%`,
        `${welfareData?.section2_annual_utilization || 0}%`,
        section1Capacity + section2Capacity > 0 
          ? `${Math.round((((welfareData?.section1_annual_avg || 0) + (welfareData?.section2_annual_avg || 0)) / (section1Capacity + section2Capacity)) * 100)}%`
          : '0%',
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
                style={[styles.tableCell, { flex: 2.5 }, index === 3 && styles.lastTableCell]}
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
              <View style={[styles.tableCell, { flex: 3, backgroundColor: row.bold ? '#f5f5f5' : 'white', alignItems: 'flex-start' }]}>
                <Text style={[row.bold ? styles.cellTextBold : styles.cellText, { textAlign: 'left', paddingLeft: 2 }]}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`daily-val-${rowIndex}-${colIndex}`} 
                  style={[
                    styles.tableCell, 
                    { flex: 2.5, backgroundColor: row.bold ? '#f5f5f5' : 'white' },
                    colIndex === 3 && styles.lastTableCell
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
<View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
  <Text style={[styles.tableSubHeaderText, { textAlign: 'left' }]}>
    当月統計
  </Text>
</View>
            {sectionNames.map((name, index) => (
              <View 
                key={`monthly-header-${index}`} 
                style={[styles.tableCell, { flex: 2.5 }, index === 3 && styles.lastTableCell]}
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
              <View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
                <Text style={[styles.cellText, { textAlign: 'left', paddingLeft: 2 }]}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`monthly-val-${rowIndex}-${colIndex}`} 
                  style={[styles.tableCell, { flex: 2.5 }, colIndex === 3 && styles.lastTableCell]}
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
            <View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
              <Text style={styles.tableSubHeaderText}>年度統計</Text>
            </View>
            {sectionNames.map((name, index) => (
              <View 
                key={`annual-header-${index}`} 
                style={[styles.tableCell, { flex: 2.5 }, index === 3 && styles.lastTableCell]}
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
              <View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
                <Text style={[styles.cellText, { textAlign: 'left', paddingLeft: 2 }]}>{row.label}</Text>
              </View>
              {row.values.map((value, colIndex) => (
                <View 
                  key={`annual-val-${rowIndex}-${colIndex}`} 
                  style={[styles.tableCell, { flex: 2.5 }, colIndex === 3 && styles.lastTableCell]}
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

// 3. Daily Users Section (利用者状況) - UPDATED with left-aligned labels, consistent column widths, and invisible columns when capacity is 0
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

  // Check if column should be invisible (capacity is 0)
  const isColumnInvisible = (section) => {
    return getCapacity(section) === 0;
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
            <View style={[styles.tableCell, { flex: 3 }]}>
              <Text style={styles.tableSubHeaderText}></Text>
            </View>
            {sections.map((section, index) => {
              const isInvisible = false// isColumnInvisible(section);
              return (
                <View 
                  key={`user-header-${index}`} 
                  style={[
                    isInvisible ? styles.invisibleCell : styles.tableCell, 
                    { flex: 2.5 },
                    index === 3 && styles.lastTableCell
                  ]}
                >
                  <Text style={isInvisible ? styles.invisibleText : styles.tableSubHeaderText}>
                    {sectionNames?.[section] || `セクション${index + 4}`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Data Rows */}
          {dailyUserRows.map((row, rowIndex) => (
            <View 
              key={`user-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === dailyUserRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 3, backgroundColor: row.bold ? '#f5f5f5' : 'white', alignItems: 'flex-start' }]}>
                <Text style={[row.bold ? styles.cellTextBold : styles.cellText, { textAlign: 'left', paddingLeft: 2 }]}>{row.label}</Text>
              </View>
              {sections.map((section, colIndex) => {
                const isInvisible = isColumnInvisible(section);
                return (
                  <View 
                    key={`user-val-${rowIndex}-${colIndex}`} 
                    style={[
                      isInvisible ? styles.invisibleCell : styles.tableCell, 
                      { flex: 2.5, backgroundColor: row.bold && !isInvisible ? '#f5f5f5' : 'white' },
                      colIndex === 3 && styles.lastTableCell
                    ]}
                  >
                    <Text style={isInvisible ? styles.invisibleText : (row.bold ? styles.cellTextBold : styles.cellText)}>
                      {row.getValue(section)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Yearly Users Table */}
      <View style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableSubHeader]}>
            <View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
              <Text style={styles.tableSubHeaderText}>年度統計</Text>
            </View>
            {sections.map((section, index) => {
              const isInvisible = false//isColumnInvisible(section);
              return (
                <View 
                  key={`yearly-header-${index}`} 
                  style={[
                    isInvisible ? styles.invisibleCell : styles.tableCell, 
                    { flex: 2.5 },
                    index === 3 && styles.lastTableCell
                  ]}
                >
                  <Text style={isInvisible ? styles.invisibleText : styles.tableSubHeaderText}>
                    {sectionNames?.[section] || `セクション${index + 4}`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Data Rows */}
          {yearlyUserRows.map((row, rowIndex) => (
            <View 
              key={`yearly-${rowIndex}`} 
              style={[styles.tableRow, rowIndex === yearlyUserRows.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[styles.tableCell, { flex: 3, alignItems: 'flex-start' }]}>
                <Text style={[styles.cellText, { textAlign: 'left', paddingLeft: 2 }]}>{row.label}</Text>
              </View>
              {sections.map((section, colIndex) => {
                const isInvisible = isColumnInvisible(section);
                return (
                  <View 
                    key={`yearly-val-${rowIndex}-${colIndex}`} 
                    style={[
                      isInvisible ? styles.invisibleCell : styles.tableCell, 
                      { flex: 2.5 },
                      colIndex === 3 && styles.lastTableCell
                    ]}
                  >
                    <Text style={isInvisible ? styles.invisibleText : styles.cellText}>
                      {row.getValue(section)}
                    </Text>
                  </View>
                );
              })}
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
        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 30 }]}>
          <View style={[styles.tableCell, { flex: 5, padding: 1 }]}>
            <Text style={styles.cellTextLeft}>
              {vacantBedNotes || renderCirclesPDF(40)}
            </Text>
          </View>
          <View style={[styles.lastTableCell, { flex: 5, padding: 1 }]}>
            <Text style={styles.cellTextLeft}>
              {responseNotes || renderCirclesPDF(40)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Main PDF Document Component - Single Page with improved header and status section
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
      {/* Single Page - All content combined */} 
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Main content container with padding */}
        <View style={{ padding: 12 }}>
          {/* Header - Compact Design */}
          <View style={styles.headerSection}>
            {/* Top row with title and status badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.title}>福祉施設日報</Text>
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

          {/* Status Confirmation Section */}
          <StatusConfirmationPDF 
            statusData={statusData}
            title="確認状態一覧"
            showSummary={true}
            showDate={true}
          />

          {/* Conference and Special Notes Section */}
          <ConferenceSpecialNotesPDF welfareData={reportData.welfare_data} />

          {/* Daily Visitors Section */}
          <Text style={styles.sectionTitle}>入所者状況</Text>
          <DailyVisitorsPDF 
            welfareData={reportData.welfare_data} 
            capacities={reportData.capacities}
          />

          {/* Daily Users Section */}
          <Text style={styles.sectionTitle}>利用者状況</Text>
          <DailyUsersPDF 
            welfareData={reportData.welfare_data}
            sectionNames={reportData.section_names}
            capacities={reportData.capacities}
          />

          {/* Vacant Bed Section - Uncommented and properly placed */}
          <Text style={styles.sectionTitle}>空床状況</Text>
          <VacantBedPDF welfareData={reportData.welfare_data} />

          {/* Management Comments */}
          {managementComments.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginBottom: 1 }]}>管理事項</Text>
              <View style={[styles.table, { marginBottom: 3 }]}>
                {/*<View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { flex: 3 }]}><Text style={styles.tableHeaderText}>コメント</Text></View>
                  <View style={[styles.tableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>報告者</Text></View>
                  <View style={[styles.lastTableCell, { flex: 1 }]}><Text style={styles.tableHeaderText}>日時</Text></View>
                </View>*/}
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

          {/* Footer - Commented out as in original */}
          {/*
          <View style={styles.footer}>
            <Text>作成者: {reportData?.report?.created_by_admin?.name || '不明'}</Text>
            <Text>ページ 1/1</Text>
            <Text>承認者: {reportData?.report?.approved_by_admin?.name || '未承認'}</Text>
          </View>
          */}
        </View>
      </Page>
    </Document>
  );
};