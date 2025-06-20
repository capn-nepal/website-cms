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
    CreateVoxPopSeasonInput,
    CreateVoxpopSeasonMutation,
    CreateVoxpopSeasonMutationVariables,
    UpdateVoxPopSeasonInput,
    UpdateVoxpopSeasonMutation,
    UpdateVoxpopSeasonMutationVariables,
    VoxPopSeasonTypeMutationResponseType,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const CREATE_VOX_POP_SEASON = gql`
    mutation CreateVoxpopSeason($data:  CreateVoxPopSeasonInput!) {
        createVoxpopSeason(data: $data) {
            ... on VoxPopSeasonTypeMutationResponseType {
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

const UPDATE_VOX_POP_SEASON = gql`
    mutation UpdateVoxpopSeason($pk: ID!, $data:  UpdateVoxPopSeasonInput!) {
        updateVoxpopSeason(pk: $pk, data: $data) {
            ... on VoxPopSeasonTypeMutationResponseType {
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
    initialValues?: Partial<UpdateVoxPopSeasonInput & { id: string }>;
    voxpopSeasonRefetch: () => void;
}

type PartialFormType = Partial<CreateVoxPopSeasonInput>;
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

function VoxpopSeasonModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
        voxpopSeasonRefetch,
    } = props;
    const alert = useAlert();
    const defaultFormValues: Partial<CreateVoxPopSeasonInput> = {
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
    ] = useMutation<CreateVoxpopSeasonMutation, CreateVoxpopSeasonMutationVariables>(
        CREATE_VOX_POP_SEASON,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const createSeasons = response.createVoxpopSeason as VoxPopSeasonTypeMutationResponseType;
                const { ok, errors } = createSeasons;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'VoxPop season successfully created',
                        { variant: 'success' },
                    );
                    onClose();
                    voxpopSeasonRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create an VoxPop season',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updatePodcastSeasonTrigger,
        { loading: updatePodcastSeasonLoading },
    ] = useMutation<UpdateVoxpopSeasonMutation, UpdateVoxpopSeasonMutationVariables>(
        UPDATE_VOX_POP_SEASON,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateSeasons = response.updateVoxpopSeason as VoxPopSeasonTypeMutationResponseType;
                const { ok, errors } = updateSeasons;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'VoxPop season successfully Updated',
                        { variant: 'success' },
                    );
                    onClose();
                    voxpopSeasonRefetch();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Update the VoxPop season',
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
                        data: finalValue as UpdateVoxPopSeasonInput,
                    },

                });
            } else {
                addPodcastSeasonTrigger({
                    variables: { data: finalValue as CreateVoxPopSeasonInput },
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
            className={styles.voxpopSeasonsModal}
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

export default VoxpopSeasonModal;
