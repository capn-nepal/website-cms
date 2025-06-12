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
    DateInput,
    Modal,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    AddYoutubeVideoMutation,
    AddYoutubeVideoMutationVariables,
    UpdateYoutubeVideoInput,
    UpdateYoutubeVideosMutation,
    UpdateYoutubeVideosMutationVariables,
    YoutubeVideoInput,
    YouTubeVideoTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const ADD_YOUTUBE_VIDEOS = gql`
    mutation AddYoutubeVideo($data: YoutubeVideoInput!) {
        addYoutubeVideo(data: $data) {
            ... on YouTubeVideoTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    isArchived
                    releaseDate
                    thumbnail {
                        url
                    }
                    title
                    videoUrl
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

const UPDATE_YOUTUBE_VIDEOS = gql`
    mutation UpdateYoutubeVideos($pk: ID!, $data: UpdateYoutubeVideoInput!) {
        updateYoutubeVideo(pk: $pk, data: $data) {
            ... on YouTubeVideoTypeMutationResponseType {
                errors
                ok
                result {
                    isArchived
                    id
                    releaseDate
                    thumbnail {
                        url
                    }
                    title
                    videoUrl
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
    initialValues?: Partial<UpdateYoutubeVideoInput & { id: string }>;
}

type PartialFormType = Partial<YoutubeVideoInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        releaseDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        videoUrl: {},
        thumbnail: {},
    }),
};

function YoutubeVideosModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
    } = props;
    const alert = useAlert();
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const defaultFormValues: Partial<YoutubeVideoInput> = {
        title: initialValues?.title || '',
        releaseDate: initialValues?.releaseDate || '',
        videoUrl: initialValues?.videoUrl || '',
        thumbnail: initialValues?.thumbnail,
    };
    const {
        value,
        error: formError,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const error = getErrorObject(formError);

    const [
        addYoutubeVideosTrigger,
        { loading: addLoading },
    ] = useMutation<AddYoutubeVideoMutation, AddYoutubeVideoMutationVariables>(
        ADD_YOUTUBE_VIDEOS,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const createYoutubeVideos = response.addYoutubeVideo as YouTubeVideoTypeMutationResponseType;
                const { ok, errors } = createYoutubeVideos;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Podcast season successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create an Podcast season',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateYoutubeVideoTrigger,
        { loading: updatePodcastSeasonLoading },
    ] = useMutation<UpdateYoutubeVideosMutation, UpdateYoutubeVideosMutationVariables>(
        UPDATE_YOUTUBE_VIDEOS,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateYoutubeVideo = response.updateYoutubeVideo as YouTubeVideoTypeMutationResponseType;
                const { ok, errors } = updateYoutubeVideo;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        ' Youtube Video successfully Updated',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Update the Youtube Video',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            if (uploadedFile) {
                setFieldValue(uploadedFile, 'thumbnail');
                setFilePreview(URL.createObjectURL(uploadedFile));
            } else {
                setFieldValue(undefined, 'thumbnail');
                setFilePreview(undefined);
            }
        },
        [setFieldValue],
    );
    const handleYoutubeVideoSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateYoutubeVideoTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateYoutubeVideoInput,
                    },
                    context: {
                        hasUpload: true,
                    },

                });
            } else {
                addYoutubeVideosTrigger({
                    variables: { data: finalValue as YoutubeVideoInput },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        },
        [addYoutubeVideosTrigger, initialValues, updateYoutubeVideoTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleYoutubeVideoSubmit)();
    }, [validate, setError, handleYoutubeVideoSubmit]);

    return (
        <Modal
            className={styles.youtubeVideoModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addLoading || updatePodcastSeasonLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={addLoading || updatePodcastSeasonLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="Title"
                name="title"
                value={value.title}
                error={error?.title}
                onChange={setFieldValue}
            />
            <DateInput
                label="Release Date"
                name="releaseDate"
                value={value.releaseDate}
                error={typeof error?.releaseDate === 'string' ? error.releaseDate : undefined}
                onChange={setFieldValue}
            />
            <TextInput
                label="Video Url"
                name="videoUrl"
                value={value.videoUrl}
                error={error?.videoUrl}
                onChange={setFieldValue}
            />
            {/*  FIXME: Update FileInput component */}
            <div>
                <div>Thumbnail</div>
                <input
                    type="file"
                    accept="image/*"
                    id="thumbnail"
                    name="thumbnail"
                    onChange={handleFileChange}
                />
                {filePreview && (
                    <div>
                        <img
                            src={filePreview}
                            alt="Thumbnail Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                    </div>
                )}
                {error?.thumbnail && typeof error.thumbnail === 'string' && (
                    <div>{error.thumbnail}</div>
                )}
            </div>
        </Modal>
    );
}

export default YoutubeVideosModal;
