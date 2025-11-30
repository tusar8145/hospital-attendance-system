import Button from '@mui/material/Button';
import _ from '@lodash';
import { useMemo, useEffect, useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { createdAt } from '../../helpers/timeHelpers';
import { filterItemsEqual } from '../../helpers/commonHelpers';
import User from '../../auth/user/user';
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
  Avatar,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Import shared components
import { CommonHeader } from '../../shared-components/new/CommonHeader';
import { ConfirmationDialog } from '../../shared-components/new/ConfirmationDialog';
import { CommonDialog } from '../../shared-components/new/CommonDialog';
import { toJapaneseDate } from '../../shared-components/new/DateHelpers';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
// Add this import for Material React Table
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

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

function Staff() {
  return (
    <QueryClientProvider client={queryClient}>
      <StaffContent />
    </QueryClientProvider>
  );
}

function StaffContent() {
  let user = User();
  let tableName = 'admins';
  let headingTitle = 'User Management';

  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const { theme, toggleTheme } = useTheme();

  const [globalFilter, setGlobalFilter] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

   const { hospital, toggleHospital } = useTheme();
   

  useEffect(() => {
    toggleTheme(t(headingTitle));
  }, [t(headingTitle)]);

  const handleFilterType = (type) => {
    setFilterType(type);
  };

  // Get current user's role
  const currentUserRole = user?.role || 'guest';

  // Define available roles that current user can create
  const getCreatableRoles = () => {
    switch (currentUserRole) {
      case 'superAdmin':
        return ['hospitalAssistant', 'staff', 'operator'];
      case 'admin':
        return ['hospitalAssistant', 'staff', 'operator'];
      case 'hospitalAssistant':
        return ['staff', 'operator'];
      case 'staff':
        return ['operator'];
      default:
        return [];
    }
  };

  // Define filter options based on user role
  const getFilterOptions = () => {
    const baseOptions = [{ value: 'ALL', label: t('All User') }];
    
    switch (currentUserRole) {
      case 'superAdmin':
      case 'admin':
        return [
          ...baseOptions,
          { value: 'superAdmin', label: t('System Administrator') },
          { value: 'admin', label: t('Chief Executive') },
          { value: 'hospitalAssistant', label: t('Head Manager') },
          { value: 'staff', label: t('Manager') },
          { value: 'operator', label: t('Data Input Person') },
        ];
      case 'hospitalAssistant':
        return [
          ...baseOptions,
          //{ value: 'hospitalAssistant', label: t('Head Manager') },
          { value: 'staff', label: t('Manager') },
          { value: 'operator', label: t('Data Input Person') },
        ];
      case 'staff':
        return [
          ...baseOptions,
          { value: 'operator', label: t('Data Input Person') },
        ];
      default:
        return baseOptions;
    }
  };

  const filterOptions = getFilterOptions();
  const creatableRoles = getCreatableRoles();

  // Check if current user can create staff
  const canCreateStaff = creatableRoles.length > 0;

  const buildFilter = () => {
    // If filterType is not 'ALL', add role filter
    const roleFilter = filterType !== 'ALL' ? { role: filterType } : {};
    
    return {
      f_columnFilters: {},
      globalFilter: "",
      f_globalFilters: {},
      others: { 
        ...roleFilter // Add the selected role filter
      }
    };
  };

  return (
    <Root
      header={
        <CommonHeader
          title={headingTitle}
          filterType={filterType}
          onFilterChange={handleFilterType}
          onCreate={canCreateStaff ? () => setCreateModalOpen(true) : null}
          filterOptions={filterOptions}
          createButtonText={t('Add User')}
          showCreateButton={canCreateStaff}
        />
      }
      content={
        <div className="flex flex-col items-center p-24 sm:p-40 container">
          {successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
          {failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}

          <div className="w-full min-w-0 py-24">
            <StaffTable
              filter={buildFilter()}
              globalFilter={globalFilter}
              tableName={tableName}
              createModalOpen={createModalOpen}
              setCreateModalOpen={setCreateModalOpen}
              filterType={filterType}
              currentUserRole={currentUserRole}
              creatableRoles={creatableRoles}
            />
          </div>
        </div>
      }
    />
  );
}

// Staff Table Component
// Staff Table Component
const StaffTable = (props) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shared-components');
  const dispatch = useAppDispatch();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignMedicalCentersModalOpen, setAssignMedicalCentersModalOpen] = useState(false);
  const [medicalCentersViewModalOpen, setMedicalCentersViewModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
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

  // New state for medical center filter
  const [filterByMedicalCenter, setFilterByMedicalCenter] = useState(false);
  const { hospital } = useTheme();

  // Get current user
  const currentUser = User();

  // Auto-check filter when hospital.id exists, uncheck when it doesn't
  useEffect(() => {
    if (hospital?.id) {
      setFilterByMedicalCenter(true);
    } else {
      setFilterByMedicalCenter(false);
    }
  }, [hospital?.id]);

  // Check if current user can perform actions on a staff member
  const canEditStaff = (staff) => {
    if (!staff || !currentUser) return false;
    
    // User cannot edit themselves
    if (staff.email === currentUser.data?.email) return false;
    
    const staffRole = staff.role;
    const userRole = currentUser.role;
    
    switch (userRole) {
      case 'superAdmin':
        return ['hospitalAssistant', 'staff', 'operator'].includes(staffRole);
      case 'admin':
        return ['hospitalAssistant', 'staff', 'operator'].includes(staffRole);
      case 'hospitalAssistant':
        return ['staff', 'operator'].includes(staffRole);
      case 'staff':
        return staffRole === 'operator';
      default:
        return false;
    }
  };

  const canDeleteStaff = (staff) => {
    return canEditStaff(staff); // Same permissions as edit
  };

  const canAssignMedicalCenters = (staff) => {
    return canEditStaff(staff); // Same permissions as edit
  };

  // Fetch medical centers for dropdown
  const { data: medicalCentersData } = useQuery({
    queryKey: ['medicalCenters'],
    queryFn: async () => {
      const response = await axios.post(apiConfig.medicalCenterList, {
        page: 1,
        perPage: 1000,
        filter: {}
      });
      return response.data;
    },
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t("Name"),
        size: 250,
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
                  gap: 2,
                  backgroundColor: 'transparent'
                }}
              >
                <Avatar
                  src={row.original.photo}
                  alt={row.original.name}
                  sx={{ width: 40, height: 40 }}
                >
                  {row.original.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cell.getValue()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {row.original.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: t('Phone'),
        size: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'role',
        header: t('Role'),
        size: 150,
        enableColumnFilter: true,
        Cell: ({ cell }) => {
          const role = cell.getValue();
          const roleTranslations = {
            'superAdmin': t('System Administrator'),
            'admin': t('Chief Executive'),
            'hospitalAssistant': t('Head Manager'),
            'staff': t('Manager'),
            'operator': t('Data Input Person')
          };
          
          return (
            <Chip
              label={roleTranslations[role] || role}
              size="small"
              color={
                role === 'superAdmin' ? 'error' :
                role === 'admin' ? 'warning' :
                role === 'hospitalAssistant' ? 'info' :
                role === 'staff' ? 'primary' : 'default'
              }
              variant="outlined"
            />
          );
        },
      },
      {
        accessorKey: 'assigned_medical_centers_count',
        header: t('Medical Centers'),
        size: 150,
        enableColumnFilter: false,
        Cell: ({ cell, row }) => {
          const medicalCenters = row.original.medical_centers || [];
          const count = cell.getValue() || medicalCenters.length;
          
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStaff(row.original);
                  setMedicalCentersViewModalOpen(true);
                }}
                startIcon={<AssignmentIcon />}
                sx={{ minWidth: 'auto' }}
              >
                {count}
              </Button>
              {medicalCenters.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  {t('centers')}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: t('Creation Information'),
        size: 200,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const createdAt = row.original.created_at;
          const creatorName = row.original.creator || 
                             row.original.creator_info?.name || 
                             row.original.created_by_user?.name || 
                             'N/A';
          
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                {creatorName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                {toJapaneseDate(createdAt)}
              </Typography>
            </Box>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: t('Actions'),
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const canEdit = canEditStaff(row.original);
          const canDelete = canDeleteStaff(row.original);
          const canAssign = canAssignMedicalCenters(row.original);
          
          // Show actions menu only if user has at least one permission
          const showActions = canEdit || canDelete || canAssign;
          
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {showActions ? (
                <IconButton
                  size="small"
                  onClick={(event) => handleMenuOpen(event, row)}
                >
                  <MoreVertIcon />
                </IconButton>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('No actions')}
                </Typography>
              )}
            </Box>
          );
        },
      },
    ],
    [validationErrors, t, pagination.pageIndex, pagination.pageSize, currentUser]
  );

  // Build filter payload
  const buildFilterPayload = () => {
    let f_columnFilters = {};
    let f_globalFilters = null;

    if (columnFilters.length > 0) {
      columnFilters.forEach(filter => {
        if (filter.id === 'name' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'phone' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'email' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'role' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        }
      });
    }

    if (globalFilter) {
      const globalFilterConditions = [
        { name: { contains: globalFilter } },
        { phone: { contains: globalFilter } },
        { email: { contains: globalFilter } },
        { role: { contains: globalFilter } }
      ].filter(condition => {
        const key = Object.keys(condition)[0];
        return !f_columnFilters[key];
      });

      if (globalFilterConditions.length > 0) {
        f_globalFilters = { OR: globalFilterConditions };
      }
    }

    // Add hospital_id filter if filterByMedicalCenter is checked and hospital exists
    const hospitalFilter = filterByMedicalCenter && hospital?.id ? { hospital_id: hospital.id } : {};

    return {
      f_columnFilters,
      globalFilter: globalFilter || "",
      f_globalFilters,
      hospitalFilter,
      others: { 
        ...props.filter?.others,
         // Add hospital filter if applicable
      }
    };
  };

  const { data: { data: tableData = [], pagination: serverPagination = {} } = {}, isError, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ['staff', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter, filterByMedicalCenter, hospital?.id],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'asc',
        filter: filterPayload
      };

      const response = await axios.post(apiConfig.hospitalStaffManageList, payload);
      return response.data;
    },
  });

  // Auto refetch after mutations
  const handleMutationSuccess = () => {
    queryClient.invalidateQueries(['staff']);
    refetch();
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.hospitalStaffManageCreate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true) {
        dispatch(showMessage({ message: t('Staff created successfully'), variant: 'success' }));
      } else if (data.message && data.message.includes('Created Successful')) {
        dispatch(showMessage({ message: t('Staff created successfully'), variant: 'success' }));
      }
      
      props.setCreateModalOpen(false);
    },
    onError: (error) => {
      console.error('Error creating staff:', error);
      const errorMessage = error.response?.data?.message || t('Error creating staff');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.hospitalStaffManageUpdate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Updated Successful')) {
        dispatch(showMessage({ message: t('Staff updated successfully'), variant: 'success' }));
      }
      
      setEditModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating staff:', error);
      const errorMessage = error.response?.data?.message || t('Error updating staff');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (email) => {
      const response = await axios.post(apiConfig.hospitalStaffManageRemove, { email });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Deleted Successful')) {
        dispatch(showMessage({ message: t('Staff deleted successfully'), variant: 'success' }));
      }
      
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error deleting staff');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const assignMedicalCentersMutation = useMutation({
    mutationFn: async ({ admin_id, medical_center_ids }) => {
      const response = await axios.post(apiConfig.hospitalStaffManageAssignMedicalCenters, { admin_id, medical_center_ids });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Assigned Successful')) {
        dispatch(showMessage({ message: t('Medical centers assigned successfully'), variant: 'success' }));
      }
      
      setAssignMedicalCentersModalOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error assigning medical centers');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const handleCreateStaff = (staffData) => {
    createMutation.mutate(staffData);
  };

  const handleEditStaff = (data) => {
    updateMutation.mutate(data);
  };

  const handleAssignMedicalCenters = (data) => {
    assignMedicalCentersMutation.mutate(data);
  };

  const handleDeleteClick = (row) => {
    setSelectedStaff(row.original);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedStaff) {
      deleteMutation.mutate(selectedStaff.email);
    }
  };

  const handleEditClick = (row) => {
    setSelectedStaff(row.original);
    setEditModalOpen(true);
  };

  const handleAssignMedicalCentersClick = (row) => {
    setSelectedStaff(row.original);
    setAssignMedicalCentersModalOpen(true);
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleFilterByMedicalCenterChange = (event) => {
    setFilterByMedicalCenter(event.target.checked);
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
  });

  // Check if user can see the medical center filter
  const canSeeMedicalCenterFilter = ['superAdmin', 'admin'].includes(currentUser?.role);

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
        {selectedRow && canEditStaff(selectedRow.original) && (
          <MenuItem 
            onClick={() => {
              handleEditClick(selectedRow);
              handleMenuClose();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            {t('Edit')}
          </MenuItem>
        )}
        {selectedRow && canAssignMedicalCenters(selectedRow.original) && (
          <MenuItem 
            onClick={() => {
              handleAssignMedicalCentersClick(selectedRow);
              handleMenuClose();
            }}
          >
            <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            {t('Assign Medical Centers')}
          </MenuItem>
        )}
        {selectedRow && canDeleteStaff(selectedRow.original) && (
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
        )}
      </Menu>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('Confirm Delete')}
        message={`${t('Are you sure you want to delete')} "${selectedStaff?.name}"? ${t('This action cannot be undone')}.`}
        confirmText={t('Delete')}
      />

      {/* Medical Centers View Modal */}
      <MedicalCentersViewModal
        open={medicalCentersViewModalOpen}
        onClose={() => setMedicalCentersViewModalOpen(false)}
        staff={selectedStaff}
        onAssign={() => {
          setMedicalCentersViewModalOpen(false);
          setAssignMedicalCentersModalOpen(true);
        }}
      />

      {/* Create Modal */}
      <CreateStaffModal
        open={props.createModalOpen}
        onClose={() => props.setCreateModalOpen(false)}
        onSubmit={handleCreateStaff}
        isLoading={createMutation.isLoading}
        mutationError={createMutation.error}
        medicalCenters={medicalCentersData?.data || []}
        creatableRoles={props.creatableRoles}
        key={props.createModalOpen ? 'create-modal-open' : 'create-modal-closed'}
      />

      {/* Edit Modal */}
      <EditStaffModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditStaff}
        staff={selectedStaff}
        isLoading={updateMutation.isLoading}
        mutationError={updateMutation.error}
        creatableRoles={props.creatableRoles}
      />

      {/* Assign Medical Centers Modal */}
      <AssignMedicalCentersModal
        open={assignMedicalCentersModalOpen}
        onClose={() => setAssignMedicalCentersModalOpen(false)}
        onSubmit={handleAssignMedicalCenters}
        staff={selectedStaff}
        isLoading={assignMedicalCentersMutation.isLoading}
        mutationError={assignMedicalCentersMutation.error}
        medicalCenters={medicalCentersData?.data || []}
        key={assignMedicalCentersModalOpen ? 'assign-modal-open' : 'assign-modal-closed'}
      />
    </div>
  );
};

