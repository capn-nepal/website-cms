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
    ArchiveVoxpopEpisodeMutation,
    ArchiveVoxpopEpisodeMutationVariables,
    VoxpopEpisodesQuery,
    VoxPopEpisodeTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import VoxpopEpisodeModal from '../VoxpopEpisodeModal';

import styles from './styles.module.css';

type VoxpopEpisodeItem = NonNullable<VoxpopEpisodesQuery['voxpopEpisodes']['results'][number]>;

interface Props {
    voxpopEpisode:VoxpopEpisodeItem
    onEdit: (voxpopEpisode: Props['voxpopEpisode']) => void;
    voxpopEpisodeRefetch: () => void;
}

const ARCHIVE_VOX_POP_EPISODE = gql`
    mutation ArchiveVoxpopEpisode($pk: ID!) {
        archiveVoxpopEpisode(pk: $pk) {
            ... on VoxPopEpisodeTypeMutationResponseType {
                errors
                ok
                result {
                    episodeNumber
                    id
                    isArchived
                    releaseDate
                    thumbnail {
                        url
                    }
                    title
                    videoUrl
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

function VoxpopEpisodeActions(props: Props) {
    const { voxpopEpisode, onEdit, voxpopEpisodeRefetch } = props;
    const alert = useAlert();
    const [
        showEditVoxpopEpisodeModal, {
            setTrue: setShowEditVoxpopEpisodeModalTrue,
            setFalse: setShowEditVoxpopEpisodeModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveVoxpopEpisode,
    ] = useMutation<ArchiveVoxpopEpisodeMutation, ArchiveVoxpopEpisodeMutationVariables>(
        ARCHIVE_VOX_POP_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveEpisode = response.archiveVoxpopEpisode as VoxPopEpisodeTypeMutationResponseType;
                const { ok, errors } = archiveEpisode;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully Archived VoxPop Episode',
                        { variant: 'success' },
                    );
                    voxpopEpisodeRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Archive the VoxPop Episode',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleEdit = useCallback(() => {
        if (!voxpopEpisode || !voxpopEpisode.id) {
            alert.show('Invalid data');
            return;
        }
        setShowEditVoxpopEpisodeModalTrue();
        onEdit(voxpopEpisode);
    }, [voxpopEpisode, setShowEditVoxpopEpisodeModalTrue, onEdit, alert]);

    const handleDelete = useCallback(() => {
        triggerArchiveVoxpopEpisode({
            variables: {
                pk: voxpopEpisode.id,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [triggerArchiveVoxpopEpisode, voxpopEpisode]);

    return (
        <div className={styles.episodeActions}>
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
            { showEditVoxpopEpisodeModal && (
                <VoxpopEpisodeModal
                    onClose={setShowEditVoxpopEpisodeModalFalse}
                    title="Edit VoxPop Episode"
                    initialValues={voxpopEpisode}
                    voxpopEpisodeRefetch={voxpopEpisodeRefetch}
                />
            )}
        </div>
    );
}

export default VoxpopEpisodeActions;
