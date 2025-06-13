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
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    AddTeamMemberMutation,
    AddTeamMemberMutationVariables,
    CreateTeamMemberInput,
    TeamMemberTypeMutationResponseType,
    UpdateTeamMemberInput,
    UpdateTeamMemberMutation,
    UpdateTeamMemberMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const ADD_TEAM_MEMBER = gql`
    mutation addTeamMember($data: CreateTeamMemberInput!) {
        addTeamMember(data: $data) {
            ... on  TeamMemberTypeMutationResponseType {
                errors
                ok
                result {
                    firstName
                    designation
                    id
                    lastName
                    memberPhoto {
                        url
                    }
                    memberType
                    middleName
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

const UPDATE_TEAM_MEMBER = gql`
    mutation UpdateTeamMember($pk: ID!, $data: UpdateTeamMemberInput!) {
        updateTeamMember(pk: $pk, data: $data) {
            ... on  TeamMemberTypeMutationResponseType {
                errors
                ok
                result {
                    firstName
                    designation
                    id
                    lastName
                    memberPhoto {
                        url
                    }
                    memberType
                    middleName
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
    title: string;
    initialValues?: Partial<UpdateTeamMemberInput & { id: string }>;
}

const statusOptions = [
    { key: 'BOARD_MEMBER', label: 'Board Member' },
    { key: 'TEAM_MEMBER', label: 'Team Member' },
];

type PartialFormType = Partial<CreateTeamMemberInput>;
type FormSchema = ObjectSchema<PartialFormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const keySelector = (option: { key: string }) => option.key;
const labelSelector = (option: { label: string }) => option.label;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        firstName: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        lastName: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        middleName: {},
        designation: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        memberType: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        memberPhoto: {},
    }),
};

function TeamModal(props: Props) {
    const {
        onClose,
        title,
        initialValues,
    } = props;
    const alert = useAlert();

    const defaultFormValues: Partial<CreateTeamMemberInput> = {
        firstName: initialValues?.firstName || '',
        middleName: initialValues?.middleName || '',
        lastName: initialValues?.lastName || '',
        designation: initialValues?.designation || '',
        memberType: initialValues?.memberType,
        memberPhoto: initialValues?.memberPhoto,
    };

    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const {
        value,
        error: formError,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const [
        addTeamMemberTrigger,
        { loading: addTeamMemberLoading },
    ] = useMutation<AddTeamMemberMutation, AddTeamMemberMutationVariables>(
        ADD_TEAM_MEMBER,
        {
            onCompleted: (response) => {
                const addTeamMember = response.addTeamMember as TeamMemberTypeMutationResponseType;
                const { ok, errors } = addTeamMember;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Team Member Successfully added',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Add Team Member',
                    { variant: 'danger' },
                );
            },
        },
    );

    const [
        updateTeamMemberTrigger,
        { loading: updateTeamMemberLoading },
    ] = useMutation<UpdateTeamMemberMutation, UpdateTeamMemberMutationVariables>(
        UPDATE_TEAM_MEMBER,
        {
            onCompleted: (response) => {
                // eslint-disable-next-line max-len
                const updateTeamMember = response.updateTeamMember as TeamMemberTypeMutationResponseType;
                const { ok, errors } = updateTeamMember;
                if (errors) {
                    const errorMessages = errors
                        ?.map((message: { messages: string; }) => message.messages)
                        .filter((msg: string) => msg)
                        .join(', ');
                    alert.show(errorMessages);
                } else if (ok) {
                    alert.show(
                        'Team Member Successfully updated',
                        { variant: 'success' },
                    );
                    onClose();
                }
            },
            onError: () => {
                alert.show(
                    'Failed to Update Team Member',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleTeamMemberSubmit = useCallback(
        (finalValue: PartialFormType) => {
            if (initialValues?.id) {
                updateTeamMemberTrigger({
                    variables: {
                        pk: initialValues.id,
                        data: finalValue as UpdateTeamMemberInput,
                    },
                    context: {
                        hasUpload: true,
                    },
                });
            } else {
                addTeamMemberTrigger({
                    variables: { data: finalValue as CreateTeamMemberInput },
                    context: {
                        hasUpload: true,
                    },
                });
            }
        },
        [addTeamMemberTrigger, initialValues, updateTeamMemberTrigger],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleTeamMemberSubmit)();
    }, [validate, setError, handleTeamMemberSubmit]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            if (uploadedFile) {
                setFieldValue(uploadedFile, 'memberPhoto');
                setFilePreview(URL.createObjectURL(uploadedFile));
            } else {
                setFieldValue(undefined, 'memberPhoto');
                setFilePreview(undefined);
            }
        },
        [setFieldValue],
    );
    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.teamModal}
            heading={title}
            onClose={onClose}
            size="medium"
            footer={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={onClose}
                        disabled={addTeamMemberLoading || updateTeamMemberLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={addTeamMemberLoading || updateTeamMemberLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
            freeHeight
        >
            <TextInput
                label="First Name"
                name="firstName"
                value={value.firstName}
                error={error?.firstName}
                onChange={setFieldValue}
            />
            <TextInput
                label="Middle Name"
                name="middleName"
                value={value.middleName}
                error={error?.middleName}
                onChange={setFieldValue}
            />
            <TextInput
                label="Last Name"
                name="lastName"
                value={value.lastName}
                error={error?.lastName}
                onChange={setFieldValue}
            />
            <SelectInput
                label="Member Type"
                name="memberType"
                value={value.memberType}
                error={error?.memberType}
                onChange={setFieldValue}
                options={statusOptions}
                keySelector={keySelector}
                labelSelector={labelSelector}
            />
            <TextInput
                label="Designation"
                name="designation"
                value={value.designation}
                error={error?.designation}
                onChange={setFieldValue}
            />
            <div>
                <div>Member Photo</div>
                <input
                    type="file"
                    accept="image/*"
                    id="memberPhoto"
                    name="memberPhoto"
                    onChange={handleFileChange}
                />
                {filePreview && (
                    <div>
                        <img
                            src={filePreview}
                            alt=""
                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                    </div>
                )}
                {error?.memberPhoto && typeof error.memberPhoto === 'string' && (
                    <div>{error.memberPhoto}</div>
                )}
            </div>
        </Modal>
    );
}

export default TeamModal;
