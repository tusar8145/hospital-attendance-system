// Department.jsx
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
  Autocomplete,
  Grid,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Collapse,
  Paper,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
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
  const [expandedRows, setExpandedRows] = useState({});

  // Get hospital from theme context
  const { hospital } = useTheme();

  // Get current user
  const currentUser = User();

  // Fetch medical centers for dropdown - only active ones (status: 1)
  const { data: medicalCentersData } = useQuery({
    queryKey: ['medicalCenters'],
    queryFn: async () => {
      const response = await axios.post(apiConfig.medicalCenterList, {
        page: 1,
        perPage: 1000,
        filter: {
          f_columnFilters: { status: { equals: 1 } }, // Only active medical centers
          globalFilter: "",
          f_globalFilters: null,
          others: {}
        }
      });
      return response.data;
    },
  });

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('Clinical Department'),
        size: 300,
        enableColumnFilter: true,
        Cell: ({ row, cell }) => {
          const serialNumber = (pagination.pageIndex * pagination.pageSize) + row.index + 1;
          const hasRooms = row.original.department_room?.length > 0;
          const isExpanded = expandedRows[row.original.id];
          
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
                  backgroundColor: 'transparent',
                  gap: 1
                }}
              >
                {hasRooms && (
                  <IconButton 
                    size="small" 
                    onClick={() => toggleRowExpansion(row.original.id)}
                    sx={{ mr: 0.5 }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
                {cell.getValue()}
                {hasRooms && (
                  <Chip
                    icon={<MeetingRoomIcon />}
                    label={`${row.original.department_room.length} 室`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </Box>
          );
        },
      },
      {
        accessorKey: 'medical_center.name',
        header: t('Hospital/Facility'),
        size: 200,
        enableColumnFilter: true,
        Cell: ({ row }) => {
          const medicalCenter = row.original.medical_center;
          const medicalCenterName = medicalCenter?.name || 'N/A';
          const isMedicalCenterActive = medicalCenter?.status === 1;
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {medicalCenterName}
              </Typography>
              {!isMedicalCenterActive && (
                <Tooltip title={t('Inactive Hospital/Facility')}>
                  <Chip
                    label={t('Inactive')}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Tooltip>
              )}
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
    [validationErrors, t, pagination.pageIndex, pagination.pageSize, expandedRows]
  );

  // Build filter payload - Updated structure with hospital_id
  const buildFilterPayload = () => {
    let f_columnFilters = {};
    let f_globalFilters = null;

    // Process column filters
    if (columnFilters.length > 0) {
      columnFilters.forEach(filter => {
        if (filter.id === 'name' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'medical_center.name' && filter.value && filter.value !== '') {
          f_columnFilters['medical_center'] = { name: { contains: filter.value } };
        }
      });
    }

    // Process global filter
    if (globalFilter) {
      const globalFilterConditions = [
        { name: { contains: globalFilter } },
        { medical_center: { name: { contains: globalFilter } } }
      ].filter(condition => {
        const key = Object.keys(condition)[0];
        return !f_columnFilters[key];
      });

      if (globalFilterConditions.length > 0) {
        f_globalFilters = { OR: globalFilterConditions };
      }
    }

    // Add hospital_id to the main filter object when hospital is selected
    const hospital_id = hospital?.id || null;

    return {
      f_columnFilters,
      globalFilter: globalFilter || "",
      f_globalFilters,
      others: props.filter?.others || null,
      hospital_id // Add hospital_id at the root level of filter
    };
  };

  const { data: { data: tableData = [], pagination: serverPagination = {} } = {}, isError, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ['departments', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter, hospital?.id],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
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
      const createPromises = departments.map(async department => 
        await createMutation.mutateAsync(department)
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
    enableGlobalFilter: true,
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
    renderDetailPanel: ({ row }) => {
      const rooms = row.original.department_room;
      if (!rooms || rooms.length === 0) return null;
      
      return (
        <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('Rooms')}:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {rooms.map((room) => (
              <Chip
                key={room.id}
                label={room.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      );
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
        medicalCenters={medicalCentersData?.data || []}
        hospital={hospital}
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
        medicalCenters={medicalCentersData?.data || []}
      />
    </div>
  );
};

// Create Department Modal Component
const CreateDepartmentModal = ({ open, onClose, onSubmit, isLoading, mutationError, medicalCenters, hospital }) => {
  const { t } = useTranslation('shared-components');
  const [departments, setDepartments] = useState([{ 
    name: '', 
    medical_center_id: '',
    rooms: [] 
  }]);
  const [errors, setErrors] = useState([]);
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [lastSelectedHospital, setLastSelectedHospital] = useState('');
  const [selectedHospitalType, setSelectedHospitalType] = useState('');

  // Get medical center type from medicalCenters array
  const getMedicalCenterType = (medicalCenterId) => {
    const center = medicalCenters.find(c => c.id == medicalCenterId);
    return center?.type || '';
  };

  // Check if hospital type is 'hospital' or 'large_hospital'
  const isHospitalType = (type) => {
    return type === 'hospital';
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // Auto-select hospital if hospital exists
      const initialMedicalCenterId = hospital?.id || '';
      const initialMedicalCenterType = hospital?.type || '';
      
      setDepartments([{ 
        name: '', 
        medical_center_id: initialMedicalCenterId,
        rooms: [] 
      }]);
      setErrors([]);
      setDuplicateErrors({});
      setApiError('');
      setLastSelectedHospital(initialMedicalCenterId);
      setSelectedHospitalType(initialMedicalCenterType);
    }
  }, [open, hospital]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating department');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('department_name_medical_center_id_key')) {
        setApiError(t('Department name already exists in this hospital/facility'));
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
      if (!department.medical_center_id) {
        fieldErrors.medical_center_id = t('This field is Required');
      }
      
      // Validate rooms if hospital type
      if (isHospitalType(getMedicalCenterType(department.medical_center_id))) {
        if (!department.rooms || department.rooms.length === 0) {
          fieldErrors.rooms = t('At least one room is required for hospitals');
        } else {
          // Validate each room name
          const roomErrors = [];
          department.rooms.forEach((room, roomIndex) => {
            if (!room.name.trim()) {
              roomErrors[roomIndex] = t('Room name is required');
            }
          });
          if (roomErrors.length > 0) {
            fieldErrors.roomErrors = roomErrors;
          }
        }
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
      if (department.name.trim() && department.medical_center_id) {
        const normalizedName = department.name.trim().toLowerCase();
        const key = `${normalizedName}_${department.medical_center_id}`;
        if (!nameCount[key]) {
          nameCount[key] = [];
        }
        nameCount[key].push(index);
      }
    });

    // Mark duplicates
    Object.keys(nameCount).forEach(key => {
      if (nameCount[key].length > 1) {
        nameCount[key].forEach(index => {
          newDuplicateErrors[index] = t('Duplicate department name in this hospital/facility');
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

    /*if (!checkForDuplicates()) {
      return;
    }*/

    const validDepartments = departments.map(dept => ({
      ...dept,
      rooms: dept.rooms.filter(room => room.name.trim() !== '')
    })).filter(dept => dept.name.trim() !== '' && dept.medical_center_id !== '');

    if (validDepartments.length === 0) {
      return;
    }

    onSubmit(validDepartments.length === 1 ? validDepartments[0] : validDepartments);
  };

  const addDepartment = () => {
    const newDepartment = { 
      name: '', 
      medical_center_id: lastSelectedHospital || '',
      rooms: [] 
    };
    setDepartments([...departments, newDepartment]);
    setErrors([...errors, {}]);
    
    // Scroll to bottom after adding new department
    setTimeout(() => {
      const dialogContent = document.querySelector('.MuiDialogContent-root');
      if (dialogContent) {
        dialogContent.scrollTop = dialogContent.scrollHeight;
      }
    }, 100);
  };

  const updateDepartment = (index, field, value) => {
    const updated = [...departments];
    updated[index][field] = value;
    setDepartments(updated);

    // Update last selected hospital when hospital is selected
    if (field === 'medical_center_id' && value) {
      setLastSelectedHospital(value);
      const hospitalType = getMedicalCenterType(value);
      setSelectedHospitalType(hospitalType);
      
      // Initialize rooms if hospital type and no rooms exist
      if (isHospitalType(hospitalType) && (!updated[index].rooms || updated[index].rooms.length === 0)) {
        updated[index].rooms = [{ name: '' }];
        setDepartments(updated);
      }
    }

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

  const addRoom = (deptIndex) => {
    const updated = [...departments];
    if (!updated[deptIndex].rooms) {
      updated[deptIndex].rooms = [];
    }
    updated[deptIndex].rooms.push({ name: '' });
    setDepartments(updated);
  };

  const updateRoom = (deptIndex, roomIndex, value) => {
    const updated = [...departments];
    updated[deptIndex].rooms[roomIndex].name = value;
    setDepartments(updated);

    // Clear room errors
    if (errors[deptIndex]?.roomErrors?.[roomIndex]) {
      const updatedErrors = [...errors];
      if (updatedErrors[deptIndex].roomErrors) {
        delete updatedErrors[deptIndex].roomErrors[roomIndex];
        if (Object.keys(updatedErrors[deptIndex].roomErrors).length === 0) {
          delete updatedErrors[deptIndex].roomErrors;
        }
      }
      setErrors(updatedErrors);
    }
  };

  const removeRoom = (deptIndex, roomIndex) => {
    const updated = [...departments];
    updated[deptIndex].rooms = updated[deptIndex].rooms.filter((_, i) => i !== roomIndex);
    setDepartments(updated);
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
    setDepartments([{ name: '', medical_center_id: '', rooms: [] }]);
    setErrors([]);
    setDuplicateErrors({});
    setApiError('');
    setLastSelectedHospital('');
    setSelectedHospitalType('');
    onClose();
  };

  const dialogContent = (
    <div className="flex flex-col gap-8">
      {departments.map((department, index) => {
        const hospitalType = getMedicalCenterType(department.medical_center_id);
        const showRoomsField = isHospitalType(hospitalType);
        
        return (
          <Paper
            key={index}
            elevation={1}
            className="p-6 rounded-lg relative bg-gray-50"
            sx={{ position: 'relative' }}
          >
            {/* Department Name and Hospital/Facility in same row */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <div className="flex flex-col gap-1">
                  <Typography variant="subtitle1" className="font-medium">
                    {t('Clinical Department')} *
                  </Typography>
                  <TextField
                    value={department.name}
                    onChange={(e) => updateDepartment(index, 'name', e.target.value)}
                    fullWidth
                    error={!!errors[index]?.name || !!duplicateErrors[index]}
                    helperText={errors[index]?.name || duplicateErrors[index]}
                    placeholder={t('Enter department name')}
                    disabled={isLoading}
                    size="small"
                  />
                </div>
              </Grid>
              
              <Grid item xs={6}>
                <div className="flex flex-col gap-1">
                  <Typography variant="subtitle1" className="font-medium">
                    {t('Hospital/Facility')} *
                  </Typography>
                  <FormControl fullWidth error={!!errors[index]?.medical_center_id} size="small">
                    <Select
                      value={department.medical_center_id}
                      onChange={(e) => updateDepartment(index, 'medical_center_id', e.target.value)}
                      displayEmpty
                      disabled={isLoading}
                    >
                      <MenuItem value="">
                        <em>{t('Select hospital/facility')}</em>
                      </MenuItem>
                      {medicalCenters.map((center) => (
                        <MenuItem key={center.id} value={center.id}>
                          {center.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[index]?.medical_center_id && (
                      <Typography variant="caption" color="error">
                        {errors[index]?.medical_center_id}
                      </Typography>
                    )}
                  </FormControl>
                </div>
              </Grid>
            </Grid>

            {/* Rooms Section - only shown for hospital type */}
            {showRoomsField && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" className="font-medium" sx={{ mb: 2 }}>
                  {t('Rooms')} *
                </Typography>
                
                {department.rooms && department.rooms.map((room, roomIndex) => (
                  <Grid container spacing={2} key={roomIndex} sx={{ mb: 2 }}>
                    <Grid item xs={10}>
                      <TextField
                        value={room.name}
                        onChange={(e) => updateRoom(index, roomIndex, e.target.value)}
                        fullWidth
                        error={!!errors[index]?.roomErrors?.[roomIndex]}
                        helperText={errors[index]?.roomErrors?.[roomIndex]}
                        placeholder={'e.g., 診1, 診2...'}
                        disabled={isLoading}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton
                        onClick={() => removeRoom(index, roomIndex)}
                        color="error"
                        size="small"
                        disabled={isLoading || department.rooms.length <= 1}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                {errors[index]?.rooms && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    {errors[index]?.rooms}
                  </Typography>
                )}

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addRoom(index)}
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  sx={{ mt: 1 }}
                >
                  {t('Add Room')}
                </Button>
              </Box>
            )}

            {departments.length > 1 && (
              <IconButton
                className="absolute top-2 right-2"
                onClick={() => removeDepartment(index)}
                color="error"
                size="small"
                disabled={isLoading}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Paper>
        );
      })}

      {/* API Error Alert */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{ 
            px: 0,
          }}
        >
          {apiError}
        </Alert>
      )}

      {/* Add Another Department */}
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
        {isLoading ? t('Creating...') : `${t('Create Department')}`}
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
      maxWidth='md'
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Edit Department Modal Component
const EditDepartmentModal = ({ open, onClose, onSubmit, department, isLoading, mutationError, medicalCenters }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ 
    name: '', 
    medical_center_id: '',
    rooms: [] 
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [selectedHospitalType, setSelectedHospitalType] = useState('');
  const [originalRooms, setOriginalRooms] = useState([]);

  // Get medical center type from medicalCenters array
  const getMedicalCenterType = (medicalCenterId) => {
    const center = medicalCenters.find(c => c.id == medicalCenterId);
    return center?.type || '';
  };

  // Check if hospital type is 'hospital' or 'large_hospital'
  const isHospitalType = (type) => {
    return type === 'hospital';
  };

  useEffect(() => {
    if (department && open) {
      const hospitalType = getMedicalCenterType(department.medical_center_id);
      
      // Map existing rooms
      const rooms = department.department_room?.map(room => ({
        id: room.id,
        name: room.name,
        status: 1
      })) || [];
      
      setFormData({
        name: department.name || '',
        medical_center_id: department.medical_center_id || '',
        rooms: rooms
      });
      setOriginalRooms(rooms);
      setSelectedHospitalType(hospitalType);
      setApiError('');
    }
  }, [department, open]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating department');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('department_name_medical_center_id_key')) {
        setApiError(t('Department name already exists in this hospital/facility'));
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
    if (!formData.medical_center_id) {
      newErrors.medical_center_id = t('This field is Required');
    }
    
    // Validate rooms if hospital type
    if (isHospitalType(selectedHospitalType)) {
      if (!formData.rooms || formData.rooms.length === 0) {
        newErrors.rooms = t('At least one room is required for hospitals');
      } else {
        // Validate each room name
        const roomErrors = [];
        formData.rooms.forEach((room, roomIndex) => {
          if (!room.name.trim()) {
            roomErrors[roomIndex] = t('Room name is required');
          }
        });
        if (roomErrors.length > 0) {
          newErrors.roomErrors = roomErrors;
        }
      }
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

    // Prepare rooms data - mark removed rooms with status 2
    const updatedRooms = formData.rooms.map(room => {
      if (!room.id) {
        // New room
        return { name: room.name };
      } else {
        // Existing room
        return { id: room.id, name: room.name, status: 1 };
      }
    });

    // Mark deleted rooms (rooms that were in original but not in current)
    originalRooms.forEach(originalRoom => {
      const stillExists = formData.rooms.some(r => r.id === originalRoom.id);
      if (!stillExists) {
        updatedRooms.push({ id: originalRoom.id, name: originalRoom.name, status: 2 });
      }
    });

    onSubmit({ 
      ...formData, 
      id: department.id,
      rooms: updatedRooms 
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update hospital type when hospital is selected
    if (field === 'medical_center_id' && value) {
      const hospitalType = getMedicalCenterType(value);
      setSelectedHospitalType(hospitalType);
      
      // Initialize rooms if hospital type and no rooms exist
      if (isHospitalType(hospitalType) && (!formData.rooms || formData.rooms.length === 0)) {
        setFormData(prev => ({ ...prev, rooms: [{ name: '' }] }));
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear API error when user types
    if (apiError) {
      setApiError('');
    }
  };

  const addRoom = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { name: '' }]
    }));
  };

  const updateRoom = (index, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[index] = { ...updatedRooms[index], name: value };
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));

    // Clear room errors
    if (errors.roomErrors?.[index]) {
      const updatedRoomErrors = [...errors.roomErrors];
      delete updatedRoomErrors[index];
      setErrors(prev => ({
        ...prev,
        roomErrors: updatedRoomErrors.filter(Boolean)
      }));
    }
  };

  const removeRoom = (index) => {
    const updatedRooms = formData.rooms.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({ name: '', medical_center_id: '', rooms: [] });
    setErrors({});
    setApiError('');
    setSelectedHospitalType('');
    setOriginalRooms([]);
    onClose();
  };

  if (!department) return null;

  const showRoomsField = isHospitalType(selectedHospitalType);

  const dialogContent = (
    <div className="flex flex-col gap-4 mt-20">
      {/* Department Name and Hospital/Facility in same row */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
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
              size="small"
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Hospital/Facility')} *
            </Typography>
            <FormControl fullWidth error={!!errors.medical_center_id} size="small">
              <Select
                value={formData.medical_center_id}
                onChange={(e) => handleChange('medical_center_id', e.target.value)}
                displayEmpty
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>{t('Select hospital/facility')}</em>
                </MenuItem>
                {medicalCenters.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.medical_center_id && (
                <Typography variant="caption" color="error">
                  {errors.medical_center_id}
                </Typography>
              )}
            </FormControl>
          </div>
        </Grid>
      </Grid>

      {/* Rooms Section - only shown for hospital type */}
      {showRoomsField && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" className="font-medium" sx={{ mb: 2 }}>
            {t('Rooms')} *
          </Typography>
          
          {formData.rooms && formData.rooms.map((room, roomIndex) => (
            <Grid container spacing={2} key={room.id || `new-${roomIndex}`} sx={{ mb: 2 }}>
              <Grid item xs={10}>
                <TextField
                  value={room.name}
                  onChange={(e) => updateRoom(roomIndex, e.target.value)}
                  fullWidth
                  error={!!errors.roomErrors?.[roomIndex]}
                  helperText={errors.roomErrors?.[roomIndex]}
                  placeholder={t('Enter room name (e.g., 診1, 診2, 処置室)')}
                  disabled={isLoading}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  onClick={() => removeRoom(roomIndex)}
                  color="error"
                  size="small"
                  disabled={isLoading || formData.rooms.length <= 1}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          {errors.rooms && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {errors.rooms}
            </Typography>
          )}

          <Button
            startIcon={<AddIcon />}
            onClick={addRoom}
            variant="outlined"
            size="small"
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            {t('Add Room')}
          </Button>
        </Box>
      )}

      {/* API Error Alert */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{             
            px: 0,
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
      maxWidth="md"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};