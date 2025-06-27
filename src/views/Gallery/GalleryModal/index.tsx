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
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreateGalleryMutation,
    CreateGalleryMutationVariables,
    GalleryInput,
    GalleryTypeMutationResponseType,
    GalleryUpdateInput,
    UpdateGalleryMutation,
    UpdateGalleryMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_GALLERY = gql`
    mutation  createGallery($data: GalleryInput!) {
        createGallery(data: $data) {
            ... on GalleryTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    isArchived
                    name
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
const UPDATE_GALLERY = gql`
    mutation UpdateGallery($pk: ID!, $data: GalleryUpdateInput!) {
        updateGallery(pk: $pk, data: $data) {
            ... on GalleryTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    isArchived
                    name
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
    galleryRefetch:()=> void;
    initialValues?: Partial<GalleryUpdateInput & { id: string }>;
}

type PartialFormType = Partial<GalleryInput>;
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
    }),
};

function GalleryModal(props: Props) {
    const {
        title,
        onClose,
        galleryRefetch,
        initialValues,
    } = props;
    const alert = useAlert();

    const defaultFormValues: PartialFormType = {
        name: initialValues?.name || '',
        description: initialValues?.description,
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
        addGalleryTrigger,
        { loading: addGalleryLoading },
    ] = useMutation<CreateGalleryMutation, CreateGalleryMutationVariables>(
        CREATE_GALLERY,
        {
            onCompleted: (response) => {
                const createItem = response.createGallery as GalleryTypeMutationResponseType;
                const { ok, errors } = createItem;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Gallery item successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    galleryRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create an Gallery item',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateGalleryTrigger,
        { loading: updateGalleryLoading },
    ] = useMutation<UpdateGalleryMutation, UpdateGalleryMutationVariables>(
        UPDATE_GALLERY,
        {
            onCompleted: (response) => {
                const updateEvent = response.updateGallery as GalleryTypeMutationResponseType;
                const { ok, errors } = updateEvent;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Gallery item successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the Gallery item',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleGallerySubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateGalleryTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as GalleryUpdateInput,
                    },

                });
            } else {
                addGalleryTrigger({
                    variables: {
                        data: finalValue as GalleryInput,
                    },
                });
            }
        },
        [addGalleryTrigger, initialValues, updateGalleryTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleGallerySubmit)();
    }, [validate, setError, handleGallerySubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.galleryModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addGalleryLoading || updateGalleryLoading || pristine}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addGalleryLoading || updateGalleryLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Gallery Name"
                name="name"
                value={value.name}
                error={error?.name}
                onChange={setFieldValue}
            />
            <TextInput
                label="Description"
                name="description"
                value={value.description}
                error={error?.description}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default GalleryModal;
