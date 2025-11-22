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
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';

// Import shared components
import { CommonHeader } from '../../../shared-components/new/CommonHeader';
import { ConfirmationDialog } from '../../../shared-components/new/ConfirmationDialog';
import { CommonDialog } from '../../../shared-components/new/CommonDialog';
import { toJapaneseDate } from '../../../shared-components/new/dateHelpers';

const ImageUpModal = lazy(() => import('../../../shared-components/modal/ImageUpModal')); 

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

function MedicalCenter() {
  return (
    <QueryClientProvider client={queryClient}>
      <MedicalCenterContent />
    </QueryClientProvider>
  );
}

function MedicalCenterContent() {
  let user = User();
  let tableName = 'medical_centers';
  let headingTitle = 'Facility List';

  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const { theme, toggleTheme } = useTheme();
  const { refreshMedicalCenter, toggleRefreshMedicalCenter } = useTheme();

  const [globalFilter, setGlobalFilter] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    toggleTheme(t(headingTitle));
  }, [t(headingTitle)]);

  function handleCountDataFromChild(count) {
    if (refreshMedicalCenter === true) {
      toggleRefreshMedicalCenter(false);
    } else {
      toggleRefreshMedicalCenter(true);
    }
  }

  const handleFilterType = (type) => {
    setFilterType(type);
  };

  // Build filter object correctly
  const buildFilter = () => {
    if (filterType === 'ALL') {
      return {
        f_columnFilters: {},
        globalFilter: "",
        f_globalFilters: {},
        others: {}
      };
    } else {
      return {
        f_columnFilters: { type: filterType },
        globalFilter: "",
        f_globalFilters: {},
        others: {}
      };
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Hospital/Facility Names' },
    { value: 'large_hospital', label: 'Hospital: Large' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'welfare', label: 'Welfare' }
  ];

  return (
    <Root
      header={
        <CommonHeader
          title={headingTitle}
          filterType={filterType}
          onFilterChange={handleFilterType}
          onCreate={() => setCreateModalOpen(true)}
          filterOptions={filterOptions}
          createButtonText="Add Hospital/Facility Name"
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

export default MedicalCenter;

// Table Component Implementation
const Table = (props) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shared-components');
  const dispatch = useAppDispatch();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMedicalCenter, setSelectedMedicalCenter] = useState(null);
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

  //added
  const [isRefetching, setIsRefetching] = useState(false);
  function UploadComplete(para) {
      setIsRefetching(true);
  // Refetch the medical centers list
  queryClient.invalidateQueries(['medical-centers']);
  refetch();
  }

  // Build filter payload based on your existing structure
  const buildFilterPayload = () => {
    let f_columnFilters = {};
    let f_globalFilters = null;

    // Process column filters - only for Name and Address
    if (columnFilters.length > 0) {
      columnFilters.forEach(filter => {
        // Only process filters for Name and Address columns
        if ((filter.id === 'name' || filter.id === 'address') && filter.value && filter.value !== '') {
          f_columnFilters[filter.id] = { contains: filter.value };
        }
      });
    }

    // Process global filter - only search in Name and Address
    if (globalFilter) {
      const globalFilterConditions = [
        { name: { contains: globalFilter } },
        { address: { contains: globalFilter } }
      ].filter(condition => {
        const key = Object.keys(condition)[0];
        return !f_columnFilters[key]; // Only add if not already in column filters
      });

      if (globalFilterConditions.length > 0) {
        f_globalFilters = { OR: globalFilterConditions };
      }
    }

    // Apply type filter from props
    if (props.filter?.f_columnFilters?.type) {
      f_columnFilters.type = props.filter.f_columnFilters.type;
    }

    return {
      f_columnFilters,
      globalFilter: globalFilter || "",
      f_globalFilters,
      others: props.filter?.others || {}
    };
  };

  const { data: responseData, isError, isFetching, isLoading, error, refetch } = useQuery({
    queryKey: ['medical-centers', pagination.pageIndex, pagination.pageSize, columnFilters, globalFilter, sorting, props.filter],
    queryFn: async () => {
      const filterPayload = buildFilterPayload();
      
      const payload = {
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sortBy: sorting.length > 0 ? sorting[0].id : 'id',
        sortType: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'asc',
        filter: filterPayload
      };

      const response = await axios.post(apiConfig.medicalCenterList, payload);
      return response.data;
    },
  });

  // Extract baseUrl and tableData from response
  const baseUrl = responseData?.baseUrl || '';
  const tableData = responseData?.data || [];
  const serverPagination = responseData?.pagination || {};

  // Auto refetch after mutations
  const handleMutationSuccess = () => {
    queryClient.invalidateQueries(['medical-centers']);
    refetch();
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.medicalCenterCreate, data);
      return response.data;
    },
    onSuccess: () => {
      handleMutationSuccess();
      props.setCreateModalOpen(false);
      dispatch(showMessage({ message: t('Medical Center created successfully'), variant: 'success' }));
    },
    onError: (error) => {
      // Error handling is now done in the modal component
      console.error('Error creating medical center:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(apiConfig.medicalCenterUpdate, data);
      return response.data;
    },
    onSuccess: () => {
      handleMutationSuccess();
      setEditModalOpen(false);
      dispatch(showMessage({ message: t('Medical Center updated successfully'), variant: 'success' }));
    },
    onError: (error) => {
      // Error handling is now done in the modal component
      console.error('Error updating medical center:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.post(apiConfig.medicalCenterRemove, { id });
      return response.data;
    },
    onSuccess: () => {
      handleMutationSuccess();
      setDeleteConfirmOpen(false);
      dispatch(showMessage({ message: t('Medical Center deleted successfully'), variant: 'success' }));
    },
    onError: (error) =>{
      dispatch(showMessage({ message: t('Error deleting medical center'), variant: 'error' }));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.post(apiConfig.medicalCenterStatus, { id, status: status === 1 ? 0 : 1 });
      return response.data;
    },
    onSuccess: () => {
      handleMutationSuccess();
      setStatusConfirmOpen(false);
      dispatch(showMessage({ message: t('Status updated successfully'), variant: 'success' }));
    },
    onError: (error) => {
      dispatch(showMessage({ message: t('Error updating status'), variant: 'error' }));
    },
  });

  const handleCreateMedicalCenters = (medicalCenters) => {
    if (Array.isArray(medicalCenters)) {
      const createPromises = medicalCenters.map(medicalCenter => 
        createMutation.mutateAsync(medicalCenter)
      );
      
      Promise.all(createPromises)
        .then(() => {
          props.setCreateModalOpen(false);
        })
        .catch(error => {
          console.error('Error creating medical centers:', error);
        });
    } else {
      createMutation.mutate(medicalCenters);
    }
  };

  const handleEditMedicalCenter = (data) => {
    updateMutation.mutate(data);
  };

  const handleStatusClick = (medicalCenter) => {
    setSelectedMedicalCenter(medicalCenter);
    setStatusConfirmOpen(true);
  };

  const handleStatusConfirm = () => {
    if (selectedMedicalCenter) {
      statusMutation.mutate({ 
        id: selectedMedicalCenter.id, 
        status: selectedMedicalCenter.status 
      });
    }
  };

  const handleDeleteClick = (row) => {
    setSelectedMedicalCenter(row.original);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedMedicalCenter) {
      deleteMutation.mutate(selectedMedicalCenter.id);
    }
  };

  const handleEditClick = (row) => {
    setSelectedMedicalCenter(row.original);
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

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('Hospital/Facility Name'),
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
        accessorKey: 'type',
        header: t('Category'),
        size: 150,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <Chip
            label={t(
              cell.getValue() === 'large_hospital' 
                ? 'Hospital: Large'
                : cell.getValue() === 'hospital'
                ? 'Hospital'
                : 'Welfare'
            )}
            className={`capitalize font-semibold ${
              cell.getValue() === 'large_hospital' 
                ? 'bg-blue-100 text-blue-800' 
                : cell.getValue() === 'hospital'
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }`}
            size="small"
          />
        ),
      },
      {
        accessorFn: (row) => ` `,
        id: 'logo',
        header: t('Logo'),
        enableEditing: false,
        required: false,
        size: 40,
        Cell: ({ renderedCellValue, row }) => {
          return (
            <> 
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                {row?.original?.logo ? (
                  <img
                    alt="avatar"
                    height={30}
                    src={`${baseUrl}${row.original.logo}`}
                    loading="lazy"
                    style={{ 
                borderRadius: '0%',
                height: '60px', // Use CSS height
                width: 'auto', // Maintain aspect ratio
                maxWidth: '60px', // Optional: limit width
                objectFit: 'contain' // Ensure image fits properly
              }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No logo
                  </Typography>
                )}
                <span>{renderedCellValue}</span>
              </Box>     
              <ImageUpModal data={row} api={'hospital-manage/logo'} complete={UploadComplete}/>
            </>
          );
        },
      },
      {
        accessorKey: 'address',
        header: t('Address'),
        size: 250,
        enableColumnFilter: true,
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
        accessorKey: 'doctors',
        header: t('Doctors'),
        size: 120,
        enableEditing: false,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <span className="font-semibold">
              {cell.getValue()?.length || 0}
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
    [validationErrors, t, pagination.pageIndex, pagination.pageSize, baseUrl, refetch]
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
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
        message={`Are you sure you want to delete "${selectedMedicalCenter?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      <ConfirmationDialog
        open={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleStatusConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status of "${selectedMedicalCenter?.name}" to ${selectedMedicalCenter?.status === 1 ? 'Inactive' : 'Active'}?`}
        confirmText="Change Status"
        confirmColor="primary"
      />

      {/* Create Modal */}
      <CreateMedicalCenterModal
        open={props.createModalOpen}
        onClose={() => props.setCreateModalOpen(false)}
        onSubmit={handleCreateMedicalCenters}
        isLoading={createMutation.isLoading}
        mutationError={createMutation.error}
        key={props.createModalOpen ? 'create-modal-open' : 'create-modal-closed'}
      />

      {/* Edit Modal */}
      <EditMedicalCenterModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditMedicalCenter}
        medicalCenter={selectedMedicalCenter}
        isLoading={updateMutation.isLoading}
        mutationError={updateMutation.error}
      />
    </div>
  );
};

