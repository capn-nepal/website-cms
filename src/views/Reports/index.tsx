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
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Chip, { ChipVariant } from '#components/Chip';
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

const statusOptions: {
    label: string;
    status: StatusEnum;
}[] = [
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PUBLISHED', label: 'Published' },
];

const PAGE_SIZE = 10;

const statusVariant: Record<string, string> = {
    Draft: 'default',
    Published: 'warning',
};

const keySelector = (item: ReportsItem) => item.id;
const statusKeySelector = (option: { status: StatusEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;

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
            status: filter.status,
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
        refetch: onReportUpdate,
    } = useQuery<ReportsQuery, ReportsQueryVariables>(
        REPORTS,
        { variables },
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
        createElementColumn<ReportsItem, string,
        { status: string | undefined; variant: string }>(
            'status',
            'Status',
            ({ status, variant }) => (
                <Chip
                    label={status}
                    variant={variant as ChipVariant}
                />
            ),
            (_key, item) => {
                const statusLabel = statusOptions.find(
                    (statusOption) => statusOption.status === item.status,
                )?.label;
                const variant = statusLabel ? statusVariant[statusLabel] : 'default';
                return {
                    status: statusLabel,
                    variant,
                };
            },
            { columnClassName: styles.actions },
        ),
        createElementColumn<ReportsItem, string, {
            report: ReportsItem;
            onReportEdit:(
            ) => void;
            onEdit: (report: ReportsItem) => void;
                }>(
                'actions',
                'Actions',
                ReportActions,
                (_key, item) => ({
                    report: item,
                    onReportEdit: onReportUpdate,
                    onEdit: setSelectedReport,
                }),
                ),
    ]), [onReportUpdate]);

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
                    onReportUpdate={onReportUpdate}
                />
            )}
        </Container>
    );
}

Component.displayName = 'Report';
