import styles from './styles.module.css';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    return (
        <div className={styles.dashboard}>
            Youtube Videos Here
        </div>
    );
}

Component.displayName = 'YoutubeVideos';
