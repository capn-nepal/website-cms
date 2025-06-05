import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { Button } from '@togglecorp/toggle-ui';

import {
    ArchiveEventMutation,
    ArchiveEventMutationVariables,
    EventTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import EventModal from '../EventModal';

import styles from './styles.module.css';

interface Props {
    id: string;
    onDelete: (id: string) => void;
}

const ARCHIVE_EVENT = gql`
    mutation ArchiveEvent($pk: ID!) {
        archiveEvent(pk: $pk) {
            ... on EventTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    name
                    description
                    location
                    startDate
                    endDate
                }
            }
            ... on OperationInfo {
                __typename
                messages {
                    message
                }
            }
        }
    }
`;

function EventActions(props: Props) {
    const {
        id,
        onDelete,
    } = props;
    const alert = useAlert();

    const [
        showEditEventModal, {
            setTrue: setShowEditEventModalTrue,
            setFalse: setShowEditEventModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveEvent,
        { loading: archiveLoading },
    ] = useMutation<ArchiveEventMutation, ArchiveEventMutationVariables>(
        ARCHIVE_EVENT,
        {
            onCompleted: (response) => {
                const archiveEvent = response.archiveEvent as EventTypeMutationResponseType;
                const { ok, errors } = archiveEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully Archived the Content',
                        { variant: 'success' },
                    );
                    onDelete(id);
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Archive the Content',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleDelete = useCallback(() => {
        triggerArchiveEvent({ variables: { pk: id } });
    }, [triggerArchiveEvent, id]);

    const handleEdit = useCallback(() => {
        if (!id) {
            alert.show('Invalid event ID');
            return;
        }
        setShowEditEventModalTrue();
    }, [id, alert, setShowEditEventModalTrue]);

    return (
        <div className={styles.eventActions}>
            <Button
                name="edit"
                onClick={handleEdit}
                title="Edit"
                transparent
            >
                <IoPencil />
            </Button>
            <Button
                name="delete"
                onClick={handleDelete}
                title="Delete"
                transparent
                disabled={archiveLoading}
            >
                <IoTrash />
            </Button>
            {showEditEventModal && (
                <EventModal
                    onClose={setShowEditEventModalFalse}
                    title="Edit Event"
                    initialValues={{ id }}
                />
            )}
        </div>
    );
}

export default EventActions;
