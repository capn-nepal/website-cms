import { Navigate } from 'react-router-dom';

import { unwrapRoute } from '#utils/routes';

import Auth from './Auth';
import {
    customWrapRoute,
    rootLayout,
} from './common';

const homeLayout = customWrapRoute({
    parent: rootLayout,
    path: '/',
    forwardPath: 'content-management',
    component: {
        render: () => import('#views/Home'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Home',
        visibility: 'is-authenticated',
    },
});

const homeIndex = customWrapRoute({
    parent: homeLayout,
    index: true,
    component: {
        eagerLoad: true,
        render: Navigate,
        props: {
            to: 'dashboard',
            replace: true,
        },
    },
    context: {
        title: 'Home',
        visibility: 'anything',
    },
});

const dashboard = customWrapRoute({
    parent: homeLayout,
    path: 'dashboard',
    component: {
        render: () => import('#views/Dashboard'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Dashboard',
        visibility: 'anything',
    },
});

const blogs = customWrapRoute({
    parent: homeLayout,
    path: 'blogs',
    component: {
        render: () => import('#views/Blogs'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Blogs',
        visibility: 'is-authenticated',
    },
});
const artWork = customWrapRoute({
    parent: homeLayout,
    path: 'artWork',
    component: {
        render: () => import('#views/ArtWork'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'ArtWork',
        visibility: 'is-authenticated',
    },
});
const gallery = customWrapRoute({
    parent: homeLayout,
    path: 'gallery',
    component: {
        render: () => import('#views/Gallery'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Gallery',
        visibility: 'is-authenticated',
    },
});

const reports = customWrapRoute({
    parent: homeLayout,
    path: 'reports',
    component: {
        render: () => import('#views/Reports'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Reports',
        visibility: 'is-authenticated',
    },
});

const podcast = customWrapRoute({
    parent: homeLayout,
    path: 'podcast',
    component: {
        render: () => import('#views/Podcast'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Podcast',
        visibility: 'is-authenticated',
    },
});

const youtubeVideos = customWrapRoute({
    parent: homeLayout,
    path: 'youtubeVideos',
    component: {
        render: () => import('#views/YoutubeVideos'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'YoutubeVideos',
        visibility: 'is-authenticated',
    },
});
const login = customWrapRoute({
    parent: rootLayout,
    path: 'login',
    component: {
        render: () => import('#views/Login'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Login',
        visibility: 'is-not-authenticated',
    },
});

const events = customWrapRoute({
    parent: homeLayout,
    path: 'events',
    component: {
        render: () => import('#views/Events'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Event',
        visibility: 'is-authenticated',
    },
});
/*
const userManagement = customWrapRoute({
    parent: homeLayout,
    path: 'user-management',
    component: {
        render: () => import('#views/UserManagement'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'User Management',
        visibility: 'anything',
    },
});

const editProfile = customWrapRoute({
    parent: homeLayout,
    path: 'edit-profile',
    component: {
        render: () => import('#views/EditProfile'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Edit Profile',
        visibility: 'anything',
    },
});

const userActivation = customWrapRoute({
    parent: rootLayout,
    path: 'user-activation/:userId/:token',
    component: {
        render: () => import('#views/UserActivation'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'User Activation',
        visibility: 'anything',
    },
});
const activationRedirect = customWrapRoute({
    parent: rootLayout,
    path: 'user-activation/:userId/:token',
    component: {
        render: () => import('../redirects/ActivationRedirect'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Activation Redirect',
        visibility: 'is-not-authenticated',
    },
});

const register = customWrapRoute({
    parent: rootLayout,
    path: 'register/:userId/:registerToken',
    component: {
        render: () => import('#views/Register'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Register',
        visibility: 'is-not-authenticated',
    },
});

const registerRedirect = customWrapRoute({
    parent: rootLayout,
    path: 'user-activation/:userId/:registerToken',
    component: {
        render: () => import('../redirects/RegisterRedirect'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Register Redirect',
        visibility: 'is-not-authenticated',
    },
});

const forgotPassword = customWrapRoute({
    parent: rootLayout,
    path: 'forgot-password',
    component: {
        render: () => import('#views/ForgotPassword'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Forgot Password',
        visibility: 'is-not-authenticated',
    },
});
const forgotPasswordConfirm = customWrapRoute({
    parent: rootLayout,
    path: 'user-password-reset/:userId/:resetToken',
    component: {
        render: () => import('#views/ForgotPasswordConfirm'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Forgot Password Confirm',
        visibility: 'is-not-authenticated',
    },
});
const resetPasswordRedirect = customWrapRoute({
    parent: rootLayout,
    path: 'user-password-reset/:userId/:resetToken/redirect',
    component: {
        render: () => import('../redirects/ResetPasswordRedirect'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Reset Password Redirect',
        visibility: 'is-not-authenticated',
    },
});
*/

const wrappedRoutes = {
    rootLayout,
    homeLayout,
    homeIndex,
    dashboard,
    blogs,
    events,
    login,
    artWork,
    gallery,
    reports,
    podcast,
    youtubeVideos,

    // userActivation,
    // editProfile,
    // forgotPassword,
    // forgotPasswordConfirm,
    // resetPasswordRedirect,
    // register,
    // registerRedirect,
    // activationRedirect,
};

export const unwrappedRoutes = unwrapRoute(Object.values(wrappedRoutes));

export default wrappedRoutes;

export type WrappedRoutes = typeof wrappedRoutes;
