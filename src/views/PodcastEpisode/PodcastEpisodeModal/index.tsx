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
    DateInput,
    Modal,
    NumberInput,
    SelectInput,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreatePodcastEpisodeInput,
    CreatePodcastEpisodeMutation,
    CreatePodcastEpisodeMutationVariables,
    PodcastEpisodeTypeMutationResponseType,
    PodcastSeasonsQuery,
    PodcastSeasonsQueryVariables,
    PodcastSeasonTypeMutationResponseType,
    UpdatePodcastEpisodeInput,
    UpdatePodcastEpisodeMutation,
    UpdatePodcastEpisodeMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_PODCAST_EPISODE = gql`
    mutation  createPodcastEpisode($data:  CreatePodcastEpisodeInput!) {
        createPodcastEpisode(data: $data) {
            ... on PodcastEpisodeTypeMutationResponseType {
                errors
                ok
                result {
                    episodeNumber
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
const UPDATE_PODCAST_EPISODE = gql`
    mutation  UpdatePodcastEpisode($pk: ID!,$data:  UpdatePodcastEpisodeInput!) {
        updatePodcastEpisode(pk: $pk,data: $data) {
            ... on PodcastEpisodeTypeMutationResponseType {
                errors
                ok
                result {
                    episodeNumber
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
const PODCAST_SEASON_QUERY = gql`
    query PodcastSeason ($pagination: OffsetPaginationInput) {
        podcastSeasons(pagination: $pagination) {
            results {
                id
                seasonNumber
            }
        }
    }
`;

interface Props {
    title: string;
    onClose: () => void;
    initialValues?: Partial<UpdatePodcastEpisodeInput & { id: string }>;
    podcastEpisodeRefetch:()=> void;
}
const seasonKeySelector = (option: { value: string; label: string }) => option.value;
const seasonLabelSelector = (option: { value: string; label: string }) => option.label;

type PartialFormType = Partial<CreatePodcastEpisodeInput>;
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
        podcastSeason: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        episodeNumber: {},
        videoUrl: {},
        thumbnail: {},
    }),
};

function PodcastEpisodeModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
        podcastEpisodeRefetch,
    } = props;

    const alert = useAlert();

    const defaultFormValues: Partial<CreatePodcastEpisodeInput> = {
        title: initialValues?.title || '',
        releaseDate: initialValues?.releaseDate || '',
        episodeNumber: initialValues?.episodeNumber || undefined,
        videoUrl: initialValues?.videoUrl || '',
        thumbnail: initialValues?.thumbnail,
        podcastSeason: initialValues?.podcastSeason,
    };
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
    const {
        value,
        error: formError,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const error = getErrorObject(formError);
    const {
        data: podcastSeasonsResponse,
    } = useQuery<PodcastSeasonsQuery, PodcastSeasonsQueryVariables>(
        PODCAST_SEASON_QUERY,
    );

    const seasonOptions = podcastSeasonsResponse?.podcastSeasons.results.map((season) => ({
        value: season.id,
        label: `Season ${season.seasonNumber}`,
    })) ?? [];
    const [
        addPodcastEpisodeTrigger,
        { loading: addLoading },
    ] = useMutation<CreatePodcastEpisodeMutation, CreatePodcastEpisodeMutationVariables>(
        CREATE_PODCAST_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const createEpisode = response.createPodcastEpisode as PodcastSeasonTypeMutationResponseType;
                const { ok, errors } = createEpisode;
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
                    podcastEpisodeRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create a Podcast season',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updatePodcastEpisodeTrigger,
        { loading: updatePodcastEpisodeLoading },
    ] = useMutation<UpdatePodcastEpisodeMutation, UpdatePodcastEpisodeMutationVariables>(
        UPDATE_PODCAST_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateEpisode = response.updatePodcastEpisode as PodcastEpisodeTypeMutationResponseType;
                const { ok, errors } = updateEpisode;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Podcast episode successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                    podcastEpisodeRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the Podcast episode',
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

    const handlePodcastEpisodeSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updatePodcastEpisodeTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdatePodcastEpisodeInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            } else {
                addPodcastEpisodeTrigger({
                    variables: { data: finalValue as CreatePodcastEpisodeInput },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        },
        [addPodcastEpisodeTrigger, initialValues, updatePodcastEpisodeTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handlePodcastEpisodeSubmit)();
    }, [validate, setError, handlePodcastEpisodeSubmit]);

    return (
        <Modal
            className={styles.podcastEpisodeModal}
            heading={title}
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
                        disabled={addLoading || updatePodcastEpisodeLoading}
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
            <NumberInput
                label="Episode Number"
                name="episodeNumber"
                value={value?.episodeNumber}
                error={error?.episodeNumber}
                onChange={setFieldValue}
            />
            <DateInput
                label="Release Date"
                name="releaseDate"
                value={value.releaseDate}
                error={typeof error?.releaseDate === 'string' ? error.releaseDate : undefined}
                onChange={setFieldValue}
            />
            <SelectInput
                label="Podcast Season"
                name="podcastSeason"
                options={seasonOptions}
                value={value.podcastSeason}
                error={error?.podcastSeason}
                keySelector={seasonKeySelector}
                labelSelector={seasonLabelSelector}
                onChange={setFieldValue}
            />

            <TextInput
                label="Video URL"
                name="videoUrl"
                value={value.videoUrl}
                error={error?.videoUrl}
                onChange={setFieldValue}
            />
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

export default PodcastEpisodeModal;
