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
    ArchiveJobVacancyMutation,
    ArchiveJobVacancyMutationVariables,
    JobVacancyTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

interface Props {
    jobVacancy: {
        id: string;
        description: string;
        deadline: string;
        numberOfVacancies: number;
        position: {
            pk: string;
        };
    };
    onEdit?: (event: Props['jobVacancy']) => void;
    refetch?: () => void;
}

const ARCHIVE_JOB_VACANCY = gql`
    mutation ArchiveJobVacancy($pk: ID!) {
        archiveJobVacancy(pk: $pk) {
            ... on JobVacancyTypeMutationResponseType {
                errors
                ok
                result {
                    deadline
                    description
                    id
                    numberOfVacancies
                    position {
                        pk
                    }
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

function JobVacancyActions(props: Props) {
    const {
        jobVacancy,
        onEdit,
        refetch,
    } = props;
    const alert = useAlert();

    const [
        triggerArchiveJobVacancy,
        { loading: archiveLoading },
    ] = useMutation<ArchiveJobVacancyMutation, ArchiveJobVacancyMutationVariables>(
        ARCHIVE_JOB_VACANCY,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const archiveVacancy = response.archiveJobVacancy as JobVacancyTypeMutationResponseType;
                const { ok, errors } = archiveVacancy;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter(Boolean)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully archived the Job Vacancy',
                        { variant: 'success' },
                    );
                    refetch?.();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to archive the Job Vacancy',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleDelete = useCallback(() => {
        triggerArchiveJobVacancy({
            variables: { pk: jobVacancy.id },
            context: {
                hasUpload: true,
            },
        });
    }, [triggerArchiveJobVacancy, jobVacancy.id]);

    const handleEdit = useCallback(() => {
        if (!jobVacancy) {
            alert.show('Invalid data');
            return;
        }
        onEdit?.(jobVacancy);
    }, [jobVacancy, onEdit, alert]);

    return (
        <div className={styles.vacancyActions}>
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
        </div>
    );
}

export default JobVacancyActions;
