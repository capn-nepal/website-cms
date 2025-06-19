import { IoPencil } from 'react-icons/io5';
import { Link } from 'react-router-dom';

import styles from './styles.module.css';

interface Props{
    id: string;
}

function BlogActions(props: Props) {
    const { id } = props;
    return (
        <div className={styles.eventActions}>
            <Link
                className={styles.editBlog}
                to={`/edit-blog/${id}`}
                title="Edit Blog"
            >
                <IoPencil />
            </Link>
        </div>
    );
}

export default BlogActions;
