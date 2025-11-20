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



 
function InjuryIllness() {

	let tableName='days_score'
	let headingTitle='Setting days and score'
	let keyConfig=[		
		{name:'receipt', type:'String', header:'DPC code',edit:1, validate:{required:1},	 		 xlsx:'__EMPTY_2'},

		{name:'hos_days_1', type:'String', header:'Days I',edit:1, validate:{required:0}, xlsx:'__EMPTY_9'},
		{name:'hos_days_2', type:'Integer', header:'Days II',edit:1, validate:{required:0}, xlsx:'__EMPTY_10'},
		{name:'hos_days_3', type:'Integer', header:'Days III',edit:1, validate:{required:0}, xlsx:'__EMPTY_11'},
		{name:'hos_score_1', type:'Integer', header:'Period I',edit:1, validate:{required:0}, xlsx:'__EMPTY_12'},
		{name:'hos_score_2', type:'Integer', header:'Period II',edit:1, validate:{required:0}, xlsx:'__EMPTY_13'},
		{name:'hos_score_3', type:'Integer', header:'Period III',edit:1, validate:{required:0}, xlsx:'__EMPTY_14'},


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


			const illnessClear = await axios.post(apiConfig.tableClear + tableName + '/remove-all', {});

			let clock = createdAt()
			let fail_count = 0
			let fail_data = []
			let obj = []
			let obj_col = []
			var counts = 0
			var done = 0
			let len = data.length
			let auto = 1
			for (var i = 0; i < len; i++) {
				let this_ = data[i]


				let array = {}
				let empty = 0


				for (let h = 0; h < keyConfig.length; h++) {
					let keycon = keyConfig[h]


					const keyconSplit = keycon.xlsx.split("<+>");

					let result = ''
					for (let x = 0; x < keyconSplit.length; x++) {
						if (keyconSplit[x] == '<auto>' || this_[keyconSplit[x]]) {
							if (keyconSplit[x] != '<auto>') {
								if (keycon.type == 'String') {
 									result = result + this_[keyconSplit[x]].toString().toUpperCase() || '出来高算定'

								} else {
									result = parseInt(this_[keyconSplit[x]])  
								}
							} else if (keyconSplit[x] == '<auto>') {
								result = auto
								if (empty == 0) {
									auto++
								}

							}
						} else {
							if(keycon.name=='hos_days_1'){
 								result = '出来高算定'
							}
							console.log(this_, 'fail')
							if (i > 1) {

							}
						}

					}
					if (!result) {
						if (keycon.validate.required == 1) {
							empty++
						}
					}

					array[keycon.name] = result || null;
					result = ''

				}



				if (empty == 0) {
					 if(array.receipt != "診断群分類番号"){
							obj.push({
								...array,
								"created_at": clock,
								"updated_at": clock,
								"created_by": 1
							})		
						empty = 0					
					 }

					
				} else {
					if (i != 0) {
						fail_data.push(this_)
						fail_count++
					}
				}



				done++

				if ((counts == 1000) || (i == parseInt(len) - 1)) {
					var cal_per = parseInt((done / len) * 100)
					setProgress(cal_per)

					obj_col[done] = obj

					const response = await axios.post(apiConfig.tableCreate + tableName + '/create', obj);
					console.log(obj,'pppppppppp')
					obj = []
					counts = 0
				}
				counts++
			}
			fail_count=fail_count-1
			setFail_count_list(fail_data)

			if (fail_count == 0) { setSuccessAlert("Data uploaded successfully") } else { setFailAlert(fail_count + " Data upload failed") }

			setShowUpload(0)
			setProgress(0)







			///////////////////////////////////////////////////////////
			tableName = 'dpc_disease_classi'
			const illnessClear1 = await axios.post(apiConfig.tableClear + tableName + '/remove-all', {});
			// 診断群分類番号

			clock = createdAt()
			fail_count = 0
			fail_data = []
			obj = []
			obj_col = []
			counts = 0
			done = 0
			len = data.length
			auto = 1



			let dpc_6 = ''
			let and_1 = ''
			let age_1 = ''
			let sur_2 = ''
			let tre1_1 = ''
			let tre2_1 = ''
			let sec_1 = ''
			let sco_1 = ''

			let codes = ''

			let result = ''

			let key_code = ''
			let key_result = []

			let allow_up = 0

			//console.log(data.length,'key_result',data)

			for (var i = 0; i < len; i++) {
				let this_ = data[i]

				if (this_['__EMPTY_2'] != '診断群分類番号') {

					try {
						let array = {}
						let empty = 0


						let x_dpc_6 = this_['__EMPTY_2'].substring(0, 6);
						let x_and_1 = this_['__EMPTY_2'].substring(6, 7);
						let x_age_1 = this_['__EMPTY_2'].substring(7, 8);
						let x_sur_2 = this_['__EMPTY_2'].substring(8, 10);
						let x_tre1_1 = this_['__EMPTY_2'].substring(10, 11);
						let x_tre2_1 = this_['__EMPTY_2'].substring(11, 12);
						let x_sec_1 = this_['__EMPTY_2'].substring(12, 13);
						let x_sco_1 = this_['__EMPTY_2'].substring(13, 14);
						let x_codes = this_['__EMPTY_2']


						if (key_code == '') {   //only run first time

							key_code = x_dpc_6

							dpc_6 = x_dpc_6
							and_1 = x_and_1
							age_1 = x_age_1
							sur_2 = x_sur_2
							tre1_1 = x_tre1_1
							tre2_1 = x_tre2_1
							sec_1 = x_sec_1
							sco_1 = x_sco_1

							codes = x_codes

						}

						else if (x_dpc_6 == key_code) { //continue merge


							dpc_6 = x_dpc_6
							and_1 = and_1 + ',' + x_and_1
							age_1 = age_1 + ',' + x_age_1
							sur_2 = sur_2 + ',' + x_sur_2
							tre1_1 = tre1_1 + ',' + x_tre1_1
							tre2_1 = tre2_1 + ',' + x_tre2_1
							sec_1 = sec_1 + ',' + x_sec_1
							sco_1 = sco_1 + ',' + x_sco_1

							codes = codes + ',' + x_codes

						} else {
							//new assign


							//binding

							key_result.push({
								receipt: auto,
								dpc_6: removeDuplicates(dpc_6.split(",")).join(','),
								and_1: removeDuplicates(and_1.split(",")).join(','),
								age_1: removeDuplicates(age_1.split(",")).join(','),
								sur_2: removeDuplicates(sur_2.split(",")).join(','),
								tre1_1: removeDuplicates(tre1_1.split(",")).join(','),
								tre2_1: removeDuplicates(tre2_1.split(",")).join(','),
								sec_1: removeDuplicates(sec_1.split(",")).join(','),
								sco_1: removeDuplicates(sco_1.split(",")).join(','),
								codes: removeDuplicates(codes.split(",")).join(','),


								"created_at": clock,
								"updated_at": clock,
								"created_by": 1
							})
							auto++


							//now
							dpc_6 = x_dpc_6
							and_1 = x_and_1
							age_1 = x_age_1
							sur_2 = x_sur_2
							tre1_1 = x_tre1_1
							tre2_1 = x_tre2_1
							sec_1 = x_sec_1
							sco_1 = x_sco_1

							key_code = dpc_6

							codes = x_codes

						}


						//last row?
						if (i == len - 1) {
							key_result.push({
								receipt: auto,
								dpc_6: removeDuplicates(dpc_6.split(",")).join(','),
								and_1: removeDuplicates(and_1.split(",")).join(','),
								age_1: removeDuplicates(age_1.split(",")).join(','),
								sur_2: removeDuplicates(sur_2.split(",")).join(','),
								tre1_1: removeDuplicates(tre1_1.split(",")).join(','),
								tre2_1: removeDuplicates(tre2_1.split(",")).join(','),
								sec_1: removeDuplicates(sec_1.split(",")).join(','),
								sco_1: removeDuplicates(sco_1.split(",")).join(','),

								codes: removeDuplicates(codes.split(",")).join(','),

								"created_at": clock,
								"updated_at": clock,
								"created_by": 1
							})
							auto++
						}

					} catch (error) {
					}

				}
			}

			const response1 = await axios.post(apiConfig.tableCreate + tableName + '/create', key_result);

			setFail_count_list(fail_data)

			if (fail_count == 0) { setSuccessAlert("Data uploaded successfully") } else { setFailAlert(fail_count + " Data upload failed") }

			setShowUpload(0)
			setProgress(0)
			///////////////////////////////////////////////////////////
















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
							<SearchInput textUpload={textUpload} enableUpload={handleActionFromSearch} globalFilter={handleSetGlobalFilter} txt={"Write ICD code or illness name or receipt code & press Enter"}/>
							<Table filter={{}} sendCountToParent={handleCountDataFromChild} globalFilter={globalFilter}   tableName={tableName} keyConfig={keyConfig}/>
						</>
					}


				</div>
			}
	/>

	);
}

export default InjuryIllness;
