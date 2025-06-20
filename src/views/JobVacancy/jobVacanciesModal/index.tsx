import { useCallback } from 'react';
import {
    gql,
    useMutation,
    useQuery,
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
    NumberInput,
    SelectInput,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    CreateJobVacancyInput,
    CreateJobVacancyMutation,
    CreateJobVacancyMutationVariables,
    JobVacancyTypeMutationResponseType,
    PositionsQuery,
    PositionsQueryVariables,
    UpdateJobVacancyInput,
    UpdateJobVacancyMutation,
    UpdateJobVacancyMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_JOB_VACANCY = gql`
    mutation CreateJobVacancy($data: CreateJobVacancyInput!) {
        createJobVacancy(data: $data) {
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

const UPDATE_JOB_VACANCY = gql`
    mutation UpdateJobVacancy($pk: ID!, $data: UpdateJobVacancyInput!) {
        updateJobVacancy(pk: $pk, data: $data) {
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

const POSITIONS_QUERY = gql`
    query Position($pagination: OffsetPaginationInput) {
        positions(pagination: $pagination) {
            results {
                id
                name
            }
        }
    }
`;

interface Props {
    title: string;
    onClose: () => void;
    initialValues?: Partial<UpdateJobVacancyInput & { id: string }>;
    jobVacancyRefetch: () => void;
}

const positionKeySelector = (option: { value: string; label: string }) => option.value;
const positionLabelSelector = (option: { value: string; label: string }) => option.label;

type PartialFormType = Partial<CreateJobVacancyInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        deadline: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        description: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        numberOfVacancies: {
            required: true,
        },
        position: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

function JobVacanciesModal(props: Props) {
    const {
        title,
        onClose,
        initialValues,
        jobVacancyRefetch,
    } = props;
    const alert = useAlert();

    const defaultFormValues: Partial<CreateJobVacancyInput> = {
        description: initialValues?.description || '',
        deadline: initialValues?.deadline || undefined,
        numberOfVacancies: initialValues?.numberOfVacancies || undefined,
        position: initialValues?.position || '',
    };
    const {
        value,
        error: formError,
        pristine,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const {
        data: positionsResponse,
    } = useQuery<PositionsQuery, PositionsQueryVariables>(
        POSITIONS_QUERY,
    );

    const positionOptions = positionsResponse?.positions.results.map((position) => ({
        value: position.id,
        label: position.name,
    })) ?? [];

    const [
        addJobVacancyTrigger,
        { loading: addJobVacancyLoading },
    ] = useMutation<CreateJobVacancyMutation, CreateJobVacancyMutationVariables>(
        CREATE_JOB_VACANCY,
        {
            onCompleted: (response) => {
                const addVacancy = response.createJobVacancy as JobVacancyTypeMutationResponseType;
                const { ok, errors } = addVacancy;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'New Job Vacancy successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    jobVacancyRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create new Job Vacancy',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateJobVacancyTrigger,
        { loading: updateJobVacancyLoading },
    ] = useMutation<UpdateJobVacancyMutation, UpdateJobVacancyMutationVariables>(
        UPDATE_JOB_VACANCY,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateJobVacancy = response.updateJobVacancy as JobVacancyTypeMutationResponseType;
                const { ok, errors } = updateJobVacancy;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Job Vacancy successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                    jobVacancyRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the Job Vacancy',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handlePositionSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateJobVacancyTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateJobVacancyInput,
                    },
                });
            } else {
                addJobVacancyTrigger({
                    variables: { data: finalValue as CreateJobVacancyInput },
                });
            }
        },
        [addJobVacancyTrigger, initialValues, updateJobVacancyTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handlePositionSubmit)();
    }, [validate, setError, handlePositionSubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.jobVacancyModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addJobVacancyLoading || updateJobVacancyLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addJobVacancyLoading || updateJobVacancyLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextArea
                label="Description"
                name="description"
                value={value.description}
                error={error?.description}
                onChange={setFieldValue}
            />
            <DateInput
                label="Deadline"
                name="deadline"
                value={value.deadline}
                error={typeof error?.deadline === 'string' ? error.deadline : undefined}
                onChange={setFieldValue}
            />
            <NumberInput
                name="numberOfVacancies"
                label="No of vacancies"
                value={value.numberOfVacancies}
                onChange={setFieldValue}
                error={error?.numberOfVacancies}
            />
            <SelectInput
                label="Position"
                name="position"
                options={positionOptions}
                value={value.position}
                error={error?.position}
                keySelector={positionKeySelector}
                labelSelector={positionLabelSelector}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default JobVacanciesModal;
