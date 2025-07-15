import { useCallback } from 'react';
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
    SelectInput,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';

import FileInput from '#components/FileInput';
import MarkdownEditor from '#components/MarkdownEditor';
import {
    AuthorsQuery,
    AuthorsQueryVariables,
    CreateBlogInput,
    CreateBlogMutation,
    CreateBlogMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';
import { transformToFormError } from '#utils/errorTransform';

import styles from './styles.module.css';

const CREATE_BLOG = gql`
    mutation CreateBlog($data: CreateBlogInput!) {
        createBlog(data: $data) {
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

interface Props {
    onClose: () => void;
    onBlogAdd:()=> void;
}
const featureOption = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
];
const authorKeySelector = (option: { value: string; label: string }) => option.value;
const authorLabelSelector = (option: { value: string; label: string }) => option.label;
const featureKeySelector = (option: { value: boolean }) => option.value;
const featureLabelSelector = (option: { label: string }) => option.label;

type PartialFormType = Partial<CreateBlogInput>;
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
            requiredValidation: requiredStringCondition,
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
    }),
};

const defaultFormValues: PartialFormType = {};

function BlogModal(props: Props) {
    const {
        onClose,
        onBlogAdd,
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

    const {
        data: authorsResponse,
    } = useQuery<AuthorsQuery, AuthorsQueryVariables>(
        AUTHORS_QUERY,
    );

    const authorOptions = authorsResponse?.authors.results.map((author: {
        id: string; name: string; }) => ({
        value: author.id,
        label: author.name,
    })) ?? [];
    const [
        createBlogResponse,
        { loading: blogLoading },
    ] = useMutation<CreateBlogMutation, CreateBlogMutationVariables>(
        CREATE_BLOG,
        {
            onCompleted: (response) => {
                const { createBlog } = response;
                // eslint-disable-next-line no-underscore-dangle
                if (createBlog.__typename === 'BlogTypeMutationResponseType') {
                    const { ok, errors } = createBlog;
                    if (errors) {
                        setError(transformToFormError(errors));
                        const errorMessages = errors
                            ?.map((message: { messages: string; }) => message.messages)
                            .filter((msg: string) => msg)
                            .join(', ');
                        alert.show(errorMessages, { variant: 'danger' });
                    } else if (ok) {
                        alert.show(
                            'Blog is successfully created',
                            { variant: 'success' },
                        );
                        onClose();
                        onBlogAdd();
                    }
                }
            },
            onError: () => {
                alert.show(
                    'Failed to create a blog',
                    { variant: 'danger' },
                );
            },
        },
    );
    const handleAddBlogSubmit = useCallback((finalValue: PartialFormType) => {
        createBlogResponse({
            variables: {
                data: finalValue as CreateBlogInput,
            },
            context: {
                hasUpload: true,
            },
        });
    }, [createBlogResponse]);
    const handleSubmit = useCallback(() => {
        createSubmitHandler(validate, setError, handleAddBlogSubmit)();
    }, [validate, setError, handleAddBlogSubmit]);

    const error = getErrorObject(formError);

    return (
        <Modal
            className={styles.blogModal}
            heading="Add Blog"
            onClose={onClose}
            size="large"
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
                        disabled={pristine || blogLoading}
                    >
                        Save
                    </Button>
                </div>
            )}
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
                label="Featured"
                name="featured"
                options={featureOption}
                value={value.featured}
                error={error?.featured}
                keySelector={featureKeySelector}
                labelSelector={featureLabelSelector}
                onChange={setFieldValue}
            />
            <DateInput
                label="Published date"
                name="publishedDate"
                value={value.publishedDate}
                error={typeof error?.publishedDate === 'string' ? error.publishedDate : undefined}
                onChange={setFieldValue}
            />
            <FileInput
                label="Cover Image"
                name="coverImage"
                accept="image/*"
                value={value.coverImage as File | undefined | null}
                onChange={setFieldValue}
                error={typeof error?.coverImage === 'string' ? error.coverImage : undefined}
                showFileName
            >
                Choose Image
            </FileInput>
            <MarkdownEditor
                label="Blog Content"
                name="content"
                value={value.content ?? undefined}
                onChange={setFieldValue}
                previewStyle="vertical"
                height="400px"
            />
        </Modal>
    );
}
export default BlogModal;
