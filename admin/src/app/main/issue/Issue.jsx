import Button from '@mui/material/Button';
import _ from '@lodash';
import { useEffect, useRef,  useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import {createdAt, timeBeauty} from '../../helpers/timeHelpers';
import {filterItemsEqual} from '../../helpers/commonHelpers';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Icon, Grid,Stack } from "@mui/material";
import TextField from '@mui/material/TextField';
 
import { useAppSelector } from 'app/store/hooks';
import { selectUserRole, selectUser } from '../../auth/user/store/userSlice';

import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useAppDispatch } from 'app/store/hooks';

import { Link } from 'react-router-dom';
 
 
import Autocomplete from '@mui/material/Autocomplete';
import * as React from 'react';

 import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';

 import Box1 from '@mui/material/Box';


 import Chip from '@mui/material/Chip';
 import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

 import Editor from 'react-simple-wysiwyg';

 const Table = lazy(() => import('../../shared-components/table/IssueTable'));

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

 


 
function Issue() {

	const [html, setHtml] = useState('my <b>HTML</b>');
	

	

	const [staff, setStaff] = useState([]);
	const [access_users, setAccessUsers] = useState([]);
	const [newrows, setNewRows] = useState(null);
	
	const [scroll_refresh, setScrollRefresh] = useState(null);
	const divRef = useRef(null);
	const scrollToBottom = () => {
		if (divRef.current) {
		  divRef.current.scrollTop = divRef.current.scrollHeight;
		}
	  };

	  useEffect(() => {
		scrollToBottom();
	}, [scroll_refresh]);

	
	async function getstaff(){
		let filter = {
			others: {hospital_id:hospital.id},
		  }

		const response = await axios.post(apiConfig.hospitalStaffManageListAssis, { filter });
        let new_data = []
        let get_data = response.data.data
		console.log(get_data,'get_datasxxx')
		for(let k=0; k<get_data.length; k++){
			let this_=get_data[k]

			if(user.uid != this_.id){
					new_data.push({
						title: this_.name +' ('+ t(this_.role)+')',
						id:this_.id

					})				
			}

		}

		setStaff(new_data)
	}



	async function getallstaff(){
		let filter = {
			others: {hospital_id:hospital.id},
		  }

		const response = await axios.post(apiConfig.hospitalStaffManageListAssis, { filter });
        let new_data = []
        let get_data = response.data.data
		console.log(get_data,'get_datasxxx')
		for(let k=0; k<get_data.length; k++){
			let this_=get_data[k]

			if(user.uid != this_.id){
					new_data.push({
						title: this_.name +' ('+ t(this_.role)+')',
						id:this_.id

					})				
			}

		}

		return new_data
	}



	useEffect(() => {  getstaff()  }, []);

 

	const fileInputRef = useRef(null);
	const fileInputRef2 = useRef(null);

  const [fileName, setFileName] = useState('');

 
	let headingTitle='Contact form'
	const dispatch = useAppDispatch();

	const { t } = useTranslation('shared-components');

	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();
	
	useEffect(() => {  toggleTheme(t(headingTitle))  }, [t(headingTitle)]);

	let base_url=apiConfig.base_url+'issue/'

	const user = useAppSelector(selectUser);
	console.log(user,'xuser')

	const handleSubject = (event) => {  setsubject(event.target.value); };
	const handleIssue = (event) => {  setissue(event.target.value); };
	 const handleIssueReply = (event) => {  setpostreply(event.target.value); };
  
	const [error, seterror] = useState(0);
	const [error2, seterror2] = useState(0);
	const [subject, setsubject] = useState('');
	const [issue, setissue] = useState('');
  
	const [issue_id, setissue_id] = useState(null);
  
	const [getreply, setgetreply] = useState([]);
	const [postreply, setpostreply] = useState('');
	const [issolved, setissolved] = useState(0);
  
	const postIssueReply = async (event) => {
	 if(postreply==''){seterror2(1)}else{
	 
		const current = new Date();
		const date = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;
		var this_unique=new Date().valueOf().toString();
  
		

		setuploading(1)
		var formData = new FormData();
		const fileInput = document.querySelector('input[type="file"]');
		for (let y = 0; y < fileInput.files.length; y++) {
			formData.append(`file-${y}`, fileInput.files[y], fileInput.files[y].name);
		}
		const response = await axios.post(apiConfig.base_url + 'issue/issue-file' + '?id=' + '1' + '&&counts=' + fileInput.files.length, formData);
 
		 console.log('888888888888888888888888888888','ffff')
			fileInputRef2.current.value = '';
			setFileName('');
		 

		const master_submit = {
			"issue_id":issue_id,
			"user_id":user.uid,
			"issue_user_id":user.uid,
			link:response.data.img_name || null,
			"reply":postreply,
			"created":createdAt(),
		  }
  
		const res = axios.post(base_url + "post_issue_reply", master_submit).then(async (response) => {
		  //alert('Request Submitted')
		  setpostreply('')
		  get_issue();

		  console.log('xxxxxxxxx')

   
		  var firsr_page_jsonreply = {
			"issue_id":issue_id
		  } 
   
		  await axios.post(base_url + "get_issue_reply", firsr_page_jsonreply).then((res) => {
			
			setgetreply(res.data.result)

			setScrollRefresh(Math.random())
	 
		}).catch(function (error) { 
			console.log('master_submit2')
			if (error.response) { console.log(error.response.data); 

		 } });    
  
  
  
  
		}).catch(function (error) {
			dispatch(showMessage({  message: t('Invalid Data'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    

			console.log('master_submit4')
		  if (error.response) {  console.log(error.response.data, 'error'); } 
		});  
  
	  } 


	  
	  
	 };
	 

	 const [uploading, setuploading] = useState(0);
  
	const postIssue = async (event) => {
	  if(subject=='' || issue==''){seterror(1)}else{
		console.log(subject,issue,'res')
  
		const current = new Date();
		const date = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;
		var this_unique=new Date().valueOf().toString();

		setuploading(1)
		var formData = new FormData();
		const fileInput = document.querySelector('input[type="file"]');
		for (let y = 0; y < fileInput.files.length; y++) {
			formData.append(`file-${y}`, fileInput.files[y], fileInput.files[y].name);
		}
		const response = await axios.post(apiConfig.base_url + 'issue/issue-file' + '?id=' + '1' + '&&counts=' + fileInput.files.length, formData);
		
		console.log('888888888888888888888888888888','ffff')
		fileInputRef.current.value = '';
		setFileName('');

		const master_submit = {
		  subject: subject,
		  issue: issue,
		  created: createdAt(),
		  link:response.data.img_name || null,
		  creator:  user.uid,
		  access_users:access_users,
		}

		
 
		const res = await axios.post(base_url + "post_issue", master_submit).then((response) => {
		dispatch(showMessage({  message: t(response.data.message), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: response.data.success }))    
		setuploading(0)
		setsubject('')
		setissue('')
		get_issue();
 
		}).catch(function (error) {
			console.log('master_submit1')
		  if (error.response) {  console.log(error.response.data, 'error'); 
		  dispatch(showMessage({  message: t('Invalid Data'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    

		  } 
		});  
  
	  }
	  
	 };
  
  
  
	 
  
   
	  const   get_issue = async (event) => {

		console.log('xxxx','ca,,,,,')
  var iid
	  //let id = e.target.getAttribute("data-id")
  
	  //console.log(id,'get_issueget_issue')
   
	  try {
		iid = event.target.getAttribute("data-id2")
		console.log(iid,'get_issueget_issue')
	  } catch (error) {
		
	  } 
	
   
	   var firsr_page_json = {
		  ...(user.is_marchant==1? { user_id:user.uid , } : { }), 
   
		} 
	
	  
  
		let res=await axios.post(base_url + "get_issue", firsr_page_json)//.then((res) => {
			  console.log(res,'res')
			  const my_json = []
			  var get_ = res.data.result;




			  for (var i=0; i < get_.length; i++) {
  
  
  var status='Pending'
  var status_date
  if(get_[i].is_solved==1){
	status='Solved'
  }
  
  else if(get_[i].is_seen==1){
	status='Seen'
  }
  
  
  
  var have_new=''
  if(get_[i].is_solved!=1){
  if(get_[i].reply=='mar_new' && user.is_marchant==1){
  have_new=' New ✉ found'
  }
  else if (get_[i].reply=='adm_new' && user.is_marchant!=1){
	have_new=' New ✉ found'
  }
  }
  
  
  let userz=""
  let all_user=""
  let access_users =  get_[i].access_users
  let access_users_array =  access_users.split(',')


  
  let staffx= await getallstaff()
  for(let y=1;y<access_users_array?.length-1;y++){
	for(let c=0;c<staffx?.length;c++){
		//if(staffx[c].id==parseInt(access_users_array[1])){ userz=staffx[c].title.split('(')[0] }
		if(staffx[c].id==parseInt(access_users_array[y])){ all_user=all_user+', '+staffx[c].title.split('(')[0] }
	}
  }


  
  
				  var x_data = {
						id: get_[i].id,
						subject: get_[i].subject, 
						issue: get_[i].issue, 
						reply: get_[i].reply, 
						have_new:have_new,
						status:status,
						is_seen: get_[i].is_seen,
						is_solved: get_[i].is_solved,
						creator_: get_[i].creator_?.name,
						...(get_[i].reply_by_? { reply_by_: get_[i].reply_by_?.name , } : {reply_by_:''}), 
						created: timeBeauty(get_[i].created)+'     '+ get_[i].creator_?.name+' -> '+all_user.slice(1), 
						created_time:timeBeauty(get_[i].created),
						
						reply_time:timeBeauty(get_[i].status_date),
						reply_by: get_[i]?.reply_by_?.name, 
						status_date: timeBeauty(get_[i].replied), 
						reply_count: get_[i]?._count?.issues_reply || 0,
						address:user,
						all_user:all_user
				  }
				  my_json.push(x_data);
				  console.log(x_data,'x_data')
			  } 
			setget_issues(my_json); 
			console.log(my_json,'my_json')
		 // }).catch(function (error) { console.log(error,'res')  });    
	  };
  
  useEffect(() => {
	  get_issue();
  }, []);
  
  
  const   get_issue2 = async (event) => {
   
	 
		 var firsr_page_json = {
			...(user.is_marchant==1? { user_id:user.uid , } : { }), 
			 is_seen:0, 
			 is_solved:0, 
		  } 
	  console.log(firsr_page_json,'firsr_page_json')
		 let res = await axios.post(base_url + "get_issue", firsr_page_json)//.then((res) => {
				console.log(res,'res')
				const my_json = []
				var get_ = res.data.result;
				for (var i=0; i < get_.length; i++) {
	
	
	var status='Pending'
	var status_date
	if(get_[i].is_solved==1){
	  status='Solved'
	}
	
	else if(get_[i].is_seen==1){
	  status='Seen'
	}
	
	var have_new=''
	if(get_[i].is_solved!=1){
	if(get_[i].reply=='mar_new' && user.is_marchant==1){
	have_new=' New ✉ found'
	}
	else if (get_[i].reply=='adm_new' && user.is_marchant!=1){
	  have_new=' New ✉ found'
	}
	}
  
	console.log('pppppppppp',get_[i])


	let userz=""
	let all_user=""
	let access_users =  get_[i].access_users
	let access_users_array =  access_users.split(',')
  
  
	
	let staffx= await getallstaff()
	for(let y=1;y<access_users_array?.length-1;y++){
	  for(let c=0;c<staffx?.length;c++){
		  //if(staffx[c].id==parseInt(access_users_array[1])){ userz=staffx[c].title.split('(')[0] }
		  if(staffx[c].id==parseInt(access_users_array[y])){ all_user=all_user+', '+staffx[c].title.split('(')[0] }
	  }
	}
  

  
							var x_data = {
								id: get_[i].id,
								subject: get_[i].subject, 
								issue: get_[i].issue, 
								reply: get_[i].reply, 
								have_new:have_new,
								status:status,
								is_seen: get_[i].is_seen,
								is_solved: get_[i].is_solved,
								creator_: get_[i].creator_?.name,
								...(get_[i].reply_by_? { reply_by_: get_[i].reply_by_?.name , } : {reply_by_:''}), 
								created: timeBeauty(get_[i].created)+'    '+ get_[i].creator_?.name+' -> '+all_user.slice(1), 
								created_time:timeBeauty(get_[i].created),  
								reply_time:timeBeauty(get_[i].status_date),
								reply_by: get_[i]?.reply_by_?.name, 
								status_date: timeBeauty(get_[i].replied), 
								reply_count: get_[i]?._count?.issues_reply || 0,
								all_user:all_user
						}
					my_json.push(x_data);
					console.log(x_data,'x_data')
				} 
			  setget_issues(my_json); 
			  console.log(my_json,'my_json')
			//}).catch(function (error) { if (error.response) { console.log(error.response.data); } });    
		};
	
   
		const   get_issue3 = async (event) => {
		  var iid
			  //let id = e.target.getAttribute("data-id")
		  
			  //console.log(id,'get_issueget_issue')
		   
			  try {
				iid = event.target.getAttribute("data-id2")
				console.log(iid,'get_issueget_issue')
			  } catch (error) {
				
			  } 
		   
		   
			   var firsr_page_json = {
				  ...(user.is_marchant==1? { user_id:user.uid , } : { }), 
				  is_seen:1 , is_solved:0 , 
   
				} 
			
			  
		  
				let res=	await axios.post(base_url + "get_issue", firsr_page_json)//.then((res) => {
					  console.log(res,'res')
					  const my_json = []
					  var get_ = res.data.result;
					  for (var i=0; i < get_.length; i++) {
		  
		  
		  var status='Pending'
		  var status_date
		  if(get_[i].is_solved==1){
			status='Solved'
		  }
		  
		  else if(get_[i].is_seen==1){
			status='Seen'
		  }
		  
  
		  var have_new=''
		  if(get_[i].is_solved!=1){
		  if(get_[i].reply=='mar_new' && user.is_marchant==1){
		  have_new=' New ✉ found'
		  }
		  else if (get_[i].reply=='adm_new' && user.is_marchant!=1){
			have_new=' New ✉ found'
		  }
		  }
		  					console.log('pppppppppp',get_[i])
		  


							  let userz=""
							  let all_user=""
							  let access_users =  get_[i].access_users
							  let access_users_array =  access_users.split(',')
							
							
							  
							  let staffx= await getallstaff()
							  for(let y=1;y<access_users_array?.length-1;y++){
								for(let c=0;c<staffx?.length;c++){
									//if(staffx[c].id==parseInt(access_users_array[1])){ userz=staffx[c].title.split('(')[0] }
									if(staffx[c].id==parseInt(access_users_array[y])){ all_user=all_user+', '+staffx[c].title.split('(')[0] }
								}
							  }


						  var x_data = {
							id: get_[i].id,
							subject: get_[i].subject, 
							issue: get_[i].issue, 
							reply: get_[i].reply, 
							have_new:have_new,
							status:status,
							is_seen: get_[i].is_seen,
							is_solved: get_[i].is_solved,
							creator_: get_[i].creator_?.name,
							...(get_[i].reply_by_? { reply_by_: get_[i].reply_by_?.name , } : {reply_by_:''}), 
							created: timeBeauty(get_[i].created)+'    '+ get_[i].creator_?.name+' -> '+all_user.slice(1), 
							created_time:timeBeauty(get_[i].created),  
							reply_time:timeBeauty(get_[i].status_date),
							reply_by: get_[i]?.reply_by_?.name, 
							status_date: timeBeauty(get_[i].replied), 
							reply_count: get_[i]?._count?.issues_reply || 0,
							all_user:all_user

						  }
						  my_json.push(x_data);
						  console.log(x_data,'x_datax_data')
					  } 
					setget_issues(my_json); 
					console.log(my_json,'my_json')
				//  }).catch(function (error) { if (error.response) { console.log(error.response.data); } });  
				  
  
   
			  };
		  
  
   
			  const   get_issue4 = async (event) => {
				console.log( 'res')
				var iid
					//let id = e.target.getAttribute("data-id")
				
					//console.log(id,'get_issueget_issue')
				 
					try {
					  iid = event.target.getAttribute("data-id2")
					  console.log(iid,'get_issueget_issue')
					} catch (error) {
					  
					} 
				 
				 
					 var firsr_page_json = {
						...(user.is_marchant==1? { user_id:user.uid , } : { }), 
						is_seen:null ,    is_solved:1  
					  } 
				  
					
				
					  let res=  await axios.post(base_url + "get_issue", firsr_page_json)//.then((res) => {
							console.log(res,'resc')
							const my_json = []
							var get_ = res.data.result;
							for (var i=0; i < get_.length; i++) {
				
				
				var status='Pending'
				var status_date
				if(get_[i].is_solved==1){
				  status='Solved'
				}
				
				else if(get_[i].is_seen==1){
				  status='Seen'
				}
	  
  
				var have_new=''
				if(get_[i].is_solved!=1){
				if(get_[i].reply=='mar_new' && user.is_marchant==1){
				have_new=' New ✉ found'
				}
				else if (get_[i].reply=='adm_new' && user.is_marchant!=1){
				  have_new=' New ✉ found'
				}
				}


				let userz=""
				let all_user=""
				let access_users =  get_[i].access_users
				let access_users_array =  access_users.split(',')
			  
			  
				
				let staffx= await getallstaff()
				for(let y=1;y<access_users_array?.length-1;y++){
				  for(let c=0;c<staffx?.length;c++){
					  //if(staffx[c].id==parseInt(access_users_array[1])){ userz=staffx[c].title.split('(')[0] }
					  if(staffx[c].id==parseInt(access_users_array[y])){ all_user=all_user+', '+staffx[c].title.split('(')[0] }
				  }
				}
				
								var x_data = {
									id: get_[i].id,
									subject: get_[i].subject, 
									issue: get_[i].issue, 
									reply: get_[i].reply, 
									have_new:have_new,
									status:status,
									is_seen: get_[i].is_seen,
									is_solved: get_[i].is_solved,
									creator_: get_[i].creator_?.name,
									...(get_[i].reply_by_? { reply_by_: get_[i].reply_by_?.name , } : {reply_by_:''}), 
									created: timeBeauty(get_[i].created)+'    '+ get_[i].creator_?.name+' -> '+all_user.slice(1), 
									created_time:timeBeauty(get_[i].created),  
									reply_time:timeBeauty(get_[i].status_date),
									reply_by: get_[i]?.reply_by_?.name, 
									status_date: timeBeauty(get_[i].replied), 
									reply_count: get_[i]?._count?.issues_reply || 0,
									all_user:all_user
								}
								my_json.push(x_data);
								console.log(x_data,'x_data')
							} 
						  setget_issues(my_json); 
						  console.log(my_json,'my_json')
						//}).catch(function (error) { if (error.response) { console.log(error.response.data); } });    
					};
  
  
  
  
  const [get_issues, setget_issues] = useState([]);
  
  const [selected_rows, setselected_rows] = useState([]);
  const [servicesList, setservicesList] = useState([]);
  
  const [services_clientsList, setservices_clientsList] = useState([]);
  const [services_clientsList_filtered, setservices_clientsList_filtered] = useState([]);
  
  const services_clientsProps_sender = { options: services_clientsList_filtered, getOptionLabel: (option) => option.label,};
  
  const [services_clients_branchList, setservices_clients_branchList] = useState([]);  
  const [services_clients_branchList_sender_filtered, setservices_clients_branchList_sender_filtered] = useState([]); 
  const services_clients_branchList_sender = { options: services_clients_branchList_sender_filtered, getOptionLabel: (option) => option.label,};
  
  const [alert_def_txt, setalert_def_txt] = useState('Data Submitted Successfully!');
  const [alert_def_class, setalert_def_class] = useState('success');
  const handleClick = () =>{ setOpen(true); };
  const handleClose = (event, reason) => { if (reason === 'clickaway') { return; } setOpen(false); };
  const [open, setOpen] = React.useState(false);
  //main
  
  
  const [client_id, setclient_id] = useState(null);
  const [marchant_id, setmarchant_id] = useState(null);
  
  const [amount, setamount] = useState([]);
  const [method, setmethod] = useState([]);
  const [account, setaccount] = useState([]);
  const [replytime, setreplytime] = useState(0);
 
  const paymentList = [
	{ label: 'Bkash', value: 'Bkash' },
	{ label: 'Nagad', value: 'Nagad' },
	{ label: 'Upay', value: 'Upay' },
	{ label: 'Bank', value: 'Bank' },
  ]
  
  
  
  
   
  
  const markSeen = (event) => {
	var done=0
 
	let c=0
	for (var key in newrows) { c++ }

	if(c!=0){
	  const current = new Date();
	  const date = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;
  
	  for (var key in newrows) {
			
  
			var filter =get_issues[parseInt(key)] //filterItemsequal(get_issues, 'id', parseInt(selected_rows[i]));
 

				  const data1 = {
					  id: filter.id,
					  is_seen:1,
					  is_solved:0,
					  reply_by:user.uid,
					  replied:createdAt(),
					  is_delete:0,
				  }
  
			 
				  const res = axios.post(base_url + "update_issues", data1).then((response) => {
					  console.log(response.data, 'res9');
					  dispatch(showMessage({  message: t(response.data.message), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: response.data.success }))    

					  done=1
					  get_issue();
				  }).catch(function (error) {
					  if (error.response) { 
						  done=0
						  console.log(done, 'done');
					  }
				  });  





		} 
   
	}else{
	  dispatch(showMessage({  message: t('Nothing Selected'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    
	}
  };
  
  const markSolved= (event) => {
	var done=0
	let c=0
	for (var key in newrows) { c++ }

	if(c!=0){
	  const current = new Date();
	  const date = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;
  
	  for (var key in newrows) {
			
  
		var filter =get_issues[parseInt(key)] 
  
				  const data1 = {
					  id: filter.id,
					  is_seen:1,
					  is_solved:1,
					  reply_by:user.uid,
					  replied:createdAt(),
				  }
  
 
				  const res = axios.post(base_url + "update_issues", data1).then((response) => {
					dispatch(showMessage({  message: t(response.data.message), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: response.data.success }))    

					  done=1
					  get_issue();
				  }).catch(function (error) {
					  if (error.response) { 
						  done=0
				 
					  }
				  }); 
		} 
   
	}else{
		dispatch(showMessage({  message: t('Nothing Selected'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    
	}
  };
  
  const markDelete= (event) => {
	var done=0
 
	let c=0
	for (var key in newrows) { c++ }

	if(c!=0){
	  const current = new Date();
	  const date = `${current.getDate()}/${current.getMonth()+1}/${current.getFullYear()}`;
  
	  for (var key in newrows) {
			
  
		var filter =get_issues[parseInt(key)] 
			  if(filter.status=='Pending'){
								const data1 = {
								  id: filter.id,
								  is_delete:1,
							  }
							  const res = axios.post(base_url + "update_issues", data1).then((response) => {
								  console.log(response.data, 'res');
								  done=1
								  get_issue();
							  }).catch(function (error) {
								  if (error.response) { 
									  done=0
									  console.log(done, 'done');
								  }
							  });
			  }else{
				dispatch(showMessage({  message: 'ID : ' + filter.id + ' ' + t('Not Deleted. Only issue with pending status can be deleted'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    

			  }
   
		} 
   
	}else{
		dispatch(showMessage({  message: t('Nothing Selected'), autoHideDuration: 2000, anchorOrigin: {  vertical: 'top',  horizontal: 'right' }, variant: 'error' }))    

	}
  };
  

  
 
  const idSend = async (data) => {

	console.log(data,'data')
	setissue_id(data)

	var firsr_page_jsonreply = {
		"issue_id":data
	  } 

	    await axios.post(base_url + "get_issue_reply", firsr_page_jsonreply).then((res) => {

		 console.log(res.data.result,'jjjjjjj')
			
		setreplytime(1)
		setgetreply(res.data.result)
		setScrollRefresh(Math.random())

		 setissolved(res.data.result[0].issue.is_solved)

	}).catch(function (error) { if (error.response) { console.log(error.response.data); } });  



  }

  const [img_col, setimg_col] = useState(null);
  const [loading_pod,setloading_pod]  = useState(0);


  const onFileChange = function (e) {

    e.preventDefault();

	  if (e.target.files.length > 0) {
		setFileName(e.target.files[0].name);
	  } else {
		setFileName('');
	  }


    console.log(55555)
    setimg_col(e.target.files)
  }

  function selectedRows(data){
	console.log(data.length)
	setNewRows(data)

 

	  for (var key in data) {
		console.log(data[key],key)
	}
  }


  function onChange(e) {
	//setHtml(e.target.value);
	setissue(e.target.value);
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
					{/*successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}
					{failAlert != null && <ReportModal data={fail_count_list} />*/}
				 

					<div class="grid md:grid-cols-5 xs:grid-cols-1 gap-4 mb-20" >
						<div class="col-span-2  ...">

							    {replytime == 0 && <div class=" mt-20" style={{"padding":"15px", "background":"white", "border-radius":"5px"}} >

								{staff.length > 0 &&
									<Autocomplete multiple

										onChange={(event, value) => {

											let ids = user.uid.toString()
											for (let x = 0; x < value.length; x++) {
												if (ids == "") {
													ids = value[x].id.toString()
												} else {
													ids = ids + ',' + value[x].id
												}
											}
											setAccessUsers(ids + ',')
										}}

										id="tags-outlined" options={staff} getOptionLabel={(option) => option.title} filterSelectedOptions renderInput={(params) => (<TextField {...params} label={t("Author*")} placeholder={t("Access by")} />)} />
								}


								<TextField fullWidth className="mt-20" type="text" name="subject" id="standard-basic" value={subject} onChange={handleSubject} label={t("Write Subject*")} />
								{subject == '' && error == 1 && <p style={{ color: "red", marginTop: "1%", marginBottom: "4%" }}>{t('This field is required *')}</p>}

								<br></br>

								<p className='mt-32 mb-12'>{t("Write Question*")}</p>
								<Editor value={issue} onChange={onChange} />
								{issue == '' && error == 1 && <p style={{ color: "red", marginTop: "1%", marginBottom: "4%" }}>{t('This field is required *')}</p>}



								{/*<TextField type="text"
									multiline
									fullWidth
									className='mt-20'
									rows={5}
									maxRows={8}
									name="issue" id="standard-basic" value={issue} onChange={handleIssue} label={t("Write Question*")} />*/}


								<div className=" " style={{ "margin-bottom": "20px", "margin-top": "20px", "padding": "15px", "border": "1px dashed gray" }}>
									<input ref={fileInputRef} onChange={onFileChange} type="file" name="imgCollection" multiple />
								</div>

								<div className='mt-40'>
									{getreply.length == 0 &&
										<Button color="secondary" data-id={1} onClick={postIssue} variant="contained" style={{ marginTop: "3px" }}> <Icon>check</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Submit New Issue")}</span>  </Button>
									}
								</div>
							    </div>}

								{getreply.length > 0 &&
								<div class=" mt-20" style={{"padding":"15px", "background":"white", "border-radius":"5px"}} >
									<div ref={divRef}
										style={{

											height: "420px",
											overflowY: "scroll",
											padding: "15px",
											border: "2px solid lightskyblue",
											borderRadius: "5px",

										}}
									>
										{getreply.map(item => (
											<>
												<Card sx={{ minWidth: 275 }}>
													<CardContent>

														<div className="flex-container">
															<div className="flex-item">
																{ item.user_.photo ?
																															<img
																															src={apiConfig.base_url + 'issue/image/' + item.user_.photo}
																															alt="beach"
																															style={{
																																maxWidth: '34px',
																														 
																															}}
																															className="rounded-6"
																														/>	

																														:
																														<img
																														src={apiConfig.base_url + 'issue/image/' + 'user.png'}
																														alt="beach"
																														style={{
																															maxWidth: '34px',
																														 
																														}}
																														className="rounded-6"
																													/>	


																}

															</div>
															<div className="flex-item">

																<Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>

																	<x style={{
																		fontWeight: "bold",
																		color: "black"
																	}}>
																		{item.user_.name.toString()}
																	</x>

																	<p  ><span> 🕐 {timeBeauty(item.created)}</span> </p>
																</Typography>

																<Typography variant="body2" className='mt-10'>
																<div dangerouslySetInnerHTML={{__html: item.reply.toString()}}></div>
																</Typography>


																{item.link ?
															 
<div class="flex justify-between mt-10 ...">

{(item.link?.split(".").slice(-1)!='png' &&item.link?.split(".").slice(-1)!='PNG'  && item.link?.split(".").slice(-1)!='jpg'  && item.link?.split(".").slice(-1)!='jpeg') &&
<Link to={apiConfig.base_url + 'issue/image/' + item.link} target="_blank" > Attachment File {item.link?.split(".").slice(-1)} </Link>
}

<>{(item.link?.split(".").slice(-1)=='png' ||item.link?.split(".").slice(-1)=='PNG'  || item.link?.split(".").slice(-1)=='jpg'  || item.link?.split(".").slice(-1)=='jpeg') &&
																		<Link to={apiConfig.base_url + 'issue/image/' + item.link} target="_blank" ><img
																			src={apiConfig.base_url + 'issue/image/' + item.link}
																			alt="beach"
																			style={{
																				maxWidth: '154px',
																				padding: '10px'

																			}}
																			className="rounded-6"
																		/></Link>
}</>


</div>


	

																 
																	:
																	<></>
																}															
														
														</div>
														</div>




												 


 
													</CardContent>
												</Card><br></br>
											</>
										))}
									</div>

								
								<br></br>


									{issolved != 1 && issue_id > 0 &&

<>
										<p className='mt-10 mb-12'>{t("Write Reply*")}</p>
										<Editor value={postreply} onChange={handleIssueReply} />



										{/*<TextField type="text"
										fullWidth
											multiline
											rows={4}
											maxRows={8}
											name="issue" id="standard-basic2" value={postreply} onChange={handleIssueReply} label={t("Write Reply*")} />*/}</>
									}

{issolved != 1 && issue_id > 0 &&

<>{postreply == '' && error2 == 1 && <p style={{ color: "red", marginTop: "1%", marginBottom: "4%" }}>{t('This field is required *')}</p>}</>
}
									{issolved != 1 && issue_id > 0 &&
									<div className=" "style={{"margin-bottom": "20px", "margin-top": "20px", "padding": "15px", "border": "1px dashed gray" }}>
									<input ref={fileInputRef2} onChange={onFileChange} type="file" name="imgCollection" multiple />
									</div>
									}



										<br></br>
									{issolved != 1 && issue_id > 0 &&
									<div class="flex justify-between ">
																			<Button className="mt-10" color="secondary" data-id={1} onClick={postIssueReply} variant="contained" style={{ marginTop: "3px" }}> <Icon>check</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Submit Reply")}</span>  </Button>
																			<Button className="mt-10" color="secondary" data-id={1}  onClick={() =>{
setgetreply([])
setreplytime(0)

				 
																				}} variant="contained" style={{ marginTop: "3px" }}> <Icon>arrow_back_ios</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Back")}</span>  </Button>

									</div>

									}
							</div>}




						</div>
						<div class="col-span-3 ml-20 ...">
							<div class="p-20 ...">
							<Button color="secondary" data-id2={1} onClick={get_issue} variant="outlined" style={{marginTop:"3px"}}> <Icon>remove_red_eye</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("View All")}</span></Button>
							&nbsp;&nbsp;
							<Button color="secondary" data-id2={2} onClick={get_issue2} variant="outlined" style={{marginTop:"3px"}}> <Icon>remove_red_eye</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("View Pending")}</span></Button>  
							&nbsp;&nbsp;
							<Button color="secondary" data-id2={3} onClick={get_issue3} variant="outlined" style={{marginTop:"3px"}}> <Icon>remove_red_eye</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("View Seen")}</span></Button>  
							&nbsp;&nbsp;
							<Button color="secondary" data-id2={4} onClick={get_issue4} variant="outlined" style={{marginTop:"3px"}}> <Icon>remove_red_eye</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("View Solved")}</span></Button>  
							&nbsp;&nbsp;
							<Icon style={{cursor:"pointer", float: "right"}} onClick={get_issue}>refresh</Icon> 
							</div>

							<Table selectedRows={selectedRows} idSend={idSend} data={get_issues}/>

{!get_issues.length>0 &&
							<Typography variant="body2" className='text-center text-amber-400' style={{'padding':'5%'}}>
								<i>No Record Found</i>
							</Typography>

}


							{/*footer*/}
							<div class="p-20 ...">
							<Button color="secondary" data-id={1} onClick={markSeen} variant="outlined" style={{marginTop:"3px"}}> <Icon>check</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Mark as Seen")}</span></Button>
							&nbsp;&nbsp;
							<Button color="secondary" data-id={1} onClick={markSolved} variant="outlined" style={{marginTop:"3px"}}> <Icon>check</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Mark as Solved")}</span></Button>  
							&nbsp;&nbsp;
							<Button color="error" data-id={1} onClick={markDelete} variant="outlined" style={{marginTop:"3px"}}> <Icon>delete</Icon> <span sx={{ pl: 1, textTransform: "capitalize" }}>{t("Delete")}</span></Button>  
							</div>
						</div>
					</div>
				</div>
			}
	/>

	);
}

export default Issue;
