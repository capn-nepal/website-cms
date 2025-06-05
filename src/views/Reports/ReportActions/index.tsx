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
    ArchiveReportMutation,
    ArchiveReportMutationVariables,
    ReportTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import ReportModal from '../ReportsModal';

import styles from './styles.module.css';

interface Props {
    id: string;
    onDelete: (id: string) => void;
}

const ARCHIVE_REPORT = gql`
    mutation ArchiveReport($pk: ID!) {
        archiveReport(pk: $pk) {
            ... on ReportTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    isDeleted
                    publishedDate
                    reportFile {
                        url
                    }
                    status
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
function ReportActions(props: Props) {
    const {
        id,
        onDelete,
    } = props;
    const alert = useAlert();

    const [
        showEditReportModal, {
            setTrue: setShowEditReportModalTrue,
            setFalse: setShowEditReportModalFalse,
        }] = useBooleanState(false);

    const [
        triggerArchiveReport,
        { loading: archiveLoading },
    ] = useMutation<ArchiveReportMutation, ArchiveReportMutationVariables>(
        ARCHIVE_REPORT,
        {
            onCompleted: (response) => {
                const archiveEvent = response.archiveReport as ReportTypeMutationResponseType;
                const { ok, errors } = archiveEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Successfully Archived the Report',
                        { variant: 'success' },
                    );
                    onDelete(id);
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Archive the Report',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleDelete = useCallback(() => {
        if (!id) {
            alert.show('Invalid report ID');
            return;
        }
        triggerArchiveReport({ variables: { pk: id } });
    }, [triggerArchiveReport, id, alert]);

    const handleEdit = useCallback(() => {
        if (!id) {
            alert.show('Invalid report ID');
            return;
        }
        setShowEditReportModalTrue();
    }, [id, alert, setShowEditReportModalTrue]);

    const initialValues = {
        id,
        title: '',
        description: '',
        publishedDate: '',
        status: '',
        reportFile: undefined,
    };

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
                disabled={archiveLoading}
            >
                <IoTrash />
            </Button>
            {showEditReportModal && (
                <ReportModal
                    onClose={setShowEditReportModalFalse}
                    title="Edit Report"
                    initialValues={initialValues}
                />
            )}
        </div>
    );
}

export default ReportActions;
