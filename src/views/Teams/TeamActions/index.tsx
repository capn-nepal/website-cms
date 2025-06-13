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
    TeamMemberTypeEnum,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

interface Props {
    teamMember: {
        id: string;
        firstName: string;
        lastName: string;
        middleName?: string;
        designation: string;
        memberType: TeamMemberTypeEnum;
        memberPhoto: {
            url: string | null;
        };
    };
    onEdit: (teamMember: Props['teamMember']) => void;
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
    } = props;

    const alert = useAlert();
    const [
        triggerDeleteTeamMember,
    ] = useMutation<DeleteTeamMemberMutation, DeleteTeamMemberMutationVariables>(
        DELETE_TEAM_MEMBER,
    );
    const handleEdit = useCallback(() => {
        if (!teamMember?.id) {
            alert.show('Invalid team member data');
            return;
        }
        onEdit(teamMember);
    }, [teamMember, onEdit, alert]);

    const handleDelete = useCallback(() => {
        triggerDeleteTeamMember({
            variables: {
                id: teamMember.id,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [triggerDeleteTeamMember, teamMember.id]);

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
        </div>
    );
}

export default TeamActions;
