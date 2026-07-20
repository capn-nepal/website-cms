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
    ArchivePodcastEpisodeMutation,
    ArchivePodcastEpisodeMutationVariables,
    PodcastEpisodesQuery,
    PodcastEpisodeTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import PodcastEpisodeModal from '../PodcastEpisodeModal';

import styles from './styles.module.css';

type PodcastEpisodeItem = NonNullable<PodcastEpisodesQuery['podcastEpisodes']['results'][number]>;

interface Props {
    podcastEpisode: PodcastEpisodeItem
    onEdit: (podcastEpisode: Props['podcastEpisode']) => void;
    podcastEpisodeRefetch:()=> void;
}

const ARCHIVE_PODCAST_EPISODE = gql`
    mutation ArchivePodcastEpisode($pk: ID!) {
        archivePodcastEpisode(pk: $pk) {
            ... on PodcastEpisodeTypeMutationResponseType {
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

function PodcastEpisodeActions(props: Props) {
    const {
        podcastEpisode,
        onEdit,
        podcastEpisodeRefetch,
    } = props;
    const alert = useAlert();
    const [
        showEditPodcastEpisodeModal, {
            setTrue: setShowEditPodcastEpisodeModalTrue,
            setFalse: setShowEditPodcastEpisodeModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchivePodcastEpisode,
    ] = useMutation<ArchivePodcastEpisodeMutation, ArchivePodcastEpisodeMutationVariables>(
        ARCHIVE_PODCAST_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveEpisode = response.archivePodcastEpisode as PodcastEpisodeTypeMutationResponseType;
                const { ok, errors } = archiveEpisode;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully Archived Podcast Episode',
                        { variant: 'success' },
                    );
                }
                podcastEpisodeRefetch();
            },
            onError: () => {
                alert.show(
                    'Failed to Archive the Podcast Episode',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleEdit = useCallback(() => {
        if (!podcastEpisode || !podcastEpisode.id) {
            alert.show('Invalid data');
            return;
        }
        setShowEditPodcastEpisodeModalTrue();
        onEdit(podcastEpisode);
    }, [podcastEpisode, setShowEditPodcastEpisodeModalTrue, onEdit, alert]);

    const handleDelete = useCallback(() => {
        triggerArchivePodcastEpisode({
            variables: {
                pk: podcastEpisode.id,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [podcastEpisode, triggerArchivePodcastEpisode]);

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
            { showEditPodcastEpisodeModal && (
                <PodcastEpisodeModal
                    onClose={setShowEditPodcastEpisodeModalFalse}
                    title="Edit Podcast Episode"
                    initialValues={podcastEpisode}
                    podcastEpisodeRefetch={podcastEpisodeRefetch}
                />
            )}
        </div>
    );
}

export default PodcastEpisodeActions;
