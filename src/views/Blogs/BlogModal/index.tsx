import { useCallback } from 'react';
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
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

type BlogItems ={
    title: string;
    description: string;
    author?: string;
    content?: string;
    publishedDate?: string;
    coverImage?: string;
}

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

type PartialFormType = Partial<BlogItems>;
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
        author: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        content: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        publishedDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        coverImage: {},
    }),
};

const defaultFormValues: PartialFormType = {};

function BlogModal(props: Props) {
    const {
        onClose,
        onSuccess,
    } = props;

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
            className={styles.blogModal}
            heading={value ? 'Edit Blog' : 'Add Blog'}
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
                        className={styles.saveButton}
                        name="save"
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
            <TextInput
                label="Author Name"
                name="author"
                value={value.author}
                error={error?.author}
                onChange={setFieldValue}
            />
            <TextInput
                label="Image URL"
                name="coverImage"
                value={value.coverImage}
                error={typeof error?.coverImage === 'string' ? error.coverImage : undefined}
                onChange={setFieldValue}
            />
        </Modal>
    );
}
export default BlogModal;
