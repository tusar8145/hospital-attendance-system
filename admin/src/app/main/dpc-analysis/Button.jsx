import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import BallotIcon from '@mui/icons-material/Ballot';
import PendingIcon from '@mui/icons-material/Pending';
import Fingerprint from '@mui/icons-material/Fingerprint';
import { useTranslation } from 'react-i18next';

export default function ButtonThree(props) {
    const { t } = useTranslation('shared-components');
    const [value, setValue] = React.useState(0);
    return (<Box style={{width:'100%'}}>
      <BottomNavigation showLabels value={value} onChange={(event, newValue) => {
            setValue(newValue);
 
            if(newValue==0){ props.setVerified(null)  }
            if(newValue==1){ props.setVerified(1)  }
            if(newValue==2){ props.setVerified(0)  }

        }}>
        <BottomNavigationAction label={`全て (${props.x_T_data})`} icon={<BallotIcon />}/>
        <BottomNavigationAction label={`確定 (${props.x_y_verify})`}  icon={<Fingerprint />}/>
        <BottomNavigationAction label={`未確定 (${props.x_n_verify})`} icon={<PendingIcon />}/>
      </BottomNavigation>
    </Box>);
}


{/*
import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

export default function ButtonThree() {
    const { t } = useTranslation('shared-components');
 
    return ( 
<div class="flex justify-between ..." style={{"justify-content":"space-between"}}>
  <div><Button color="secondary"  variant="outlined">{t('All')}</Button></div>
  <div><Button color="success" variant="contained"> {t('Already checked')} </Button></div>
  <div><Button color="secondary" variant="outlined"> {t('Not inspected')} </Button></div>
</div>



      
      
      
   );
 

 /*<div class="flex justify-between ...">
  <div class="py-4"><Button color="secondary">{t('All')}</Button> </div>
  <div class="py-12"><Button color="success" variant="contained"> {t('Already checked')} </Button> </div>
  <div class="py-8"><Button color="secondary" variant="outlined"> {t('Not inspected')} </Button> </div>
</div>*/}