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
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useAppDispatch } from 'app/store/hooks';
import {excelSerialNumberToJSDate} from '../../helpers/commonHelpers';

const FileChoose = lazy(() => import('../../shared-components/file-choose/FileChoose'));
const SearchInput = lazy(() => import('../../shared-components/search-input/SearchInput'));
const Table = lazy(() => import('../../shared-components/table/TableCommon'));
const ReportModal = lazy(() => import('../../shared-components/modal/ReportModal')); 
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


 
function DataUpload() {
 
	const dispatch = useAppDispatch();

	let tableName='new'
	let headingTitle='Data Upload'
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

	const [loading, setLoading] = useState(false);

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

	const { hospital, toggleHospital } = useTheme();
	const [ser_error, setser_error] = useState(false);
 
	const [is_surgery_file, setis_surgery_file] = useState(null);




	/*-----------start common function shareable------------*/
	async function server(type,hospital) {
				 					

		try {
				//const illnessClear = await axios.post(apiConfig.tableClear + tableName+'/remove-all', {});
				console.log( 'responsezz1')

				let clock=createdAt()
				let fail_count=0
				let fail_data=[]
				let obj = []
				let obj_col=[]
				var counts = 0
				var done = 0
				let len = data.length
 				let auto=1



				let first_loop_collect=[]
				let receipt_obj=[]
				let items_obj=[]
				let amount_obj=[]

				let doctor_obj=[]
				let date_obj=[]
				let dept_obj=[]
				let disease_obj=[]

				//new
				let treno_obj=[]
				let icd_obj=[]

				let final_data=[]


				function clear_data(){
					first_loop_collect=[]
					receipt_obj=[]
					items_obj=[]
					amount_obj=[]

					 doctor_obj=[]
					 date_obj=[]
					 dept_obj=[]
					 disease_obj=[]
					 //new
					 treno_obj=[]
					 icd_obj=[]
				}

				function assign_data(this_,hospital){
					
						//data only first loop
						if(first_loop_collect.length==0){
 
							first_loop_collect.push({
								patient_code:this_['患者コード'],
								doctor:this_['医師(会計)'],
								ward:this_['病棟'],
								icd_code:this_['医療資源を最も投入した傷病のＩＣＤコード'],
								admission_date:excelSerialNumberToJSDate(this_['入院日(DPC入院情報)']),
								discharge_date:excelSerialNumberToJSDate(this_['退院日(DPC入院情報)']),
								treatment_date:excelSerialNumberToJSDate(this_['会計日']),
								date_of_birth:excelSerialNumberToJSDate(this_['生年月日']),

								hospitalization_days:3,
								hospital_id:hospital.id,
							})							
						}

						
						//data every loop
						receipt_obj.push(this_['レセプト電算用マスタコード'])
						items_obj.push(this_['算定項目'])
						amount_obj.push(this_['点数・金額'])

						doctor_obj.push(this_['医師(会計)'])
						date_obj.push(this_['会計日'])
						dept_obj.push(this_['診療科(DPC入院情報)'])
						disease_obj.push(this_['申込病名'])
						//new
						treno_obj.push(this_['診療NO名称'])
						icd_obj.push(this_['医療資源を最も投入した傷病のＩＣＤコード'])
				}

				 let operation_count=0

				 let c_patient=null
				 let p_patient=null



				let surgery=[]
				 if(is_surgery_file==1){
 
					//update surgery code
					for (var i = 0; i < len; i++) {
						let this_ = data[i]

						surgery.push({
							patient_code:this_['患者コード'],
							k_code:this_['DPC入院情報手術Kコード'],

							treatment_date:excelSerialNumberToJSDate(this_['DPC入院情報手術日']),
							discharge_date:excelSerialNumberToJSDate(this_['退院日']),
							admission_date:excelSerialNumberToJSDate(this_['入院日']),

							arr_disease:this_['算定項目'],
							points:this_['点数・金額'],

						})

					}
					console.log(surgery,'surgeryccc')
					const responsec = await axios.post(apiConfig.PatientDpcUpdateCode, {data:surgery, hospital_id:hospital.id});
					console.log(responsec,'surgery')
					
				 }else{
						for (var i = 0; i < len; i++) {
							let this_ = data[i]
							c_patient=this_['患者コード']

							if(p_patient==null){p_patient=c_patient } //initial

							if(c_patient==p_patient){ //continue data collect //same persion
								assign_data(this_,hospital)



							}else{
								//ager data gula store korte hobe
								//axios
								//console.log(first_loop_collect,receipt_obj,items_obj,amount_obj)
								operation_count++
								final_data.push({
									first_loop_collect:first_loop_collect[0],
									receipt_obj:receipt_obj,
									items_obj:items_obj,
									amount_obj:amount_obj,

									doctor_obj:doctor_obj,
									date_obj:date_obj,
									dept_obj:dept_obj,
									disease_obj:disease_obj,
									//new
									treno_obj:treno_obj,
									icd_obj:icd_obj,
								})


								//new store start korte hobe
								clear_data()
								assign_data(this_,hospital)
								p_patient=c_patient

							}

							//last index where new patient absent
							if(i == len-1){
								operation_count++
								final_data.push({
									first_loop_collect:first_loop_collect[0],
									receipt_obj:receipt_obj,
									items_obj:items_obj,
									amount_obj:amount_obj,

									doctor_obj:doctor_obj,
									date_obj:date_obj,
									dept_obj:dept_obj,
									disease_obj:disease_obj,
									//new
									treno_obj:treno_obj,
									icd_obj:icd_obj,
								})
							}


							done++

							if ((operation_count == 10) || (i == parseInt(len) - 1)) {
								var cal_per = parseInt((done / len) * 100)
								setProgress(cal_per)
 
								console.log(final_data,'final_data')
								const response = await axios.post(apiConfig.PatientDpcCreate, final_data);
								final_data = []
								operation_count = 0

								if(response.data.success=='error'){
									console.log('responsezz')
									dispatch(showMessage({  message: t('Invalid file')+'. '+response.data.message, autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: response.data.success }))    
									setser_error(true)
								}

								
							}
						}
				 }






				 
				setAllowUpload(false)


 

				setFail_count_list(fail_data)

				if(fail_count==0){setSuccessAlert("Data uploaded successfully")}else{setFailAlert(fail_count+ " Data upload failed")}
				setis_surgery_file(null)
				setShowUpload(0)
				setProgress(0)		
				setShowUpload(1)	
		} catch (error) {
			console.log( 'responsezz12')
			console.log(error,'error')
			setProgress(0)	
			setFailAlert("Invalid File")
		}
	}
	/*---------end common function shareable---------*/

	function handleDataFromChild(data) {
		console.log(data,'tusar')
		if(data.length>0){
			setAllowUpload(true)
			setData(data)
			if(data[0]['DPC入院情報手術Kコード']){
		 
				setis_surgery_file(1)

			 }else{
				setis_surgery_file(0)
			 }
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
		console.log(data,'tusar')
			setGlobalFilter(data)
	}
	

	const { theme, toggleTheme } = useTheme();

	
	useEffect(() => {  toggleTheme(t(headingTitle))  }, [t(headingTitle)]);

	return (
		<Root
			header={
				<div className="p-24 hidden-on-large">
					<h4>{t(headingTitle)} </h4>
				</div>
			}
			content={
				<div className="flex flex-col items-center p-24 sm:p-40 container">

					{successAlert != null && ser_error==false && <Alert severity="success">{t(successAlert)}.</Alert>}
					{failAlert != null &&  ser_error==false && <Alert severity="error">{t(failAlert)}..</Alert>}
					{failAlert != null &&   ser_error==false && <ReportModal data={fail_count_list}/> }

					

					{is_surgery_file == 1 && <Alert severity="success">{t('Surgery Data Found')}.</Alert>}
					{is_surgery_file == 0 && <Alert severity="success">{t('Service Data Found')}.</Alert>}

					{/*File upload*/}
					{showUpload == 1 &&
						<div className="flex flex-col w-full max-w-4xl">
							<FileChoose progress={progress} sendDataToParent={handleDataFromChild} textUpload={textUpload} resetComponents={resetComponents} enableUpload={handleActionFromSearch} start={start} keyConfig={keyConfig} disableBack={true}/>
							<div className="flex  justify-center mt-32">
								<Button

									disabled={!(allowUpload)}
									onClick={() => {
										let msg = ""
										let type='replace'
										if (textUpload == "Data replacement") {
											msg = "Are you sure to replace old data with new data?"
										} else { msg = "Are you sure to continue?"
										type='upload' }
										if (window.confirm(t(msg))) {
											server(type,hospital)
											window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
											
										}
									}}
									className="mx-8"
									variant="contained"
									color="success"
									type="submit"
								>
									{t("Upload")}
								</Button>
							</div>
						</div>
					}




				</div>
			}
	/>

	);
}

export default DataUpload;
