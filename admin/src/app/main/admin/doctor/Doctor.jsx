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
  Tooltip,
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

  // Fetch departments for dropdown - only active ones (status: 1) - without hospital filter for initial load
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.post(apiConfig.departmentList, {
        page: 1,
        perPage: 1000,
        filter: {
          f_columnFilters: { status: { equals: 1 } }, // Only active departments
          globalFilter: "",
          f_globalFilters: null,
          others: {}
        }
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
        accessorKey: 'dept_links',
        header: t('Clinical Department'),
        size: 250,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const departments = cell.getValue() || [];
          // Filter out inactive departments (status: 0)
          const activeDepartments = departments.filter(link => 
            link.department?.status === 1
          );
          
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {activeDepartments.length > 0 ? (
                activeDepartments.map((link, index) => (
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
                  {t('No active departments assigned')}
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

  // Build filter payload - Updated structure
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

    // Add hospital_id to the main filter object automatically when hospital is selected
    const hospital_id = hospital?.id || null;

    return {
      f_columnFilters,
      globalFilter: globalFilter || "",
      f_globalFilters,
      others: props.filter?.others || null,
      hospital_id // Add hospital_id at the root level of filter automatically
    };
  };

  const { data: { data: tableData = [], pagination: serverPagination = {} } = {}, isError, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ['doctors', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter, hospital?.id],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
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
        props.setCreateModalOpen(false);
      } else if (data.message && data.message.includes('Created Successful')) {
        dispatch(showMessage({ message: t('Doctor created successfully'), variant: 'success' }));
        props.setCreateModalOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error creating doctor:', error);
      // Don't close the modal on error - let the user fix the issue
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
        setEditModalOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error updating doctor:', error);
      // Don't close the modal on error
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
      const createPromises = doctors.map(async doctor => 
        await createMutation.mutateAsync(doctor)
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
        {/*<MenuItem 
          onClick={() => {
            handleAssignDepartmentsClick(selectedRow);
            handleMenuClose();
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          {t('Assign Departments')}
        </MenuItem>*/}
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
        hospital={hospital}
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
        departments={departmentsData?.data || []}
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

// Doctor.jsx - Updated sections for room selection

// Doctor.jsx - Updated sections for room selection

// Update the CreateDoctorModal component
// Doctor.jsx - Updated sections for multiple room selection

// Update the CreateDoctorModal component
const CreateDoctorModal = ({ open, onClose, onSubmit, isLoading, mutationError, medicalCenters, departments, hospital }) => {
  const { t } = useTranslation('shared-components');
  const [doctors, setDoctors] = useState([{ 
    name: '', 
    license_no: '', 
    medical_center_id: '', 
    department_rooms: [] 
  }]);
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const [lastSelectedHospital, setLastSelectedHospital] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [hospitalSelectionError, setHospitalSelectionError] = useState('');

  // Filter departments based on selected medical center
  const filterDepartmentsByMedicalCenter = (medicalCenterId) => {
    if (!medicalCenterId) {
      setFilteredDepartments([]);
      return;
    }
    
    // Filter departments by medical_center_id and ensure they're active
    const filtered = departments.filter(dept => 
      dept.medical_center_id === parseInt(medicalCenterId) && dept.status === 1
    );
    
    console.log('Filtered departments for medical center', medicalCenterId, filtered);
    setFilteredDepartments(filtered);
  };

  // Get rooms for a department from the department data
  const getRoomsForDepartment = (departmentId) => {
    const department = filteredDepartments.find(dept => dept.id === departmentId);
    // Check both department_room array and _count.department_room
    const rooms = department?.department_room || [];
    console.log('Rooms for department', departmentId, rooms);
    return rooms;
  };

  // Check if a department has rooms
  const departmentHasRooms = (departmentId) => {
    const rooms = getRoomsForDepartment(departmentId);
    return rooms && rooms.length > 0;
  };

  // Handle department selection change
  const handleDepartmentChange = (index, selectedDepts) => {
    const updated = [...doctors];
    
    // Get current department_rooms
    const currentDepartmentRooms = updated[index].department_rooms || [];
    
    // Create a map of existing selections (department_id -> array of room_ids)
    const existingSelections = {};
    currentDepartmentRooms.forEach(item => {
      if (!existingSelections[item.department_id]) {
        existingSelections[item.department_id] = [];
      }
      if (item.room_id) {
        existingSelections[item.department_id].push(item.room_id);
      }
    });

    // Update with new selections
    const newDepartmentRooms = [];
    
    for (const dept of selectedDepts) {
      const deptId = dept.id;
      
      // If this department was previously selected, keep its room selections
      if (existingSelections[deptId] && existingSelections[deptId].length > 0) {
        existingSelections[deptId].forEach(roomId => {
          newDepartmentRooms.push({
            department_id: deptId,
            room_id: roomId
          });
        });
      } else {
        // New department selection, add without rooms initially
        // Only add if department has rooms? No, always add department even without rooms
        newDepartmentRooms.push({
          department_id: deptId,
          room_id: null
        });
      }
    }
    
    updated[index].department_rooms = newDepartmentRooms;
    setDoctors(updated);
  };

  // Handle multiple room selection change
  const handleRoomChange = (index, departmentId, selectedRoomIds) => {
    const updated = [...doctors];
    const departmentRooms = updated[index].department_rooms || [];
    
    // Remove all existing entries for this department
    const filteredRooms = departmentRooms.filter(item => item.department_id !== departmentId);
    
    // Add new entries for each selected room
    if (selectedRoomIds && selectedRoomIds.length > 0) {
      selectedRoomIds.forEach(roomId => {
        filteredRooms.push({
          department_id: departmentId,
          room_id: roomId
        });
      });
    } else {
      // If no rooms selected, still keep the department entry with null room
      filteredRooms.push({
        department_id: departmentId,
        room_id: null
      });
    }
    
    updated[index].department_rooms = filteredRooms;
    setDoctors(updated);
  };

  // Get selected department objects
  const getSelectedDepartments = (index) => {
    const doctor = doctors[index];
    if (!doctor || !doctor.department_rooms) return [];
    
    const selectedDeptIds = doctor.department_rooms
      .map(item => item.department_id)
      .filter(id => id);
    
    return filteredDepartments.filter(dept => selectedDeptIds.includes(dept.id));
  };

  // Get selected room IDs for a department
  const getSelectedRoomIdsForDepartment = (index, departmentId) => {
    const doctor = doctors[index];
    if (!doctor || !doctor.department_rooms) return [];
    
    return doctor.department_rooms
      .filter(item => item.department_id === departmentId && item.room_id)
      .map(item => item.room_id);
  };

  useEffect(() => {
    if (open) {
      // Check if hospital is selected in global state
      if (!hospital?.id) {
        setHospitalSelectionError(t('Please select a hospital/facility from the global dropdown first'));
        // Reset form if no hospital selected
        setDoctors([{ 
          name: '', 
          license_no: '', 
          medical_center_id: '', 
          department_rooms: [] 
        }]);
      } else {
        // Auto-select hospital from global state
        const initialMedicalCenterId = hospital.id;
        
        setDoctors([{ 
          name: '', 
          license_no: '', 
          medical_center_id: initialMedicalCenterId, 
          department_rooms: [] 
        }]);
        setHospitalSelectionError('');
      }
      
      setErrors([]);
      setApiError('');
      setLastSelectedHospital(hospital?.id || '');
      
      // Filter departments when modal opens
      if (hospital?.id) {
        filterDepartmentsByMedicalCenter(hospital.id);
      }
    }
  }, [open, hospital, departments]);

  useEffect(() => {
    // Update filtered departments when departments data changes
    if (hospital?.id && departments.length > 0) {
      filterDepartmentsByMedicalCenter(hospital.id);
    }
  }, [departments, hospital]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating doctor');
      
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('doctor_name_medical_center_id_key')) {
        setApiError(t('A doctor with the same name already exists in this hospital/facility'));
      } else if (errorMessage.includes('license_no')) {
        setApiError(t('Doctor already exists'));
      } else {
        setApiError(errorMessage);
      }
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    // First check if hospital is selected
    if (!hospital?.id) {
      setHospitalSelectionError(t('Please select a hospital/facility from the global dropdown first'));
      return false;
    }

    const newErrors = doctors.map((doctor, index) => {
      const fieldErrors = {};
      if (!doctor.name.trim()) {
        fieldErrors.name = t('This field is Required');
      } else if (doctor.name.trim().length < 1) {
        fieldErrors.name = t('Name must be at least 1 characters');
      }
      if (!doctor.license_no.trim()) {
        fieldErrors.license_no = t('This field is Required');
      } else if (doctor.license_no.trim().length < 1) {
        fieldErrors.license_no = t('Last name must be at least 1 characters');
      }
      return fieldErrors;
    });

    setErrors(newErrors);
    return newErrors.every(error => Object.keys(error).length === 0);
  };

  const handleSubmit = () => {
    setApiError('');
    setHospitalSelectionError('');

    // Check if hospital is selected before validating form
    if (!hospital?.id) {
      setHospitalSelectionError(t('Please select a hospital/facility from the global dropdown first'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    const validDoctors = doctors.map(doctor => ({
      ...doctor,
      medical_center_id: hospital.id, // Force the hospital ID from global state
      department_rooms: doctor.department_rooms?.filter(item => item.department_id) || []
    })).filter(doctor => 
      doctor.name.trim() !== '' && 
      doctor.license_no.trim() !== ''
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
      medical_center_id: hospital?.id || '', // Use hospital from global state
      department_rooms: [] 
    };
    setDoctors([...doctors, newDoctor]);
    setErrors([...errors, {}]);
    
    // Scroll to bottom when adding new doctor
    setTimeout(() => {
      const modalContent = document.querySelector('.MuiDialogContent-root');
      if (modalContent) {
        modalContent.scrollTop = modalContent.scrollHeight;
      }
    }, 100);
  };

  const updateDoctor = (index, field, value) => {
    const updated = [...doctors];
    updated[index][field] = value;
    setDoctors(updated);

    // Update last selected hospital when hospital is selected and filter departments
    if (field === 'medical_center_id') {
      setLastSelectedHospital(value);
      filterDepartmentsByMedicalCenter(value);
      
      // Clear department selections when hospital changes
      if (value !== updated[index].medical_center_id) {
        updated[index].department_rooms = [];
      }
    }

    if (errors[index]?.[field]) {
      const updatedErrors = [...errors];
      delete updatedErrors[index][field];
      setErrors(updatedErrors);
    }

    if (apiError) {
      setApiError('');
    }
  };

  const removeDoctor = (index) => {
    if (doctors.length > 1) {
      setDoctors(doctors.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const handleClose = () => {
    setDoctors([{ name: '', license_no: '', medical_center_id: '', department_rooms: [] }]);
    setErrors([]);
    setApiError('');
    setHospitalSelectionError('');
    setLastSelectedHospital('');
    setFilteredDepartments([]);
    onClose();
  };

  const dialogContent = (
    <div className="flex flex-col gap-8">
      {/* Hospital Selection Error Alert */}
      {hospitalSelectionError && (
        <Alert severity="warning" sx={{ px: 0 }}>
          {hospitalSelectionError}
        </Alert>
      )}

      {doctors.map((doctor, index) => (
        <div
          key={index}
          className="flex mt-20 mb-10 flex-col gap-4 border border-gray-200 p-6 rounded-lg relative bg-gray-50"
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
                  error={!!errors[index]?.license_no}
                  helperText={errors[index]?.license_no}
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
          <br />
          
          {/* Hospital/Facility */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <div className="flex flex-col gap-1">
                <Typography variant="subtitle1" className="font-medium">
                  {t('Hospital/Facility')} *
                </Typography>
                <FormControl fullWidth error={!!errors[index]?.medical_center_id}>
                  {hospital?.id ? (
                    <TextField
                      value={medicalCenters.find(mc => mc.id === hospital.id)?.name || 'Selected Hospital'}
                      fullWidth
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText={'世界中の病院から選ばれる'}
                    />
                  ) : (
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
                  )}
                  {errors[index]?.medical_center_id && (
                    <Typography variant="caption" color="error">
                      {errors[index]?.medical_center_id}
                    </Typography>
                  )}
                  {hospital?.id && (
                    <Typography variant="caption" color="text.secondary">
                     病院/施設はグローバル選択から自動的に選択されます
                    </Typography>
                  )}
                </FormControl>
              </div>
            </Grid>
          </Grid>

          {/* Clinical Departments with Room Selection */}
          <div className="flex flex-col gap-3 mt-4">
            <Typography variant="subtitle1" className="font-medium">
              {t('Clinical Department')}
            </Typography>
            
            <Autocomplete
              multiple
              options={filteredDepartments}
              getOptionLabel={(option) => option.name}
              value={getSelectedDepartments(index)}
              onChange={(event, newValue) => handleDepartmentChange(index, newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    doctor.medical_center_id || hospital?.id
                      ? t('Select clinical departments')
                      : t('Please select a hospital/facility first')
                  }
                  disabled={(!doctor.medical_center_id && !hospital?.id) || isLoading}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, tagIndex) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index: tagIndex })}
                    size="small"
                  />
                ))
              }
              disabled={(!doctor.medical_center_id && !hospital?.id) || isLoading}
            />

            {/* Room selection for each selected department - only shown if department has rooms */}
            {getSelectedDepartments(index).map((dept) => {
              const rooms = getRoomsForDepartment(dept.id);
              const hasRooms = rooms && rooms.length > 0;
              const selectedRoomIds = getSelectedRoomIdsForDepartment(index, dept.id);

              console.log('Department', dept.name, 'has rooms:', hasRooms, rooms);

              // Only show room selection if department has rooms
              if (hasRooms) {
                return (
                  <Box key={dept.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'primary.light', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                      {dept.name} - {t('Select Rooms')} ({rooms.length} {t('rooms available')})
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      options={rooms}
                      getOptionLabel={(option) => option.name}
                      value={rooms.filter(room => selectedRoomIds.includes(room.id))}
                      onChange={(event, newValue) => {
                        const roomIds = newValue.map(room => room.id);
                        handleRoomChange(index, dept.id, roomIds);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t('Select rooms (optional)')}
                          size="small"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, tagIndex) => (
                          <Chip
                            label={option.name}
                            {...getTagProps({ index: tagIndex })}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                      disabled={isLoading}
                      size="small"
                    />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {t('Room selection is optional. You can select multiple rooms or leave empty.')}
                    </Typography>
                  </Box>
                );
              }
              return null; // Don't show anything for departments without rooms
            })}

            {hospital?.id && (
              <Typography variant="caption" color="text.secondary">
                選択した病院の部門がフィルタリングされます
              </Typography>
            )}
          </div>

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
          disabled={isLoading || !hospital?.id}
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
        disabled={isLoading || !hospital?.id}
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

// Update the EditDoctorModal component similarly for multiple room selection
const EditDoctorModal = ({ open, onClose, onSubmit, doctor, isLoading, mutationError, medicalCenters, departments }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ 
    name: '', 
    license_no: '', 
    medical_center_id: '', 
    department_rooms: [] 
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  // Filter departments based on selected medical center
  const filterDepartmentsByMedicalCenter = (medicalCenterId) => {
    if (!medicalCenterId) {
      setFilteredDepartments([]);
      return;
    }
    
    // Filter departments by medical_center_id and ensure they're active
    const filtered = departments.filter(dept => 
      dept.medical_center_id === parseInt(medicalCenterId) && dept.status === 1
    );
    
    console.log('Filtered departments for edit modal', medicalCenterId, filtered);
    setFilteredDepartments(filtered);
  };

  // Get rooms for a department from the department data
  const getRoomsForDepartment = (departmentId) => {
    const department = filteredDepartments.find(dept => dept.id === departmentId);
    // Check both department_room array and _count.department_room
    const rooms = department?.department_room || [];
    console.log('Rooms for department in edit', departmentId, rooms);
    return rooms;
  };

  // Check if a department has rooms
  const departmentHasRooms = (departmentId) => {
    const rooms = getRoomsForDepartment(departmentId);
    return rooms && rooms.length > 0;
  };

  // Initialize department rooms from doctor data
  useEffect(() => {
    if (doctor && open) {
      console.log('Doctor data in edit modal:', doctor);
      
      // Convert existing department links to department_rooms format
      const departmentRooms = [];
      
      if (doctor.dept_links && doctor.dept_links.length > 0) {
        doctor.dept_links.forEach(link => {
          const deptId = link.department_id;
          
          // If there are room assignments
          if (link.doctor_department_room && link.doctor_department_room.length > 0) {
            link.doctor_department_room.forEach(roomLink => {
              departmentRooms.push({
                department_id: deptId,
                room_id: roomLink.department_room_id
              });
            });
          } else {
            // Department without room assignment - still include it
            departmentRooms.push({
              department_id: deptId,
              room_id: null
            });
          }
        });
      }

      const initialData = {
        name: doctor.name || '',
        license_no: doctor.license_no || '',
        medical_center_id: doctor.medical_center_id || '',
        department_rooms: departmentRooms
      };
      
      console.log('Initial form data:', initialData);
      setFormData(initialData);
      setApiError('');
      
      if (initialData.medical_center_id) {
        filterDepartmentsByMedicalCenter(initialData.medical_center_id);
      }
    }
  }, [doctor, open, departments]);

  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating doctor');
      
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('doctor_name_medical_center_id_key')) {
        setApiError(t('A doctor with the same name already exists in this hospital/facility'));
      } else if (errorMessage.includes('license_no')) {
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
    } else if (formData.name.trim().length < 1) {
      newErrors.name = t('Name must be at least 1 characters');
    }
    if (!formData.license_no.trim()) {
      newErrors.license_no = t('This field is Required');
    } else if (formData.license_no.trim().length < 1) {
      newErrors.license_no = t('Last name must be at least 1 characters');
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
    
    // Filter departments when medical center changes
    if (field === 'medical_center_id') {
      filterDepartmentsByMedicalCenter(value);
      
      // Clear department selections when hospital changes
      if (value !== formData.medical_center_id) {
        setFormData(prev => ({ ...prev, department_rooms: [] }));
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  // Handle department selection change
  const handleDepartmentChange = (selectedDepts) => {
    // Create a map of existing selections (department_id -> array of room_ids)
    const existingSelections = {};
    formData.department_rooms.forEach(item => {
      if (!existingSelections[item.department_id]) {
        existingSelections[item.department_id] = [];
      }
      if (item.room_id) {
        existingSelections[item.department_id].push(item.room_id);
      }
    });

    // Update with new selections
    const newDepartmentRooms = [];
    
    for (const dept of selectedDepts) {
      const deptId = dept.id;
      
      // If this department was previously selected, keep its room selections
      if (existingSelections[deptId] && existingSelections[deptId].length > 0) {
        existingSelections[deptId].forEach(roomId => {
          newDepartmentRooms.push({
            department_id: deptId,
            room_id: roomId
          });
        });
      } else {
        // New department selection, add without rooms initially
        newDepartmentRooms.push({
          department_id: deptId,
          room_id: null
        });
      }
    }
    
    setFormData(prev => ({ ...prev, department_rooms: newDepartmentRooms }));
  };

  // Handle multiple room selection change
  const handleRoomChange = (departmentId, selectedRoomIds) => {
    const departmentRooms = [...(formData.department_rooms || [])];
    
    // Remove all existing entries for this department
    const filteredRooms = departmentRooms.filter(item => item.department_id !== departmentId);
    
    // Add new entries for each selected room
    if (selectedRoomIds && selectedRoomIds.length > 0) {
      selectedRoomIds.forEach(roomId => {
        filteredRooms.push({
          department_id: departmentId,
          room_id: roomId
        });
      });
    } else {
      // If no rooms selected, still keep the department entry with null room
      filteredRooms.push({
        department_id: departmentId,
        room_id: null
      });
    }
    
    setFormData(prev => ({ ...prev, department_rooms: filteredRooms }));
  };

  // Get selected department objects
  const getSelectedDepartments = () => {
    if (!formData.department_rooms) return [];
    
    const selectedDeptIds = formData.department_rooms
      .map(item => item.department_id)
      .filter(id => id);
    
    return filteredDepartments.filter(dept => selectedDeptIds.includes(dept.id));
  };

  // Get selected room IDs for a department
  const getSelectedRoomIdsForDepartment = (departmentId) => {
    if (!formData.department_rooms) return [];
    
    return formData.department_rooms
      .filter(item => item.department_id === departmentId && item.room_id)
      .map(item => item.room_id);
  };

  const handleClose = () => {
    setFormData({ name: '', license_no: '', medical_center_id: '', department_rooms: [] });
    setErrors({});
    setApiError('');
    setFilteredDepartments([]);
    onClose();
  };

  if (!doctor) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4 mt-20">
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
      <div className="flex flex-col gap-2 mt-20">
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

      {/* Clinical Departments with Room Selection */}
      <div className="flex flex-col gap-3 mt-4">
        <Typography variant="subtitle1" className="font-medium">
          {t('Clinical Department')}
        </Typography>
        
        <Autocomplete
          multiple
          options={filteredDepartments}
          getOptionLabel={(option) => option.name}
          value={getSelectedDepartments()}
          onChange={(event, newValue) => handleDepartmentChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={
                formData.medical_center_id 
                  ? t('Select clinical departments') 
                  : t('Select hospital/facility first')
              }
              disabled={!formData.medical_center_id || isLoading}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, tagIndex) => (
              <Chip
                label={option.name}
                {...getTagProps({ index: tagIndex })}
                size="small"
              />
            ))
          }
          disabled={!formData.medical_center_id || isLoading}
        />

        {/* Room selection for each selected department - only shown if department has rooms */}
        {getSelectedDepartments().map((dept) => {
          const rooms = getRoomsForDepartment(dept.id);
          const hasRooms = rooms && rooms.length > 0;
          const selectedRoomIds = getSelectedRoomIdsForDepartment(dept.id);

          console.log('Edit - Department', dept.name, 'has rooms:', hasRooms, rooms);

          // Only show room selection if department has rooms
          if (hasRooms) {
            return (
              <Box key={dept.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'primary.light', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                  {dept.name} - {t('部屋を選択')} ({rooms.length} {t('空室状況')})
                </Typography>
                
                <Autocomplete
                  multiple
                  options={rooms}
                  getOptionLabel={(option) => option.name}
                  value={rooms.filter(room => selectedRoomIds.includes(room.id))}
                  onChange={(event, newValue) => {
                    const roomIds = newValue.map(room => room.id);
                    handleRoomChange(dept.id, roomIds);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('部屋を選択')}
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, tagIndex) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index: tagIndex })}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  }
                  disabled={isLoading}
                  size="small"
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
部屋の選択は任意です。複数の部屋を選択することも、空白のままにすることもできます。                </Typography>
              </Box>
            );
          }
          return null; // Don't show anything for departments without rooms
        })}

        {!formData.medical_center_id && (
          <Typography variant="caption" color="text.secondary">
            {t('Please select a hospital/facility first')}
          </Typography>
        )}
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
      maxWidth="md"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Update the AssignDepartmentsModal component similarly
const AssignDepartmentsModal = ({ open, onClose, onSubmit, doctor, isLoading, mutationError, departments }) => {
  const { t } = useTranslation('shared-components');
  const [departmentRooms, setDepartmentRooms] = useState([]);
  const [apiError, setApiError] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  // Filter departments based on doctor's medical center
  useEffect(() => {
    if (doctor && open) {
      // Filter departments by doctor's medical center
      const doctorMedicalCenterId = doctor.medical_center_id;
      if (doctorMedicalCenterId) {
        const filtered = departments.filter(dept => 
          dept.medical_center_id === doctorMedicalCenterId && dept.status === 1
        );
        setFilteredDepartments(filtered);
      } else {
        setFilteredDepartments(departments);
      }
      
      // Convert existing department links to department_rooms format
      const initialRooms = [];
      
      if (doctor.dept_links && doctor.dept_links.length > 0) {
        doctor.dept_links.forEach(link => {
          const deptId = link.department_id;
          
          // If there are room assignments
          if (link.doctor_department_room && link.doctor_department_room.length > 0) {
            link.doctor_department_room.forEach(roomLink => {
              initialRooms.push({
                department_id: deptId,
                room_id: roomLink.department_room_id
              });
            });
          } else {
            // Department without room assignment - still include it
            initialRooms.push({
              department_id: deptId,
              room_id: null
            });
          }
        });
      }
      
      setDepartmentRooms(initialRooms);
      setApiError('');
    }
  }, [doctor, open, departments]);

  // Get rooms for a department
  const getRoomsForDepartment = (departmentId) => {
    const department = filteredDepartments.find(dept => dept.id === departmentId);
    return department?.department_room || [];
  };

  // Check if a department has rooms
  const departmentHasRooms = (departmentId) => {
    const rooms = getRoomsForDepartment(departmentId);
    return rooms && rooms.length > 0;
  };

  // Get selected department objects
  const getSelectedDepartments = () => {
    const selectedDeptIds = departmentRooms
      .map(item => item.department_id)
      .filter(id => id);
    
    return filteredDepartments.filter(dept => selectedDeptIds.includes(dept.id));
  };

  // Get selected room IDs for a department
  const getSelectedRoomIdsForDepartment = (departmentId) => {
    return departmentRooms
      .filter(item => item.department_id === departmentId && item.room_id)
      .map(item => item.room_id);
  };

  // Handle department selection change
  const handleDepartmentChange = (selectedDepts) => {
    // Create a map of existing selections
    const existingSelections = {};
    departmentRooms.forEach(item => {
      if (!existingSelections[item.department_id]) {
        existingSelections[item.department_id] = [];
      }
      if (item.room_id) {
        existingSelections[item.department_id].push(item.room_id);
      }
    });

    // Update with new selections
    const newDepartmentRooms = [];
    
    for (const dept of selectedDepts) {
      const deptId = dept.id;
      
      // If this department was previously selected, keep its room selections
      if (existingSelections[deptId] && existingSelections[deptId].length > 0) {
        existingSelections[deptId].forEach(roomId => {
          newDepartmentRooms.push({
            department_id: deptId,
            room_id: roomId
          });
        });
      } else {
        // New department selection, add without rooms initially
        newDepartmentRooms.push({
          department_id: deptId,
          room_id: null
        });
      }
    }
    
    setDepartmentRooms(newDepartmentRooms);
  };

  // Handle multiple room selection change
  const handleRoomChange = (departmentId, selectedRoomIds) => {
    // Remove all existing entries for this department
    const filteredRooms = departmentRooms.filter(item => item.department_id !== departmentId);
    
    // Add new entries for each selected room
    if (selectedRoomIds && selectedRoomIds.length > 0) {
      selectedRoomIds.forEach(roomId => {
        filteredRooms.push({
          department_id: departmentId,
          room_id: roomId
        });
      });
    } else {
      // If no rooms selected, still keep the department entry with null room
      filteredRooms.push({
        department_id: departmentId,
        room_id: null
      });
    }
    
    setDepartmentRooms(filteredRooms);
  };

  const handleSubmit = () => {
    setApiError('');
    onSubmit({ doctor_id: doctor.id, department_rooms: departmentRooms });
  };

  const handleClose = () => {
    setDepartmentRooms([]);
    setApiError('');
    setFilteredDepartments([]);
    onClose();
  };

  if (!doctor) return null;

  const dialogContent = (
    <div className="flex flex-col gap-4">
      <Typography variant="body1">
        {t('Assign departments and rooms to')} <strong>{doctor.name}</strong>
      </Typography>

      <div className="flex flex-col gap-3">
        <Typography variant="subtitle1" className="font-medium">
          {t('Clinical Department')}
        </Typography>
        
        <Autocomplete
          multiple
          options={filteredDepartments}
          getOptionLabel={(option) => option.name}
          value={getSelectedDepartments()}
          onChange={(event, newValue) => handleDepartmentChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('Select clinical departments')}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, tagIndex) => (
              <Chip
                label={option.name}
                {...getTagProps({ index: tagIndex })}
                size="small"
              />
            ))
          }
          disabled={isLoading}
        />

        {/* Room selection for each selected department - only shown if department has rooms */}
        {getSelectedDepartments().map((dept) => {
          const rooms = getRoomsForDepartment(dept.id);
          const hasRooms = rooms && rooms.length > 0;
          const selectedRoomIds = getSelectedRoomIdsForDepartment(dept.id);

          // Only show room selection if department has rooms
          if (hasRooms) {
            return (
              <Box key={dept.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'primary.light', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                  {dept.name} - {t('Select Rooms')} ({rooms.length} {t('rooms available')})
                </Typography>
                
                <Autocomplete
                  multiple
                  options={rooms}
                  getOptionLabel={(option) => option.name}
                  value={rooms.filter(room => selectedRoomIds.includes(room.id))}
                  onChange={(event, newValue) => {
                    const roomIds = newValue.map(room => room.id);
                    handleRoomChange(dept.id, roomIds);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('Select rooms (optional)')}
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, tagIndex) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index: tagIndex })}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  }
                  disabled={isLoading}
                  size="small"
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('Room selection is optional. You can select multiple rooms or leave empty.')}
                </Typography>
              </Box>
            );
          }
          return null; // Don't show anything for departments without rooms
        })}
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
        {isLoading ? t('Assigning...') : t('Assign Departments & Rooms')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Assign Departments & Rooms"
      maxWidth="md"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};