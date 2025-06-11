import { useCallback } from 'react';
import {
    IoPencil,
    IoTrash,
} from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import { TeamMemberTypeEnum } from '#generated/types/graphql';
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

function TeamActions(props: Props) {
    const {
        teamMember,
        onEdit,
    } = props;

    const alert = useAlert();

    const handleEdit = useCallback(() => {
        if (!teamMember?.id) {
            alert.show('Invalid team member data');
            return;
        }
        onEdit(teamMember);
    }, [teamMember, onEdit, alert]);

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
                onClick={() => {}}// TODO: Handle delete here
                title="Delete"
                transparent
            >
                <IoTrash />
            </Button>
        </div>
    );
}

export default TeamActions;
