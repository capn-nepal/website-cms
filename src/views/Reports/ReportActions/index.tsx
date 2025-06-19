// ReportActions.tsx

import { useCallback } from 'react';
import { IoPencil } from 'react-icons/io5';
import { Button } from '@togglecorp/toggle-ui';

import { ReportsQuery } from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import useBooleanState from '#hooks/useBooleanState';

import ReportModal from '../ReportsModal';

import styles from './styles.module.css';

type ReportsItem = NonNullable<ReportsQuery['reports']['results'][number]>;

interface Props {
    report: ReportsItem;
    onEdit: (report: ReportsItem) => void;
    reportRefetch: () => void;
}

function ReportActions(props: Props) {
    const {
        report,
        onEdit,
        reportRefetch,
    } = props;

    const alert = useAlert();
    const [
        showEditReportModal, {
            setTrue: setShowEditReportModalTrue,
            setFalse: setShowEditReportModalFalse,
        },
    ] = useBooleanState(false);

    const handleEdit = useCallback(() => {
        if (!report?.id) {
            alert.show('Invalid report data');
            return;
        }

        setShowEditReportModalTrue();
        onEdit(report);
    }, [report, alert, setShowEditReportModalTrue, onEdit]);

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
            {showEditReportModal && (
                <ReportModal
                    onClose={setShowEditReportModalFalse}
                    title="Edit Report"
                    initialValues={report}
                    reportsRefetch={reportRefetch}
                />
            )}
        </div>
    );
}

export default ReportActions;
