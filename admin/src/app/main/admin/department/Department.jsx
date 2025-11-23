import Button from '@mui/material/Button';
import _ from '@lodash';
import { useMemo, useEffect, useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { createdAt } from '../../../helpers/timeHelpers';
import { filterItemsEqual } from '../../../helpers/commonHelpers';
import User from '../../../auth/user/user';
import { useAppDispatch } from 'app/store/hooks';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Menu,
  Chip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

// Import shared components
import { CommonHeader } from '../../../shared-components/new/CommonHeader';
import { ConfirmationDialog } from '../../../shared-components/new/ConfirmationDialog';
import { CommonDialog } from '../../../shared-components/new/CommonDialog';
import { toJapaneseDate } from '../../../shared-components/new/DateHelpers';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';

// Create a client
const queryClient = new QueryClient();

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

function Department() {
  return (
    <QueryClientProvider client={queryClient}>
      <DepartmentContent />
    </QueryClientProvider>
  );
}

function DepartmentContent() {
  let user = User();
  let tableName = 'departments';
  let headingTitle = 'Clinical Department List';

  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const { theme, toggleTheme } = useTheme();
  const { refreshDepartment, toggleRefreshDepartment } = useTheme();

  const [globalFilter, setGlobalFilter] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    toggleTheme(t(headingTitle));
  }, [t(headingTitle)]);

  function handleCountDataFromChild(count) {
    if (refreshDepartment === true) {
      toggleRefreshDepartment(false);
    } else {
      toggleRefreshDepartment(true);
    }
  }

  const handleFilterType = (type) => {
    setFilterType(type);
  };

  // Build filter object correctly
  const buildFilter = () => {
    return {
      f_columnFilters: {},
      globalFilter: "",
      f_globalFilters: {},
      others: {}
    };
  };

  const filterOptions = null;

  return (
    <Root
      header={
        <CommonHeader
          title={headingTitle}
          filterType={filterType}
          onFilterChange={handleFilterType}
          onCreate={() => setCreateModalOpen(true)}
          filterOptions={filterOptions}
          createButtonText="Add Clinical Department"
        />
      }
      content={
        <div className="flex flex-col items-center p-24 sm:p-40 container">
          {successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
          {failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}

          <div className="w-full min-w-0 py-24">
            <Table
              filter={buildFilter()}
              sendCountToParent={handleCountDataFromChild}
              globalFilter={globalFilter}
              tableName={tableName}
              createModalOpen={createModalOpen}
              setCreateModalOpen={setCreateModalOpen}
            />
          </div>
        </div>
      }
    />
  );
}

export default Department;

