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
  patientsCount,
  outpatientsCount,
  specialNotes,
  hospital_type = 'hospital'
) => {
  return {
    admission_count: patientsCount || "0",
    discharge_count: outpatientsCount || "0",
    external_duty: "0",
    emergency_transport: "0",
    post_transport_admission: "0",
    visit_count: "0",
    special_notes: specialNotes.trim(),
    report_details: [],
    report_details_mid: [],
    external_consultation_details: null,
    hospital_type: hospital_type,
  };
};

// Validate form data
export const validateForm = (
  hospitalId,
  patientsCount,
  outpatientsCount
) => {
  const errors = {};
  
  // Required fields validation
  if (!hospitalId) {
    errors.hospital = "病院の選択が必要です";
  }
  
  // Validate patient counts
  if (!patientsCount || patientsCount === "" || isNaN(parseInt(patientsCount))) {
    errors.patientsCount = "有効な午前診数が必要です";
  }
  
  if (!outpatientsCount || outpatientsCount === "" || isNaN(parseInt(outpatientsCount))) {
    errors.outpatientsCount = "有効な午後診数が必要です";
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