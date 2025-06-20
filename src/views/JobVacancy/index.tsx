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
    createNumberColumn,
    createStringColumn,
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    JobVacanciesQuery,
    JobVacanciesQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import JobVacanciesModal from './jobVacanciesModal';
import JobVacancyActions from './JobVacancyActions';

import styles from './styles.module.css';

type JobsItem = NonNullable<JobVacanciesQuery['jobVacancies']['results'][number]>;

const PAGE_SIZE = 10;
const statusOption = [
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];

const statusKeySelector = (option: { value: boolean; label: string }) => String(option.value);
const statusLabelSelector = (option: { value: boolean; label: string }) => option.label;

const keySelector = (item: JobsItem) => item.id;

const POSITIONS = gql`
    query JobVacancies(
        $pagination:OffsetPaginationInput ,
        $filters: JobVacancyFilter,
        $order: JobVacancyOrder,
        ) {
            jobVacancies (order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                deadline
                description
                id
                numberOfVacancies
            }
            totalCount
        }
    }
`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showJobsModal, {
            setTrue: setShowJobVacancyModalTrue,
            setFalse: setShowJobVacancyModalFalse,
        }] = useBooleanState(false);

    const [selectedJob, setSelectedJob] = useState<Partial<JobsItem> | undefined>(undefined);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        isArchived?: boolean;
    }>({
        filter: {},
        pageSize: PAGE_SIZE,
    });

    const variables = {
        pagination: {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
        filters: {
            isArchived: filter.isArchived,
        },
    };
    const {
        data: jobVacanciesResponse,
        refetch: jobVacancyRefetch,
    } = useQuery<JobVacanciesQuery, JobVacanciesQueryVariables>(
        POSITIONS,
        { variables },
    );
    const onChange = useCallback(
        (newValue: string | undefined) => {
            let isArchived;
            if (newValue === 'true') {
                isArchived = true;
            } else if (newValue === 'false') {
                isArchived = false;
            } else {
                isArchived = undefined;
            }

            setFilterField(isArchived, 'isArchived');
        },
        [setFilterField],
    );

    const handleAddVacancy = useCallback(() => {
        setSelectedJob(undefined);
        setShowJobVacancyModalTrue();
    }, [setShowJobVacancyModalTrue]);

    const data = jobVacanciesResponse?.jobVacancies.results;

    const columns = useMemo(() => [
        createStringColumn<JobsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createStringColumn<JobsItem, string | number>(
            'deadline',
            'Deadline',
            (item) => item.deadline,
        ),
        createNumberColumn<JobsItem, string | number>(
            'numberOfVacancies',
            'No.of Vacancies',
            (item) => item.numberOfVacancies,
        ),
        createElementColumn<JobsItem, string, {
            jobVacancy: JobsItem;
            onEdit:(
                jobs: JobsItem) => void;
            jobVacancyRefetch: () => void;
                }>(
                'actions',
                'Actions',
                JobVacancyActions,
                (_key, item) => ({
                    jobVacancy: item,
                    jobVacancyRefetch,
                    onEdit: setSelectedJob,
                }),
                ),

    ], [jobVacancyRefetch]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Job Vacancy"
            headingDescription={(
                <div className={styles.actions}>
                    <SelectInput
                        placeholder="Is Archived"
                        name="isDeleted"
                        options={statusOption}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.isArchived !== undefined ? String(filter.isArchived) : null}
                        onChange={onChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={handleAddVacancy}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={jobVacanciesResponse?.jobVacancies.totalCount ?? 0}
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
            {showJobsModal && (
                <JobVacanciesModal
                    onClose={setShowJobVacancyModalFalse}
                    title={selectedJob ? 'Edit Job' : 'Add Job'}
                    initialValues={selectedJob}
                    jobVacancyRefetch={jobVacancyRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'JobVacancy';
