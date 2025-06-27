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
    ArchiveGalleryMutation,
    ArchiveGalleryMutationVariables,
    GalleriesQuery,
    GalleryTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import GalleryModal from '../GalleryModal';

import styles from './styles.module.css';

type GalleryItem = NonNullable<GalleriesQuery['galleries']['results'][number]>;

const DELETE_GALLERY = gql`
    mutation ArchiveGallery($pk: ID!) {
        archiveGallery(pk: $pk ) {
            ... on GalleryTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    isArchived
                    name
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

interface Props {
    galleryItem: GalleryItem
    onEdit?: (event: Props['galleryItem']) => void;
    refetchGallery:()=> void;
}

function GalleryActions(props: Props) {
    const {
        galleryItem,
        onEdit,
        refetchGallery,
    } = props;
    const alert = useAlert();
    const [
        showEditGalleryModal, {
            setTrue: setShowEditGalleryModalTrue,
            setFalse: setShowEditGalleryModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveGalleryItem,
        { loading: deleteLoading },
    ] = useMutation<ArchiveGalleryMutation, ArchiveGalleryMutationVariables>(
        DELETE_GALLERY,
        {
            onCompleted: (response) => {
                const archiveGallery = response.archiveGallery as GalleryTypeMutationResponseType;
                const { ok, errors } = archiveGallery;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully archived the Gallery',
                        { variant: 'success' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Delete an Gallery item',
                    { variant: 'danger' },
                );
            },
        },

    );

    const handleDelete = useCallback(() => {
        if (!galleryItem?.id) {
            alert.show(
                'Invalid gallery item ID',
                { variant: 'danger' },
            );
            return;
        }

        triggerArchiveGalleryItem({
            variables: {
                pk: galleryItem.id,
            },
        });
    }, [galleryItem.id, triggerArchiveGalleryItem, alert]);

    const handleEdit = useCallback(() => {
        if (!galleryItem || !galleryItem.id) {
            alert.show('Invalid data');
            return;
        }
        setShowEditGalleryModalTrue();
        if (onEdit) {
            onEdit(galleryItem);
        }
    }, [galleryItem, setShowEditGalleryModalTrue, onEdit, alert]);

    return (
        <div className={styles.galleryActions}>
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
                disabled={deleteLoading}
            >
                <IoTrash />
            </Button>
            {showEditGalleryModal && (
                <GalleryModal
                    onClose={setShowEditGalleryModalFalse}
                    title="Edit Gallery"
                    initialValues={galleryItem}
                    galleryRefetch={refetchGallery}
                />
            )}
        </div>
    );
}

export default GalleryActions;
