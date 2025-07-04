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
    createStringColumn,
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    EmploymentTypeEnum,
    PositionsQuery,
    PositionsQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import PositionActions from './PositionActions';
import PositionModal from './PositionModal';

import styles from './styles.module.css';

type PositionsItem = NonNullable<PositionsQuery['positions']['results'][number]>;

const PAGE_SIZE = 10;
const statusOption = [
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];

const employeeTypeOptions: {
    label: string;
    employeeType: EmploymentTypeEnum;
}[] = [
    { employeeType: 'CONTRACT', label: 'Contract' },
    { employeeType: 'FULL_TIME', label: 'Full Time' },
    { employeeType: 'PART_TIME', label: 'Part Time' },
];

const employeeKeySelector = (option: { employeeType: EmploymentTypeEnum}) => option.employeeType;
const employeeLabelSelector = (option: { label: string }) => option.label;

const statusKeySelector = (option: { value: boolean; label: string }) => String(option.value);
const statusLabelSelector = (option: { value: boolean; label: string }) => option.label;

const keySelector = (item: PositionsItem) => item.id;

const POSITIONS = gql`
    query Positions(
        $pagination:OffsetPaginationInput ,
        $filters: PositionFilter,
        $order:  PositionOrder
        ) {
         positions (order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                description
                employmentType
                id
                name
                summary
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
        showPositionModal, {
            setTrue: setShowPositionModalTrue,
            setFalse: setShowPositionModalFalse,
        }] = useBooleanState(false);

    const [selectedPosition, setSelectedPosition] = useState<Partial<PositionsItem> | null>(null);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        employmentType?: EmploymentTypeEnum,
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
            employmentType: filter.employmentType,
        },
    };
    const {
        refetch: positionRefetch,
        data: positionsResponse,
    } = useQuery<PositionsQuery, PositionsQueryVariables>(
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

    const handleAddPosition = useCallback(() => {
        setSelectedPosition(null);
        setShowPositionModalTrue();
    }, [setShowPositionModalTrue]);

    const data = positionsResponse?.positions.results;

    const columns = useMemo(() => [
        createStringColumn<PositionsItem, string | number>(
            'name',
            'Event Name',
            (item) => item.name,
        ),
        createStringColumn<PositionsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createStringColumn<PositionsItem, string | number>(
            'summary',
            'Summary',
            (item) => item.description,
        ),
        createStringColumn<PositionsItem, string | number>(
            'employmentType',
            'Employment Type',
            (item) => item.employmentType,
        ),
        createElementColumn<PositionsItem, string, {
            positions: PositionsItem,
            positionRefetch:(
            ) => void;
                }>(
                'actions',
                'Actions',
                PositionActions,
                (_key, item) => ({ positions: item, positionRefetch }),
                ),

    ], [positionRefetch]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Positions Table"
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
                    <SelectInput
                        placeholder="Employment Type"
                        name="employmentType"
                        options={employeeTypeOptions}
                        keySelector={employeeKeySelector}
                        labelSelector={employeeLabelSelector}
                        value={filter.employmentType}
                        onChange={setFilterField}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={handleAddPosition}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={positionsResponse?.positions.totalCount ?? 0}
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
            {showPositionModal && (
                <PositionModal
                    onClose={setShowPositionModalFalse}
                    title={selectedPosition ? 'Edit Position' : 'Add Position'}
                    refetchPosition={positionRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'Positions';
