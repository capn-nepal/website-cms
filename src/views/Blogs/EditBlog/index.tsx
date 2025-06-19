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
    SelectInput,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import MarkdownEditor from '#components/MarkdownEditor';
import {
    AuthorsQuery,
    AuthorsQueryVariables,
    BlogTypeMutationResponseType,
    StatusEnum,
    UpdateBlogInput,
    UpdateBlogMutation,
    UpdateBlogMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

interface Props {
    id : string;
}

const UPDATE_BLOG = gql`
    mutation UpdateBlog($pk: ID!, $data: UpdateBlogInput!) {
        updateBlog(pk: $pk, data: $data) {
            ... on BlogTypeMutationResponseType {
                errors
                ok
                result {
                    author {
                        name
                    }
                    content
                    coverImage {
                        url
                    }
                    description
                    featured
                    id
                    publishedDate
                    status
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

const AUTHORS_QUERY = gql`
    query Authors($pagination: OffsetPaginationInput) {
        authors(pagination: $pagination) {
            results {
                id
                name
            }
        }
    }
`;

const statusOptions: {
    label: string;
    status: StatusEnum;
}[] = [
    { status: 'ARCHIVED', label: 'Archived' },
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PUBLISHED', label: 'Published' },
];

type PartialFormType = Partial<UpdateBlogInput> ;
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
        author: {
            required: true,
        },
        content: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        publishedDate: {
            required: true,
            requiredValidation: requiredStringCondition,
        },
        coverImage: {},
        featured: {},
        status: {},
    }),
};

const statusKeySelector = (option: { status: StatusEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;
const authorKeySelector = (option: { value: string; label: string }) => option.value;
const authorLabelSelector = (option: { value: string; label: string }) => option.label;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component(props: Props) {
    const {
        id,
    } = props;
    const alert = useAlert();
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const defaultFormValues: PartialFormType = {};

    const {
        value,
        error: formError,
        pristine,
        setFieldValue,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValues });

    const { data: authorsResponse } = useQuery<AuthorsQuery, AuthorsQueryVariables>(
        AUTHORS_QUERY,
    );

    const authorOptions = authorsResponse?.authors.results.map((author) => ({
        value: author.id,
        label: author.name,
    }));

    const [
        updateBlogResponse,
        { loading: blogLoading },
    ] = useMutation<UpdateBlogMutation, UpdateBlogMutationVariables>(UPDATE_BLOG, {
        onCompleted: (response) => {
            const archiveEvent = response.updateBlog as BlogTypeMutationResponseType;
            const { ok, errors } = archiveEvent;
            if (errors) {
                const errorMessages = errors
                    ?.map((message: { messages: string }) => message.messages)
                    .filter((msg: string) => msg)
                    .join(', ');
                alert.show(errorMessages);
            } else if (ok) {
                alert.show(
                    'Blog is successfully Updated',
                    { variant: 'success' },
                );
            }
        },
        onError: () => {
            alert.show(
                'Failed to update a blog',
                { variant: 'danger' },
            );
        },
    });

    const handleEditBlogSubmit = useCallback(
        (finalValue: PartialFormType) => {
            const formattedValue = {
                ...finalValue,
                author: {
                    connect: {
                        id: finalValue.author,
                    },
                },
            };

            updateBlogResponse({
                variables: {
                    pk: id,
                    data: formattedValue as UpdateBlogInput,
                },
                context: {
                    hasUpload: true,
                },
            });
        },
        [updateBlogResponse, id],
    );

    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleEditBlogSubmit)();
    }, [validate, setError, handleEditBlogSubmit]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            if (uploadedFile) {
                setFieldValue(uploadedFile ? URL.createObjectURL(uploadedFile) : undefined, 'coverImage');
                setFilePreview(URL.createObjectURL(uploadedFile));
            } else {
                setFieldValue(undefined, 'coverImage');
                setFilePreview(undefined);
            }
        },
        [setFieldValue],
    );

    const error = getErrorObject(formError);

    return (
        <Container
            className={styles.container}
            showHeader
            heading="Edit Blog"
            actions={(
                <div className={styles.footerContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={() => {}}
                    >
                        Cancel
                    </Button>
                    <Button
                        name="save"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={pristine || blogLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
        >
            <form
                className={styles.form}
                onSubmit={handleSubmit}
            >
                <TextInput
                    label="Title"
                    name="title"
                    value={value.title}
                    error={error?.title}
                    onChange={setFieldValue}
                />
                <TextArea
                    className={styles.fullSizeInput}
                    label="Description"
                    name="description"
                    value={value.description}
                    error={error?.description}
                    onChange={setFieldValue}
                />
                <DateInput
                    label="Published date"
                    name="publishedDate"
                    value={value.publishedDate}
                    error={typeof error?.publishedDate === 'string' ? error.publishedDate : undefined}
                    onChange={setFieldValue}
                />
                <SelectInput
                    label="Authors"
                    name="author"
                    options={authorOptions}
                    value={value.author}
                    keySelector={authorKeySelector}
                    labelSelector={authorLabelSelector}
                    onChange={setFieldValue}
                />
                <SelectInput
                    label="status"
                    placeholder="Status"
                    name="status"
                    options={statusOptions}
                    keySelector={statusKeySelector}
                    labelSelector={statusLabelSelector}
                    value={value.status}
                    onChange={setFieldValue}
                />
                <div>
                    <div>Cover Image</div>
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
                                alt=""
                                style={{ maxWidth: '100%', maxHeight: '200px' }}
                            />
                        </div>
                    )}
                    {error?.coverImage && typeof error.coverImage === 'string' && (
                        <div>{error.coverImage}</div>
                    )}
                </div>
                <MarkdownEditor
                    label="Blog Content"
                    name="content"
                    value={value.content}
                    onChange={setFieldValue}
                    height={400}
                />
            </form>

        </Container>
    );
}

Component.displayName = 'EditBlog';
