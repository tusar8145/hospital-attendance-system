import { Component } from 'react';
import { matchRoutes } from 'react-router-dom';
import FuseUtils from '@fuse/utils';
import AppContext from 'app/AppContext';
import withRouter from '@fuse/core/withRouter';
import history from '@history';
import {
	getSessionRedirectUrl,
	resetSessionRedirectUrl,
	setSessionRedirectUrl
} from '@fuse/core/FuseAuthorization/sessionRedirectUrl';
import FuseLoading from '@fuse/core/FuseLoading';

function isUserGuest(role) {
	return !role || (Array.isArray(role) && role.length === 0);
}

class FuseAuthorization extends Component {
	constructor(props, context) {
		super(props); 
		const { routes } = context;

		this.state = {
			accessGranted: true,
			routes
		};
	}

	componentDidMount() {
		if (!this.state.accessGranted) {
			this.redirectRoute();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextState.accessGranted !== this.state.accessGranted;
	}

	componentDidUpdate() {
		if (!this.state.accessGranted) {
			this.redirectRoute();
		}
	}

	static getDerivedStateFromProps(props, state) {
		const { location, userRole } = props;
		const { pathname, search } = location;

		const fullPath = pathname + search; // ✅ preserve query params

		const matchedRoutes = matchRoutes(state.routes, pathname);
		const matched = matchedRoutes ? matchedRoutes[0] : false;

		const isGuest = isUserGuest(userRole);

		if (!matched) {
			return { accessGranted: true };
		}

		const { route } = matched;
		const userHasPermission = FuseUtils.hasPermission(route.auth, userRole);

		const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-out', '/logout', '/404'];

		// ✅ Save FULL URL (with query params)
		if (!userHasPermission && !ignoredPaths.includes(pathname)) {
			setSessionRedirectUrl(fullPath);
		}

		return {
			accessGranted: userHasPermission
		};
	}

	redirectRoute() {
		const { userRole, loginRedirectUrl = '/' } = this.props;

		const redirectUrl = getSessionRedirectUrl();

		console.log('Redirect URL:', redirectUrl);
		console.log('User Role:', userRole);

		// ✅ Guest → always go to login
		if (isUserGuest(userRole)) {
			setTimeout(() => {
				history.push('/sign-in');
			}, 0);
			return;
		}

		// ✅ Logged in user
		if (redirectUrl) {



					if ((redirectUrl == '/user-management' ||
						redirectUrl == '/doctor' ||
						redirectUrl == '/department' ||
						redirectUrl == '/medical-center') && this.props.userRole == 'operator') {

							setTimeout(() => history.push('/dashboard'), 0);
							resetSessionRedirectUrl();

					}else if ((redirectUrl == '/user-management') && this.props.userRole == 'staff') {

							setTimeout(() => history.push('/dashboard'), 0);
							resetSessionRedirectUrl();

					} else {

						setTimeout(() => {
							history.push(redirectUrl);
							resetSessionRedirectUrl(); // IMPORTANT
						}, 0);

					}



		} else {
			setTimeout(() => {
				history.push('/dashboard');
			}, 0);
		}
	}

	render() {
		const { accessGranted } = this.state;
		const { children } = this.props;

		return accessGranted ? children : <FuseLoading />;
	}
}

FuseAuthorization.contextType = AppContext;

export default withRouter(FuseAuthorization);