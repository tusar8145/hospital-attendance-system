import { Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const FilterButton = styled(Button)(({ theme, selected }) => ({
  backgroundColor: selected ? theme.palette.primary.main : 'transparent',
  color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.action.hover,
    borderColor: selected ? theme.palette.primary.dark : theme.palette.divider,
  },
}));

export const CommonHeader = ({ 
  title, 
  filterType, 
  onFilterChange, 
  onCreate,
  filterOptions,
  createButtonText
}) => {
  const { t } = useTranslation('shared-components');

  return (
    <div className="p-24">
      <div className="flex justify-between items-center">
        <Typography variant="h4" className="font-bold">
          {t(title)}
        </Typography>
        {createButtonText && <Button
          color="primary"
          onClick={onCreate}
          startIcon={<AddIcon />}
          variant="contained"
        >
          {t(createButtonText)}
        </Button>}
      </div>
      <div className="flex gap-12 mt-16">
        {filterOptions?.map((option) => (
          <FilterButton 
            key={option.value}
            variant="outlined"
            selected={filterType === option.value}
            onClick={() => onFilterChange(option.value)}
          >
            {t(option.label)}
          </FilterButton>
        ))}
      </div>
    </div>
  );
};