import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import useBooleanState from '#hooks/useBooleanState';

import BlogModal from '../BlogModal';

import styles from './styles.module.css';

interface Props {
    blogId: string;
    onDelete: (id: string) => void;
}

function BlogActions(props: Props) {
    const {
        blogId,
        onDelete,
    } = props;

    const [showEditBlogModal, {
        setTrue: setShowEditBlogModalTrue,
        setFalse: setShowEditBlogModalFalse,
    }] = useBooleanState(false);

    const handleDelete = useCallback(() => {
        onDelete(blogId);
    }, [
        onDelete,
        blogId,
    ]);

    return (
        <div className={styles.eventActions}>
            <Button
                name="edit"
                onClick={setShowEditBlogModalTrue}
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
            {showEditBlogModal && (
                <BlogModal
                    onClose={setShowEditBlogModalFalse}
                />
            )}
        </div>
    );
}

export default BlogActions;
