import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import VoxpopSeasonModal from '../VoxpopSeasonModal';

import styles from './styles.module.css';

interface Props {
    voxpopSeason:{
        id :string;
        title: string;
        description: string;
        seasonNumber: number;
    }
    onEdit: (event: Props['voxpopSeason']) => void;
}

function VoxPopSeasonsActions(props:Props) {
    const {
        voxpopSeason, onEdit,
    } = props;
    const alert = useAlert();
    const [
        showEditPodCastSeasonModal, {
            setTrue: setShowEditVoxpopSeasonModalTrue,
            setFalse: setShowEditVoxpopSeasonModalFalse,
        }] = useBooleanState(false);

    const handleEdit = useCallback(() => {
        if (!voxpopSeason || !voxpopSeason.id) {
            alert.show('Invalid data');
            return;
        }
        setShowEditVoxpopSeasonModalTrue();
        onEdit(voxpopSeason);
    }, [voxpopSeason, setShowEditVoxpopSeasonModalTrue, onEdit, alert]);
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
                <VoxpopSeasonModal
                    onClose={setShowEditVoxpopSeasonModalFalse}
                    title="Edit VoxPop Season"
                    initialValues={voxpopSeason}
                />
            )}
        </div>
    );
}

export default VoxPopSeasonsActions;
