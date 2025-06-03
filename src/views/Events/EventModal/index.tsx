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
    AddEventMutation,
    AddEventMutationVariables,
    CreateEventInput,
    EventTypeMutationResponseType,
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

// const UPDATE_EVENT = gql`
//     mutation UpdateEvent($pk: ID!, $data: UpdateEventInput!) {
//         updateEvent(pk: $pk, data: $data) {
//             ... on EventTypeMutationResponseType {
//                 errors
//                 ok
//                 result {
//                     id
//                     name
//                     description
//                     location
//                     startDate
//                     endDate
//                 }
//             }
//             ... on OperationInfo {
//                 __typename
//                 messages {
//                     message
//                 }
//             }
//         }
//     }
// `;
interface Props {
    onClose: () => void;
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
        // eventImage: {},
    }),
};

function EventModal(props: Props) {
    const {
        onClose,
    } = props;
    const alert = useAlert();

    const defaultFormValues: PartialFormType = {};

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
    ] = useMutation<AddEventMutation, AddEventMutationVariables>(
        CREATE_EVENT,
        {
            onCompleted: (response) => {
                const archiveEvent = response.createEvent as EventTypeMutationResponseType;
                const { ok, errors } = archiveEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Event Successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Create an Event',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleAddEventSubmit = useCallback((finalValue: PartialFormType) => {
        addEventsTrigger({
            variables: {
                data: {
                    ...finalValue,
                } as unknown as CreateEventInput,
            },
        });
    }, [addEventsTrigger]);

    const handleSubmit = useCallback(() => {
        createSubmitHandler(
            validate,
            setError,
            handleAddEventSubmit,
        )();
    }, [validate, setError, handleAddEventSubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.eventModal}
            heading="Add Event"
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={pristine || addEventLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addEventLoading}
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
            {/* <TextInput
                label="Image URL"
                name="eventImage"
                value={value.eventImage}
                error={error?.eventImage}
                onChange={setFieldValue}
            /> */}
        </Modal>
    );
}

export default EventModal;
