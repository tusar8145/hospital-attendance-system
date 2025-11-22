// Doctor.js
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

// Import shared components
import { CommonHeader } from '../../../shared-components/new/CommonHeader';
import { ConfirmationDialog } from '../../../shared-components/new/ConfirmationDialog';
import { CommonDialog } from '../../../shared-components/new/CommonDialog';
import { toJapaneseDate } from '../../../shared-components/new/dateHelpers';
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

function Doctor() {
  return (
    <QueryClientProvider client={queryClient}>
      <DoctorContent />
    </QueryClientProvider>
  );
}

function DoctorContent() {
  let user = User();
  let tableName = 'doctors';
  let headingTitle = 'Doctor List';

  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const { theme, toggleTheme } = useTheme();

  const [globalFilter, setGlobalFilter] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    toggleTheme(t(headingTitle));
  }, [t(headingTitle)]);

  const handleFilterType = (type) => {
    setFilterType(type);
  };

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
          createButtonText="Add Doctor"
        />
      }
      content={
        <div className="flex flex-col items-center p-24 sm:p-40 container">
          {successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
          {failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}

          <div className="w-full min-w-0 py-24">
            <DoctorTable
              filter={buildFilter()}
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

export default Doctor;

// Doctor Table Component Implementation
const DoctorTable = (props) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shared-components');
  const dispatch = useAppDispatch();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignDepartmentsModalOpen, setAssignDepartmentsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
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

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.post(apiConfig.departmentList, {
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
        accessorKey: 'license_no',
        header: t("First Name"),
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
        accessorKey: 'name',
        header: t('Last Name'),
        size: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'medical_center.name',
        header: t('Hospital/Facility'),
        size: 200,
        enableColumnFilter: true,
        Cell: ({ cell }) => cell.getValue() || 'N/A',
      },
      {
        accessorKey: 'dept_links',
        header: t('Clinical Department'),
        size: 250,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const departments = cell.getValue() || [];
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {departments.length > 0 ? (
                departments.map((link, index) => (
                  <Chip
                    key={link.id}
                    label={link.department?.name}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('No departments assigned')}
                </Typography>
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
        size: 120,
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

  // Build filter payload
  const buildFilterPayload = () => {
    let f_columnFilters = {};
    let f_globalFilters = null;

    if (columnFilters.length > 0) {
      columnFilters.forEach(filter => {
        if (filter.id === 'name' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'license_no' && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        } else if (filter.id === 'medical_center.name' && filter.value && filter.value !== '') {
          f_columnFilters['medical_center'] = { name: { contains: filter.value } };
        }
      });
    }

    if (globalFilter) {
      const globalFilterConditions = [
        { name: { contains: globalFilter } },
        { license_no: { contains: globalFilter } },
        { medical_center: { name: { contains: globalFilter } } }
      ].filter(condition => {
        const key = Object.keys(condition)[0];
        return !f_columnFilters[key];
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
    queryKey: ['doctors', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'asc',
        filter: filterPayload
      };

      const response = await axios.post(apiConfig.doctorList, payload);
      return response.data;
    },
  });

  // Auto refetch after mutations
  const handleMutationSuccess = () => {
    queryClient.invalidateQueries(['doctors']);
    refetch();
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.doctorCreate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true) {
        if (Array.isArray(data.data)) {
          dispatch(showMessage({ message: t('{count} doctors created successfully', { count: data.data.length }), variant: 'success' }));
        } else {
          dispatch(showMessage({ message: t('Doctor created successfully'), variant: 'success' }));
        }
      } else if (data.message && data.message.includes('Created Successful')) {
        dispatch(showMessage({ message: t('Doctor created successfully'), variant: 'success' }));
      }
      
      props.setCreateModalOpen(false);
    },
    onError: (error) => {
      console.error('Error creating doctor:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.doctorUpdate, data);
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Updated Successful')) {
        dispatch(showMessage({ message: t('Doctor updated successfully'), variant: 'success' }));
      }
      
      setEditModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating doctor:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.post(apiConfig.doctorRemove, { id });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Deleted Successful')) {
        dispatch(showMessage({ message: t('Doctor deleted successfully'), variant: 'success' }));
      }
      
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error deleting doctor');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.post(apiConfig.doctorStatus, { id, status: status === 1 ? 0 : 1 });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
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

  const assignDepartmentsMutation = useMutation({
    mutationFn: async ({ doctor_id, department_ids }) => {
      const response = await axios.post(apiConfig.doctorAssignDepartments, { doctor_id, department_ids });
      return response.data;
    },
    onSuccess: (data) => {
      handleMutationSuccess();
      
      if (data.success === "true" || data.success === true || data.message?.includes('Assigned Successful')) {
        dispatch(showMessage({ message: t('Departments assigned successfully'), variant: 'success' }));
      }
      
      setAssignDepartmentsModalOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || t('Error assigning departments');
      dispatch(showMessage({ message: errorMessage, variant: 'error' }));
    },
  });

  const handleCreateDoctors = (doctors) => {
    if (Array.isArray(doctors)) {
      const createPromises = doctors.map(doctor => 
        createMutation.mutateAsync(doctor)
      );
      
      Promise.all(createPromises)
        .then(() => {
          // Success handled in individual mutations
        })
        .catch(error => {
          console.error('Error creating doctors:', error);
        });
    } else {
      createMutation.mutate(doctors);
    }
  };

  const handleEditDoctor = (data) => {
    updateMutation.mutate(data);
  };

  const handleAssignDepartments = (data) => {
    assignDepartmentsMutation.mutate(data);
  };

  const handleStatusClick = (doctor) => {
    setSelectedDoctor(doctor);
    setStatusConfirmOpen(true);
  };

  const handleStatusConfirm = () => {
    if (selectedDoctor) {
      statusMutation.mutate({ 
        id: selectedDoctor.id, 
        status: selectedDoctor.status 
      });
    }
  };

  const handleDeleteClick = (row) => {
    setSelectedDoctor(row.original);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDoctor) {
      deleteMutation.mutate(selectedDoctor.id);
    }
  };

  const handleEditClick = (row) => {
    setSelectedDoctor(row.original);
    setEditModalOpen(true);
  };

  const handleAssignDepartmentsClick = (row) => {
    setSelectedDoctor(row.original);
    setAssignDepartmentsModalOpen(true);
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
            handleAssignDepartmentsClick(selectedRow);
            handleMenuClose();
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          {t('Assign Departments')}
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
        message={`Are you sure you want to delete "${selectedDoctor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      <ConfirmationDialog
        open={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleStatusConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status of "${selectedDoctor?.name}" to ${selectedDoctor?.status === 1 ? 'Inactive' : 'Active'}?`}
        confirmText="Change Status"
        confirmColor="primary"
      />

      {/* Create Modal */}
      <CreateDoctorModal
        open={props.createModalOpen}
        onClose={() => props.setCreateModalOpen(false)}
        onSubmit={handleCreateDoctors}
        isLoading={createMutation.isLoading}
        mutationError={createMutation.error}
        medicalCenters={medicalCentersData?.data || []}
        departments={departmentsData?.data || []}
        key={props.createModalOpen ? 'create-modal-open' : 'create-modal-closed'}
      />

      {/* Edit Modal */}
      <EditDoctorModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditDoctor}
        doctor={selectedDoctor}
        isLoading={updateMutation.isLoading}
        mutationError={updateMutation.error}
        medicalCenters={medicalCentersData?.data || []}
      />

      {/* Assign Departments Modal */}
      <AssignDepartmentsModal
        open={assignDepartmentsModalOpen}
        onClose={() => setAssignDepartmentsModalOpen(false)}
        onSubmit={handleAssignDepartments}
        doctor={selectedDoctor}
        isLoading={assignDepartmentsMutation.isLoading}
        mutationError={assignDepartmentsMutation.error}
        departments={departmentsData?.data || []}
      />
    </div>
  );
};

// Create Doctor Modal Component
const CreateDoctorModal = ({ open, onClose, onSubmit, isLoading, mutationError, medicalCenters, departments }) => {
  const { t } = useTranslation('shared-components');
  const [doctors, setDoctors] = useState([{ name: '', license_no: '', medical_center_id: '', department_ids: [] }]);
  const [errors, setErrors] = useState([]);
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [lastSelectedHospital, setLastSelectedHospital] = useState('');

  useEffect(() => {
    if (open) {
      setDoctors([{ name: '', license_no: '', medical_center_id: '', department_ids: [] }]);
      setErrors([]);
      setDuplicateErrors({});
      setApiError('');
      setLastSelectedHospital('');
    }
  }, [open]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating doctor');
      
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('license_no')) {
        setApiError(t('Doctor already exists'));
      } else {
        setApiError(errorMessage);
      }
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = doctors.map((doctor, index) => {
      const fieldErrors = {};
      if (!doctor.name.trim()) {
        fieldErrors.name = t('This field is Required');
      } else if (doctor.name.trim().length < 3) {
        fieldErrors.name = t('Name must be at least 3 characters');
      }
      if (!doctor.license_no.trim()) {
        fieldErrors.license_no = t('This field is Required');
      } else if (doctor.license_no.trim().length < 3) {
        fieldErrors.license_no = t('Last name must be at least 3 characters');
      }
      if (!doctor.medical_center_id) {
        fieldErrors.medical_center_id = t('This field is Required');
      }
      return fieldErrors;
    });

    setErrors(newErrors);
    return newErrors.every(error => Object.keys(error).length === 0);
  };

  const checkForDuplicates = () => {
    const licenseCount = {};
    const newDuplicateErrors = {};
    
    doctors.forEach((doctor, index) => {
      if (doctor.license_no.trim()) {
        const normalizedLicense = doctor.license_no.trim().toLowerCase();
        if (!licenseCount[normalizedLicense]) {
          licenseCount[normalizedLicense] = [];
        }
        licenseCount[normalizedLicense].push(index);
      }
    });

    Object.keys(licenseCount).forEach(license => {
      if (licenseCount[license].length > 1) {
        licenseCount[license].forEach(index => {
          newDuplicateErrors[index] = { license_no: t('Duplicate license number in this form') };
        });
      }
    });

    setDuplicateErrors(newDuplicateErrors);
    return Object.keys(newDuplicateErrors).length === 0;
  };

  const handleSubmit = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    if (!checkForDuplicates()) {
      return;
    }

    const validDoctors = doctors.filter(doctor => 
      doctor.name.trim() !== '' && 
      doctor.license_no.trim() !== '' && 
      doctor.medical_center_id !== ''
    );
    
    if (validDoctors.length === 0) {
      return;
    }

    onSubmit(validDoctors.length === 1 ? validDoctors[0] : validDoctors);
  };

  const addDoctor = () => {
    const newDoctor = { 
      name: '', 
      license_no: '', 
      medical_center_id: lastSelectedHospital || '', 
      department_ids: [] 
    };
    setDoctors([...doctors, newDoctor]);
    setErrors([...errors, {}]);
  };

  const updateDoctor = (index, field, value) => {
    const updated = [...doctors];
    updated[index][field] = value;
    setDoctors(updated);

    // Update last selected hospital when hospital is selected
    if (field === 'medical_center_id' && value) {
      setLastSelectedHospital(value);
    }

    if (errors[index]?.[field]) {
      const updatedErrors = [...errors];
      delete updatedErrors[index][field];
      setErrors(updatedErrors);
    }

    if (duplicateErrors[index]?.[field]) {
      const updatedDuplicateErrors = { ...duplicateErrors };
      delete updatedDuplicateErrors[index][field];
      setDuplicateErrors(updatedDuplicateErrors);
    }

    if (apiError) {
      setApiError('');
    }
  };

  const removeDoctor = (index) => {
    if (doctors.length > 1) {
      setDoctors(doctors.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
      
      const updatedDuplicateErrors = { ...duplicateErrors };
      delete updatedDuplicateErrors[index];
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
    setDoctors([{ name: '', license_no: '', medical_center_id: '', department_ids: [] }]);
    setErrors([]);
    setDuplicateErrors({});
    setApiError('');
    setLastSelectedHospital('');
    onClose();
  };

  const dialogContent = (
    <div className="flex flex-col gap-8">
      {doctors.map((doctor, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 border border-gray-200 p-6 rounded-lg relative bg-gray-50"
        >
          {/* Name and Last Name in same row */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <div className="flex flex-col gap-1">
                <Typography variant="subtitle1" className="font-medium">
                  {t('Last Name')} *
                </Typography>
                <TextField
                  value={doctor.license_no}
                  onChange={(e) => updateDoctor(index, 'license_no', e.target.value)}
                  fullWidth
                  error={!!errors[index]?.license_no || !!duplicateErrors[index]?.license_no}
                  helperText={errors[index]?.license_no || duplicateErrors[index]?.license_no}
                  placeholder={t('Enter last name')}
                  disabled={isLoading}
                />
              </div>
            </Grid>
            <Grid item xs={6}>
              <div className="flex flex-col gap-1">
                <Typography variant="subtitle1" className="font-medium">
                  {t("First Name")} *
                </Typography>
                <TextField
                  value={doctor.name}
                  onChange={(e) => updateDoctor(index, 'name', e.target.value)}
                  fullWidth
                  error={!!errors[index]?.name}
                  helperText={errors[index]?.name}
                  placeholder={t('Enter first name')}
                  disabled={isLoading}
                />
              </div>
            </Grid>
          </Grid>

          {/* Hospital/Facility and Clinical Department in same row */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <div className="flex flex-col gap-1">
                <Typography variant="subtitle1" className="font-medium">
                  {t('Hospital/Facility')} *
                </Typography>
                <FormControl fullWidth error={!!errors[index]?.medical_center_id}>
                  <Select
                    value={doctor.medical_center_id}
                    onChange={(e) => updateDoctor(index, 'medical_center_id', e.target.value)}
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
            <Grid item xs={6}>
              <div className="flex flex-col gap-1">
                <Typography variant="subtitle1" className="font-medium">
                  {t('Clinical Department')}
                </Typography>
                <Autocomplete
                  multiple
                  options={departments}
                  getOptionLabel={(option) => option.name}
                  value={departments.filter(dept => doctor.department_ids.includes(dept.id))}
                  onChange={(event, newValue) => {
                    updateDoctor(index, 'department_ids', newValue.map(dept => dept.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('Select clinical departments')}
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
            </Grid>
          </Grid>

          {doctors.length > 1 && (
            <IconButton
              className="absolute top-2 right-2"
              onClick={() => removeDoctor(index)}
              color="error"
              size="small"
              disabled={isLoading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      ))}

      {apiError && (
        <Alert severity="error" sx={{ px: 0 }}>
          {apiError}
        </Alert>
      )}

      <div className="flex justify-center pt-4">
        <Button
          startIcon={<AddIcon />}
          onClick={addDoctor}
          variant="outlined"
          disabled={isLoading}
        >
          {t('Add Another Doctor')}
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
        {isLoading ? t('Creating...') : `${t('Create Doctor')}${doctors.length > 1 ? 's' : ''}`}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={`Create Doctor${doctors.length > 1 ? 's' : ''}`}
      actions={dialogActions}
      disabled={isLoading}
      maxWidth="lg"
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Edit Doctor Modal Component
const EditDoctorModal = ({ open, onClose, onSubmit, doctor, isLoading, mutationError, medicalCenters }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ name: '', license_no: '', medical_center_id: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (doctor && open) {
      setFormData({
        name: doctor.name || '',
        license_no: doctor.license_no || '',
        medical_center_id: doctor.medical_center_id || ''
      });
      setApiError('');
    }
  }, [doctor, open]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating doctor');
      
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('license_no')) {
        setApiError(t('Doctor already exists'));
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
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t('Name must be at least 3 characters');
    }
    if (!formData.license_no.trim()) {
      newErrors.license_no = t('This field is Required');
    } else if (formData.license_no.trim().length < 3) {
      newErrors.license_no = t('Last name must be at least 3 characters');
    }
    if (!formData.medical_center_id) {
      newErrors.medical_center_id = t('This field is Required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    onSubmit({ ...formData, id: doctor.id });
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
    setFormData({ name: '', license_no: '', medical_center_id: '' });
    setErrors({});
    setApiError('');
    onClose();
  };

  if (!doctor) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      {/* Name and Last Name in same row */}
      <Grid container spacing={2}>
                <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t('Last Name')} *
            </Typography>
            <TextField
              value={formData.license_no}
              onChange={(e) => handleChange('license_no', e.target.value)}
              fullWidth
              error={!!errors.license_no}
              helperText={errors.license_no}
              placeholder={t('Enter last name')}
              disabled={isLoading}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle1" className="font-medium">
              {t("First Name")} *
            </Typography>
            <TextField
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
              placeholder={t('Enter first name')}
              disabled={isLoading}
            />
          </div>
        </Grid>

      </Grid>

      {/* Hospital/Facility */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Hospital/Facility')} *
        </Typography>
        <FormControl fullWidth error={!!errors.medical_center_id}>
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
        {isLoading ? t('Updating...') : t('Update Doctor')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Edit Doctor"
      maxWidth="sm"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Assign Departments Modal Component
const AssignDepartmentsModal = ({ open, onClose, onSubmit, doctor, isLoading, mutationError, departments }) => {
  const { t } = useTranslation('shared-components');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (doctor && open) {
      // Set currently assigned departments
      const currentDepartmentIds = doctor.dept_links?.map(link => link.department_id) || [];
      setSelectedDepartments(departments.filter(dept => currentDepartmentIds.includes(dept.id)));
      setApiError('');
    }
  }, [doctor, open, departments]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error assigning departments');
      setApiError(errorMessage);
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const handleSubmit = () => {
    setApiError('');
    const department_ids = selectedDepartments.map(dept => dept.id);
    onSubmit({ doctor_id: doctor.id, department_ids });
  };

  const handleClose = () => {
    setSelectedDepartments([]);
    setApiError('');
    onClose();
  };

  if (!doctor) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      <Typography variant="body1">
        {t('Assign departments to')} <strong>{doctor.name}</strong>
      </Typography>

      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Clinical Department')}
        </Typography>
        <Autocomplete
          multiple
          options={departments}
          getOptionLabel={(option) => option.name}
          value={selectedDepartments}
          onChange={(event, newValue) => {
            setSelectedDepartments(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('Select clinical departments')}
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
        {isLoading ? t('Assigning...') : t('Assign Departments')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Assign Departments"
      maxWidth="sm"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};