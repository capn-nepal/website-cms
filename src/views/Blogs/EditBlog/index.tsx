import {
    useCallback,
    useState,
} from 'react';
import {
    useNavigate,
    useParams,
} from 'react-router-dom';
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
    BlogQuery,
    BlogTypeMutationResponseType,
    StatusEnum,
    UpdateBlogInput,
    UpdateBlogMutation,
    UpdateBlogMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

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
const GET_BLOG_BY_ID = gql`
    query Blog($id: ID!) {
        blog(id: $id) {
            id
            title
            description
            content
            publishedDate
            featured
            status
            coverImage {
                url
            }
            author {
                id
                name
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
const featureOption = [
    { featured: true, label: 'Yes' },
    { featured: false, label: 'No' },
];

type PartialFormType = Partial<UpdateBlogInput>;
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

const featureKeySelector = (option: { label: string }) => String(option.label);
const featureLabelSelector = (option: { label: string }) => String(option.label);

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const alert = useAlert();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [filePreview, setFilePreview] = useState<string | undefined>(undefined);

    const {
        data: blogData,
    } = useQuery<BlogQuery>(
        GET_BLOG_BY_ID,
        { variables: { id: id as string }, skip: !id },
    );

    const blogValues = blogData?.blog;

    const defaultFormValues: PartialFormType = {
        title: blogValues?.title || '',
        description: blogValues?.description || '',
        publishedDate: blogValues?.publishedDate,
        content: blogValues?.content || '',
        coverImage: blogValues?.coverImage?.url || undefined,
        author: blogValues?.author.id,
        featured: blogValues?.featured,
    };

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

    const authorOptions = authorsResponse?.authors.results.map(
        (author: { id: string; name: string; }) => ({
            value: author.id,
            label: author.name,
        }),
    );

    const [
        updateBlogResponse,
        { loading: blogLoading },
    ] = useMutation<UpdateBlogMutation, UpdateBlogMutationVariables >(
        UPDATE_BLOG,
        {
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
                        'Blog successfully updated',
                        { variant: 'success' },
                    );
                    navigate('/blogs');
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update the blog',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleEditBlogSubmit = useCallback(
        (finalValue: PartialFormType) => {
            const formattedValue = {
                ...finalValue,
                author: finalValue.author,
                featured: finalValue.featured === true,
            };
            updateBlogResponse({

                variables: {
                    pk: id as string,
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
                setFieldValue(uploadedFile, 'coverImage');
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
                <div className={styles.actionContent}>
                    <Button
                        name="cancel"
                        variant="default"
                        onClick={() => navigate('/blogs')}
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
            <form className={styles.form} onSubmit={handleSubmit}>
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
                    label="Featured"
                    name="featured"
                    options={featureOption}
                    keySelector={featureKeySelector}
                    labelSelector={featureLabelSelector}
                    value={value.featured}
                    onChange={setFieldValue}
                    placeholder="Select Yes or No"
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
                    label="Status"
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
                    value={value.content ?? undefined}
                    onChange={setFieldValue}
                    height="400px"
                />
            </form>
        </Container>
    );
}

Component.displayName = 'EditBlog';
