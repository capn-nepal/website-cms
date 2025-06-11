import {
    useMemo,
    useState,
} from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    Button,
    Chip,
    createDateColumn,
    createStringColumn,
    Pager,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';

import styles from './styles.module.css';

type PodcastItem = {
    title: string;
    id: string;
    description: string;
    thumbnail? : string;
    releaseDate: string;
    link: string;
};
const Podcast : PodcastItem[] = [
    {
        id: '1',
        title: 'AI & Ethics in Software Development',
        description: 'Where do we draw the line in building ethical machine learning systems?',
        releaseDate: '2025-05-10T12:00:00Z',
        link: 'https://example.com/podcast/ai-ethics',
    },
    {
        title: 'DevOps Demystified',
        description: 'From CI/CD pipelines to observability, what DevOps really means today.',
        releaseDate: '2025-03-20T09:00:00Z',
        link: 'https://example.com/podcast/devops-demystified',
        id: '2',
    },

];

const PAGE_SIZE = 10;

const keySelector = (item: PodcastItem) => item.id;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);

    const columns = useMemo(() => ([
        createStringColumn<PodcastItem, string | number>(
            'name',
            'Event Name',
            (item) => item.title,
        ),
        createStringColumn<PodcastItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createElementColumn<PodcastItem, string, { link: string }>(
            'document',
            'Document',
            ({ link }) => (
                <a
                    className={styles.actions}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {link}
                </a>
            ),
            (_, item) => ({ link: item.link }),
        ),
        createDateColumn<PodcastItem, string | number>(
            'endDate',
            'End Date',
            (item) => item.releaseDate,
        ),
        createElementColumn<PodcastItem, string, { imageUrl?: string }>(
            'image',
            'Image',
            ({ imageUrl }) => (
                imageUrl
                    ? <img src={imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item) => ({ imageUrl: item.thumbnail }),
        ),

    ]), []);
    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Event Table"
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={() => {}}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={Podcast.length ?? 0}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={Podcast}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
        </Container>
    );
}

Component.displayName = 'Podcast';
