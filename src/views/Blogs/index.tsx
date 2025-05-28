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
    Chip,
    createDateColumn,
    createStringColumn,
    createYesNoColumn,
    Pager,
    Table,
    TextInput,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    BlogsQuery,
    BlogsQueryVariables,
} from '#generated/types/graphql';
import useFilterState from '#hooks/useFilterState';

import styles from './styles.module.css';

type BlogsItem = NonNullable<NonNullable<NonNullable<BlogsQuery>['blogs']>['results']>[number] & {serialNumber: string; };

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

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const {
        filter,
        setFilterField,
    } = useFilterState<{
        title?: string
    }>({
        filter: {},
        pageSize: PAGE_SIZE,
    });
    const variables = {
        pagination: {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
        filters: {
            title: filter.title ? { contains: filter.title } : undefined,
        },
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

    const columns = useMemo(() => ([
        createStringColumn<BlogsItem, string| number>(
            'sn',
            'S.N',
            (item) => String(item.serialNumber),
        ),
        createStringColumn<BlogsItem, string| number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<BlogsItem, string| number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createStringColumn<BlogsItem, string| number>(
            'author',
            'Author',
            (item) => item.author?.name,
        ),
        createDateColumn<BlogsItem, string| number>(
            'publishedDate',
            'Published Date',
            (item) => item.publishedDate,
        ),
        createYesNoColumn<BlogsItem, boolean>(
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

    ]), []);

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
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={() => {}}
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
        </Container>
    );
}

Component.displayName = 'Blogs';
