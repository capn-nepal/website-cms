import { useCallback } from 'react';
import { IoTrash } from 'react-icons/io5';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { Button } from '@togglecorp/toggle-ui';

import {
    ArtWorksQuery,
    DeleteArtworkMutation,
    DeleteArtworkMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

type ArtWorkItems = NonNullable<ArtWorksQuery['artWorks']['results'][number]>;
const DELETE_ART_WORK = gql`
    mutation DeleteArtwork($id: ID!) {
        deleteArtwork(data: {id: $id}) {
            ... on  ArtworkType {
                id
                name
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
    artWorks: ArtWorkItems;
    refetchArtWork:()=> void;
}

function ArtWorkActions(props: Props) {
    const {
        artWorks,
        refetchArtWork,
    } = props;
    const alert = useAlert();

    const [
        triggerDeleteArtWork,
        { loading: deleteLoading },
    ] = useMutation<DeleteArtworkMutation, DeleteArtworkMutationVariables>(
        DELETE_ART_WORK,
        {
            onCompleted: () => {
                alert.show(
                    'Gallery item deleted Artwork',
                    { variant: 'success' },
                );
                refetchArtWork();
            },
            onError: () => {
                alert.show(
                    'Failed to Delete  Artwork',
                    { variant: 'danger' },
                );
            },
        },

    );

    const handleDelete = useCallback(() => {
        if (!artWorks?.id) {
            alert.show(
                'InvalidID',
                { variant: 'danger' },
            );
            return;
        }

        triggerDeleteArtWork({
            variables: {
                id: artWorks.id,
            },
        });
    }, [artWorks, triggerDeleteArtWork, alert]);

    return (
        <div className={styles.artworkActions}>
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

export default ArtWorkActions;
