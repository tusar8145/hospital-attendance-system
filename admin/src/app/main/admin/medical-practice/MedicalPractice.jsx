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
 







function MedicalPractice() {

	let tableName='medical_practices'
	let headingTitle='Medical practice'
	let keyConfig=[
			{name:'name', type:'String', header:'Medical practice name',edit:1, validate:{required:1},	 xlsx:'nama'},
			{name:'class', type:'String', header:'Classification', edit:1, validate:{required:1},	 	 xlsx:'class'},
			{name:'treat_code', type:'String', header:'Treatment code', edit:1, validate:{required:0},	 	 xlsx:'__EMPTY_111'},
			{name:'score', type:'Integer', header:'Score', edit:1, validate:{required:1},	 			 xlsx:'score'},  
			{name:'receipt', type:'Integer', header:'Receipt',edit:0, validate:{required:0},	 		 xlsx:'receipt code'},
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
				for (var i = 0; i < len; i++) {
					let this_ = data[i]
					

					let array={}
					let empty=0


					for(let h=0; h<keyConfig.length; h++){
						let keycon=keyConfig[h]


						const keyconSplit = keycon.xlsx.split("<+>");
						
						let result=''
						for(let x=0; x<keyconSplit.length; x++){
							if(keyconSplit[x]=='<auto>' || this_[keyconSplit[x]]){
								if(keyconSplit[x] != '<auto>'){
									if(keycon.type=='String'){
										result=result+this_[keyconSplit[x]].toString()
									}else{
										result=parseInt(this_[keyconSplit[x]])
									}
								}else if(keyconSplit[x] == '<auto>'){
									result=auto
									if(empty==0){
										auto++
									}
									
								}							
							}else{
								console.log(this_,'fail')
								if(i>1){
									
								}	
							}
							
						}
						if(!result){
							if(keycon.validate.required==1){
								empty++
							}
						}
 
						array[keycon.name] = result;
						result=''

					}
					 

					
					if(empty==0){
						obj.push({
							...array,
							"created_at":clock,
							"updated_at":clock,
							"created_by": 1
						})	
						
						empty=0
					}else{
						if(i!=0){
							fail_data.push(this_)
							fail_count++
						}
					}

						 			

					done++

					if ((counts == 1000) || (i == parseInt(len) - 1)) {
						var cal_per = parseInt((done / len) * 100)
						setProgress(cal_per)

						obj_col[done]=obj

						const response = await axios.post(apiConfig.tableCreate + tableName+'/create', obj);
						obj = []
						counts = 0
					}
					counts++
				}

				setFail_count_list(fail_data)

				if(fail_count==0){setSuccessAlert("Data uploaded successfully")}else{setFailAlert(fail_count+ " Data upload failed")}
				
				setShowUpload(0)
				setProgress(0)			
		} catch (error) {
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
		console.log(action,'action')
		setShowUpload(action)
		setSuccessAlert(null)
		setFailAlert(null)
		//setResetComponents(true)
		setAllowUpload(false)
	}

	function handleSetGlobalFilter(data) {
		console.log(data,'tusar')
		//if(data?.length>0){
			setGlobalFilter(data)
		//}
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
							<SearchInput textUpload={textUpload} enableUpload={handleActionFromSearch} globalFilter={handleSetGlobalFilter} txt={"Write classification/medical practice name/receipt code & press Enter"}/>
							<Table filter={{}} sendCountToParent={handleCountDataFromChild} globalFilter={globalFilter}   tableName={tableName} keyConfig={keyConfig}/>
						</>
					}


				</div>
			}
	/>

	);
}

export default MedicalPractice;
