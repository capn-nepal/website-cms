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
    YoutubeVideosQuery,
    YoutubeVideosQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import YoutubeVideoActions from './YoutubeVideoActions';
import YoutubeVideosModal from './YoutubeVideosModal';

import styles from './styles.module.css';

type YoutubeVideosItem = NonNullable<NonNullable<NonNullable<YoutubeVideosQuery>['youtubeVideos']>['results']>[number];

const PAGE_SIZE = 10;
const statusOption = [
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];
const statusKeySelector = (option: { value: boolean; label: string }) => String(option.value);
const statusLabelSelector = (option: { value: boolean; label: string }) => option.label;

const keySelector = (item: YoutubeVideosItem) => item.id;

const YOUTUBE_VIDEOS = gql`
    query YoutubeVideos (
        $pagination: OffsetPaginationInput,
        $order: YouTubeVideoOrder
        $filters: YouTubeVideoFilter,
    ) {
        youtubeVideos(filters: $filters, pagination: $pagination, order: $order) {
            totalCount
            pageInfo {
                limit
                offset
            }
            results {
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
    }
`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [showYoutubeVideoModal, {
        setTrue: setShowYoutubeVideoModalTrue,
        setFalse: setShowYoutubeVideoModalFalse,
    }] = useBooleanState(false);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        title?: string;
        isArchived?:boolean;
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
            title: filter.title ? { iContains: filter.title } : undefined,
            isArchived: filter.isArchived,
        },
    };
    const {
        data: YoutubeVideosResponse,
        refetch: youtubeVideosRefetch,
    } = useQuery<YoutubeVideosQuery, YoutubeVideosQueryVariables>(
        YOUTUBE_VIDEOS,
        { variables },
    );
    const data = YoutubeVideosResponse?.youtubeVideos.results;

    const onChange = useCallback(
        (newValue: string | undefined) => {
            let isArchived;
            if (newValue === 'true') {
                isArchived = true;
            } else if (newValue === 'false') {
                isArchived = false;
            } else {
                isArchived = undefined;
            }

            setFilterField(isArchived, 'isArchived');
        },
        [setFilterField],
    );
    const columns = useMemo(() => ([
        createStringColumn<YoutubeVideosItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createYesNoColumn<YoutubeVideosItem, string | number>(
            'isArchived',
            'Is Archived',
            (item) => item.isArchived,
        ),
        createElementColumn<YoutubeVideosItem, string, { url: string }>(
            'videoUrl',
            'Video Url',
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
            (_, item) => ({ url: item.videoUrl }),
        ),
        createDateColumn<YoutubeVideosItem, string | number>(
            'releaseDate',
            'Release Date',
            (item) => item.releaseDate,
        ),
        createElementColumn<YoutubeVideosItem, string, { url: string }>(
            'thumbnail',
            'Thumbnail',
            ({ url }) => (
                url
                    ? <img src={url} alt="thumbnail" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item) => ({ url: item.thumbnail?.url || '' }),
        ),
        createElementColumn<YoutubeVideosItem, string, { youtubeVideo: YoutubeVideosItem }>(
            'actions',
            'Actions',
            YoutubeVideoActions as React.FC<{ youtubeVideo: YoutubeVideosItem }>,
            (_key, item) => ({
                youtubeVideo: {
                    ...item,
                    thumbnail: item.thumbnail,
                },
            }),
        ),

    ]), []);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Youtube Videos Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <TextInput
                        placeholder="Title"
                        onChange={setFilterField}
                        value={filter.title}
                        name="title"
                    />
                    <SelectInput
                        placeholder="Is Archived"
                        name="isArchived"
                        options={statusOption}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.isArchived !== undefined ? String(filter.isArchived) : null}
                        onChange={onChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Event"
                    variant="primary"
                    onClick={setShowYoutubeVideoModalTrue}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={YoutubeVideosResponse?.youtubeVideos.totalCount ?? 0}
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
            {showYoutubeVideoModal && (
                <YoutubeVideosModal
                    onClose={setShowYoutubeVideoModalFalse}
                    title="Add Youtube Video"
                    onYoutubeVideoUpdate={youtubeVideosRefetch}
                />
            )}

        </Container>
    );
}

Component.displayName = 'YoutubeVideos';
