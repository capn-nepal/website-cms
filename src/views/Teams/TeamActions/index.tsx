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
    DeleteTeamMemberMutation,
    DeleteTeamMemberMutationVariables,
    TeamMembersQuery,
    TeamMemberTypeEnum,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import TeamModal from '../TeamModal';

import styles from './styles.module.css';

type TeamsItem = NonNullable<TeamMembersQuery['teamMembers']['results'][number]>;

interface Props {
    teamMember: TeamsItem;
    onEdit: (teamMember: Props['teamMember']) => void;
    teamRefetch: () => void;
}

const DELETE_TEAM_MEMBER = gql`
    mutation DeleteTeamMember($id: ID!) {
        deleteTeamMember(data: { id: $id }) {
            ... on TeamMemberType {
                id
                designation
                firstName
                lastName
                memberPhoto {
                    url
                }
                memberType
                middleName
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

function TeamActions(props: Props) {
    const {
        teamMember,
        onEdit,
        teamRefetch,
    } = props;

    const alert = useAlert();
    const [
        showEditTeamMemberModal, {
            setTrue: setShowEditTeamMemberModalTrue,
            setFalse: setShowEditTeamMemberModalFalse,
        },
    ] = useBooleanState(false);
    const [
        triggerDeleteTeamMember,
    ] = useMutation<DeleteTeamMemberMutation, DeleteTeamMemberMutationVariables>(
        DELETE_TEAM_MEMBER,
        {
            onCompleted: (response) => {
                if ('messages' in response.deleteTeamMember) {
                    const message = response.deleteTeamMember.messages?.[0]?.message;
                    alert.show(
                        message,
                    );
                } else {
                    alert.show(
                        'Team member deleted successfully',
                        { variant: 'success' },
                    );
                    teamRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to delete team member',
                    { variant: 'danger' },
                );
            },

        },
    );
    const handleEdit = useCallback(() => {
        if (!teamMember?.id) {
            alert.show('Invalid report data');
            return;
        }

        setShowEditTeamMemberModalTrue();
        onEdit(teamMember);
    }, [teamMember, setShowEditTeamMemberModalTrue, onEdit, alert]);

    const handleDelete = useCallback(() => {
        triggerDeleteTeamMember({
            variables: {
                id: teamMember.id,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [triggerDeleteTeamMember, teamMember]);

    return (
        <div className={styles.reportActions}>
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
            {showEditTeamMemberModal && (
                <TeamModal
                    onClose={setShowEditTeamMemberModalFalse}
                    title="Edit Team member"
                    initialValues={{
                        ...teamMember,
                        memberType: teamMember.memberType as TeamMemberTypeEnum,
                    }}
                    teamRefetch={teamRefetch}
                />
            )}
        </div>
    );
}

export default TeamActions;
