import Button from '@mui/material/Button';
import _ from '@lodash';
import { useEffect, useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import {createdAt} from '../../../helpers/timeHelpers';
import {filterItemsEqual} from '../../../helpers/commonHelpers';

const FileChoose = lazy(() => import('../../../shared-components/file-choose/FileChoose'));
const SearchInput = lazy(() => import('../../../shared-components/search-input/SearchInput'));
const Table = lazy(() => import('../../../shared-components/table/TableCommon'));
const ReportModal = lazy(() => import('../../../shared-components/modal/ReportModal')); 
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








 
function DPCDisease() {

	let tableName='dpc_disease_classi'
	let headingTitle='DPC Disease Classification'
	let keyConfig=[
		{name:'dpc_6', type:'String', header:'A', edit:0, validate:{required:0},		  xlsx:'XA'},
		{name:'and_1', type:'String', header:'B', edit:0, validate:{required:0},		  xlsx:'XB'},
		{name:'age_1', type:'String', header:'C', edit:0, validate:{required:0},		  xlsx:'XC'},
		{name:'sur_2', type:'String', header:'D', edit:0, validate:{required:0},		  xlsx:'XD'},
		{name:'tre1_1', type:'String', header:'E', edit:0, validate:{required:0},		  xlsx:'XE'},
		{name:'tre2_1', type:'String', header:'F', edit:0, validate:{required:0},		  xlsx:'XF'},
		{name:'sec_1', type:'String', header:'G', edit:0, validate:{required:0},		  xlsx:'XG'},
		{name:'sco_1', type:'String', header:'H', edit:0, validate:{required:0},		  xlsx:'XH'},
		{name:'receipt', type:'Integer', header:'ID',edit:0, validate:{required:0},						xlsx:'<auto>'}
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
	const [showUpload, setShowUpload] = useState(0);
	const [textUpload, setTextUpload] = useState(null);

	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const [resetComponents, setResetComponents] = useState(false);
	const [globalFilter, setGlobalFilter] = useState(null);
	const [fail_count_list, setFail_count_list] = useState(null);


	/*-----------start common function shareable------------*/
	async function server(type) {
											

		try {

			function removeDuplicates(arr) {
				return arr.filter((item,
					index) => arr.indexOf(item) === index);
			}


				const illnessClear = await axios.post(apiConfig.tableClear + tableName+'/remove-all', {});
			
				let clock=createdAt()
				let fail_count=0
				let fail_data=[]
				let obj = []
				let obj_col=[]
				var counts = 0
				var done = 0
				let len = data.length
 				let auto=1



				let  dpc_6  =''
				let  and_1  =''
				let  age_1  =''
				let  sur_2  =''
				let  tre1_1 =''
				let  tre2_1 =''
				let  sec_1  =''
				let  sco_1  =''

				let  codes  =''
				
				let result=''

				let key_code=''
				let key_result=[]

				let allow_up=0

				//console.log(data.length,'key_result',data)

				for (var i = 0; i < len; i++) {
					
					console.log(i)
					let this_ = data[i]
					

					let array={}
					let empty=0
 
					
					let x_dpc_6  =this_['A'].substring(0, 6);
					let x_and_1  =this_['A'].substring(6, 7);
					let x_age_1  =this_['A'].substring(7, 8);
					let x_sur_2  =this_['A'].substring(8, 10);
					let x_tre1_1 =this_['A'].substring(10, 11);
					let x_tre2_1 =this_['A'].substring(11, 12);
					let x_sec_1  =this_['A'].substring(12, 13);
					let x_sco_1  =this_['A'].substring(13, 14);
					let x_codes=this_['A']


					if(key_code==''){   //only run first time
						
						key_code=x_dpc_6

						dpc_6  =x_dpc_6
						and_1  =x_and_1
						age_1  =x_age_1
						sur_2  =x_sur_2
						tre1_1 =x_tre1_1
						tre2_1 =x_tre2_1
						sec_1  =x_sec_1
						sco_1  =x_sco_1

						codes=x_codes

					}

					else if(x_dpc_6==key_code){ //continue merge

						
						dpc_6  =x_dpc_6
						and_1  =and_1+','+x_and_1
						age_1  =age_1+','+x_age_1
						sur_2  =sur_2+','+x_sur_2
						tre1_1 =tre1_1+','+x_tre1_1
						tre2_1 =tre2_1+','+x_tre2_1
						sec_1  =sec_1+','+x_sec_1
						sco_1  =sco_1+','+x_sco_1

						codes=codes+','+x_codes

					}else{
						//new assign
						

						//binding
 
						key_result.push({
							  receipt:auto,
							  dpc_6  : removeDuplicates(dpc_6.split(",")).join(','),
							  and_1  : removeDuplicates(and_1.split(",")).join(','),
							  age_1  : removeDuplicates(age_1.split(",")).join(','),
							  sur_2  : removeDuplicates(sur_2.split(",")).join(','),
							  tre1_1 : removeDuplicates(tre1_1.split(",")).join(','),
							  tre2_1 : removeDuplicates(tre2_1.split(",")).join(','),
							  sec_1  : removeDuplicates(sec_1.split(",")).join(','),
							  sco_1  : removeDuplicates(sco_1.split(",")).join(','),
							  codes  : removeDuplicates(codes.split(",")).join(','),
 

							  "created_at":clock,
							  "updated_at":clock,
							  "created_by": 1
						})
						auto++


							//now
						dpc_6  =x_dpc_6
						and_1  =x_and_1
						age_1  =x_age_1
						sur_2  =x_sur_2
						tre1_1 =x_tre1_1
						tre2_1 =x_tre2_1
						sec_1  =x_sec_1
						sco_1  =x_sco_1

						key_code=dpc_6

						codes=x_codes

					}


					//last row?
					if(i == len-1){
						key_result.push({
							receipt:auto,
							dpc_6  : removeDuplicates(dpc_6.split(",")).join(','),
							and_1  : removeDuplicates(and_1.split(",")).join(','),
							age_1  : removeDuplicates(age_1.split(",")).join(','),
							sur_2  : removeDuplicates(sur_2.split(",")).join(','),
							tre1_1 : removeDuplicates(tre1_1.split(",")).join(','),
							tre2_1 : removeDuplicates(tre2_1.split(",")).join(','),
							sec_1  : removeDuplicates(sec_1.split(",")).join(','),
							sco_1  : removeDuplicates(sco_1.split(",")).join(','),

							codes  : removeDuplicates(codes.split(",")).join(','),

							"created_at":clock,
							"updated_at":clock,
							"created_by": 1
					  })
					  auto++
					}
				}

				

				const response = await axios.post(apiConfig.tableCreate + tableName+'/create', key_result);

				setFail_count_list(fail_data)

				if(fail_count==0){setSuccessAlert("Data uploaded successfully")}else{setFailAlert(fail_count+ " Data upload failed")}
				
				setShowUpload(0)
				setProgress(0)			
		} catch (error) {
			console.log(error)
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
	const { hospital, toggleHospital } = useTheme();
	
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

					{successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}
					{failAlert != null &&  <ReportModal data={fail_count_list}/> }

					{/*File upload*/}
					{showUpload == 1 &&
						<div className="flex flex-col w-full max-w-4xl">
							<FileChoose progress={progress} sendDataToParent={handleDataFromChild} textUpload={textUpload} resetComponents={resetComponents} enableUpload={handleActionFromSearch} start={start} keyConfig={keyConfig} />
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
											server(type)
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


					{showUpload == 0 &&
						<>{/*Table*/}
							<SearchInput textUpload={textUpload} enableUpload={handleActionFromSearch} globalFilter={handleSetGlobalFilter} txt={"Type your query and press Enter"}/>
							<Table filter={{}} sendCountToParent={handleCountDataFromChild} globalFilter={globalFilter}   tableName={tableName} keyConfig={keyConfig}/>
						</>
					}


				</div>
			}
	/>

	);
}

export default DPCDisease;
