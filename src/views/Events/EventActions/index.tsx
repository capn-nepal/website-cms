import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

interface Props {
    eventId: string;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
}

function EventActions(props: Props) {
    const {
        eventId,
        onDelete,
        onEdit,
    } = props;

    const handleDelete = useCallback(() => {
        onDelete(eventId);
    }, [
        onDelete,
        eventId,
    ]);

    const handleEdit = useCallback(() => {
        onEdit(eventId);
    }, [onEdit, eventId]);

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
            >
                <IoTrash />
            </Button>
        </div>
    );
}

export default EventActions;
