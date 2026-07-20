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
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    ArtworkInput,
    ArtworkTypeMutationResponseType,
    CreateArtworkMutation,
    CreateArtworkMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

interface Props {
    onClose: () => void;
    artWorkRefetch: () => void;
}

const CREATE_ART_WORK = gql`
    mutation CreateArtwork($data: ArtworkInput!) {
        createArtwork(data: $data) {
            ... on ArtworkTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    name
                    image {
                        url
                    }
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

type PartialFormType = Partial<ArtworkInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        name: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        image: {},
    }),
};

const defaultFormValues: PartialFormType = {};

function ArtWorkModal(props: Props) {
    const {
        onClose,
        artWorkRefetch,
    } = props;
    const alert = useAlert();
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
        addArtworkTrigger,
        { loading: artWorkLoading },
    ] = useMutation<CreateArtworkMutation, CreateArtworkMutationVariables>(
        CREATE_ART_WORK,
        {
            onCompleted: (response) => {
                const createArtwork = response.createArtwork as ArtworkTypeMutationResponseType;
                const { ok, errors } = createArtwork;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'ArtWork successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    artWorkRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create an ArtWork',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleAddArtWorkSubmit = useCallback((finalValue: PartialFormType) => {
        addArtworkTrigger({
            variables: {
                data: finalValue as ArtworkInput,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [addArtworkTrigger]);

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleAddArtWorkSubmit)();
    }, [validate, setError, handleAddArtWorkSubmit]);

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
            className={styles.artWorkModal}
            heading="Add ArtWork"
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
                        disabled={pristine || artWorkLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="ArtWork Name"
                name="name"
                value={value.name}
                error={error?.name}
                onChange={setFieldValue}
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
export default ArtWorkModal;
