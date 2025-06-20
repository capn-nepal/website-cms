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
    JobVacanciesQuery,
    JobVacancyTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import JobVacanciesModal from '../jobVacanciesModal';

import styles from './styles.module.css';

type JobsItem = NonNullable<JobVacanciesQuery['jobVacancies']['results'][number]>;

interface Props {
    jobVacancy:JobsItem
    onEdit?: (event: Props['jobVacancy']) => void;
    jobVacancyRefetch: () => void;
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
        jobVacancyRefetch,
    } = props;
    const alert = useAlert();
    const [
        showEditJobVacancyModal, {
            setTrue: setShowEditJobVacancyModalTrue,
            setFalse: setShowEditJobVacancyModalFalse,
        }] = useBooleanState(false);

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
                    jobVacancyRefetch();
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
        if (!jobVacancy || !jobVacancy.id) {
            alert.show('Invalid event data');
            return;
        }
        setShowEditJobVacancyModalTrue();
        if (onEdit) {
            onEdit(jobVacancy);
        }
    }, [jobVacancy, setShowEditJobVacancyModalTrue, onEdit, alert]);

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
            {showEditJobVacancyModal && (
                <JobVacanciesModal
                    onClose={setShowEditJobVacancyModalFalse}
                    title="Edit Job Vacancy"
                    initialValues={jobVacancy}
                    jobVacancyRefetch={jobVacancyRefetch}
                />
            )}
        </div>

    );
}

export default JobVacancyActions;
