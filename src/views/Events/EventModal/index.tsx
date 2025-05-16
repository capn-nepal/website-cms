import {
    useCallback,
    useMemo,
} from 'react';
import { isDefined } from '@togglecorp/fujs';
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

import styles from './styles.module.css';

type EventItem = {
    id?: string;
    name: string;
    description: string;
    location?: string;
    startDate: string;
    endDate: string;
    eventImage?: string;
};

interface Props {
    onClose: () => void;
    event?: Partial<EventItem>;
    onSuccess?: () => void;
}

type PartialFormType = Partial<EventItem>;
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
        eventImage: {},
    }),
};

function EventModal(props: Props) {
    const {
        onClose,
        event,
        onSuccess,
    } = props;

    const defaultFormValues = useMemo<PartialFormType>(() => ({
        id: event?.id,
        name: event?.name ?? '',
        description: event?.description ?? '',
        location: event?.location ?? '',
        startDate: event?.startDate ?? '',
        endDate: event?.endDate ?? '',
        eventImage: event?.eventImage ?? '',
    }), [event]);

    const {
        value,
        error: formError,
        pristine,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const handleSubmitSuccess = useCallback((formValues: PartialFormType) => {
        console.info('Form submitted:', formValues);

        if (onSuccess) {
            onSuccess();
        }

        onClose();
    }, [onClose, onSuccess]);

    const handleSubmit = useCallback(() => {
        createSubmitHandler(
            validate,
            setError,
            handleSubmitSuccess,
        )();
    }, [validate, setError, handleSubmitSuccess]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.eventModal}
            heading={isDefined(event?.id) ? 'Edit Event' : 'Add Event'}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine}
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
                error={error?.startDate}
                onChange={setFieldValue}
            />
            <DateInput
                label="End Date"
                name="endDate"
                value={value.endDate}
                error={error?.endDate}
                onChange={setFieldValue}
            />
            <TextInput
                label="Image URL"
                name="eventImage"
                value={value.eventImage}
                error={error?.eventImage}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default EventModal;
