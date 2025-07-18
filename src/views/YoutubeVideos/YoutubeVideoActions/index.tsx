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
    ArchiveYoutubeVideoMutation,
    ArchiveYoutubeVideoMutationVariables,
    YoutubeVideosQuery,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import YoutubeVideosModal from '../YoutubeVideosModal';

import styles from './styles.module.css';

type YoutubeVideosItem = NonNullable<NonNullable<NonNullable<YoutubeVideosQuery>['youtubeVideos']>['results']>[number];

interface Props {
    youtubeVideo: YoutubeVideosItem
    onEdit?: (event: Props['youtubeVideo']) => void;
    onYoutubeVideoUpdate: () => void
}

const ARCHIVE_YOUTUBE_VIDEO = gql`
    mutation ArchiveYoutubeVideo($pk: ID!) {
        archiveYoutubeVideo(pk: $pk) {
            ... on YouTubeVideoTypeMutationResponseType {
                errors
                ok
                result {
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

function YoutubeVideoActions(props: Props) {
    const {
        youtubeVideo,
        onEdit,
        onYoutubeVideoUpdate,
    } = props;
    const alert = useAlert();

    const [showEditBlogModal, {
        setTrue: setShowEditYoutubeVideosModalTrue,
        setFalse: setShowEditYoutubeVideosModalFalse,
    }] = useBooleanState(false);

    const [
        triggerArchiveYoutubeVideo,
        { loading: archiveLoading },
    ] = useMutation<ArchiveYoutubeVideoMutation, ArchiveYoutubeVideoMutationVariables>(
        ARCHIVE_YOUTUBE_VIDEO,
        {
            onCompleted: (response) => {
                const archiveYoutubeVideosResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (archiveYoutubeVideosResponse.archiveYoutubeVideo.__typename === 'YouTubeVideoTypeMutationResponseType') {
                    const { ok, errors } = archiveYoutubeVideosResponse.archiveYoutubeVideo;
                    if (errors) {
                        const errorMessages = errors
                            ?.map((message: { messages: string }) => message.messages)
                            .filter((msg: string) => msg)
                            .join(', ');
                        alert.show(errorMessages);
                    } else if (ok) {
                        alert.show(
                            'Successfully archived the Youtube Video',
                            { variant: 'success' },
                        );
                    }
                    onYoutubeVideoUpdate();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to archive the Youtube Video',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleDelete = useCallback(() => {
        triggerArchiveYoutubeVideo({
            variables: { pk: youtubeVideo.id },
            context: {
                hasUpload: true,
            },
        });
    }, [triggerArchiveYoutubeVideo, youtubeVideo]);

    const handleEdit = useCallback(() => {
        if (!youtubeVideo || !youtubeVideo.id) {
            alert.show('Invalid event data');
            return;
        }
        setShowEditYoutubeVideosModalTrue();
        if (onEdit) {
            onEdit(youtubeVideo);
        }
    }, [youtubeVideo, setShowEditYoutubeVideosModalTrue, onEdit, alert]);

    return (
        <div className={styles.youtubeVideoActions}>
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
                disabled={archiveLoading}
            >
                <IoTrash />
            </Button>
            {showEditBlogModal && (
                <YoutubeVideosModal
                    onClose={setShowEditYoutubeVideosModalFalse}
                    title="Edit Youtube Video"
                    initialValues={youtubeVideo}
                    onYoutubeVideoUpdate={onYoutubeVideoUpdate}
                />
            )}
        </div>
    );
}

export default YoutubeVideoActions;
