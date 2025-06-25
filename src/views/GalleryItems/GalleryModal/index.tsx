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
    Modal,
    SelectInput,
} from '@togglecorp/toggle-ui';

import {
    AddGalleryItemMutation,
    AddGalleryItemMutationVariables,
    GalleryItemInput,
    GalleryItemTypeMutationResponseType,
    ImageTypeEnum,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_GALLERY_ITEM = gql`
    mutation AddGalleryItem($data: GalleryItemInput!) {
        addGalleryItem(data: $data) {
            ... on GalleryItemTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    image {
                        url
                    }
                    imageType
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
    galleryItemRefetch:()=> void;
}

const statusOptions: {
    label: string;
    status: ImageTypeEnum;
}[] = [
    { status: 'ARTWORK', label: 'Artwork' },
    { status: 'IMAGE', label: 'Image' },
];

const statusKeySelector = (option: { status: ImageTypeEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;

type PartialFormType = Partial<GalleryItemInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        imageType: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        image: {},
    }),
};

function GalleryModal(props: Props) {
    const {
        onClose,
        galleryItemRefetch,
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
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const [
        addGalleryItemTrigger,
        { loading: addGalleryLoading },
    ] = useMutation<AddGalleryItemMutation, AddGalleryItemMutationVariables>(
        CREATE_GALLERY_ITEM,
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
                    'Failed to create an Gallery item',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleAddGalleryItemSubmit = useCallback((finalValue: PartialFormType) => {
        addGalleryItemTrigger({
            variables: {
                data: finalValue as GalleryItemInput,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [addGalleryItemTrigger]);

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleAddGalleryItemSubmit)();
    }, [validate, setError, handleAddGalleryItemSubmit]);

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
            className={styles.galleryModal}
            heading="Add Gallery Item"
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addGalleryLoading || pristine}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || addGalleryLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <SelectInput
                label="Image type"
                name="imageType"
                options={statusOptions}
                value={value.imageType}
                error={error?.imageType}
                keySelector={statusKeySelector}
                labelSelector={statusLabelSelector}
                onChange={setFieldValue}
            />
            <div>
                <div>Thumbnail</div>
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

export default GalleryModal;