// Create Medical Center Modal Component
const CreateMedicalCenterModal = ({ open, onClose, onSubmit, isLoading, mutationError }) => {
  const { t } = useTranslation('shared-components');
  const [medicalCenters, setMedicalCenters] = useState([{ name: '', type: 'hospital', address: '' }]);
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const [duplicateErrors, setDuplicateErrors] = useState({});

  // Clean API errors when modal closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setApiError('');
        setErrors([]);
        setDuplicateErrors({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setMedicalCenters([{ name: '', type: 'hospital', address: '' }]);
      setErrors([]);
      setApiError('');
      setDuplicateErrors({});
    }
  }, [open]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error creating medical center');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('medical_center_name_key')) {
        setApiError(t('Hospital/Facility Name already exists'));
      } else {
        setApiError(errorMessage);
      }
    } else {
      setApiError('');
    }
  }, [mutationError, t]);

  const validateForm = () => {
    const newErrors = medicalCenters.map((medicalCenter, index) => {
      const fieldErrors = {};
      if (!medicalCenter.name.trim()) {
        fieldErrors.name = t('This field is Required');
      }
      if (!medicalCenter.type) {
        fieldErrors.type = t('This field is Required');
      }
      return fieldErrors;
    });

    setErrors(newErrors);
    return newErrors.every(error => Object.keys(error).length === 0);
  };

  const checkForDuplicates = () => {
    const nameCount = {};
    const newDuplicateErrors = {};
    
    medicalCenters.forEach((medicalCenter, index) => {
      if (medicalCenter.name.trim()) {
        const normalizedName = medicalCenter.name.trim().toLowerCase();
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
          newDuplicateErrors[index] = t('Duplicate medical center name in this form');
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

    const validMedicalCenters = medicalCenters.filter(mc => mc.name.trim() !== '');
    
    if (validMedicalCenters.length === 0) {
      return;
    }

    onSubmit(validMedicalCenters.length === 1 ? validMedicalCenters[0] : validMedicalCenters);
  };

  const addMedicalCenter = () => {
    setMedicalCenters([...medicalCenters, { name: '', type: 'hospital', address: '' }]);
    setErrors([...errors, {}]);
    
    // Clear API error when adding new medical center
    if (apiError) {
      setApiError('');
    }
  };

  const updateMedicalCenter = (index, field, value) => {
    const updated = [...medicalCenters];
    updated[index][field] = value;
    setMedicalCenters(updated);

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

  const removeMedicalCenter = (index) => {
    if (medicalCenters.length > 1) {
      setMedicalCenters(medicalCenters.filter((_, i) => i !== index));
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
    
    // Clear API error when removing medical center
    if (apiError) {
      setApiError('');
    }
  };

  const handleClose = () => {
    // Clear all errors before closing
    setApiError('');
    setErrors([]);
    setDuplicateErrors({});
    onClose();
  };

  const handleCancelClick = () => {
    // Clear all errors when cancel button is clicked
    setApiError('');
    setErrors([]);
    setDuplicateErrors({});
    onClose();
  };

  const handleCreateClick = () => {
    // Clear API error when create button is clicked (validation will show field errors)
    setApiError('');
    handleSubmit();
  };

  const dialogContent = (
    <div className="flex flex-col gap-8">
      {medicalCenters.map((medicalCenter, index) => (
        <div
          key={index}
          className="flex gap-14 border border-gray-200 p-6 rounded-lg items-start relative bg-gray-50"
        >
          {/* Column 1: Name */}
          <div className="flex flex-col gap-1 flex-[2] min-w-[250px]">
            <Typography variant="subtitle1" className="font-medium">
              {t('Hospital/Facility Name')} *
            </Typography>
            <TextField
              value={medicalCenter.name}
              onChange={(e) =>
                updateMedicalCenter(index, 'name', e.target.value)
              }
              fullWidth
              error={!!errors[index]?.name || !!duplicateErrors[index]}
              helperText={errors[index]?.name || duplicateErrors[index]}
              placeholder={t('Enter medical center name')}
              disabled={isLoading}
            />
          </div>

          {/* Column 2: Type */}
          <div className="flex flex-col gap-1 flex-[1] min-w-[150px]">
            <Typography variant="subtitle1" className="font-medium">
              {t('Category')} *
            </Typography>
            <FormControl fullWidth error={!!errors[index]?.type}>
              <Select
                value={medicalCenter.type}
                onChange={(e) =>
                  updateMedicalCenter(index, 'type', e.target.value)
                }
                disabled={isLoading}
              >
                <MenuItem value="large_hospital">{t('Hospital: Large')}</MenuItem>
                <MenuItem value="hospital">{t('Hospital')}</MenuItem>
                <MenuItem value="welfare">{t('Welfare')}</MenuItem>
              </Select>
              {errors[index]?.type && (
                <Typography variant="caption" color="error">
                  {errors[index]?.type}
                </Typography>
              )}
            </FormControl>
          </div>

          {/* Column 3: Address + Delete */}
          <div className="flex flex-col gap-1 flex-[2] min-w-[250px] relative">
            <Typography variant="subtitle1" className="font-medium">
              {t('Address')}
            </Typography>
            <TextField
              value={medicalCenter.address}
              onChange={(e) =>
                updateMedicalCenter(index, 'address', e.target.value)
              }
              fullWidth
              placeholder={t('Enter medical center address')}
              disabled={isLoading}
            />

            {medicalCenters.length > 1 && (
              <IconButton
                className="absolute top-0 right-0 mt-1"
                onClick={() => removeMedicalCenter(index)}
                color="error"
                size="small"
                disabled={isLoading}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
      ))}

      {/* API Error Alert */}
      {apiError && (
        <Alert severity="error" sx={{ px:0, mb: 2 }}>
          {apiError}
        </Alert>
      )}

      {/* Add Another */}
      <div className="flex justify-center pt-4">
        <Button
          startIcon={<AddIcon />}
          onClick={addMedicalCenter}
          variant="outlined"
          disabled={isLoading}
        >
          {t('Add Another Medical Center')}
        </Button>
      </div>
    </div>
  );

  const dialogActions = (
    <>
      <Button onClick={handleCancelClick} variant="outlined" size="large" disabled={isLoading}>
        {t('Cancel')}
      </Button>
      <Button 
        color="primary" 
        onClick={handleCreateClick} 
        variant="contained"
        size="large"
        disabled={isLoading}
      >
        {isLoading ? t('Creating...') : `${t('Create Medical Center')}${medicalCenters.length > 1 ? 's' : ''}`}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={`Create Medical Center${medicalCenters.length > 1 ? 's' : ''}`}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};

// Edit Medical Center Modal Component
const EditMedicalCenterModal = ({ open, onClose, onSubmit, medicalCenter, isLoading, mutationError }) => {
  const { t } = useTranslation('shared-components');
  const [formData, setFormData] = useState({ name: '', type: 'hospital', address: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Clean API errors when modal closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setApiError('');
        setErrors({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (medicalCenter && open) {
      setFormData({
        name: medicalCenter.name || '',
        type: medicalCenter.type || 'hospital',
        address: medicalCenter.address || ''
      });
      setApiError('');
      setErrors({});
    }
  }, [medicalCenter, open]);

  // Handle mutation errors
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError.response?.data?.message || t('Error updating medical center');
      
      // Handle unique constraint error specifically
      if (errorMessage.includes('Unique constraint failed') || errorMessage.includes('medical_center_name_key')) {
        setApiError(t('Hospital/Facility Name already exists'));
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
    if (!formData.type) {
      newErrors.type = t('This field is Required');
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

    onSubmit({ ...formData, id: medicalCenter.id });
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
    // Clear all errors before closing
    setApiError('');
    setErrors({});
    onClose();
  };

  const handleCancelClick = () => {
    // Clear all errors when cancel button is clicked
    setApiError('');
    setErrors({});
    onClose();
  };

  const handleUpdateClick = () => {
    // Clear API error when update button is clicked (validation will show field errors)
    setApiError('');
    handleSubmit();
  };

  if (!medicalCenter) return null;

  const dialogContent = (
    <div className="">
      {/* Name */}
      <div className="flex flex-col gap-2 pb-4">
        <Typography variant="subtitle1" className="font-medium">
          {t('Hospital/Facility Name')} *
        </Typography>
        <TextField
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          fullWidth
          error={!!errors.name}
          helperText={errors.name}
          placeholder={t('Enter medical center name')}
          disabled={isLoading}
        />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-2 pb-4">
        <Typography variant="subtitle1" className="font-medium">
          {t('Category')} *
        </Typography>
        <FormControl fullWidth error={!!errors.type}>
          <Select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={isLoading}
          >
            <MenuItem value="large_hospital">{t('Hospital: Large')}</MenuItem>
            <MenuItem value="hospital">{t('Hospital')}</MenuItem>
            <MenuItem value="welfare">{t('Welfare')}</MenuItem>
          </Select>

          {errors.type && (
            <Typography variant="caption" color="error">
              {errors.type}
            </Typography>
          )}
        </FormControl>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-2">
        <Typography variant="subtitle1" className="font-medium">
          {t('Address')}
        </Typography>
        <TextField
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder={t('Enter medical center address')}
          disabled={isLoading}
        />
      </div>
      
      {/* API Error Alert */}
      {apiError && (
        <Alert severity="error" sx={{ px:0, mb: 2, mt: 2 }}>
          {apiError}
        </Alert>
      )}
    </div>
  );

  const dialogActions = (
    <>
      <Button onClick={handleCancelClick} variant="outlined" size="large" disabled={isLoading}>
        {t('Cancel')}
      </Button>
      <Button
        color="primary"
        onClick={handleUpdateClick}
        variant="contained"
        size="large"
        disabled={isLoading}
      >
        {isLoading ? t('Updating...') : t('Update Medical Center')}
      </Button>
    </>
  );

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Edit Medical Center"
      maxWidth="sm"
      contentPadding={{ px: 4, py: 0 }}
      actions={dialogActions}
      disabled={isLoading}
    >
      {dialogContent}
    </CommonDialog>
  );
};