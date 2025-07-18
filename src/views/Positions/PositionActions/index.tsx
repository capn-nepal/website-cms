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
    ArchivePositionMutation,
    ArchivePositionMutationVariables,
    EmploymentTypeEnum,
    PositionsQuery,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import PositionModal from '../PositionModal';

import styles from './styles.module.css';

type PositionsItem = NonNullable<PositionsQuery['positions']['results'][number]>;

interface Props {
    positions: PositionsItem
    onEdit?: (event: Props['positions']) => void;
    positionRefetch:()=> void;
}

const ARCHIVE_POSITION = gql`
    mutation ArchivePosition($pk: ID!) {
        archivePosition(pk: $pk) {
            ... on PositionTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    name
                    description
                    summary
                    employmentType
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
function PositionActions(props: Props) {
    const {
        positions,
        onEdit,
        positionRefetch,
    } = props;
    const alert = useAlert();

    const [
        showEditEventModal, {
            setTrue: setShowEditPositionModalTrue,
            setFalse: setShowEditPositionModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchivePosition,
        { loading: archiveLoading },
    ] = useMutation<ArchivePositionMutation, ArchivePositionMutationVariables>(
        ARCHIVE_POSITION,
        {
            onCompleted: (response) => {
                const archivePositionResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (archivePositionResponse.archivePosition.__typename === 'PositionTypeMutationResponseType') {
                    const { ok, errors } = archivePositionResponse.archivePosition;
                    if (errors) {
                        const errorMessages = errors
                            ?.map((message: { messages: string }) => message.messages)
                            .filter((msg: string) => msg)
                            .join(', ');
                        alert.show(errorMessages);
                    } else if (ok) {
                        alert.show(
                            'Successfully archived the Position',
                            { variant: 'success' },
                        );
                        positionRefetch();
                    }
                }
            },
            onError: () => {
                alert.show(
                    'Failed to archive the Position',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleDelete = useCallback(() => {
        triggerArchivePosition({ variables: { pk: positions.id } });
    }, [triggerArchivePosition, positions]);

    const handleEdit = useCallback(() => {
        if (!positions || !positions.id) {
            alert.show('Invalid Position data');
            return;
        }
        setShowEditPositionModalTrue();
        if (onEdit) {
            onEdit(positions);
        }
    }, [positions, setShowEditPositionModalTrue, onEdit, alert]);

    return (
        <div className={styles.eventActions}>
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
            {showEditEventModal && (
                <PositionModal
                    onClose={setShowEditPositionModalFalse}
                    title="Edit Position"
                    initialValues={positions ? {
                        ...positions,
                        employmentType: positions.employmentType as EmploymentTypeEnum,
                    } : undefined}
                    onPositionUpdate={positionRefetch}
                />
            )}
        </div>
    );
}
export default PositionActions;
