import {
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
    StatusEnum,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import BlogActions from './BlogAction';
import BlogModal from './BlogModal';

import styles from './styles.module.css';

type BlogsItem = NonNullable<NonNullable<NonNullable<BlogsQuery>['blogs']>['results']>[number];

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
                status
                coverImage {
                    url
                }  
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

const statusKeySelector = (option: { status: StatusEnum }) => option.status;
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
        status?: StatusEnum;
    }>({
        filter: {},
        pageSize: PAGE_SIZE,
    });

    const variables: BlogsQueryVariables = {
        pagination: {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
        filters: filter.status || filter.title
            ? {
                title: filter.title ? { contains: filter.title } : undefined,
                status: filter.status,
            }
            : undefined,
    };

    const {
        data: blogsResponse,
        refetch: blogsRefetch,
    } = useQuery<BlogsQuery, BlogsQueryVariables>(
        BLOGS,
        {
            variables,
        },
    );

    const data = blogsResponse?.blogs.results;

    const columns = useMemo(() => ([
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
        createStringColumn<BlogsItem, string | number>(
            'status',
            'Status',
            (item) => item.status,
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
        createElementColumn<BlogsItem, string, { url: string }>(
            'coverImage',
            'Cover Image',
            ({ url }) => (
                <a
                    className={styles.actions}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {url}
                </a>
            ),
            (_, item) => ({ url: item.coverImage?.url ?? '' }),
        ),
        createElementColumn<BlogsItem, string, { id: string }>(
            'actions',
            'Actions',
            BlogActions,
            (_key, item) => ({
                id: item.id,
            }),
        ),
    ]), []);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Blogs Table"
            headingDescription={(
                <div className={styles.filterActions}>
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
                    name="Add Blog"
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
                    addBlogsRefetch={blogsRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'Blogs';
