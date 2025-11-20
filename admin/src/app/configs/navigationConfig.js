import i18next from 'i18next';
import en from './navigation-i18n/en';
import ja from './navigation-i18n/ja';
import { authRoles } from '../auth';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('ja', 'navigation', ja);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig = [
 


	{
		id: '1',
		title: 'Dashboard',
		translate: 'Dashboard',
		type: 'item',
		icon: 'material-outline:widgets',
		auth: authRoles.common,
		url: 'dashboard'
	},
	{
		id: 'apps.ecommerce',
		title: 'Data registration',
		type: 'collapse',
		icon: 'heroicons-outline:menu-alt-2',
		translate: 'Dataregistration',
		auth: authRoles.admin,
		children: [
			{
				id: 'e-commerce-products',
				title: 'Injury/illness name',
				translate: 'Injuryillnessname',
				type: 'item',
				icon: 'material-twotone:face_retouching_natural',
				url: 'data-registration/injury-illness',
				
				end: true
			},
			{
				id: 'e-commerce-product-detail',
				title: 'Medical practice',
			    translate: 'medicalPractice',
				type: 'item',
				icon: 'feather:activity',
				url: 'data-registration/medical-practice'
			},
			{
				id: 'e-commerce-new-product',
				title: 'Medicine',
				translate: 'Medicine',
				type: 'item',
				icon: 'material-outline:card_travel',
				url: 'data-registration/medicine'
			},
			{
				id: 'e-commerce-orders',
				title: 'Medicinal efficacy category',
				translate: 'MedicinalEfficacyCategory',
				type: 'item',
				icon: 'material-twotone:medical_services',
				url: 'data-registration/medicinal-efficacy',
				end: true
			},
		]
	},




 
	{
		id: 'apps.ecommerce1',
		title: 'DPC management',
		type: 'collapse',
		icon: 'material-outline:auto_awesome_motion',
		translate: 'DPCManagement',
		auth: authRoles.admin,
		children: [
			{
				id: 'pages.invoice.printable',
				title: '1 layer',
				translate: 'A1layer',
				type: 'collapse',
				icon: 'material-outline:filter_1',
 
				children: [
					{
						id: 'pages.invoice.printable.compact',
						title: 'ICD to DPC',
						translate: 'ICDtoDPC',
						type: 'item',
						icon: 'material-outline:layers',
						url: 'dpc-management/icd-dpc'
					},
					{
						id: 'pages.invoice.printable.modern',
						title: 'Age birth weight',
						translate: 'AgeBirthWeight',
						type: 'item',
						icon: 'material-outline:layers',
						url: 'dpc-management/age-birth-weight'
					}
				]


			},
			{
				id: 'pages3.invoice3.printable',
				title: '2 layers',
			    translate: 'A2layers',
				type: 'item',
				icon: 'material-outline:filter_2',
				url: 'dpc-management/surgery'
			},
			{
				id: 'pages2.invoice2.printable',
				title: '3 layers',
				translate: 'A3layers',
				type: 'collapse',
				icon: 'material-outline:filter_3',
				children: [
					{
						id: 'pages2.invoice2.printable.compact',
						title: 'Treatement 1',
						translate: 'Treatement1',
						type: 'item',
						icon: 'material-outline:layers',
						url: 'dpc-management/treatement-1'
					},
					{
						id: 'pages2.invoice2.printable.modern',
						title: 'Treatement 2',
						translate: 'Treatement2',
						type: 'item',
						icon: 'material-outline:layers',
						url: 'dpc-management/treatement-2'
					},
					{
						id: 'pages2.invoice2.printable.modern2',
						title: 'Secondary Injury',
						translate: 'SecondaryInjury',
						type: 'item',
						icon: 'material-outline:layers',
						url: 'dpc-management/secondary-injury'
					}
				]
			},
			{
				id: 'e-commerce-orders199',
				title: 'Days and score settings',
				translate: 'DaysAndScoreSettings',
				type: 'item',
				icon: 'material-outline:event',
				url: 'dpc-management/days-score',
				end: true
			},
			/*{
				id: 'e-commerce-orders1991',
				title: 'Disease Classification',
				translate: 'DiseaseClassification',
				type: 'item',
				icon: 'material-outline:event',
				url: 'dpc-management/dieases-classification',
				end: true
			},*/
		]
	},






	{
		id: '4',
		title: 'DPC analysis',
		translate: 'DPCAnalysis',
		type: 'item',
		icon: 'heroicons-solid:document-report',
		auth: authRoles.hospitalAssistant_staff,
		url: 'hospital/dpc-analysis'
	},	
	/*{ 
		id: '5',
		title: 'Search',
		translate: 'Search',
		type: 'item',
		icon: 'heroicons-solid:document-search',
		auth: authRoles.hospitalAssistant_staff,
		url: 'hospital/dpc-search'
	},	*/
	{
		id: '6',
		title: 'Data upload',
		translate: 'DataUpload',
		type: 'item',
		icon: 'heroicons-solid:cloud-upload',
		auth: authRoles.hospitalAssistant_staff,
		url: 'hospital/data-upload'
	},
	{
		id: '7',
		title: 'Contact form',
		translate: 'ContactForm',
		type: 'item',
		icon: 'heroicons-solid:chat-alt-2',
		auth: authRoles.hospitalAssistant_staff,
		url: 'contact-form'
	},

	
//hospital
{
	id: '28',
	title: 'DPC rules',
	translate: 'DPCRules',
	type: 'collapse',
	icon: 'material-outline:assignment_turned_in',
	auth: authRoles.hospitalAssistant_staff,
	children: [
		{
			id: 'apps.ecommerce222',
			title: 'Data registration',
			type: 'collapse',
			icon: 'heroicons-outline:menu-alt-2',
			translate: 'Dataregistration',
			children: [
				{
					id: 'e-commerce-products999',
					title: 'Injury/illness name',
					translate: 'Injuryillnessname',
					type: 'item',
					icon: 'material-twotone:face_retouching_natural',
					url: 'data-registration/injury-illness',
					
					end: true
				},
				{
					id: 'e-commerce-product-detail99',
					title: 'Medical practice',
					translate: 'medicalPractice',
					type: 'item',
					icon: 'feather:activity',
					url: 'data-registration/medical-practice'
				},
				{
					id: 'e-commerce-new-product99',
					title: 'Medicine',
					translate: 'Medicine',
					type: 'item',
					icon: 'material-outline:card_travel',
					url: 'data-registration/medicine'
				},
				{
					id: 'e-commerce-orders99',
					title: 'Medicinal efficacy category',
					translate: 'MedicinalEfficacyCategory',
					type: 'item',
					icon: 'material-twotone:medical_services',
					url: 'data-registration/medicinal-efficacy',
					end: true
				},
			]
		},			
		{
			id: 'apps.ecommerce11',
			title: 'DPC management',
			type: 'collapse',
			icon: 'material-outline:auto_awesome_motion',
			translate: 'DPCManagement',
			children: [
				{
					id: 'pages.invoice.printable88',
					title: '1 layer',
					translate: 'A1layer',
					type: 'collapse',
					icon: 'material-outline:filter_1',
	 
					children: [
						{
							id: 'pages.invoice.printable.compact99',
							title: 'ICD to DPC',
							translate: 'ICDtoDPC',
							type: 'item',
							icon: 'material-outline:layers',
							url: 'dpc-management/icd-dpc'
						},
						{
							id: 'pages.invoice.printable.modern99',
							title: 'Age birth weight',
							translate: 'AgeBirthWeight',
							type: 'item',
							icon: 'material-outline:layers',
							url: 'dpc-management/age-birth-weight'
						}
					]
	
	
				},
				{
					id: 'pages3.invoice3.printable88',
					title: '2 layers',
					translate: 'A2layers',
					type: 'item',
					icon: 'material-outline:filter_2',
					url: 'dpc-management/surgery'
				},
				{
					id: 'pages2.invoice2.printable88',
					title: '3 layers',
					translate: 'A3layers',
					type: 'collapse',
					icon: 'material-outline:filter_3',
					children: [
						{
							id: 'pages2.invoice2.printable.compact99',
							title: 'Treatement 1',
							translate: 'Treatement1',
							type: 'item',
							icon: 'material-outline:layers',
							url: 'dpc-management/treatement-1'
						},
						{
							id: 'pages2.invoice2.printable.modern99',
							title: 'Treatement 2',
							translate: 'Treatement2',
							type: 'item',
							icon: 'material-outline:layers',
							url: 'dpc-management/treatement-2'
						},
						{
							id: 'pages2.invoice2.printable.modern299',
							title: 'Secondary Injury',
							translate: 'SecondaryInjury',
							type: 'item',
							icon: 'material-outline:layers',
							url: 'dpc-management/secondary-injury'
						}
					]
				},
				/*{
					id: 'e-commerce-orders188',
					title: 'Days and score settings',
					translate: 'DaysAndScoreSettings',
					type: 'item',
					icon: 'material-outline:event',
					url: 'page',
					end: true
				},*/
				{
					id: 'e-commerce-orders1888',
					title: 'Days and score settings',
					translate: 'DaysAndScoreSettings',
					type: 'item',
					icon: 'material-outline:event',
					url: 'dpc-management/days-score',
					end: true
				},
				/*{
					id: 'e-commerce-orders19912',
					title: 'Disease Classification',
					translate: 'DiseaseClassification',
					type: 'item',
					icon: 'material-outline:event',
					url: 'dpc-management/dieases-classification',
					end: true
				},*/
			]
		},	
		{
			id: '181',
			title: 'CCPM',
			translate: 'CCPM',
			type: 'item',
			icon: 'material-outline:assignment_turned_in',
			url: 'ccpm'
		},

	
	]
},
{
	id: '18',
	title: 'CCPM',
	translate: 'CCPM',
	type: 'item',
	icon: 'material-outline:assignment_turned_in',
	auth: authRoles.admin,
	url: 'ccpm'
},
{
	id: '3',
	title: 'Hospital management',
	translate: 'HospitalManagement',
	type: 'item',
	icon: 'heroicons-solid:key',
	auth: authRoles.admin,
	url: 'hospital-management'
},
{
	id: '8',
	title: 'Staff management',
	translate: 'StaffManagement',
	type: 'item',
	icon: 'heroicons-solid:user-add',
	auth: authRoles.hospitalAssistant,
	url: 'staff-management'
},


];
export default navigationConfig;
