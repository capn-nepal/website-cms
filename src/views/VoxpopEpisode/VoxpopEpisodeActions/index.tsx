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
    VoxPopEpisodeTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

interface Thumbnail {
    url: string;
}

interface Props {
    voxpopEpisode: {
        id: string;
        title: string;
        episodeNumber: number;
        isArchived: boolean;
        voxpopSeason: {
            pk: string;
        };
        releaseDate: string | null;
        thumbnail: Thumbnail | null;
        videoUrl: string | null;
    };
    onEdit: (podcastEpisode: Props['voxpopEpisode']) => void;
    refetch: () => void;
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
                    voxpopSeason {
                        pk
                    }
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
    const { voxpopEpisode, onEdit, refetch } = props;
    const alert = useAlert();
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
                    refetch();
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
        if (!voxpopEpisode?.id) {
            alert.show('Invalid data');
            return;
        }
        onEdit(voxpopEpisode);
    }, [voxpopEpisode, onEdit, alert]);

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
                onClick={handleDelete}
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
        </div>
    );
}

export default VoxpopEpisodeActions;
