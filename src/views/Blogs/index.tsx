import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { IoAdd } from 'react-icons/io5';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Button,
    Chip,
    createDateColumn,
    createStringColumn,
    createYesNoColumn,
    Pager,
    SelectInput,
    Table,
    TextInput,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    BlogsQuery,
    BlogsQueryVariables,
    BlogStatusEnum,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import BlogActions from './BlogAction';
import BlogModal from './BlogModal';

import styles from './styles.module.css';

type BlogsItem = NonNullable<NonNullable<NonNullable<BlogsQuery>['blogs']>['results']>[number] & { serialNumber: string };

const PAGE_SIZE = 10;

const keySelector = (item: BlogsItem) => item.id;

const BLOGS = gql`
    query blogs (
        $pagination: OffsetPaginationInput,
        $order: BlogOrder,
        $filters: BlogFilter,
    ) {
        blogs(filters: $filters, pagination: $pagination, order: $order) {
            totalCount
            pageInfo {
                limit
                offset
            }
            results {
                content
                description
                featured
                id
                publishedDate
                title
                author {
                    name
                    id
                }
                coverImage {
                    url
                }  
            }
        }
    }
`;

const statusOptions: {
    label: string;
    status: BlogStatusEnum;
}[] = [
    { status: 'ARCHIVED', label: 'Archived' },
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PUBLISHED', label: 'Published' },
];

const statusKeySelector = (option: { status: BlogStatusEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [showBlogModal, {
        setTrue: setShowBlogModalTrue,
        setFalse: setShowBlogModalFalse,
    }] = useBooleanState(false);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        title?: string;
        status?: BlogStatusEnum;
    }>({
        filter: {},
        pageSize: PAGE_SIZE,
    });

    const filters = filter.status
        ? {
            title: filter.title ? { contains: filter.title } : undefined,
            status: filter.status,
        }
        : undefined;

    const variables = {
        pagination: {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
        filters,
    };
    const {
        data: blogsResponse,
    } = useQuery<BlogsQuery, BlogsQueryVariables>(
        BLOGS,
        {
            variables,
        },
    );

    const data = useMemo(() => (
        blogsResponse?.blogs.results?.map((user, index) => ({
            ...user,
            serialNumber: (page - 1) * PAGE_SIZE + index + 1,
        })) as unknown as BlogsItem[]
    ), [blogsResponse, page]);

    const handleDelete = useCallback(() => {}, []);

    const columns = useMemo(() => ([
        createStringColumn<BlogsItem, string | number>(
            'sn',
            'S.N',
            (item) => String(item.serialNumber),
        ),
        createStringColumn<BlogsItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<BlogsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createStringColumn<BlogsItem, string | number>(
            'author',
            'Author',
            (item) => item.author?.name,
        ),
        createDateColumn<BlogsItem, string | number>(
            'publishedDate',
            'Published Date',
            (item) => item.publishedDate,
        ),
        createYesNoColumn<BlogsItem, string>(
            'featured',
            'Featured',
            (item) => item.featured,
        ),
        createElementColumn<BlogsItem, string, { imageUrl?: string }>(
            'image',
            'Image',
            ({ imageUrl }) => (
                imageUrl && typeof imageUrl === 'string'
                    ? <img src={imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item: BlogsItem) => ({ imageUrl: item.coverImage?.url }),
        ),
        createElementColumn<BlogsItem, string, {
            id: string;
            onDelete:(
                id: string,
            ) => void;
            blogId: string;
                }>(
                'actions',
                'Actions',
                BlogActions,
                (_key, item) => ({
                    id: item.id,
                    blogId: item.id,
                    onDelete: handleDelete,
                }),
                ),

    ]), [handleDelete]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Blogs Table"
            headingDescription={(
                <div className={styles.actions}>
                    <TextInput
                        placeholder="Title"
                        onChange={setFilterField}
                        value={filter.title}
                        name="title"
                    />
                    <SelectInput
                        placeholder="Status"
                        name="status"
                        options={statusOptions}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.status}
                        onChange={setFilterField}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={setShowBlogModalTrue}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={blogsResponse?.blogs.totalCount ?? 0}
                    maxItemsPerPage={PAGE_SIZE}
                    onItemsPerPageChange={setPage}
                />
            )}
        >
            <Table
                className={styles.table}
                keySelector={keySelector}
                data={data}
                columns={columns}
                resizableColumn
                fixedColumnWidth
            />
            {showBlogModal && (
                <BlogModal
                    onClose={setShowBlogModalFalse}
                />
            )}

        </Container>
    );
}

Component.displayName = 'Blogs';
