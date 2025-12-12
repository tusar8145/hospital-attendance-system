import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Checkbox,
  useTheme
} from '@mui/material';
import { CheckCircle, Pending, AccessTime } from '@mui/icons-material';

const StatusConfirmationSection = ({ 
  statusData = [],
  onStatusChange,
  title = "確認状態一覧",
  showSummary = true,
  showDate = true,
  compact = true
}) => {
  const theme = useTheme();

  // Get current date in Japanese format
  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const day = days[now.getDay()];
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日（${day}）`;
  };

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

  return (
    <Box className="mb-8">
      <Paper elevation={2} className="border border-gray-300 rounded-xl overflow-hidden">
        {/* Header for Status Section */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-3">
          <Typography variant="h6" className="font-bold text-black-400 text-left">
            {title}
          </Typography>
        </div>
        
        <div className="p-4">
          {/* Grid of Confirmation Boxes */}
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {statusData.map((item) => (
              <Paper 
                key={item.id}
                elevation={1} 
                className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 min-w-0"
              >
                {/* Header - Compact */}
                <div className={`${item.title === '理事長' ? 'bg-blue-600' : item.title === '専務' ? 'bg-green-600' : 'bg-purple-600'} p-2`}>
                  <Typography variant="caption" className="font-bold text-white text-center block truncate">
                    {item.title || '未設定'}
                  </Typography>
                </div>
                
                {/* Body */}
                <div className="p-2">
                  {/* Checkbox and Person */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center min-w-0">
                      <div className={`${item.color || 'bg-gray-500'} w-5 h-5 rounded-full flex items-center justify-center mr-1`}>
                        <span className="text-white text-xs font-bold">
                          {item.avatar || '?'}
                        </span>
                      </div>
                      <Typography variant="caption" className="font-medium text-gray-700 truncate">
                        {item.person ? item.person.split(' ')[0] : '未設定'}
                      </Typography>
                    </div>
                    
                    <Checkbox
                      checked={item.checked || false}
                      onChange={() => onStatusChange(item.id)}
                      icon={<Pending className="text-gray-400" style={{ fontSize: 14 }} />}
                      checkedIcon={<CheckCircle className="text-green-500" style={{ fontSize: 14 }} />}
                      size="small"
                      className="p-0"
                      disabled={item.disabled}
                    />
                  </div>
                  
                  {/* Status and Date */}
                  <div className="space-y-1">
                    <div className="flex items-center">
                      {item.checked ? (
                        <CheckCircle className="text-green-500 w-3 h-3 mr-1" />
                      ) : (
                        <Pending className="text-orange-500 w-3 h-3 mr-1" />
                      )}
                      <Typography variant="caption" className={item.checked ? "text-green-600" : "text-orange-600"}>
                        {item.status || '未確認'}
                      </Typography>
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                      <AccessTime className="w-3 h-3 mr-1" />
                      <Typography variant="caption" className="truncate">
                        {formatDateForDisplay(item.date)}
                      </Typography>
                    </div>
                    
                    {/* Approver Information */}
                    {item.checked && item.approver && (
                      <div className="mt-1 pt-1 border-t border-gray-200">
                        <Typography variant="caption" className="text-gray-500 block truncate">
                          承認者: {item.approver || item.person || '未設定'}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              </Paper>
            ))}
          </div>
          
          {/* Summary - Only show if we have data */}
          {showSummary && statusData.length > 0 && (
            <Paper elevation={0} className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-1" style={{ fontSize: 16 }} />
                    <Typography variant="caption" className="text-gray-600">
                      確認済み: <span className="font-bold">{statusData.filter(item => item.checked).length}</span>
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <Pending className="text-orange-500 mr-1" style={{ fontSize: 16 }} />
                    <Typography variant="caption" className="text-gray-600">
                      未確認: <span className="font-bold">{statusData.filter(item => !item.checked).length}</span>
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                    <Typography variant="caption" className="text-gray-600">
                      合計: <span className="font-bold">{statusData.length}</span>
                    </Typography>
                  </div>
                </div>
                
                {showDate && (
                  <Typography variant="caption" className="text-gray-500 mt-2 sm:mt-0">
                    最終更新: {getCurrentJapaneseDateWithoutWeekday()}
                  </Typography>
                )}
              </div>
            </Paper>
          )}

          {/* Empty State */}
          {statusData.length === 0 && (
            <Paper elevation={0} className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <CheckCircle className="text-gray-400 mx-auto mb-2" style={{ fontSize: 32 }} />
              <Typography variant="body2" className="text-gray-500">
                承認履歴はまだありません
              </Typography>
              <Typography variant="caption" className="text-gray-400">
                最初の承認が行われるとここに表示されます
              </Typography>
            </Paper>
          )}
        </div>
      </Paper>
    </Box>
  );
};

export default StatusConfirmationSection;