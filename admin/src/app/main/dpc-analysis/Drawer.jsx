import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FilterList from '@mui/icons-material/FilterList';
import Input from '@mui/material/Input';
import { useEffect, useState, useRef } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Paper from '@mui/material/Paper';
import Close from '@mui/icons-material/Close';
import '../../../styles/table-html.css';
import { lazy } from 'react';
import {  useWindowHeight,
} from '@react-hook/window-size'
const TablePatient = lazy(() => import('../../shared-components/table/TablePatient'));

export default function TemporaryDrawer(props) {
  const [newval, setnewval] = useState('');
  const [single_patient_rec, setSinglePatientRec] = useState([]);
  const [nTable, setnTable] = useState([]);
  const onlyHeight = useWindowHeight()
  const [newheight, setnewheight] = useState(0);

  


  useEffect(() => {
    let xx=onlyHeight
    let yy=parseInt(xx)-(parseInt(xx)*(30/100))
    setnewheight(yy)
  }, [onlyHeight]);



  const [state, setState] = React.useState({
    top: false, 
    left: false,
    bottom: false,
    right: false,
  });
  const toggleDrawer = (anchor, open) => (event) => {
    

    if(open==false){
      
      props.closePa()
      localStorage.removeItem("ld");
    }
 
    if (event.type === 'keydown' &&
      (event.key === 'Tab' ||
        event.key === 'Shift')) {
      return;
    }
    setState({ ...state, [anchor]: open });
  };



  const list = (anchor) => (<Box sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }} role="presentation" onClick={toggleDrawer(anchor, false)} onKeyDown={toggleDrawer(anchor, false)}>
    <List>
      {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (<ListItem key={text} disablePadding>
        <ListItemButton>
          <ListItemIcon>
            {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
          </ListItemIcon>
          <ListItemText primary={text} />
        </ListItemButton>
      </ListItem>))}
    </List>
    <Divider />
    <List>
      {['All mail', 'Trash', 'Spam'].map((text, index) => (<ListItem key={text} disablePadding>
        <ListItemButton>
          <ListItemIcon>
            {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
          </ListItemIcon>
          <ListItemText primary={text} />
        </ListItemButton>
      </ListItem>))}
    </List>
  </Box>);

  function handleChange(event) {
    // if(event.target.value){
    props.keyup(event.target.value)
    //}  
    setnewval(event.target.value)
    //
  }

  const [spacing, setSpacing] = React.useState(2);

  const jsx = ` <Grid container spacing={${spacing}}> `;

  /////////////////////

  const buttonRef = useRef(null);
  const [counter, setCounter] = useState(0);

  function clickHandler(event) {
    setCounter((prev) => prev + 1);
  }


  ////////////////////////
  useEffect(() => {
    if (props.single_patient.length != 0) {
      buttonRef.current.addEventListener('click', clickHandler);
      buttonRef.current.click();
    }

    
    let datat=props.single_patient
    setSinglePatientRec(datat)

    try {
        if(datat.dpc_data){
          setnTable(datat.dpc_data)
          console.log(datat.dpc_data, 'datat.dpc_data')
        }      
    } catch (error) {
    }

 

  }, [props.single_patient]);

function  excelSerialNumberToJSDate  (serial)  {

  if(serial>0){

     const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
  
    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
  
    let totalSeconds = Math.floor(86400 * fractionalDay);
  
    let seconds = totalSeconds % 60;
  
    totalSeconds -= seconds;
  
    let hours = Math.floor(totalSeconds / (60 * 60));
    let minutes = Math.floor(totalSeconds / 60) % 60;   

    var year    = dateInfo.getFullYear()  
    var month   = dateInfo.getMonth()+1
    var day     = dateInfo.getDate()

    if(month.toString().length == 1) {
        month = '0'+month;
   }
   if(day.toString().length == 1) {
        day = '0'+day;
   }   

    return  year+'/'+month+'/'+day;

  }else{
    return  serial;
  }
  };


  function verify() {
    props.verify()
   // setIsRefetching(true)
  }

  function done() {
    localStorage.removeItem("ld");
  }

 
 
  //console.log(size.get(),'?????????????????????????'); 

  return (<div class=" ">
 


      <IconButton style={{"display":"none"}} aria-label="fingerprint" ref={buttonRef}
        onClick={toggleDrawer('top', true)}
        color="success"><FilterList /></IconButton>


 


 
 

   
            <table style={{width:"100%"}}>
                <tr style={{"border":"0px"}}>
                <th className='width_single text-center bg-[#6d8fccf0] text-white mb-10' colSpan={8} style={{"border":"0px"}}>
                DPCコード
                </th>
                <th className='width_single text-right mb-10 bg-[#91abda]' colSpan={1} style={{"border":"0px"}}>
                    <Button  size="small" variant="contained"  
                  
                     onClick={()=>{
                      props.closePa()

                      
                      localStorage.removeItem("ld");
                     }   }

                      endIcon={<Close />}>
                      近い
                    </Button>                    
                  </th>
                </tr>
      
              </table>
              
            <TablePatient className="mt-24 " patientDetails={null} sl={1} data={nTable} basic={1}    verify={verify}/>
        

            <br/>

        

            <div class="gridx">
            <div class="grid-containerx" style={{height:newheight+"px"}}>
              <table className='scrollable'>
                <tr style={{"border":"0px"}}>
                <th className='width_single text-center bg-[#6d8fccf0] text-white mb-10' colSpan={5} style={{"border":"0px"}}>
                患者データ
                </th>
                <th className='width_single text-right mb-10 bg-[#91abda]' colSpan={3} style={{"border":"0px"}}>
                          
                  </th>
                </tr>
                <tr>
                  <th className=' border width_single'>ICD</th>
                  <th className=' border width_double'>申込病名</th>
                  <th className=' border width_double'>レセ電</th>
                  <th className=' border width_single'>診療 NO 名称</th>
                  <th className=' border .t-left width_big'>レセ電名称</th>
                  <th className=' border width_single'>単価</th>
                  <th className=' border width_single'>診区</th>
                  <th className=' border width_double'>実施日</th>
                </tr>
                {single_patient_rec?.all?.map((_item) => (
                  <tr style={{ color:_item.color.split("?")[0], 
                    ..._item.color.split("?")[0] != 'black'? { border: '2px solid '+_item.color.split("?")[0],} :{}
                 
                  
                  }} title={_item.color.split("?")[1]}>
                    <td className=' border t-left'>{_item.icd}</td>
                    <td className=' border t-left'>{_item.disease}</td>
                    <td className=' border t-center'>{_item.receipt}</td>
                    <td className=' border t-left'>{_item.treno}</td>                   
  
                    <td className=' border t-left'>{_item.name}</td>
                    <td className=' border t-right'>{_item.amount}</td>
                    <td className=' border t-left'>{single_patient_rec.ward}</td>
                    <td className=' border t-center'>{excelSerialNumberToJSDate(_item.date)}</td>
                  </tr>
                ))}

              </table>
</div>
</div>


     

            {/*<Grid key={1}>
              <IconButton aria-label="fingerprint"
                onClick={toggleDrawer('top', false)}
                color="error"><Close/></IconButton>
            </Grid>*/}


 
 
 

        {/* <div className="flex flex-col items-center container">
 
 
           <Typography className='m-20 p-24 text-center item-center' >
                患者コードでフィルタリング :
                    <Input
                        className={'flex flex-1 mx-8  '}
                        name="content"
                        value={newval}
                        style={{width:'350px', marginLeft:'40%'}}

                        onChange={handleChange}	 
                    />
           
           </Typography>    
 


    </div>*/}
 
 
  </div>);
}