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
    Modal,
    SelectInput,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreatePositionInput,
    CreatePositionMutation,
    CreatePositionMutationVariables,
    EmploymentTypeEnum,
    PositionTypeMutationResponseType,
    UpdatePositionInput,
    UpdatePositionMutation,
    UpdatePositionMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const employeeTypeOptions: {
    label: string;
    employeeType: EmploymentTypeEnum;
}[] = [
    { employeeType: 'CONTRACT', label: 'Contract' },
    { employeeType: 'FULL_TIME', label: 'Full Time' },
    { employeeType: 'PART_TIME', label: 'Part Time' },
];
const employeeKeySelector = (option: { employeeType: EmploymentTypeEnum}) => option.employeeType;
const employeeLabelSelector = (option: { label: string }) => option.label;

const CREATE_POSITION = gql`
    mutation CreatePosition($data: CreatePositionInput!) {
        createPosition(data: $data) {
            ... on PositionTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    employmentType
                    id
                    name
                    summary
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

const UPDATE_POSITION = gql`
    mutation UpdatePosition($pk: ID!, $data: UpdatePositionInput!) {
        updatePosition(pk: $pk, data: $data) {
            ... on PositionTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    employmentType
                    id
                    name
                    summary
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
    title: string;
    onClose: () => void;
    initialValues?: Partial<UpdatePositionInput & { id: string }>;
    refetchPosition: ()=> void;
}

type PartialFormType = Partial<CreatePositionInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        name: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        description: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        summary: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        employmentType: {
            required: true,
            requiredValidation: requiredStringCondition,
        },

    }),
};

function PositionModal(props: Props) {
    const {
        title,
        onClose,
        initialValues,
        refetchPosition,
    } = props;
    const alert = useAlert();

    const defaultFormValues: Partial<CreatePositionInput> = {
        name: initialValues?.name || '',
        description: initialValues?.description || '',
        summary: initialValues?.summary || undefined,
        employmentType: initialValues?.employmentType || undefined,
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
        addEventsTrigger,
        { loading: addPositionLoading },
    ] = useMutation<CreatePositionMutation, CreatePositionMutationVariables>(
        CREATE_POSITION,
        {
            onCompleted: (response) => {
                const addPosition = response.createPosition as PositionTypeMutationResponseType;
                const { ok, errors } = addPosition;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        ' New Position successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    refetchPosition();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create new Position',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateEventTrigger,
        { loading: updatePositionLoading },
    ] = useMutation<UpdatePositionMutation, UpdatePositionMutationVariables>(
        UPDATE_POSITION,
        {
            onCompleted: (response) => {
                const updatePosition = response.updatePosition as PositionTypeMutationResponseType;
                const { ok, errors } = updatePosition;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        ' Position successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                    refetchPosition();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the  Position',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handlePositionSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateEventTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdatePositionInput,
                    },

                });
            } else {
                addEventsTrigger({
                    variables: { data: finalValue as CreatePositionInput },
                });
            }
        },
        [addEventsTrigger, initialValues, updateEventTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handlePositionSubmit)();
    }, [validate, setError, handlePositionSubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.positionModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addPositionLoading || updatePositionLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addPositionLoading || updatePositionLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Position Name"
                name="name"
                value={value.name}
                error={error?.name}
                onChange={setFieldValue}
            />
            <TextArea
                label="Description"
                name="description"
                value={value.description}
                error={error?.description}
                onChange={setFieldValue}
            />

            <TextArea
                label="Summary"
                name="summary"
                value={value.summary}
                error={error?.summary}
                onChange={setFieldValue}
            />
            <div>
                <SelectInput
                    label="Employment type"
                    placeholder="Employment type"
                    name="employmentType"
                    options={employeeTypeOptions}
                    keySelector={employeeKeySelector}
                    labelSelector={employeeLabelSelector}
                    value={value.employmentType}
                    onChange={setFieldValue}
                />
            </div>

        </Modal>
    );
}

export default PositionModal;
