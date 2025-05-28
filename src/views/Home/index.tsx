import {
    IoGrid,
    IoImages,
    IoPerson,
} from 'react-icons/io5';
import {
    MdDraw,
    MdOutlineOndemandVideo,
    MdSmartDisplay,
} from 'react-icons/md';
import { TbReportSearch } from 'react-icons/tb';
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
                        <NavigationTab
                            to="events"
                            icon={<IoGrid />}
                        >
                            Events
                        </NavigationTab>
                        <NavigationTab
                            to="artWork"
                            icon={<MdDraw />}
                        >
                            Artwork
                        </NavigationTab>
                        <NavigationTab
                            to="gallery"
                            icon={<IoImages />}
                        >
                            Gallery
                        </NavigationTab>
                        <NavigationTab
                            to="podcast"
                            icon={<MdOutlineOndemandVideo />}
                        >
                            Podcast
                        </NavigationTab>
                        <NavigationTab
                            to="reports"
                            icon={<TbReportSearch />}
                        >
                            Reports
                        </NavigationTab>
                        <NavigationTab
                            to="youtubeVideos"
                            icon={<MdSmartDisplay />}
                        >
                            Youtube Videos
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