// Create Staff Modal Component
const CreateStaffModal = ({ open, onClose, onSubmit, isLoading, mutationError, medicalCenters, creatableRoles }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    role: creatableRoles[0] || 'operator',
    medical_center_ids: [] 
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Role options with translations - only show creatable roles
  const roleOptions = [
    { value: 'operator', label: t('Data Input Person') },
    { value: 'staff', label: t('Manager') },
    { value: 'hospitalAssistant', label: t('Head Manager') },
    { value: 'admin', label: t('Chief Executive') },
    { value: 'superAdmin', label: t('System Administrator') }
  ].filter(option => creatableRoles.includes(option.value));

  useEffect(() => {
    if (open) {
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        password: '',
        role: creatableRoles[0] || 'operator',
        medical_center_ids: [] 
      });
      setErrors({});
      setApiError('');
    }
  }, [open, creatableRoles]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating staff');
      
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('email')) {
        setApiError(t('Staff with this email already exists'));
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
    if (!formData.email.trim()) {
      newErrors.email = t('This field is Required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('Invalid email format');
    }
    if (!formData.password.trim()) {
      newErrors.password = t('This field is Required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('Password must be at least 6 characters');
    }
    if (!formData.role) {
      newErrors.role = t('This field is Required');
    }
    if (formData.medical_center_ids.length === 0) {
      newErrors.medical_center_ids = t('At least one medical center is required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleClose = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      password: '',
      role: creatableRoles[0] || 'operator',
      medical_center_ids: [] 
    });
    setErrors({});
    setApiError('');
    onClose();
  };

  const dialogContent = (
    <div className="flex flex-col gap-4">
      {/* Name and Email in same row */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Name')} *
            </Typography>
            <TextField
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              placeholder={t('Enter staff name')}
              disabled={isLoading}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Email')} *
            </Typography>
            <TextField
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              error={!!errors.email}
              helperText={errors.email}
              placeholder={t('Enter email address')}
              disabled={isLoading}
            />
          </div>
        </Grid>
      </Grid>

      {/* Phone and Password in same row */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Phone')}
            </Typography>
            <TextField
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder={t('Enter phone number')}
              disabled={isLoading}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Password')} *
            </Typography>
            <TextField
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              fullWidth
              error={!!errors.password}
              helperText={errors.password}
              placeholder={t('Enter password (minimum 6 characters)')}
              disabled={isLoading}
            />
          </div>
        </Grid>
      </Grid>

      {/* Role Selection */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Staff Role')} *
        </Typography>
        <FormControl fullWidth error={!!errors.role}>
          <Select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            disabled={isLoading}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.role && (
            <FormHelperText>{errors.role}</FormHelperText>
          )}
        </FormControl>
      </div>

      {/* Medical Centers - Required Field */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Medical Centers')} *
        </Typography>
        <Autocomplete
          multiple
          options={medicalCenters}
          getOptionLabel={(option) => option.name}
          value={medicalCenters.filter(mc => formData.medical_center_ids.includes(mc.id))}
          onChange={(event, newValue) => {
            handleChange('medical_center_ids', newValue.map(mc => mc.id));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('Select medical centers')}
              error={!!errors.medical_center_ids}
              helperText={errors.medical_center_ids || t('Select at least one medical center')}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
                size="small"
              />
            ))
          }
          disabled={isLoading}
        />
      </div>

      {apiError && (
        <Alert severity="error" sx={{ px: 0 }}>
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
        {isLoading ? t('Creating...') : t('Create Staff')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={t('Create Staff')}
      actions={dialogActions}
      disabled={isLoading}
      maxWidth="md"
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Edit Staff Modal Component
const EditStaffModal = ({ open, onClose, onSubmit, staff, isLoading, mutationError, creatableRoles }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Role options with translations - only show creatable roles and current role
  const roleOptions = [
    { value: 'operator', label: t('Data Input Person') },
    { value: 'staff', label: t('Manager') },
    { value: 'hospitalAssistant', label: t('Head Manager') },
    { value: 'admin', label: t('Chief Executive') },
    { value: 'superAdmin', label: t('System Administrator') }
  ].filter(option => 
    creatableRoles.includes(option.value) || option.value === staff?.role
  );

  useEffect(() => {
    if (staff && open) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        password: '',
        role: staff.role || 'staff'
      });
      setApiError('');
    }
  }, [staff, open]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating staff');
      setApiError(errorMessage);
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('This field is Required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('This field is Required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('Invalid email format');
    }
    if (!formData.role) {
      newErrors.role = t('This field is Required');
    }
    // Password is optional in edit, but if provided, must be at least 6 characters
    if (formData.password && formData.password.length < 6) {
      newErrors.password = t('Password must be at least 6 characters');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    // Only include password if it was changed
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }

    onSubmit({ ...submitData, id: staff.id });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'staff' });
    setErrors({});
    setApiError('');
    onClose();
  };

  if (!staff) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      {/* Name and Email in same row */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Name')} *
            </Typography>
            <TextField
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              placeholder={t('Enter staff name')}
              disabled={isLoading}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Email')} *
            </Typography>
            <TextField
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              error={!!errors.email}
              helperText={errors.email}
              placeholder={t('Enter email address')}
              disabled={isLoading}
            />
          </div>
        </Grid>
      </Grid>

      {/* Phone and Password in same row */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Phone')}
            </Typography>
            <TextField
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder={t('Enter phone number')}
              disabled={isLoading}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Password')}
            </Typography>
            <TextField
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              fullWidth
              error={!!errors.password}
              helperText={errors.password || t('Leave blank to keep current password. Minimum 6 characters if changing.')}
              placeholder={t('Enter new password (minimum 6 characters)')}
              disabled={isLoading}
            />
          </div>
        </Grid>
      </Grid>

      {/* Role Selection */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Staff Role')} *
        </Typography>
        <FormControl fullWidth error={!!errors.role}>
          <Select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            disabled={isLoading}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.role && (
            <FormHelperText>{errors.role}</FormHelperText>
          )}
        </FormControl>
      </div>

      {apiError && (
        <Alert severity="error" sx={{ px: 0 }}>
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
        {isLoading ? t('Updating...') : t('Update Staff')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={t('Edit Staff')}
      maxWidth="md"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Assign Medical Centers Modal Component
const AssignMedicalCentersModal = ({ open, onClose, onSubmit, staff, isLoading, mutationError, medicalCenters }) => {
  const { t } = useTranslation('shared-components');
  const [selectedMedicalCenters, setSelectedMedicalCenters] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (staff && open) {
      // Get currently assigned medical center IDs from the staff data
      const currentMedicalCenterIds = staff.medical_centers?.map(mc => mc.id) || 
                                     staff.assigned_medicals?.map(mc => mc.id) || 
                                     staff.assigned_medical_centers?.map(mc => mc.id) || [];
      
      // Filter medical centers to get the actual objects
      const currentlyAssigned = medicalCenters.filter(mc => 
        currentMedicalCenterIds.includes(mc.id)
      );
      
      setSelectedMedicalCenters(currentlyAssigned);
      setErrors({});
      setApiError('');
    }
  }, [staff, open, medicalCenters]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error assigning medical centers');
      setApiError(errorMessage);
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = {};
    if (selectedMedicalCenters.length === 0) {
      newErrors.medical_centers = t('At least one medical center is required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    const medical_center_ids = selectedMedicalCenters.map(mc => mc.id);
    onSubmit({ admin_id: staff.id, medical_center_ids });
  };

  const handleClose = () => {
    setSelectedMedicalCenters([]);
    setErrors({});
    setApiError('');
    onClose();
  };

  if (!staff) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      <Typography variant="body1">
        {t('Assign medical centers to')} <strong>{staff.name}</strong>
      </Typography>

      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Medical Centers')} *
        </Typography>
        <Autocomplete
          multiple
          options={medicalCenters}
          getOptionLabel={(option) => option.name}
          value={selectedMedicalCenters}
          onChange={(event, newValue) => {
            setSelectedMedicalCenters(newValue);
            if (errors.medical_centers) {
              setErrors(prev => ({ ...prev, medical_centers: '' }));
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('Select medical centers')}
              error={!!errors.medical_centers}
              helperText={errors.medical_centers || t('Select at least one medical center')}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))
          }
          disabled={isLoading}
        />
        <Typography variant="caption" color="text.secondary">
          {t('Currently selected')}: {selectedMedicalCenters.length} {t('centers')}
        </Typography>
      </div>

      {apiError && (
        <Alert severity="error" sx={{ px: 0 }}>
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
        {isLoading ? t('Assigning...') : t('Assign Medical Centers')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={t('Assign Medical Centers')}
      maxWidth="sm"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Medical Centers View Modal Component
const MedicalCentersViewModal = ({ open, onClose, staff, onAssign }) => {
  const { t } = useTranslation('shared-components');

  if (!staff) return null;

  const medicalCenters = staff.medical_centers || staff.assigned_medicals || staff.assigned_medical_centers || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('Medical Centers for')} {staff.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {medicalCenters.length > 0 ? (
            medicalCenters.map((mc, index) => (
              <Box
                key={mc.id || index}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {mc.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {mc.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mc.address}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mc.type}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              {t('No medical centers assigned')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('Close')}
        </Button>
        <Button onClick={onAssign} variant="contained" color="primary">
          {t('Assign Medical Centers')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Staff;