import {
    useCallback,
    useState,
} from 'react';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
    createSubmitHandler,
    getErrorObject,
    ObjectSchema,
    requiredStringCondition,
    useForm,
} from '@togglecorp/toggle-form';
import {
    Button,
    DateInput,
    Modal,
    SelectInput,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreateReportInput,
    CreateReportMutation,
    CreateReportMutationVariables,
    ReportTypeMutationResponseType,
    UpdateReportInput,
    UpdateReportMutation,
    UpdateReportMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_REPORT = gql`
    mutation CreateReport($data: CreateReportInput!) {
        createReport(data: $data) {
            ... on ReportTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    publishedDate
                    isDeleted
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

const UPDATE_REPORT = gql`
    mutation UpdateReport($pk: ID!, $data: UpdateReportInput!) {
        updateReport(pk: $pk, data: $data) {
            ... on ReportTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    publishedDate
                    isDeleted
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

interface Props {
    onClose: () => void;
    title: string;
    initialValues?: Partial<CreateReportInput & { id: string }>;
}

const statusOptions = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PUBLISHED', label: 'Published' },
];

type PartialFormType = Partial<CreateReportInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const keySelector = (option: { key: string }) => option.key;
const labelSelector = (option: { label: string }) => option.label;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        description: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        publishedDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        status: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        reportFile: {},
    }),
};

function ReportModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
    } = props;
    const alert = useAlert();

    const defaultFormValues: PartialFormType = initialValues || {
        title: '',
        description: '',
        publishedDate: '',
        status: 'DRAFT',
        reportFile: undefined,
    };

    const [filePreview, setFilePreview] = useState<string | undefined>(
        initialValues?.reportFile ? initialValues.reportFile : undefined,
    );

    const {
        value,
        error: formError,
        pristine,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const [
        createReportTrigger,
        { loading: createReportLoading },
    ] = useMutation<CreateReportMutation, CreateReportMutationVariables>(
        CREATE_REPORT,
        {
            onCompleted: (response) => {
                const createReport = response.createReport as ReportTypeMutationResponseType;
                const { ok, errors } = createReport;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Report Successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Create Report',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateReportTrigger,
        { loading: updateReportLoading },
    ] = useMutation<UpdateReportMutation, UpdateReportMutationVariables>(
        UPDATE_REPORT,
        {
            onCompleted: (response) => {
                const updateReport = response.updateReport as ReportTypeMutationResponseType;
                const { ok, errors } = updateReport;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Report Successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Update Report',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            setFieldValue(uploadedFile, 'reportFile');
            if (uploadedFile) {
                setFilePreview(uploadedFile.name);
            } else {
                setFilePreview(undefined);
            }
        },
        [setFieldValue],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateReportTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateReportInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            } else {
                createReportTrigger({
                    variables: {
                        data: finalValue as CreateReportInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        })();
    }, [validate, setError, createReportTrigger, updateReportTrigger, initialValues]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.reportModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={pristine || createReportLoading || updateReportLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || createReportLoading || updateReportLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Title"
                name="title"
                value={value.title}
                error={error?.title}
                onChange={setFieldValue}
            />
            <TextArea
                label="Description"
                name="description"
                value={value.description}
                error={error?.description}
                onChange={setFieldValue}
            />
            <DateInput
                label="Published Date"
                name="publishedDate"
                value={value.publishedDate}
                error={typeof error?.publishedDate === 'string' ? error.publishedDate : undefined}
                onChange={setFieldValue}
            />
            <SelectInput
                label="Status"
                name="status"
                value={value.status}
                error={error?.status}
                onChange={setFieldValue}
                options={statusOptions}
                keySelector={keySelector}
                labelSelector={labelSelector}
            />
            <div>
                <div>Report File</div>
                <input
                    type="file"
                    id="reportFile"
                    name="reportFile"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleFileChange}
                />
                {filePreview && (
                    <div>
                        Selected file:
                        {filePreview}
                    </div>
                )}
                {error?.reportFile && typeof error.reportFile === 'string'
                 && <div>{error.reportFile}</div>}
            </div>
        </Modal>
    );
}

export default ReportModal;
