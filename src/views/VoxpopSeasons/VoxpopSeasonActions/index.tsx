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
    ArchiveVoxpopSeasonMutation,
    ArchiveVoxpopSeasonMutationVariables,
    VoxpopSeasonsQuery,
    VoxPopSeasonTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import VoxpopSeasonModal from '../VoxpopSeasonModal';

import styles from './styles.module.css';

type VoxpopSeasonsItem = NonNullable<VoxpopSeasonsQuery['voxpopSeasons']['results'][number]>;

interface Props {
    voxpopSeason:VoxpopSeasonsItem
    onEdit: (voxpopSeason: VoxpopSeasonsItem) => void;
    voxPopSeasonRefetch: () => void;
}

const ARCHIVE_VOX_POP_SEASON = gql`
    mutation  ArchiveVoxpopSeason($pk: ID!) {
        archiveVoxpopSeason(pk: $pk) {
            ... on VoxPopSeasonTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    description
                    id
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

function VoxPopSeasonsActions(props:Props) {
    const {
        voxpopSeason,
        onEdit,
        voxPopSeasonRefetch,
    } = props;
    const alert = useAlert();
    const [
        showEditVoxpopSeasonModal, {
            setTrue: setShowEditVoxpopSeasonModalTrue,
            setFalse: setShowEditVoxpopSeasonModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveVoxPopSeason,
    ] = useMutation<ArchiveVoxpopSeasonMutation, ArchiveVoxpopSeasonMutationVariables>(
        ARCHIVE_VOX_POP_SEASON,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveEvent = response.archiveVoxpopSeason as VoxPopSeasonTypeMutationResponseType;
                const { ok, errors } = archiveEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully archived the Voxpop season',
                        { variant: 'success' },
                    );
                }
                voxPopSeasonRefetch();
            },
            onError: () => {
                alert.show(
                    'Failed to archive the Voxpop season',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleDelete = useCallback(() => {
        triggerArchiveVoxPopSeason({ variables: { pk: voxpopSeason.id } });
    }, [triggerArchiveVoxPopSeason, voxpopSeason]);

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
                onClick={handleDelete}
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
            { showEditVoxpopSeasonModal && (
                <VoxpopSeasonModal
                    onClose={setShowEditVoxpopSeasonModalFalse}
                    title="Edit VoxPop Season"
                    initialValues={voxpopSeason}
                    voxpopSeasonRefetch={voxPopSeasonRefetch}
                />
            )}
        </div>
    );
}

export default VoxPopSeasonsActions;