// Table Component Implementation
const Table = (props) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shared-components');
  const dispatch = useAppDispatch();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // State for filters and pagination
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('Clinical Department'),
        size: 300,
        enableColumnFilter: true,
        Cell: ({ row, cell }) => {
          const serialNumber = (pagination.pageIndex * pagination.pageSize) + row.index + 1;
          return (
            <Box sx={{ display: 'flex', alignItems: 'stretch', width: '100%', height: '100%' }}>
              {/* SL Cell - 15% width */}
              <Box 
                sx={{ 
                  width: '15%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'grey.50',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  position: 'relative'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {serialNumber}
                </Typography>
              </Box>
              
              {/* Name Cell - 85% width */}
              <Box 
                sx={{ 
                  width: '85%', 
                  display: 'flex',
                  alignItems: 'center',
                  pl: 2,
                  backgroundColor: 'transparent'
                }}
              >
                {cell.getValue()}
              </Box>
            </Box>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell, row }) => (
          <Button
            variant={cell.getValue() === 1 ? "contained" : "outlined"}
            color={cell.getValue() === 1 ? "success" : "error"}
            size="small"
            onClick={() => handleStatusClick(row.original)}
          >
            {cell.getValue() === 1 ? t('Active') : t('Inactive')}
          </Button>
        ),
      },
      {
        accessorKey: '_count.doctor_links',
        header: t('Doctors'),
        size: 120,
        enableEditing: false,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <span className="font-semibold">
              {cell.getValue() || 0}
            </span>
          </Box>
        ),
      },
      {
        accessorKey: 'created_at',
        header: t('Creation Information'),
        size: 200,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const createdAdmin = row.original.created_admin;
          const createdAt = row.original.created_at;
          
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.2rem' }}>
                {createdAdmin?.name || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
                {toJapaneseDate(createdAt)}
              </Typography>
            </Box>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: t('Actions'),
        size: 100,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={(event) => handleMenuOpen(event, row)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [validationErrors, t, pagination.pageIndex, pagination.pageSize]
  );

  // Build filter payload based on your existing structure
  const buildFilterPayload = () => {
    let f_columnFilters = {};
    let f_globalFilters = null;

    // Process column filters - only for Name
    if (columnFilters.length > 0) {
      columnFilters.forEach(filter => {
        // Only process filters for Name column
        if (filter.id === 'name' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        }
      });
    }

    // Process global filter - only search in Name
    if (globalFilter) {
      const globalFilterConditions = [
        { name: { contains: globalFilter } }
      ].filter(condition => {
        const key = Object.keys(condition)[0];
        return !f_columnFilters[key]; // Only add if not already in column filters
      });

      if (globalFilterConditions.length > 0) {
        f_globalFilters = { OR: globalFilterConditions };
      }
    }

    return {
      f_columnFilters,
      globalFilter: globalFilter || "",
      f_globalFilters,
      others: props.filter?.others || {}
    };
  };

  const { data: { data: tableData = [], pagination: serverPagination = {} } = {}, isError, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ['departments', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'asc',
        filter: filterPayload
      };

      const response = await axios.post(apiConfig.departmentList, payload);
      return response.data;
    },
  });

  // Auto refetch after mutations
  const handleMutationSuccess = () => {
    queryClient.invalidateQueries(['departments']);
    refetch();
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.departmentCreate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      // Show success message based on response structure
      if (data.success === "true" || data.success === true) {
        if (data.count > 0) {
          // Bulk create success
          dispatch(showMessage({ message: t('{count} departments created successfully', { count: data.count }), variant: 'success' }));
        } else {
          // Single create success
          dispatch(showMessage({ message: t('Department created successfully'), variant: 'success' }));
        }
      } else if (data.message && data.message.includes('Created Successful')) {
        dispatch(showMessage({ message: t('Department created successfully'), variant: 'success' }));
      }
      
      // Close modal and reset form via props
      props.setCreateModalOpen(false);
    },
    onError: (error) => {
      // Error handling is now done in the modal component
      console.error('Error creating department:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.departmentUpdate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      // Show success message based on response structure
      if (data.success === "true" || data.success === true || data.message?.includes('Updated Successful')) {
        dispatch(showMessage({ message: t('Department updated successfully'), variant: 'success' }));
      }
      
      setEditModalOpen(false);
    },
    onError: (error) => {
      // Error handling is now done in the modal component
      console.error('Error updating department:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.post(apiConfig.departmentRemove, { id });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      // Show success message based on response structure
      if (data.success === "true" || data.success === true || data.message?.includes('Deleted Successful')) {
        dispatch(showMessage({ message: t('Department deleted successfully'), variant: 'success' }));
      }
      
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error deleting department');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.post(apiConfig.departmentStatus, { id, status: status === 1 ? 0 : 1 });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      // Show success message based on response structure
      if (data.success === "true" || data.success === true || data.message?.includes('Updated Successful')) {
        dispatch(showMessage({ message: t('Status updated successfully'), variant: 'success' }));
      }
      
      setStatusConfirmOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error updating status');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const handleCreateDepartments = (departments) => {
    if (Array.isArray(departments)) {
      const createPromises = departments.map(department => 
        createMutation.mutateAsync(department)
      );
      
      Promise.all(createPromises)
        .then(() => {
          // Success handled in individual mutations
        })
        .catch(error => {
          console.error('Error creating departments:', error);
        });
    } else {
      createMutation.mutate(departments);
    }
  };

  const handleEditDepartment = (data) => {
    updateMutation.mutate(data);
  };

  const handleStatusClick = (department) => {
    setSelectedDepartment(department);
    setStatusConfirmOpen(true);
  };

  const handleStatusConfirm = () => {
    if (selectedDepartment) {
      statusMutation.mutate({ 
        id: selectedDepartment.id, 
        status: selectedDepartment.status 
      });
    }
  };

  const handleDeleteClick = (row) => {
    setSelectedDepartment(row.original);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDepartment) {
      deleteMutation.mutate(selectedDepartment.id);
    }
  };

  const handleEditClick = (row) => {
    setSelectedDepartment(row.original);
    setEditModalOpen(true);
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const table = useMaterialReactTable({
    columns,
    data: tableData || [],
    enableEditing: false,
    enableRowActions: false,
    enableColumnFilters: true,
    enableGlobalFilter: false,
    enableFullScreenToggle: false,
    enableMultiRowSelection: false,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount: serverPagination?.total || 0,
    initialState: {
      showColumnFilters: true,
    },
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showProgressBars: isFetching,
      sorting,
    },
  });

  return (
    <div className="w-full">
      <MaterialReactTable table={table} />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => {
            handleEditClick(selectedRow);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          {t('Edit')}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDeleteClick(selectedRow);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('Delete')}
        </MenuItem>
      </Menu>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${selectedDepartment?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      <ConfirmationDialog
        open={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleStatusConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status of "${selectedDepartment?.name}" to ${selectedDepartment?.status === 1 ? 'Inactive' : 'Active'}?`}
        confirmText="Change Status"
        confirmColor="primary"
      />

      {/* Create Modal */}
      <CreateDepartmentModal
        open={props.createModalOpen}
        onClose={() => props.setCreateModalOpen(false)}
        onSubmit={handleCreateDepartments}
        isLoading={createMutation.isLoading}
        mutationError={createMutation.error}
        key={props.createModalOpen ? 'create-modal-open' : 'create-modal-closed'} // Force re-render
      />

      {/* Edit Modal */}
      <EditDepartmentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditDepartment}
        department={selectedDepartment}
        isLoading={updateMutation.isLoading}
        mutationError={updateMutation.error}
      />
    </div>
  );
};

// Create Department Modal Component
const CreateDepartmentModal = ({ open, onClose, onSubmit, isLoading, mutationError }) => {
  const { t } = useTranslation('shared-components');
  const [departments, setDepartments] = useState([{ name: '' }]);
  const [errors, setErrors] = useState([]);
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setDepartments([{ name: '' }]);
      setErrors([]);
      setDuplicateErrors({});
      setApiError('');
    }
  }, [open]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating department');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('department_name_key')) {
        setApiError(t('Department name already exists'));
      } else {
        setApiError(errorMessage);
      }
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = departments.map((department, index) => {
      const fieldErrors = {};
      if (!department.name.trim()) {
        fieldErrors.name = t('This field is Required');
      }
      return fieldErrors;
    });

    setErrors(newErrors);
    return newErrors.every(error => Object.keys(error).length === 0);
  };

  const checkForDuplicates = () => {
    const nameCount = {};
    const newDuplicateErrors = {};
    
    departments.forEach((department, index) => {
      if (department.name.trim()) {
        const normalizedName = department.name.trim().toLowerCase();
        if (!nameCount[normalizedName]) {
          nameCount[normalizedName] = [];
        }
        nameCount[normalizedName].push(index);
      }
    });

    // Mark duplicates
    Object.keys(nameCount).forEach(name => {
      if (nameCount[name].length > 1) {
        nameCount[name].forEach(index => {
          newDuplicateErrors[index] = t('Duplicate department name in this form');
        });
      }
    });

    setDuplicateErrors(newDuplicateErrors);
    return Object.keys(newDuplicateErrors).length === 0;
  };

  const handleSubmit = () => {
    // Clear previous API errors
    setApiError('');

    if (!validateForm()) {
      return;
    }

    if (!checkForDuplicates()) {
      return;
    }

    const validDepartments = departments.filter(dept => dept.name.trim() !== '');
    
    if (validDepartments.length === 0) {
      return;
    }

    onSubmit(validDepartments.length === 1 ? validDepartments[0] : validDepartments);
  };

  const addDepartment = () => {
    setDepartments([...departments, { name: '' }]);
    setErrors([...errors, {}]);
  };

  const updateDepartment = (index, field, value) => {
    const updated = [...departments];
    updated[index][field] = value;
    setDepartments(updated);

    // Clear errors when user types
    if (errors[index]?.[field]) {
      const updatedErrors = [...errors];
      delete updatedErrors[index][field];
      setErrors(updatedErrors);
    }

    // Clear duplicate errors when user types
    if (duplicateErrors[index]) {
      const updatedDuplicateErrors = { ...duplicateErrors };
      delete updatedDuplicateErrors[index];
      setDuplicateErrors(updatedDuplicateErrors);
    }

    // Clear API error when user types
    if (apiError) {
      setApiError('');
    }
  };

  const removeDepartment = (index) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
      
      const updatedDuplicateErrors = { ...duplicateErrors };
      delete updatedDuplicateErrors[index];
      // Reindex duplicate errors
      Object.keys(updatedDuplicateErrors).forEach(key => {
        if (parseInt(key) > index) {
          updatedDuplicateErrors[parseInt(key) - 1] = updatedDuplicateErrors[key];
          delete updatedDuplicateErrors[key];
        }
      });
      setDuplicateErrors(updatedDuplicateErrors);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setDepartments([{ name: '' }]);
    setErrors([]);
    setDuplicateErrors({});
    setApiError('');
    onClose();
  };

  const dialogContent = (
    <div className="flex flex-col gap-8">
      {departments.map((department, index) => (
        <div
          key={index}
          className="flex gap-14 border border-gray-200 p-6 rounded-lg items-start relative bg-gray-50"
        >
          {/* Department Name */}
          <div className="flex flex-col gap-1 flex-[2] min-w-[300px]">
            <Typography variant="subtitle1" className="font-medium">
              {t('Clinical Department')} *
            </Typography>
            <TextField
              value={department.name}
              onChange={(e) =>
                updateDepartment(index, 'name', e.target.value)
              }
              fullWidth
              error={!!errors[index]?.name || !!duplicateErrors[index]}
              helperText={errors[index]?.name || duplicateErrors[index]}
              placeholder={t('Enter department name')}
              disabled={isLoading}
            />
          </div>

          {departments.length > 1 && (
            <IconButton
              className="absolute top-0 right-0 mt-1"
              onClick={() => removeDepartment(index)}
              color="error"
              size="small"
              disabled={isLoading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      ))}

      {/* API Error Alert - Moved to bottom */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{ 
            px: 0, // Remove horizontal padding
          }}
        >
          {apiError}
        </Alert>
      )}

      {/* Add Another */}
      <div className="flex justify-center pt-4">
        <Button
          startIcon={<AddIcon />}
          onClick={addDepartment}
          variant="outlined"
          disabled={isLoading}
        >
          {t('Add Another Department')}
        </Button>
      </div>


    </div>
  );

  const dialogActions = (
    <>
      <Button onClick={handleClose} variant="outlined" size="large" disabled={isLoading}>
        {t('Cancel')}
      </Button>
      <Button 
        color="primary" 
        onClick={handleSubmit} 
        variant="contained"
        size="large"
        disabled={isLoading}
      >
        {isLoading ? t('Creating...') : `${t('Create Department')}${departments.length > 1 ? 's' : ''}`}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={`Create Department${departments.length > 1 ? 's' : ''}`}
      actions={dialogActions}
      disabled={isLoading}
      maxWidth='xs'
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Edit Department Modal Component
const EditDepartmentModal = ({ open, onClose, onSubmit, department, isLoading, mutationError }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ name: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (department && open) {
      setFormData({
        name: department.name || ''
      });
      setApiError('');
    }
  }, [department, open]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating department');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('department_name_key')) {
        setApiError(t('Department name already exists'));
      } else {
        setApiError(errorMessage);
      }
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('This field is Required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Clear previous API errors
    setApiError('');

    if (!validateForm()) {
      return;
    }

    onSubmit({ ...formData, id: department.id });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear API error when user types
    if (apiError) {
      setApiError('');
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({ name: '' });
    setErrors({});
    setApiError('');
    onClose();
  };

  if (!department) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Clinical Department')} *
        </Typography>
        <TextField
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          fullWidth
          error={!!errors.name}
          helperText={errors.name}
          placeholder={t('Enter department name')}
          disabled={isLoading}
        />
      </div>

      {/* API Error Alert - Moved to bottom */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{             
            px: 0, // Remove horizontal padding
          }}
        >
          {apiError}
        </Alert>
      )}
    </div>
  );

  const dialogActions = (
    <>
      <Button onClick={handleClose} variant="outlined" size="large" disabled={isLoading}>
        {t('Cancel')}
      </Button>
      <Button
        color="primary"
        onClick={handleSubmit}
        variant="contained"
        size="large"
        disabled={isLoading}
      >
        {isLoading ? t('Updating...') : t('Update Department')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Edit Department"
      maxWidth="sm"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};