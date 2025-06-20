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
    CreateVoxPopEpisodeInput,
    CreateVoxpopEpisodeMutation,
    CreateVoxpopEpisodeMutationVariables,
    UpdateVoxPopEpisodeInput,
    UpdateVoxpopEpisodeMutation,
    UpdateVoxpopEpisodeMutationVariables,
    VoxPopEpisodeTypeMutationResponseType,
    VoxpopSeasonsQuery,
    VoxpopSeasonsQueryVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_VOX_POP_EPISODE = gql`
    mutation  createVoxpopEpisode($data: CreateVoxPopEpisodeInput!) {
        createVoxpopEpisode(data: $data) {
            ... on VoxPopEpisodeTypeMutationResponseType {
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
const UPDATE_VOX_POP_EPISODE = gql`
    mutation  UpdateVoxpopEpisode($pk: ID!,$data:UpdateVoxPopEpisodeInput!) {
        updateVoxpopEpisode(pk: $pk,data: $data) {
            ... on VoxPopEpisodeTypeMutationResponseType  {
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
const VOX_POP_SEASON_QUERY = gql`
    query VoxpopSeason($pagination: OffsetPaginationInput) {
        voxpopSeasons(pagination: $pagination) {
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
    initialValues?: Partial<UpdateVoxPopEpisodeInput & { id: string }>;
    voxpopEpisodeRefetch: () => void;
}
const seasonKeySelector = (option: { value: string; label: string }) => option.value;
const seasonLabelSelector = (option: { value: string; label: string }) => option.label;

type PartialFormType = Partial<CreateVoxPopEpisodeInput>;
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
        voxpopSeason: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        episodeNumber: {},
        videoUrl: {},
        thumbnail: {},
    }),
};

function VoxpopEpisodeModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
        voxpopEpisodeRefetch,
    } = props;

    const alert = useAlert();

    const defaultFormValues: Partial<CreateVoxPopEpisodeInput> = {
        title: initialValues?.title || '',
        releaseDate: initialValues?.releaseDate || '',
        episodeNumber: initialValues?.episodeNumber || undefined,
        videoUrl: initialValues?.videoUrl || '',
        thumbnail: initialValues?.thumbnail,
        voxpopSeason: initialValues?.voxpopSeason,
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
        data: voxpopSeasonsResponse,
    } = useQuery<VoxpopSeasonsQuery, VoxpopSeasonsQueryVariables>(
        VOX_POP_SEASON_QUERY,
    );

    const seasonOptions = voxpopSeasonsResponse?.voxpopSeasons.results.map((season) => ({
        value: season.id,
        label: `Season ${season.seasonNumber}`,
    })) ?? [];
    const [
        addVoxpopEpisodeTrigger,
        { loading: addLoading },
    ] = useMutation<CreateVoxpopEpisodeMutation, CreateVoxpopEpisodeMutationVariables>(
        CREATE_VOX_POP_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const createEpisode = response.createVoxpopEpisode as VoxPopEpisodeTypeMutationResponseType;
                const { ok, errors } = createEpisode;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Voxpop episode season successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    voxpopEpisodeRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create a Voxpop episode',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateVoxpopEpisodeTrigger,
        { loading: updateVoxpopEpisodeLoading },
    ] = useMutation<UpdateVoxpopEpisodeMutation, UpdateVoxpopEpisodeMutationVariables>(
        UPDATE_VOX_POP_EPISODE,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateEpisode = response.updateVoxpopEpisode as VoxPopEpisodeTypeMutationResponseType;
                const { ok, errors } = updateEpisode;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Voxpop episode successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                    voxpopEpisodeRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the Voxpop episode',
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
                updateVoxpopEpisodeTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateVoxPopEpisodeInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            } else {
                addVoxpopEpisodeTrigger({
                    variables: { data: finalValue as CreateVoxPopEpisodeInput },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        },
        [addVoxpopEpisodeTrigger, initialValues, updateVoxpopEpisodeTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handlePodcastEpisodeSubmit)();
    }, [validate, setError, handlePodcastEpisodeSubmit]);

    return (
        <Modal
            className={styles.voxpopEpisodeModal}
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
                        disabled={addLoading || updateVoxpopEpisodeLoading}
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
                name="voxpopSeason"
                options={seasonOptions}
                value={value.voxpopSeason}
                error={error?.voxpopSeason}
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

export default VoxpopEpisodeModal;
