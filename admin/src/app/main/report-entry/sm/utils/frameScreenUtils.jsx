// Utility functions for FrameScreen component

// Format date for API (YYYY-MM-DD)
export const formatDateForAPI = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date for display in Japanese format
export const formatJapaneseDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

// Check if a date should be disabled (future dates)
export const shouldDisableDate = (date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const selectedDate = new Date(date);
  selectedDate.setHours(23, 59, 59, 999);
  
  // Disable dates after today (future dates)
  return selectedDate > today;
};

// Prepare form data for submission
export const prepareFormData = (
  getDisplayMorning,
  getDisplayAfternoon,
  getDisplayNight,
  externalConsultationData,
  specialNotes,
  consolidatedData,
  consolidatedDataCount,
  hospital_type
) => {
  console.log('=== Preparing Form Data ===');
  
  // Filter out empty consolidated data for both components
  const filteredConsolidatedData = consolidatedData.filter(item => 
    (item.doctor_id_1 || item.doctor_id_2 || item.doctor_id_3 || item.floor)
  );

  const filteredConsolidatedDataCount = consolidatedDataCount.filter(item => 
    item.department_id && (item.total_patients !== undefined || item.new_patients !== undefined)
  );

  return {
    admission_count: parseInt(getDisplayMorning()) || 0,
    discharge_count: parseInt(getDisplayAfternoon()) || 0,
    external_duty: parseInt(getDisplayNight()) || 0,
    emergency_transport: parseInt(externalConsultationData.summary.PET) || 0,
    post_transport_admission: parseInt(externalConsultationData.summary.MR) || 0,
    visit_count: parseInt(externalConsultationData.summary.CT) || 0,
    special_notes: specialNotes.trim(),
    report_details: filteredConsolidatedData,
    report_details_mid: filteredConsolidatedDataCount,
    external_consultation_details: externalConsultationData.details,
    hospital_type: hospital_type,
  };
};

// Validate form data
 // Update validateForm function to only validate visible boxes
// In frameScreenUtils.jsx, update validateForm function:
export const validateForm = (
  hospitalId,
  getDisplayMorning,
  getDisplayAfternoon,
  getDisplayNight,
  externalConsultationData,
  consolidatedData,
  consolidatedDataCount,
  showPETBox = false,
  showMRBox = false,
  showCTBox = false
) => {
  const errors = {};
  
  // Required fields validation
  if (!hospitalId) {
    errors.hospital = "病院の選択が必要です";
  }
  
  // Validate the current display values
  const morningValue = getDisplayMorning();
  const afternoonValue = getDisplayAfternoon();
  const nightValue = getDisplayNight();
  
  // These fields are always readonly, so validation is minimal
  // Just check if they are valid numbers
  if (morningValue === undefined || morningValue === null || morningValue === "" || isNaN(parseInt(morningValue))) {
    errors.patientsCount = "有効な患者数が必要です";
  }
  
  if (afternoonValue === undefined || afternoonValue === null || afternoonValue === "" || isNaN(parseInt(afternoonValue))) {
    errors.outpatientsCount = "有効な午後診数が必要です";
  }
  
  if (nightValue === undefined || nightValue === null || nightValue === "" || isNaN(parseInt(nightValue))) {
    errors.nightConsultation = "有効な夜診数が必要です";
  }
  
  // External consultation validation - only validate visible boxes
  if (showPETBox && (!externalConsultationData.summary.PET || externalConsultationData.summary.PET === "" || isNaN(parseInt(externalConsultationData.summary.PET)))) {
    errors.PET = "有効なPET数が必要です";
  }
  
  if (showMRBox && (!externalConsultationData.summary.MR || externalConsultationData.summary.MR === "" || isNaN(parseInt(externalConsultationData.summary.MR)))) {
    errors.MR = "有効なMR数が必要です";
  }
  
  if (showCTBox && (!externalConsultationData.summary.CT || externalConsultationData.summary.CT === "" || isNaN(parseInt(externalConsultationData.summary.CT)))) {
    errors.CT = "有効なCT数が必要です";
  }

  // Validate consolidated data for both components
  // Both components should have at least one entry
  if (consolidatedData.length === 0 && consolidatedDataCount.length === 0) {
    errors.consolidatedData = "少なくとも1つの診療科エントリが必要です";
  }
  
  return errors;
};

// Status badge configuration
export const getStatusConfig = (status) => {
  const statusConfig = {
    draft: { color: '#ff9800', label: '下書き', bgColor: '#fff3e0' },
    submitted: { color: '#2196f3', label: '提出済み', bgColor: '#e3f2fd' },
    approved: { color: '#4caf50', label: '承認済み', bgColor: '#e8f5e9' },
    rejected: { color: '#f44336', label: '拒否済み', bgColor: '#ffebee' }
  };
  
  return statusConfig[status] || { color: '#9e9e9e', label: '未提出', bgColor: '#f5f5f5' };
};