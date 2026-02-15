// D:\Projects\trans\hospital-attendance-system\admin\src\app\main\report-view\exportUtils.jsx
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from './PDFTemplate.jsx';

// Export to PDF with actual report data
export const exportToPDF = async (reportData, reportDate, hospitalInfo, statusData = [], managementComments = []) => {
  try {
    console.log('Creating PDF report with Japanese font...');
    
    const blob = await pdf(
      <PDFDocument 
        reportData={reportData}
        reportDate={reportDate}
        hospitalInfo={hospitalInfo}
        statusData={statusData}
        managementComments={managementComments}
      />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date
    const dateStr = reportDate.replace(/[年月日（）\/\s]/g, '').substring(0, 8);
    link.download = `管理日誌レポート_${dateStr}.pdf`;
    
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('PDF report created successfully!');
    return true;
  } catch (error) {
    console.error('PDF creation failed:', error);
    throw error;
  }
};