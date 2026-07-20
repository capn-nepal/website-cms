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
    NumberInput,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    CreatePodcastSeasonInput,
    CreatePodcastSeasonMutation,
    CreatePodcastSeasonMutationVariables,
    UpdatePodcastSeasonInput,
    UpdatePodcastSeasonMutation,
    UpdatePodcastSeasonMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_PODCAST_SEASON = gql`
    mutation  createPodcastSeason($data: CreatePodcastSeasonInput!) {
        createPodcastSeason(data: $data) {
            ... on PodcastSeasonTypeMutationResponseType {
                errors
                ok
                result {
                    description
                    id
                    seasonNumber
                    title
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

const UPDATE_PODCAST_SEASON = gql`
    mutation UpdatePodcastSeason($pk: ID!, $data:  UpdatePodcastSeasonInput!) {
        updatePodcastSeason(pk: $pk, data: $data) {
            ... on PodcastSeasonTypeMutationResponseType {
                errors
                ok
                result {
                    id
                    description
                    title
                    seasonNumber
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
    initialValues?: Partial<UpdatePodcastSeasonInput & { id: string }>;
    onPodcastSeasonUpdate: ()=> void;
}

type PartialFormType = Partial<CreatePodcastSeasonInput>;
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
        seasonNumber: {},
    }),
};

function PodcastSeasonModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
        onPodcastSeasonUpdate,
    } = props;
    const alert = useAlert();
    const defaultFormValues: Partial<CreatePodcastSeasonInput> = {
        title: initialValues?.title || '',
        description: initialValues?.description,
        seasonNumber: initialValues?.seasonNumber || undefined,
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
        addPodcastSeasonTrigger,
        { loading: addLoading },
    ] = useMutation<CreatePodcastSeasonMutation, CreatePodcastSeasonMutationVariables>(
        CREATE_PODCAST_SEASON,
        {
            onCompleted: (response) => {
                const createPodcastSeasonResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (createPodcastSeasonResponse.createPodcastSeason.__typename === 'PodcastSeasonTypeMutationResponseType') {
                    const { ok, errors } = createPodcastSeasonResponse.createPodcastSeason;
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
                        onPodcastSeasonUpdate();
                    }
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
        updatePodcastSeasonTrigger,
        { loading: updatePodcastSeasonLoading },
    ] = useMutation<UpdatePodcastSeasonMutation, UpdatePodcastSeasonMutationVariables>(
        UPDATE_PODCAST_SEASON,
        {
            onCompleted: (response) => {
                const updatePodcastSeasonResponse = response;
                // eslint-disable-next-line no-underscore-dangle
                if (updatePodcastSeasonResponse.updatePodcastSeason.__typename === 'PodcastSeasonTypeMutationResponseType') {
                    const { ok, errors } = updatePodcastSeasonResponse.updatePodcastSeason;
                    if (errors) {
                        const errorMessages = errors
                            ?.map((message: { messages: string }) => message.messages)
                            .filter((msg: string) => msg)
                            .join(', ');
                        alert.show(errorMessages);
                    } else if (ok) {
                        alert.show(
                            'Podcast season successfully Updated',
                            { variant: 'success' },
                        );
                        onClose();
                        onPodcastSeasonUpdate();
                    }
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Update the Podcast season',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handlePodcastSeasonSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updatePodcastSeasonTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdatePodcastSeasonInput,
                    },

                });
            } else {
                addPodcastSeasonTrigger({
                    variables: { data: finalValue as CreatePodcastSeasonInput },
                });
            }
        },
        [addPodcastSeasonTrigger, initialValues, updatePodcastSeasonTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handlePodcastSeasonSubmit)();
    }, [validate, setError, handlePodcastSeasonSubmit]);

    return (
        <Modal
            className={styles.podcastSeasonsModal}
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
            <TextArea
                label="Description"
                name="description"
                value={value.description}
                error={error?.description}
                onChange={setFieldValue}
            />
            <NumberInput
                label="Season number"
                name="seasonNumber"
                value={value?.seasonNumber}
                error={error?.seasonNumber}
                onChange={setFieldValue}
            />
        </Modal>
    );
}

export default PodcastSeasonModal;
