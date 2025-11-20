import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import _ from '@lodash';
import { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lazy } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

const FileChoose = lazy(() => import('../../shared-components/file-choose/FileChoose'));

import en from '../../shared-components/i18n/en';
import ja from '../../shared-components/i18n/ja';

import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);


const defaultValues = { name: '', email: '', subject: '', message: '' };
const schema = z.object({
	name: z.string().nonempty('You must enter a name'),
	subject: z.string().nonempty('You must enter a subject'),
	message: z.string().nonempty('You must enter a message'),
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email')
});

/**
 * The help center support.
 */
function Example2() {
	const { control, handleSubmit, watch, formState } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});
	const { isValid, dirtyFields, errors } = formState;
	const form = watch();

	function onSubmit(data) {
		// eslint-disable-next-line no-console
		console.log(data);
	}

	if (_.isEmpty(form)) {
		return null;
	}


	const [dataFromChild, setDataFromChild] = useState("");

	function handleDataFromChild(data) {
		console.log(data)
	  //setDataFromChild(data);
	}

	const { t } = useTranslation('shared-components');
	return (
		<div className="flex flex-col items-center p-24 sm:p-40 container">
			<div className="flex flex-col w-full max-w-4xl">
				
				<div className="sm:mt-32 text-red-700">
				{t("No data found!")}
				</div>

				<FileChoose  sendDataToParent={handleDataFromChild} />

				<div className="flex  justify-center mt-32">
					<Button
						className="mx-8"
						variant="contained"
						color="success"
						type="submit"
					>
						{t("Upload")}
					</Button>
				</div>
			</div>
		</div>
	);
}

export default Example2;
