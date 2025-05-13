import {
    useCallback,
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

import Chip from '#components/Chip';
import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import useBooleanState from '#hooks/useBooleanState';

import EventActions from './EventActions';
import EventModal from './EventModal';

import styles from './styles.module.css';

type EventItem = {
    id: string;
    name: string;
    description: string;
    location?: string;
    startDate: string;
    endDate: string;
    eventImage?: string;
};

const dummyEvents: EventItem[] = [
    {
        id: '1',
        name: 'Disaster Preparedness Workshop',
        description: 'Training session on community resilience',
        location: 'Kathmandu',
        startDate: '2025-05-20T10:00:00Z',
        endDate: '2025-05-21T15:00:00Z',
    },
    {
        id: '2',
        name: 'Relief Distribution Planning',
        description: 'Meeting for logistics planning',
        location: 'Lalitpur',
        startDate: '2025-06-01T09:30:00Z',
        endDate: '2025-06-01T12:00:00Z',
    },
    {
        id: '3',
        name: 'Flood Awareness Campaign',
        description: 'Community outreach on flood risk',
        location: 'Jhapa',
        startDate: '2025-06-15T08:00:00Z',
        endDate: '2025-06-15T17:00:00Z',
    },
];

const PAGE_SIZE = 10;

type PartialFormType = Partial<EventItem>;
const keySelector = (item: EventItem) => item.id;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        selectedEvent,
        setSelectedEvent,
    ] = useState<string | undefined>();

    const defaultFormValues: PartialFormType = {};
    console.log('here', selectedEvent);

    const [showEventModal, {
        setTrue: setShowEventModalTrue,
        setFalse: setShowEventModalFalse,
    }] = useBooleanState(false);

    const handleDelete = useCallback((id: string) => {
        console.log('Delete item with id:', id);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedEvent(id);
        setShowEventModalTrue();
    }, [setShowEventModalTrue]);

    const columns = useMemo(() => ([
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
        createElementColumn<EventItem, string, { imageUrl?: string }>(
            'image',
            'Image',
            ({ imageUrl }) => (
                imageUrl
                    ? <img src={imageUrl} alt="event" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item) => ({ imageUrl: item.eventImage }),
        ),
        createElementColumn<EventItem, string, {
            id: string;
            onDelete:(
                id: string,
            ) => void;
            onEdit: () => void;
            eventId: string;
                }>(
                'actions',
                'Actions',
                EventActions,
                (_key, item) => ({
                    id: item.id,
                    onEdit: () => handleEdit(item.id),
                    onDelete: handleDelete,
                    eventId: item.id,
                }),
                { columnClassName: styles.actions },
                ),
    ]), [
        handleDelete,
        handleEdit,
    ]);

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
                    itemsCount={dummyEvents.length}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            {showEventModal && (
                <EventModal
                    event={defaultFormValues}
                    onClose={setShowEventModalFalse}
                    onSuccess={undefined}
                />
            )}
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={dummyEvents}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
        </Container>
    );
}

Component.displayName = 'Events';
