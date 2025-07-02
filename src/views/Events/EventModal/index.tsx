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
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreateEventInput,
    CreateEventMutation,
    CreateEventMutationVariables,
    EventTypeMutationResponseType,
    UpdateEventInput,
    UpdateEventMutation,
    UpdateEventMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_EVENT = gql`
    mutation CreateEvent($data: CreateEventInput!) {
        createEvent(data: $data) {
            ... on EventTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    name
                    description
                    location
                    startDate
                    endDate
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

const UPDATE_EVENT = gql`
    mutation UpdateEvent($pk: ID!, $data: UpdateEventInput!) {
        updateEvent(pk: $pk, data: $data) {
            ... on EventTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    name
                    description
                    location
                    startDate
                    endDate
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
    initialValues?: Partial<UpdateEventInput & { id: string }>;
    eventRefetch: ()=> void;
}

type PartialFormType = Partial<CreateEventInput>;
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
        location: {},
        startDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        endDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
    }),
};

function EventModal(props: Props) {
    const {
        title,
        onClose,
        initialValues,
        eventRefetch,
    } = props;
    const alert = useAlert();

    const defaultFormValues: Partial<CreateEventInput> = {
        name: initialValues?.name || '',
        description: initialValues?.description || '',
        location: initialValues?.location || '',
        startDate: initialValues?.startDate || '',
        endDate: initialValues?.endDate || '',
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
        { loading: addEventLoading },
    ] = useMutation<CreateEventMutation, CreateEventMutationVariables>(
        CREATE_EVENT,
        {
            onCompleted: (response) => {
                const addEvent = response.createEvent as EventTypeMutationResponseType;
                const { ok, errors } = addEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Event successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    eventRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create an event',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [updateEventTrigger, { loading: updateEventLoading }] = useMutation<
        UpdateEventMutation,
        UpdateEventMutationVariables
    >(UPDATE_EVENT, {
        onCompleted: (response) => {
            const updateEvent = response.updateEvent as EventTypeMutationResponseType;
            const { ok, errors } = updateEvent;
            if (errors) {
                const errorMessages = errors
                    ?.map((message: { messages: string }) => message.messages)
                    .filter((msg: string) => msg)
                    .join(', ');
                alert.show(errorMessages);
            } else if (ok) {
                alert.show(
                    'Event successfully updated',
                    { variant: 'success' },
                );
                onClose();
                eventRefetch();
            }
        },
        onError: () => {
            alert.show(
                'Failed to update the event',
                { variant: 'danger' },
            );
        },
    });

    const handleEventSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateEventTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateEventInput,
                    },

                });
            } else {
                addEventsTrigger({
                    variables: { data: finalValue as CreateEventInput },
                });
            }
        },
        [addEventsTrigger, initialValues, updateEventTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleEventSubmit)();
    }, [validate, setError, handleEventSubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.eventModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addEventLoading || updateEventLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addEventLoading || updateEventLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Event Name"
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
            <TextInput
                label="Location"
                name="location"
                value={value.location}
                error={error?.location}
                onChange={setFieldValue}
            />
            <DateInput
                label="Start Date"
                name="startDate"
                value={value.startDate}
                error={typeof error?.startDate === 'string' ? error.startDate : undefined}
                onChange={setFieldValue}
            />
            <DateInput
                label="End Date"
                name="endDate"
                value={value.endDate}
                error={typeof error?.endDate === 'string' ? error.endDate : undefined}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default EventModal;
