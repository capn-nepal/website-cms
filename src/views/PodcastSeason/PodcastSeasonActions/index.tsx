import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import PodcastSeasonsModal from '../PodcastSeasonsModal';

import styles from './styles.module.css';

interface Props {
    podcastSeason:{
        id :string;
        title: string;
        description: string;
        seasonNumber: number;
    }
    onEdit: (event: Props['podcastSeason']) => void;
}

function PodcastSeasonsActions(props:Props) {
    const {
        podcastSeason, onEdit,
    } = props;
    const alert = useAlert();
    const [
        showEditPodCastSeasonModal, {
            setTrue: setShowEditPodcastSeasonModalTrue,
            setFalse: setShowEditPodcastSeasonModalFalse,
        }] = useBooleanState(false);

    const handleEdit = useCallback(() => {
        if (!podcastSeason || !podcastSeason.id) {
            alert.show('Invalid event data');
            return;
        }
        setShowEditPodcastSeasonModalTrue();
        onEdit(podcastSeason);
    }, [podcastSeason, alert, setShowEditPodcastSeasonModalTrue, onEdit]);
    return (
        <div className={styles.seasonsActions}>
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
                onClick={() => {}} // FIXME : update the submission logic  Here
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
            { showEditPodCastSeasonModal && (
                <PodcastSeasonsModal
                    onClose={setShowEditPodcastSeasonModalFalse}
                    title="Edit Event"
                    initialValues={podcastSeason}
                />
            )}
        </div>
    );
}

export default PodcastSeasonsActions;
