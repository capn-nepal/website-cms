import { useCallback } from 'react';
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

import FileInput from '#components/FileInput';
import {
    CreateReportInput,
    CreateReportMutation,
    CreateReportMutationVariables,
    StatusEnum,
    UpdateReportInput,
    UpdateReportMutation,
    UpdateReportMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import { transformToFormError } from '#utils/errorTransform';

import styles from './styles.module.css';

const CREATE_REPORT = gql`
    mutation CreateReport($data: CreateReportInput!) {
        createReport(data: $data) {
            ... on ReportTypeMutationResponseType {
                errors
                ok
                result {
                    coverImage {
                        name
                        url
                    }
                    description
                    id
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
    initialValues?: Partial<UpdateReportInput & { id: string }>;
    onReportUpdate: () => void;
}
const statusOptions: {
    label: string;
    status: StatusEnum;
}[] = [
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PUBLISHED', label: 'Published' },
];
const statusKeySelector = (option: { status: StatusEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;

type PartialFormType = Partial<CreateReportInput & UpdateReportInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

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
        reportFile: {},
        status: {},
        coverImage: {},
    }),
};

function ReportModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
        onReportUpdate,
    } = props;
    const alert = useAlert();

    const defaultFormValues: Partial<CreateReportInput & UpdateReportInput> = {
        title: initialValues?.title || '',
        description: initialValues?.description || '',
        publishedDate: initialValues?.publishedDate || undefined,
        reportFile: initialValues?.reportFile,
        status: initialValues?.status || undefined,
    };
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
                const createReportResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (createReportResponse.createReport.__typename === 'ReportTypeMutationResponseType') {
                    const { ok, errors } = createReportResponse.createReport;

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
                        onReportUpdate();
                    }
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
                const updateReportResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (updateReportResponse.updateReport.__typename === 'ReportTypeMutationResponseType') {
                    const { ok, errors } = updateReportResponse.updateReport;
                    if (errors) {
                        setError(transformToFormError(errors));
                        const errorMessages = errors
                            ?.map((message: { messages: string; }) => message.messages)
                            .filter((msg: string) => msg)
                            .join(', ');
                        alert.show(errorMessages, { variant: 'danger' });
                    } else if (ok) {
                        alert.show(
                            'Report Successfully updated',
                            { variant: 'success' },
                        );
                        onClose();
                    }
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

    const handleSubmit = useCallback(
        () => {
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { status, ...createData } = finalValue;
                    createReportTrigger({
                        variables: {
                            data: createData as CreateReportInput,
                        },
                        context: {
                            hasUpload: true,
                        },
                    });
                }
            })();
        },
        [validate, setError, createReportTrigger, updateReportTrigger, initialValues],
    );
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
            <FileInput
                label="Cover Image"
                name="coverImage"
                value={value.coverImage}
                accept="image/*"
                onChange={setFieldValue}
            >
                Choose Cover Image
            </FileInput>

            {initialValues?.id && (
                <SelectInput
                    label="Status"
                    name="status"
                    options={statusOptions}
                    keySelector={statusKeySelector}
                    labelSelector={statusLabelSelector}
                    value={value.status}
                    error={error?.status}
                    onChange={setFieldValue}
                />
            )}
            <DateInput
                label="Published Date"
                name="publishedDate"
                value={value.publishedDate}
                error={typeof error?.publishedDate === 'string' ? error.publishedDate : undefined}
                onChange={setFieldValue}
            />
            <FileInput
                label="Report File"
                name="reportFile"
                value={value.reportFile}
                accept=".pdf, .doc, .docx, .txt, .xlsx"
                onChange={setFieldValue}
            >
                Choose a File
            </FileInput>

        </Modal>
    );
}

export default ReportModal;
