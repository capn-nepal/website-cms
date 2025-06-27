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
    ArchiveGalleryItemMutation,
    ArchiveGalleryItemMutationVariables,
    GalleryItemsQuery,
    GalleryItemTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import GalleryItemModal from '../GalleryItemModal';

import styles from './styles.module.css';

type GalleryItem = NonNullable<GalleryItemsQuery['galleryItems']['results'][number]>;

const DELETE_GALLERY = gql`
    mutation ArchiveGalleryItem($pk: ID!) {
        archiveGalleryItem(pk: $pk ) {
            ... on GalleryItemTypeMutationResponseType {
                errors
                ok
                result {
                    caption
                    id
                    gallery {
                        name
                        id
                    }
                    image {
                        url
                    }
                    isArchived
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
    refetchGalleryItem: ()=> void;
}

function GalleryItemActions(props: Props) {
    const {
        galleryItem,
        onEdit,
        refetchGalleryItem,
    } = props;
    const alert = useAlert();
    const [
        showEditGalleryItemModal, {
            setTrue: setShowEditGalleryItemModalTrue,
            setFalse: setShowEditGalleryItemModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveGalleryItem,
        { loading: deleteLoading },
    ] = useMutation<ArchiveGalleryItemMutation, ArchiveGalleryItemMutationVariables >(
        DELETE_GALLERY,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveGallery = response.archiveGalleryItem as GalleryItemTypeMutationResponseType;
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
                    refetchGalleryItem();
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
        setShowEditGalleryItemModalTrue();
        if (onEdit) {
            onEdit(galleryItem);
        }
    }, [galleryItem, setShowEditGalleryItemModalTrue, onEdit, alert]);

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
            {showEditGalleryItemModal && (
                <GalleryItemModal
                    onClose={setShowEditGalleryItemModalFalse}
                    title="Edit Gallery Item"
                    initialValues={{
                        ...galleryItem,
                        gallery: galleryItem.gallery.id,
                    }}
                    galleryItemRefetch={refetchGalleryItem}
                />
            )}
        </div>
    );
}

export default GalleryItemActions;
