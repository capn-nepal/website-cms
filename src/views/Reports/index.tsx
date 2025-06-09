<<<<<<< HEAD
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
||||||| parent of 0ed29d1 (Add Report table and report modal to add and edit)
=======
import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Button,
    createDateColumn,
    createStringColumn,
    createYesNoColumn,
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    ReportsQuery,
    ReportsQueryVariables,
    StatusEnum,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import ReportActions from './ReportActions';
import ReportModal from './ReportsModal';

import styles from './styles.module.css';

type ReportsItem = NonNullable<ReportsQuery['reports']['results'][number]>;

const REPORTS = gql`
    query Reports(
        $pagination: OffsetPaginationInput,
        $filters: ReportFilter,
        $order: ReportOrder,
    ) {
        reports(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            totalCount
            results {
                description
                id
                isDeleted
                publishedDate
                reportFile {
                    url
                }
                status
                title
            }
        }
    }
`;

const isDeleteOptions = [
    { isDelete: true, label: 'True' },
    { isDelete: false, label: 'False' },
];

const statusOptions = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PUBLISHED', label: 'Published' },
];

const PAGE_SIZE = 10;

const keySelector = (item: ReportsItem) => item.id;
const isDeleteKeySelector = (option: {
    isDelete: boolean; label: string;
 }) => String(option.isDelete);
const isDeleteLabelSelector = (option: { isDelete: boolean; label: string }) => option.label;
const statusKeySelector = (option: { key: string; label: string }) => option.key;
const statusLabelSelector = (option: { key: string; label: string }) => option.label;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showReportModal, {
            setTrue: setShowReportModalTrue,
            setFalse: setShowReportModalFalse,
        }] = useBooleanState(false);
    const [selectedReport, setSelectedReport] = useState<Partial<ReportsItem> | null>(null);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        isDeleted?: boolean;
        status?: StatusEnum;
    }>({
        filter: {},
        pageSize: PAGE_SIZE,
    });

    const variables = useMemo(() => {
        const filters: ReportsQueryVariables['filters'] = {
            isDeleted: filter.isDeleted ?? false,
            status: filter.status ?? 'PUBLISHED',
        };

        return {
            pagination: {
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            },
            filters,
        };
    }, [page, filter]);

    const {
        data: reportsResponse,
    } = useQuery<ReportsQuery, ReportsQueryVariables>(
        REPORTS,
        { variables },
    );

    const handleIsDeletedChange = useCallback(
        (newValue: string | undefined) => {
            let isDeleted;
            if (newValue === 'true') {
                isDeleted = true;
            } else if (newValue === 'false') {
                isDeleted = false;
            } else {
                isDeleted = undefined;
            }

            setFilterField(isDeleted, 'isDeleted');
        },
        [setFilterField],
    );
    const handleAddReport = useCallback(() => {
        setSelectedReport(null);
        setShowReportModalTrue();
    }, [setShowReportModalTrue]);

    const data = reportsResponse?.reports.results;

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
        createDateColumn<ReportsItem, string | number>(
            'publishedDate',
            'Published Date',
            (item) => item.publishedDate,
        ),
        createStringColumn<ReportsItem, string | number>(
            'status',
            'Status',
            (item) => item.status,
        ),
        createElementColumn<ReportsItem, string, { url: string }>(
            'reportFile',
            'Report File',
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
            (_, item) => ({ url: item.reportFile.url }),
        ),
        createYesNoColumn<ReportsItem, string | number>(
            'isDeleted',
            'Is Deleted',
            (item) => item.isDeleted,
        ),
        createElementColumn<ReportsItem, string, { id: string; onDelete:(
            id: string) => void }>(
            'actions',
            'Actions',
            ReportActions,
            (_key, item) => ({
                report: item,
            }),
            ),
    ]), []);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Reports Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <SelectInput
                        placeholder="Is Deleted"
                        name="isDeleted"
                        options={isDeleteOptions}
                        keySelector={isDeleteKeySelector}
                        labelSelector={isDeleteLabelSelector}
                        value={filter.isDeleted !== undefined ? String(filter.isDeleted) : null}
                        onChange={handleIsDeletedChange}
                    />
                    <SelectInput
                        placeholder="Status"
                        name="status"
                        options={statusOptions}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.status}
                        onChange={setFilterField}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Reports"
                    variant="primary"
                    onClick={handleAddReport}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={reportsResponse?.reports.totalCount ?? 0}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={data}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
            {showReportModal && (
                <ReportModal
                    onClose={setShowReportModalFalse}
                    title={selectedReport ? 'Edit Report' : 'Add Report'}
                />
            )}
        </Container>
    );
}

Component.displayName = 'Report';
>>>>>>> 0ed29d1 (Add Report table and report modal to add and edit)
