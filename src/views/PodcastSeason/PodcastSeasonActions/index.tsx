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
    ArchivePodcastSeasonMutation,
    ArchivePodcastSeasonMutationVariables,
    PodcastSeasonsQuery,
    PodcastSeasonTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import PodcastSeasonsModal from '../PodcastSeasonsModal';

import styles from './styles.module.css';

type PodcastSeasonsItem = NonNullable<PodcastSeasonsQuery['podcastSeasons']['results'][number]>;

interface Props {
    podcastSeason:PodcastSeasonsItem
    onEdit: (event: Props['podcastSeason']) => void;
    podcastSeasonRefetch: () => void;
}

const ARCHIVE_PODCAST_SEASON = gql`
    mutation ArchivePodcastSeason($pk: ID!) {
        archivePodcastSeason(pk: $pk) {
            ... on  PodcastSeasonTypeMutationResponseType{
                errors
                ok
                result {
                    id
                    description
                    seasonNumber
                    title
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

function PodcastSeasonsActions(props:Props) {
    const {
        podcastSeason,
        onEdit,
        podcastSeasonRefetch,
    } = props;
    const alert = useAlert();
    const [
        showEditPodcastSeasonModal, {
            setTrue: setShowEditPodcastSeasonModalTrue,
            setFalse: setShowEditPodcastSeasonModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchivePodcastSeason,
    ] = useMutation<ArchivePodcastSeasonMutation, ArchivePodcastSeasonMutationVariables>(
        ARCHIVE_PODCAST_SEASON,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveEvent = response.archivePodcastSeason as PodcastSeasonTypeMutationResponseType;
                const { ok, errors } = archiveEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully archived the podcast season',
                        { variant: 'success' },
                    );
                }
                podcastSeasonRefetch();
            },
            onError: () => {
                alert.show(
                    'Failed to archive the podcast season',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleDelete = useCallback(() => {
        triggerArchivePodcastSeason({ variables: { pk: podcastSeason.id } });
    }, [podcastSeason, triggerArchivePodcastSeason]);

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
                onClick={handleDelete}
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
            { showEditPodcastSeasonModal && (
                <PodcastSeasonsModal
                    onClose={setShowEditPodcastSeasonModalFalse}
                    title="Edit Podcast season"
                    initialValues={podcastSeason}
                    podcastSeasonRefetch={podcastSeasonRefetch}
                />
            )}
        </div>
    );
}

export default PodcastSeasonsActions;
