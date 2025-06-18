import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { Button } from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

function BlogActions() {
    return (
        <div className={styles.eventActions}>
            <Link
                className={styles.editBlog}
                to="/edit-blog"
                title="Edit Blog"
            >
                <IoPencil />
            </Link>
            <Button
                name="delete"
                onClick={() => {}}
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
        </div>
    );
}

export default BlogActions;
