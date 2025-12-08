import React from 'react';
import { 
  Paper, 
  Typography, 
  Stack, 
  Button,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCommentIcon from '@mui/icons-material/AddComment';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const ManagementComments = ({ 
  comments = [],
  title = "管理事項",
  showSummary = true,
  summaryMessage = "本日の管理事項はすべて正常に処理されました。特段の問題は発生していません。",
  showActionButtons = false,
  onAddComment,
  onDeleteLastComment,
  onEditComment,
  onDeleteComment,
  allowAddComment = true,
  allowDeleteLastComment = true,
  allowEditComments = true,
  allowDeleteComments = true,
  showCommentCount = true
}) => {
  return (
    <Paper 
      elevation={2} 
      className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header with title and comment count */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <Typography variant="h6" className="font-bold ">
            {title}
          </Typography>
        </div>
        {showCommentCount && (
          <div className="text-white text-sm bg-black/20 px-3 py-1 rounded-full">
            全{comments.length}件
          </div>
        )}
      </div>
      
      {/* Action buttons section (if enabled) */}
      {showActionButtons && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex flex-wrap gap-2">
            {allowAddComment && onAddComment && (
              <Button
                variant="contained"
                startIcon={<AddCommentIcon />}
                onClick={onAddComment}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                size="small"
              >
                コメント追加
              </Button>
            )}
            
            {allowDeleteLastComment && onDeleteLastComment && comments.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteForeverIcon />}
                onClick={onDeleteLastComment}
                className="border-red-500 text-red-600 hover:bg-red-50 font-semibold text-sm"
                size="small"
              >
                最後のコメントを削除
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <Typography variant="body2" className="text-gray-500">
              コメントはありません
            </Typography>
            {allowAddComment && onAddComment && (
              <Button
                variant="outlined"
                startIcon={<AddCommentIcon />}
                onClick={onAddComment}
                className="mt-3 border-blue-500 text-blue-600 hover:bg-blue-50"
                size="small"
              >
                最初のコメントを追加
              </Button>
            )}
          </div>
        ) : (
          <Stack spacing={3}>
            {comments.map((comment, index) => (
              <div 
                key={index} 
                className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg hover:bg-blue-100 transition-colors duration-200 group relative"
              >
                {/* Action buttons for each comment */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  {allowEditComments && onEditComment && (
                    <Tooltip title="編集">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditComment(index, comment);
                        }}
                        className="text-blue-500 hover:bg-blue-50"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {allowDeleteComments && onDeleteComment && (
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteComment(index);
                        }}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
                
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mr-3 mt-1">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <Typography variant="body2" className="text-gray-700 leading-relaxed">
                      {comment.text || comment}
                    </Typography>
                    
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          報告時間: {comment.time || '未設定'}
                        </div>
                        {comment.author && (
                          <div className="mt-1 sm:mt-0 text-gray-600">
                            報告者: <span className="font-medium">{comment.author}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Stack>
        )}
        
        {showSummary && comments.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <Typography variant="body2" className="text-gray-600">
                {summaryMessage}
              </Typography>
            </div>
          </div>
        )}
      </div>
    </Paper>
  );
};

export default ManagementComments;