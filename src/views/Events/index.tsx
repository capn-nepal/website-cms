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

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    EventsQuery,
    EventsQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import EventActions from './EventActions';
import EventModal from './EventModal';

import styles from './styles.module.css';

type EventItem = NonNullable<EventsQuery['events']['results'][number]>;

const PAGE_SIZE = 10;
const statusOption = [
    { isActive: true, label: 'true' },
    { isActive: false, label: 'false' },
];

const keySelector = (item: EventItem) => item.id;

const statusKeySelector = (option: { isActive: boolean; label: string }) => String(option.isActive);
const statusLabelSelector = (option: { isActive: boolean; label: string }) => String(option.label);

const EVENTS = gql`
    query Events(
        $pagination:OffsetPaginationInput ,
        $filters: EventFilter,
        $order: EventOrder
        ) {
        events(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                description
                endDate
                id
                location
                name
                startDate
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
        showEventModal, {
            setTrue: setShowEventModalTrue,
            setFalse: setShowEventModalFalse,
        }] = useBooleanState(false);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        isDeleted?: boolean;
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
            isDeleted: filter.isDeleted ?? false, // FIXME: update after server side is fixed
        },
    };
    const {
        data: eventsResponse,
    } = useQuery<EventsQuery, EventsQueryVariables>(
        EVENTS,
        { variables },
    );

    const onChange = useCallback(
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

    const handleDelete = useCallback(() => {}, []);
    const handleEdit = useCallback(() => {}, []);

    const data = eventsResponse?.events.results;

    const columns = useMemo(() => [
        createStringColumn<EventItem, string | number>(
            'name',
            'Event Name',
            (item) => item.name,
        ),
        createStringColumn<EventItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createStringColumn<EventItem, string | number>(
            'location',
            'Location',
            (item) => item.location,
        ),
        createDateColumn<EventItem, string | number>(
            'startDate',
            'Start Date',
            (item) => item.startDate,
        ),
        createDateColumn<EventItem, string | number>(
            'endDate',
            'End Date',
            (item) => item.endDate,
        ),
        createElementColumn<EventItem, string, { id: string; onDelete:(
            id: string) => void }>(
            'actions',
            'Actions',
            EventActions,
            (_key, item) => ({
                id: item.id,
                onDelete: handleDelete,
                onEdit: handleEdit,
            }),
            ),
        // createElementColumn<EventItem, string, { imageUrl?: string }>(
        //     'image',
        //     'Image',
        //     ({ imageUrl }) => (
        //         imageUrl
        //             ? <img src={imageUrl} alt="event"
        // style={{ width: 40, height: 40, borderRadius: 4 }} />
        //             : <Chip label="No Image" variant="default" />
        //     ),
        //     (_key, item) => ({ imageUrl: item.location}),
        // ),
    ], [handleDelete, handleEdit]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Event Table"
            headingDescription={(
                <div className={styles.actions}>
                    <SelectInput
                        placeholder="Is Deleted"
                        name="isDeleted"
                        options={statusOption}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.isDeleted !== undefined ? String(filter.isDeleted) : null}
                        onChange={onChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={setShowEventModalTrue}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={eventsResponse?.events.totalCount ?? 0}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            {showEventModal && (
                <EventModal
                    onClose={setShowEventModalFalse}
                    title="Add Event"
                />
            )}
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={data}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
        </Container>
    );
}

Component.displayName = 'Events';
