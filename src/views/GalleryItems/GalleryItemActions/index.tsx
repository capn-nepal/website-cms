import { useCallback } from 'react';
import { IoTrash } from 'react-icons/io5';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { Button } from '@togglecorp/toggle-ui';

import {
    DeleteGalleryItemMutation,
    DeleteGalleryItemMutationVariables,
    GalleryItemType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const DELETE_GALLERY_ITEM = gql`
    mutation DeleteGalleryItem($id: ID!) {
        deleteGalleryItem(data: { id: $id }) {
            ... on GalleryItemType {
                id
                imageType
                image {
                    url
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
    galleryItem: {
        id: string;
    };
    refetchGalleryItems:()=> void;
}

function GalleryItemActions(props: Props) {
    const {
        galleryItem,
        refetchGalleryItems,
    } = props;
    const alert = useAlert();

    const [
        triggerDeleteGalleryItem,
        { loading: deleteLoading },
    ] = useMutation<DeleteGalleryItemMutation, DeleteGalleryItemMutationVariables>(
        DELETE_GALLERY_ITEM,
        {
            onCompleted: () => {
                alert.show(
                    'Gallery item deleted successfully',
                    { variant: 'success' },
                );
                refetchGalleryItems();
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
            alert.show('Invalid gallery item ID', { variant: 'danger' });
            return;
        }

        triggerDeleteGalleryItem({
            variables: {
                id: galleryItem.id,
            },
        });
    }, [galleryItem, triggerDeleteGalleryItem, alert]);

    return (
        <div className={styles.galleryActions}>
            <Button
                name="delete"
                onClick={handleDelete}
                title="Delete"
                transparent
                disabled={deleteLoading}
            >
                <IoTrash />
            </Button>
        </div>
    );
}

export default GalleryItemActions;
