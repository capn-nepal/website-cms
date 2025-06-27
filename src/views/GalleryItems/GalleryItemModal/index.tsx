import {
    useCallback,
    useState,
} from 'react';
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
    Modal,
    SelectInput,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    AddGalleryItemMutation,
    AddGalleryItemMutationVariables,
    GalleriesQuery,
    GalleriesQueryVariables,
    GalleryItemInput,
    GalleryItemTypeMutationResponseType,
    GalleryItemUpdateInput,
    UpdateGalleryItemMutation,
    UpdateGalleryItemMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_GALLERY = gql`
    mutation AddGalleryItem($data: GalleryItemInput!) {
        addGalleryItem(data: $data) {
            ... on GalleryItemTypeMutationResponseType {
                errors
                ok
                result {
                    caption
                    gallery {
                        description
                        id
                        isArchived
                        name
                    }
                    id
                    image {
                        url
                    }
                    isArchived
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
const UPDATE_GALLERY_ITEM = gql`
    mutation UpdateGalleryItem($pk: ID!, $data: GalleryItemUpdateInput!) {
        updateGalleryItem(pk: $pk, data: $data) {
            ... on GalleryItemTypeMutationResponseType  {
                errors
                ok
                result {
                    caption
                    gallery {
                        description
                        id
                        isArchived
                        name
                    }
                    id
                    image {
                        url
                    }
                    isArchived
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

const GALLERY = gql`
    query Galleries(
        $pagination: OffsetPaginationInput,
    ) {
        galleries(pagination: $pagination) {
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
    galleryItemRefetch: () => void;
    initialValues?: Partial<GalleryItemUpdateInput & { id: string }>;
}
const galleryKeySelector = (option: { value: string }) => option.value;
const galleryLabelSelector = (option: { label: string }) => option.label;

type PartialFormType = Partial<GalleryItemInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        caption: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        gallery: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        image: {
            required: true,
        },
    }),
};

function GalleryItemModal(props: Props) {
    const {
        title,
        onClose,
        galleryItemRefetch,
        initialValues,
    } = props;
    const alert = useAlert();
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const defaultFormValues: PartialFormType = {
        caption: initialValues?.caption,
        gallery: initialValues?.gallery || '',
        image: initialValues?.image,
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
        data: galleryResponse,
        loading: galleryLoading,
    } = useQuery<GalleriesQuery, GalleriesQueryVariables>(
        GALLERY,
    );

    const galleryOptions = galleryResponse?.galleries?.results?.map((gallery) => ({
        value: gallery.id,
        label: gallery.name,
    }));

    const [
        addGalleryItemTrigger,
        { loading: addGalleryLoading },
    ] = useMutation<AddGalleryItemMutation, AddGalleryItemMutationVariables>(
        CREATE_GALLERY,
        {
            onCompleted: (response) => {
                const createItem = response.addGalleryItem as GalleryItemTypeMutationResponseType;
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
                    galleryItemRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create a Gallery item',
                    { variant: 'danger' },
                );
            },
        },
    );
    const [
        updateGalleryItemTrigger,
        { loading: updateGalleryItemLoading },
    ] = useMutation<UpdateGalleryItemMutation, UpdateGalleryItemMutationVariables>(
        UPDATE_GALLERY_ITEM,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateGalleryItem = response.updateGalleryItem as GalleryItemTypeMutationResponseType;
                const { ok, errors } = updateGalleryItem;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Gallery Item successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                    galleryItemRefetch();
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
                updateGalleryItemTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as GalleryItemUpdateInput,
                    },
                    context: {
                        hasUpload: true,
                    },

                });
            } else {
                addGalleryItemTrigger({
                    variables: {
                        data: finalValue as GalleryItemInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        },
        [addGalleryItemTrigger, initialValues, updateGalleryItemTrigger],
    );
    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleGallerySubmit)();
    }, [validate, setError, handleGallerySubmit]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            if (uploadedFile) {
                setFieldValue(uploadedFile, 'image');
                setFilePreview(URL.createObjectURL(uploadedFile));
            } else {
                setFieldValue(undefined, 'image');
                setFilePreview(undefined);
            }
        },
        [setFieldValue],
    );

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.galleryItemModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={updateGalleryItemLoading || addGalleryLoading || pristine}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addGalleryLoading || updateGalleryItemLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Caption"
                name="caption"
                value={value.caption}
                error={error?.caption}
                onChange={setFieldValue}
            />
            <SelectInput
                label="Gallery"
                name="gallery"
                value={value.gallery}
                error={error?.gallery}
                onChange={setFieldValue}
                options={galleryOptions}
                keySelector={galleryKeySelector}
                labelSelector={galleryLabelSelector}
                disabled={galleryLoading}
            />
            <div>
                <div>Image</div>
                <input
                    type="file"
                    accept="image/*"
                    id="image"
                    name="image"
                    onChange={handleFileChange}
                />
                {filePreview && (
                    <div>
                        <img
                            src={filePreview}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                    </div>
                )}
                {error?.image && typeof error.image === 'string' && (
                    <div>{error.image}</div>
                )}
            </div>
        </Modal>
    );
}

export default GalleryItemModal;
