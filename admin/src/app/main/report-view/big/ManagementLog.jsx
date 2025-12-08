import React, { useState } from 'react';
import { Check } from 'lucide-react';

const ManagementLog = ({ tableData, title = "Management Log", fixedCellHeight = '54px', fixedCellWidth = '72px' }) => {
  const [localTableData, setLocalTableData] = useState(tableData || []);

  // Function to handle checkbox click
  const handleCheckboxClick = (id) => {
    setLocalTableData(prevData => 
      prevData.map(item => 
        item.id === id && item.content 
          ? {
              ...item,
              content: {
                ...item.content,
                checked: !item.content.checked,
                lines: [
                  !item.content.checked ? '確認済み' : '未確認',
                  item.content.date
                ]
              }
            }
          : item
      )
    );
  };

  return (
    <div className="w-full p-3">
      {/* Title - Reduced font size */}
      {title && (
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
        </div>
      )}
      
      {/* Table Section */}
      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {localTableData.map((column) => (
                <th 
                  key={`header-${column.id}`} 
                  className="border border-gray-300 p-1 text-center font-medium text-xs"
                  style={{ 
                    width: fixedCellWidth,
                    height: '30px', // Fixed header height
                    minWidth: fixedCellWidth,
                    maxWidth: fixedCellWidth
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {column.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {localTableData.map((column) => (
                <td 
                  key={`data-${column.id}`} 
                  className="border border-gray-300 align-top"
                  style={{ 
                    height: fixedCellHeight,
                    width: fixedCellWidth,
                    minWidth: fixedCellWidth,
                    maxWidth: fixedCellWidth,
                    minHeight: fixedCellHeight,
                    maxHeight: fixedCellHeight,
                    padding: 0,
                    verticalAlign: 'top'
                  }}
                >
                  {/* Render content only if it exists */}
                  {column.content ? (
                    <div 
                      className="flex flex-col items-center justify-center text-center"
                      style={{
                        height: '100%',
                        width: '100%',
                        padding: '4px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* SMALLER CLICKABLE SQUARE CHECKBOX */}
                      {column.content.hasCheckbox && (
                        <div 
                          className="flex flex-col items-center"
                          style={{ marginBottom: '2px' }}
                        >
                          <button
                            onClick={() => handleCheckboxClick(column.id)}
                            className="focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-1 rounded-sm"
                            aria-label={column.content.checked ? '確認済み' : '未確認'}
                          >
                            {/* Smaller square checkbox container */}
                            <div 
                              className={`flex items-center justify-center transition-colors duration-200 ${
                                column.content.checked 
                                  ? 'bg-green-500 border-green-600' 
                                  : 'border-gray-400 hover:border-gray-600'
                              }`}
                              style={{
                                width: '13px',
                                height: '13px',
                                borderWidth: '2.4px',
                                borderStyle: 'solid',
                                borderRadius: '1px',
                                cursor: 'pointer'
                              }}
                            >
                              {column.content.checked && (
                                <Check 
                                  className="text-white" 
                                  style={{
                                    width: '9px',
                                    height: '9px',
                                    strokeWidth: '3'
                                  }}
                                />
                              )}
                            </div>
                          </button>
                        </div>
                      )}
                      
                      {/* Text lines with smaller font sizes */}
                      <div 
                        className="flex flex-col justify-center"
                        style={{
                          width: '100%',
                          flex: 1,
                          overflow: 'hidden'
                        }}
                      >
                        {column.content.lines.map((line, lineIndex) => (
                          <div 
                            key={lineIndex}
                            className={`w-full ${
                              lineIndex === 0 
                                ? 'text-xs font-bold'
                                : 'text-[10px] font-medium'
                            } ${
                              line.includes('確認済み') || line.includes('Complete') || line.includes('Verified')
                                ? 'text-green-700' 
                                : line.includes('未確認') || line.includes('Pending')
                                  ? 'text-gray-600'
                                  : line.includes('Not Required')
                                    ? 'text-gray-400'
                                    : 'text-gray-700'
                            }`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              marginBottom: lineIndex === 0 ? '2px' : '0',
                              lineHeight: '1.2'
                            }}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Empty cell
                    <div 
                      style={{ 
                        height: '100%',
                        width: '100%'
                      }}
                    />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagementLog;