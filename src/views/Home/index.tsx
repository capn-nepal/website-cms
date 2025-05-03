import {
    IoGrid,
    IoPerson,
} from 'react-icons/io5';
import { Outlet } from 'react-router-dom';

import Navbar from '#components/Navbar';
import NavigationTab from '#components/NavigationTab';
import Page from '#components/Page';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    return (
        <>
            <Navbar />
            <Page
                leftPaneContent={(
                    <>
                        <NavigationTab
                            to="dashboard"
                            icon={<IoGrid />}
                        >
                            Dashboard
                        </NavigationTab>
                        <NavigationTab
                            to="blogs"
                            icon={<IoPerson />}
                        >
                            Blogs
                        </NavigationTab>
                    </>
                )}
            >
                <Outlet />
            </Page>
        </>
    );
}

Component.displayName = 'Home';
