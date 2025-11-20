import Button from '@mui/material/Button';
import _ from '@lodash';
import { useEffect, useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import {createdAt} from '../../helpers/timeHelpers';
import {filterItemsEqual} from '../../helpers/commonHelpers';
import Grid from '@mui/material/Grid';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useAppDispatch } from 'app/store/hooks';
import { display, padding } from '@mui/system';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';
import * as FileSaver from 'file-saver';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';

import Filter from '@mui/icons-material/FilterAlt';
import { motion } from 'framer-motion';
import Typography from '@mui/material/Typography';
import * as XLSX from 'xlsx';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

 
import ButtonGroup from '@mui/material/ButtonGroup';
import { DatePicker } from 'antd';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import {format} from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));

const FileChoose = lazy(() => import('../../shared-components/file-choose/FileChoose'));
const SearchInput = lazy(() => import('../../shared-components/search-input/SearchInput'));
const Table = lazy(() => import('../../shared-components/table/TableCommon'));
const ReportModal = lazy(() => import('../../shared-components/modal/ReportModal')); 
const ButtonThree = lazy(() => import('./Button'));
const TablePatient = lazy(() => import('../../shared-components/table/TablePatient'));
const Paginate = lazy(() => import('../../shared-components/card/Paginate'));
const Drawer = lazy(() => import('./Drawer'));
const CenterItems = lazy(() => import('../../shared-components/card/CenterItems'));

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

 


 
function DPCAnalysis() {
	const dispatch = useAppDispatch();

	let tableName='new'
	let headingTitle='DPC Analysis'
	let keyConfig=[
	  {name:'dpc', type:'String', header:'DPC First 6 Digits', edit:1, validate:{required:1},   	 xlsx:'MDCｺｰﾄﾞ<+>分類ｺｰﾄﾞ'},
	  {name:'name', type:'String', header:'Injury and disease name',edit:1, validate:{required:1},   xlsx:'ICD名称'},
	  {name:'icd', type:'String', header:'ICD Code', edit:1, validate:{required:1},  				 xlsx:'ICDｺｰﾄﾞ'},
	  {name:'receipt', type:'Integer', header:'ID',edit:0, validate:{required:0},   				 xlsx:'<auto>'}
	]


	const { t } = useTranslation('shared-components');

	function onSubmit(data) {
		console.log(data);
	}


	const queryParameters = new URLSearchParams(window.location.search)
	const gethospitalization_days = queryParameters.get("hospitalization-days")
	const getType = queryParameters.get("type")

	const searchId = queryParameters.get("query")
	const cpage = queryParameters.get("page") || 0  

	console.log('nowwwww',cpage)


	const [loading, setLoading] = useState(true);

    const [data, setData] = useState([]);
	const [dataFromChild, setDataFromChild] = useState("");
	const [start, setStart] = useState(0);
	const [count, setCount] = useState(null);
	const [progress, setProgress] = useState(0);
	const [allowUpload, setAllowUpload] = useState(0);
	const [showUpload, setShowUpload] = useState(1);
	const [textUpload, setTextUpload] = useState(null);

	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const [resetComponents, setResetComponents] = useState(false);
	const [globalFilter, setGlobalFilter] = useState(null);
	const [fail_count_list, setFail_count_list] = useState(null);

	const [dpc_data, setDpc_data] = useState([]);

	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();

	

	const [c_verified, setCverified] = useState(0);
	const [c_n_verified, setCNverified] = useState(0);

	const [pageP, setPageP] = useState(cpage);
	const [rowP, setRowP] = useState(10);

	const [total_data, setTotal_data] = useState(0);

	const [is_verified, setIs_verified] = useState(null);

	let sl=(pageP*rowP)+1;

	const [filter_days, setFilterDays] = useState(null);
	const [filter_code, setFilterCode] = useState(null);
	const [filter_ward, setFilterWard] = useState(null);
 


	const [single_patient, setsingle_patient]   = useState([]);

	const [newval, setnewval] = useState('');
	const [newvalHospi, setnewvalHospi] = useState('');

	const [enableFilter, setEnableFilter] = useState(false);

	const [loading_, setLoading_] = useState(false);

	const [data_id, setdata_id] = useState(null);

	const [test, settest] = useState(true);
	

//////////////////Filter//////////////////
const [range_start, setrange_start] = useState('');
const [range_end, setrange_end] = useState('');
const [date_type, setDateType] = useState('admission_date');
const [patient_code, setPatientCode] = useState(null);
const [hospitalized_days, setHospitalized] = useState('');
const [dpcPattern, setDpcPattern] = useState('XXXXXX|X|X|XX|X|X|X|X');
const [typeDisPatient, setTypeDisPatient] = useState(null);
///////////////////////////////////



 

const [ signal, setSignal]  =useState('45');


	const dateFormat = 'YYYY/MM/DD';

	const [this_date, setthis_date] = useState(null);



	const handleDateChange = (value) => {   
    
		if(value!=null){ 
			console.log(value,'xxx22')
 		  setrange_start(format(value[0].$d,'yyyy/MM/dd')); setrange_end(format(value[1].$d,'yyyy/MM/dd'));    
		  setthis_date(format(value[0].$d,'yyyy/MM/dd')+","+format(value[1].$d,'yyyy/MM/dd'))
		 } 
		else{
	 
			setrange_start(null);
			 setrange_end(null); 
		}
	  };

	  const handleSingleDateStart = (value) => {   
		if(value!=null){ 
 		   setrange_start(format(value.$d,'yyyy/MM/dd'));    
		  //setthis_date(format(value[0].$d,'yyyy/MM/dd')+","+format(value[1].$d,'yyyy/MM/dd'))
		 } 
		else{
			  setrange_start(null);
			 //setrange_end(null); 
		}
	  };

	  const handleSingleDateEnd = (value) => {   
		if(value!=null){ 
 		   //setrange_start(format(value.$d,'yyyy/MM/dd'));    
		   setrange_end(format(value.$d,'yyyy/MM/dd'));  
		 } 
		else{
			 //setrange_start(null);
			 setrange_end(null); 
		}
	  };


	  const handleRadioChange = (event) => {   
		setDateType(event.target.value)
		//console.log(event.target.value)
		/*if(value!=null){ 
 		  setrange_start(format(value[0].$d,'yyyy-MM-dd')); setrange_end(format(value[1].$d,'yyyy-MM-dd'));    
		  setthis_date(format(value[0].$d,'yyyy-MM-dd')+","+format(value[1].$d,'yyyy-MM-dd'))
		 } 
		else{
	 
			setrange_start(null);
			 setrange_end(null); 
		}*/
	  };

	   



	  useEffect(() => {
		let gets=window.location.search
		 let getsarr=gets.split('=')
		 if(getsarr?.length>1){
		   console.log('cccccc', getsarr[1])
		  // setdata_id(getsarr[1])
		 }
	   }, []);








	  
 const { RangePicker } = DatePicker;
 

	/*-----------start common function shareable------------*/
	async function server(hospital) {

		const queryParameters = new URLSearchParams(window.location.search)
		const gethospitalization_days = queryParameters.get("hospitalization-days")

		if(gethospitalization_days){
			if(!hospitalized_days){
				return true;
			}
		}
 
		try {

			let id=null

			let queryParameters = new URLSearchParams(window.location.search)
			let query=queryParameters.get('query');

			if(query){
				id=parseInt(query)
			 // setdata_id(getsarr[1])
			}

				console.log(typeDisPatient,'typeDisPatient')

				 
                let page=queryParameters.get('page');
				let skip=rowP*pageP
				let take=rowP

				if(page){
					skip=rowP*page
					take=rowP
					setPageP(page)
				}  
				console.log('bbbb',page, pageP, rowP,id)

				if(dpcPattern != 'XXXXXX|X|X|XX|X|X|X|X'){
					skip=0
					setPageP(0)
					console.log(dpcPattern,'dpcPattern',skip)
				}


				let filter={
					...range_start?{range_start:range_start}:{},
					...range_end?{range_end:range_end}:{},
					...date_type?{date_type:date_type}:{},
					...patient_code?{patient_code:parseInt(patient_code)}:{},
					...hospitalized_days?{hospitalized_days:parseInt(hospitalized_days)}:{},
					...dpcPattern?{dpcPattern:dpcPattern}:{},
					...typeDisPatient?{typeDisPatient:typeDisPatient}:{},
					...id?{id:id}:{}
				}
				 

				const data = await axios.post(apiConfig.PatientDpcList +'?skip='+skip+'&take='+take, {hospital_id:hospital.id, is_verified:is_verified, ...filter?{ filter:filter }:{}});
				 
				let temp_count=data.data.data.count
 
				let temp1=0 // for not verify
				let temp2=0 // for verify
				let tempTotal=0

		 

				for(let m=0; m<temp_count.length; m++){
					if(temp_count[m].is_verified==1){
						
						temp2=temp_count[m]._count?.is_verified
					}else{
						temp1=temp_count[m]._count?.is_verified
					}
				}

				tempTotal=temp1+temp2

				setCNverified(temp1)
				setCverified(temp2)
				setTotal_data(tempTotal)
			
	 
				setDpc_data(data.data.data.list)

				//console.log(data.data.data.list,'data.data.data.list')

				let ld=localStorage.getItem("ld");
				data.data.data.list?.map(single => {
					if(ld){
						if(parseInt(ld)==single.id){
							patientDetails(single)
						}					
					}
				})


				setLoading(false)
				
		} catch (error) {
			//setFailAlert("Invalid File")
		}
	}



	function Export  (exceldata,filename) {


			 try {
					const fileType= 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset-UTF-8';
					const fileExtension = '.xlsx';
			
					const ws = XLSX.utils.json_to_sheet(exceldata);
					const wb = {Sheets: {'data': ws}, SheetNames: ['data']};
					const excelBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
					const data = new Blob ([excelBuffer], {type:fileType});
					FileSaver.saveAs(data, filename+fileExtension)	
			} catch (error) {
				
			} 

	   
	 
	  }


	async function download() {
		
		try {	 
			var scale=50
		  
			let total=total_data
			var per_page=0
			var total_page=0
			var last_page=0

					if(total>scale){
						per_page=scale
					
						total_page=parseInt(total/per_page)
						last_page=total-total_page*per_page 
					
					}else{
						total_page=0
						last_page=total
					}

			 
					const collection=[]
					let report_name=''

					let filter={
						...range_start?{range_start:range_start}:{},
						...range_end?{range_end:range_end}:{},
						...date_type?{date_type:date_type}:{},
						...patient_code?{patient_code:parseInt(patient_code)}:{},
						...hospitalized_days?{hospitalized_days:parseInt(hospitalized_days)}:{},
						...dpcPattern?{dpcPattern:dpcPattern}:{},
						...typeDisPatient?{typeDisPatient:typeDisPatient}:{}
					}
					 


			for (var i = 0; i <= total_page; i++) {
				var skip = i * per_page
				var get_items = per_page
				if (i == total_page) {
					per_page = last_page
				}

				let com = parseInt(((i + 1) / total_page) * 100)
			 
				//setcompleted(com)

				
 				const data = await axios.post(apiConfig.PatientDpcList +'?skip='+skip+'&take='+per_page, {hospital_id:hospital.id, is_verified:is_verified, ...filter?{ filter:filter }:{}});
				 
				console.log(data,'llll')

				for (var j = data.data.data.list.length - 1; j > -1; j--) {
				 
					var obj = data.data.data.list[j];

					collection.push({
						'患者 コード':obj.patient_code,
						'病棟':obj.ward,
						'入院日':obj.admission_date,
						'退院 予定日':obj.discharge_date,
						'入院 日数':obj.hospitalization_days,
						'DPCコード':obj.dpc_6+obj.and_1+obj.age_1+obj.sur_2+obj.tre1_1+obj.tre2_1+obj.sec_1+obj.sco_1
					});
				} 
			}; 

				console.log(collection,'dddddddddddd')
				Export(collection,'DPCエクスポート '+date_type+' '+range_start+' '+range_end+' '+hospitalized_days)
 
				
		} catch (error) {
			console.log(error,'dddddddddddd')
			//setFailAlert("Invalid File")
		}
	}


async function deleteAll(hospital_id) {
		
		try {

			//alert(hospital_id)
			const illnessClear = await axios.post(apiConfig.tableClear + 'dpc_generate'+'/remove-all', {hospital_id:hospital_id});
			let hospital={id:hospital_id}
			server(hospital) 
		} catch (error) {
				console.log(error,'dddddddddddd')
		}
}

	/*---------end common function shareable---------*/

	function handleDataFromChild(data) {
		console.log(data,'tusar')
		if(data.length>0){
			setAllowUpload(true)
			setData(data)
		}
	}


	function handleCountDataFromChild(count) {
		if(!count>0){
			setTextUpload(t('Upload'))
		}else{
			setTextUpload(t('Data replacement'))
		}
		setCount(count)
	}


	function handleActionFromSearch(action) {
		console.log(action,'actionx')
		setShowUpload(action)
		setSuccessAlert(null)
		setFailAlert(null)
		setAllowUpload(false)
	}

	function handleSetGlobalFilter(data) {
			setGlobalFilter(data)
	}

	function setPageParent(val) {
		setPageP(val)	 
	}
	
	function setRowParent(val) {
		setRowP(val)	 
	}
	
	function setVerified(val) {
		setIs_verified(val)	 
	}

	function keyup(event) {
		setPatientCode(event.target.value)
		setnewval(event.target.value)
	}
 
	function keyupHospitalization(event) {
		setHospitalized(event.target.value)
		setnewvalHospi(event.target.value)
	}
	function keyuDpcattern(event) {
		setDpcPattern(event.target.value)
	}

	function verify() {
		server(hospital);
		dispatch(showMessage({
			message: 'データの更新に成功しました',
			autoHideDuration: 2000,
			anchorOrigin: {
				vertical: 'top',
				horizontal: 'right'
			}
		}))
	}

	function patientDetails(val) {
		settest(false)

		let arr_amount=JSON.parse(val.arr_amount)
		let arr_date=JSON.parse(val.arr_date)
		let arr_dept=JSON.parse(val.arr_dept)
		let arr_disease=JSON.parse(val.arr_disease)
		let arr_doctor=JSON.parse(val.arr_doctor)
		let arr_name=JSON.parse(val.arr_name)
		let arr_receipt=JSON.parse(val.arr_receipt)
		let arr_color=JSON.parse(val.arr_color)
		//new
		let arr_treno=JSON.parse(val.arr_treno)
		let arr_icd=JSON.parse(val.arr_icd)


		let obj_ = arr_receipt.map((value, index) => ({ receipt: value, name: arr_name[index], doctor: arr_doctor[index], color:arr_color[index], disease: arr_disease[index], dept: arr_dept[index], date: arr_date[index], amount: arr_amount[index], treno: arr_treno[index] , icd: arr_icd[index]  }));
		setsingle_patient({all:obj_,ward:val.ward,dpc_data:val})
		 //console.log({all:obj_,ward:val.ward})
	}

	useEffect(() => { 
		setHospitalized(gethospitalization_days);  
		setEnableFilter(true)
		setnewvalHospi(gethospitalization_days)
		setTimeout(myTimer, 1000);
	}, [gethospitalization_days]);


	useEffect(() => { 
		if(getType){
			setTypeDisPatient(getType)
			setEnableFilter(true)
			setTimeout(myTimer, 1000);
		}
	}, [getType]);	


	useEffect(() => { 
		setPageP(cpage);  
 	}, [cpage]);

	
	useEffect(() => { 
 		//
		if(pageP >-1){
			server(hospital);  
		}
	
	}, [pageP, rowP, is_verified, range_start, range_end, date_type , patient_code, dpcPattern,typeDisPatient, hospitalized_days, loading_]);

 
	

	function myTimer() {
		//if(hospitalized_days>-1){
			console.log('xxx',9)
				setLoading_(true)
	//	}
		
	}


	useEffect(() => {  toggleTheme(t(headingTitle));   }, [t(headingTitle)]);

	function FunEnableFilter() {
		if(enableFilter==true){
			setEnableFilter(false)	 
		}else{
			setEnableFilter(true)	
		}
		
	}

	///here from
	/*useEffect(() => {  
		setPageP(cpage)
	   }, [cpage]);*/


		
	function closePa(){
		console.log('9999999999', pageP)
		let queryParameters = new URLSearchParams(window.location.search)
		let page=queryParameters.get('page') || 0;

 

		let hospitalization=queryParameters.get('hospitalization-days')
		let urls='?page='+page
		
		if(hospitalization){
		  urls=urls+'&hospitalization-days='+hospitalization
		}



		window.history.pushState('hospital', 'hospital', '/hospital/dpc-analysis'+urls);
		settest(true)
 	//	setsingle_patient([])	
		//let hospital={id:hospital_id}
		server(hospital) 
	}








	

	return (
		<Root
			header={
				<div className="p-24 hidden-on-large">
					<h4>{t(headingTitle)} </h4>
				</div>
			}
			content={


				
				<div className=" p-24 sm:p-40 container">


					{successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}
					{failAlert != null && <ReportModal data={fail_count_list} />}

					<p style={{display:" none"}} >
						

					</p>					

 
  
						{test==false ?

						<Drawer single_patient={single_patient} keyup={keyup} signal={signal} closePa={closePa} className="hidden"verify={verify}/> 

:
<>

					<div class="grid md:grid-cols-6 xs:grid-cols-2 gap-4 mb-5" >
						<div class="col-span-2 ...">	 
							<ButtonThree setVerified={setVerified} x_n_verify={c_n_verified} x_y_verify={c_verified} x_T_data={total_data} c_n_verified={c_n_verified} c_verified={c_verified} />	 
						</div>
						<div class=" col-span-1 ..."> </div>	
						<div class=" col-span-1 ..."> 
							<DatePicker style={{ width: "90%","margin-left":"4%" }} placeholder={t("Start Date")} onChange={handleSingleDateStart} format={dateFormat} />
							<DatePicker style={{ width: "90%","margin-left":"4%" }} placeholder={t("End Date")} onChange={handleSingleDateEnd} format={dateFormat} />
						</div>	
						<div class=" col-span-2 ..."> 
						


								<RangePicker style={{ width: "100%" }} onChange={handleDateChange} format={dateFormat} />

								<RadioGroup onChange={handleRadioChange} value={date_type} row aria-labelledby="demo-row-radio-buttons-group-label" name="row-radio-buttons-group">
									<FormControlLabel value="admission_date" control={<Radio />} label="入院日" />
									<FormControlLabel value="discharge_date" control={<Radio />} label="退院日" />
									<FormControlLabel value="date_of_birth" control={<Radio />} label="生年月日" />
								</RadioGroup>



						</div>
					</div>

					

					<motion.div class="grid md:grid-cols-6  xs:grid-cols-1  flex justify-between mb-10 mt-10 ..."
					style={{ "background": "azure", "padding": "10px", "border-radius": "10px" }}>
						    <motion.div><TextField  size="small" id="standard-basic" label="患者コード" className="  " style={{ width: '100%' }} onChange={keyup} value={newval}   /></motion.div>
							<motion.div className=" ml-10" ><TextField  size="small" type="number" inputProps={{ min: 0, max: 100 }} id="standard-basic" label="入院日数"style={{ width: '100%' }} onChange={keyupHospitalization} value={newvalHospi}  /></motion.div>
							<motion.div className="ml-10" ><TextField  size="small" id="standard-basic" label="DPCパターン"style={{ width: '100%' }} onChange={keyuDpcattern} value={dpcPattern}  /></motion.div>
							<motion.div  class="ml-64 col-span-3  flex justify-between" > 								
							 
									<Button size="small" variant="" style={{ 'border': '1px' }}
									onClick={() => { download() }}
									endIcon={<Close />}> ダウンロード </Button>	 

									<Button size="small" variant="" style={{ 'border': '1px' }}

									onClick={() => {
										if (window.confirm(t('Are you sure to continue?'))) {
											deleteAll(hospital.id)
											window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
											
										}
									}}




									 
									endIcon={<DeleteForever />}> すべて削除 </Button>	

								 
								<Paginate  total_data={total_data} setRowParent={setRowParent} setPageParent={setPageParent} />
							</motion.div>
					</motion.div>	

					<table class="dpc dpc-table p-10 mt-2    transition ease-in-out   bg-white hover:-translate-y-1 hover:scale-104 hover:bg-white-50 duration-300 ">
						  <tr>
						    <td class=" width_single text-center new_t_color_head" rowspan="2">SL</td>
						    <td class="width_double new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">患者 コード </div>
						      </span>
						    </td>
						    <td class="width_double new_t_color_head  text-left">
						      <span class="dpc">
						        <div class=" ">ドクター名</div>
						      </span>
						    </td>
						    <td class="width_single new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">病棟</div>
						      </span>
						    </td>
						    <td class="width_double new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">入院日</div>
						      </span>
						    </td>
						    <td class="width_double new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">退院 予定日</div>
						      </span>
						    </td>
						    <td class="width_single new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">入院 日数</div>
						      </span>
						    </td>
						    <td class="width_single new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">今期 患者数</div>
						      </span>
						    </td>
						    <td class="width_single new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">過去 患者数</div>
						      </span>
						    </td>
						    <td class="width_single new_t_color_head text-left">
						      <span class="dpc">
						        <div class=" ">入院 期間Ⅱ</div>
						      </span>
						    </td>
						    <td class=" width_button text-center border-right-zero new_t_color_head" rowspan="2">
							アクション
						    </td>
						  </tr>
		 
						</table>			 
					
					<div class="grid md:grid-cols-1 xs:grid-cols-1 gap-4">
					{dpc_data?.map(single => (
							<TablePatient className="mt-24 " patientDetails={patientDetails} sl={sl++} data={single} verify={verify} />
						))}
					</div>

					{/*<div class="grid md:grid-cols-1 xs:grid-cols-1   gap-4">
						<div class="flex justify-end ">
							<motion.div><Paginate total_data={total_data} setRowParent={setRowParent} setPageParent={setPageParent} /></motion.div>
						</div>
					</div>*/}
 
					{dpc_data.length == 0 && loading == false &&
 						<CenterItems text1={'何もデータが見つかりませんでした'} icon={1}/>
					}

</>



						}

					





 
				</div>
			}
	/>

	);
}

export default DPCAnalysis;
