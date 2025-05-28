import {
    useMemo,
    useState,
} from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    Button,
    createDateColumn,
    createStringColumn,
    Pager,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';

import styles from './styles.module.css';

type ReportsItem = {
    title: string;
    id: string;
    description: string;
    document: string;
    published_date: string;
    status: string;
};

// FIXME: Remove after server side is ready
const Reports: ReportsItem[] = [

    {
        title: 'API Integration Guide',
        description: 'Detailed guide for integrating with v2 of our public API.',
        document: 'reports/api-integration-guide.pdf',
        published_date: '2025-04-10',
        status: 'Published',
        id: '1',
    },
    {
        title: 'Sprint 21 Code Audit',
        description: 'Findings from the peer code audit conducted during Sprint 21.',
        document: 'reports/sprint21-code-audit.pdf',
        published_date: '2025-05-01',
        status: 'Published',
        id: '2',
    },
    {
        title: 'Database Optimization Proposal',
        description: 'Proposed indexing and query restructuring .',
        document: 'reports/db-optimization-proposal.pdf',
        published_date: '2025-03-20',
        status: 'Draft',
        id: '3',
    },
    {
        title: 'Frontend Component Refactor Plan',
        description: 'Strategy for refactoring.',
        document: 'reports/frontend-refactor-plan.pdf',
        published_date: '2025-02-15',
        status: 'Draft',
        id: '4',
    },

];
const PAGE_SIZE = 10;

const keySelector = (item: ReportsItem) => item.id;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);

    const columns = useMemo(() => ([
        createStringColumn<ReportsItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<ReportsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createElementColumn<ReportsItem, string, { url: string }>(
            'document',
            'Document',
            ({ url }) => (
                <a
                    className={styles.actions}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {url}
                </a>
            ),
            (_, item) => ({ url: item.document }),
        ),
        createDateColumn<ReportsItem, string | number>(
            'publishedDate',
            'Published Date',
            (item) => item.published_date,
        ),
        createStringColumn<ReportsItem, string | number>(
            'document',
            'Document',
            (item) => item.status,
        ),
    ]), []);
    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Reports Table"
            actions={(
                <Button
                    name="Add Reports"
                    variant="primary"
                    onClick={() => {}} // FIXME : Add  onChange here
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={Reports.length ?? 0}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={Reports}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
        </Container>
    );
}

Component.displayName = 'Reports';
