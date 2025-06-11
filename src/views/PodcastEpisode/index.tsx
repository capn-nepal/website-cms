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
    createNumberColumn,
    createStringColumn,
    createYesNoColumn,
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    PodcastEpisodesQuery,
    PodcastEpisodesQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import PodcastEpisodeActions from './PodcastEpisodeActions';
import PodcastEpisodeModal from './PodcastEpisodeModal';

import styles from './styles.module.css';

type PodcastEpisodeItem = NonNullable<PodcastEpisodesQuery['podcastEpisodes']['results'][number]>;

const PODCAST_EPISODE = gql`
    query PodcastEpisodes(
        $pagination:OffsetPaginationInput ,
        $filters:  PodcastEpisodeFilter
        $order:  PodcastEpisodeOrder,
        ) {
        podcastEpisodes(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                episodeNumber
                id
                isArchived
                podcastSeason {
                    pk
                }
                releaseDate
                thumbnail {
                    url
                }
                title
                videoUrl
            }
            totalCount
        }
    }
`;

const PAGE_SIZE = 10;
const statusOptions = [
    { isArchived: true, label: 'True' },
    { isArchived: false, label: 'False' },
];

const keySelector = (item: PodcastEpisodeItem) => item.id;
const statusKeySelector = (option: {
    isArchived: boolean; label: string;
 }) => String(option.isArchived);
const statusLabelSelector = (option: { isArchived: boolean; label: string }) => option.label;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showPodcastSeasonModal, {
            setTrue: setShowPodcastEpisodeModalTrue,
            setFalse: setShowPodcastEpisodeModalFalse,
        }] = useBooleanState(false);

    const [
        selectedEpisode,
        setSelectedEpisode,
    ] = useState<Partial<PodcastEpisodeItem> | null>(null);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        isArchived?: boolean;
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
            isArchived: filter.isArchived ?? false,
        },
    };

    const {
        data: podcastEpisodeResponse,
    } = useQuery<PodcastEpisodesQuery, PodcastEpisodesQueryVariables>(
        PODCAST_EPISODE,
        { variables },
    );
    const handleAddPodcast = useCallback(() => {
        setSelectedEpisode(null);
        setShowPodcastEpisodeModalTrue();
    }, [setShowPodcastEpisodeModalTrue]);

    const handleIsDeletedChange = useCallback(
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
        createStringColumn<PodcastEpisodeItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<PodcastEpisodeItem, string | number>(
            'podcastSeason',
            'Podcast Season',
            (item) => item.podcastSeason?.pk,
        ),
        createNumberColumn<PodcastEpisodeItem, number>(
            'EpisodeNumber',
            'Episode  number',
            (item) => item.episodeNumber,
        ),
        createDateColumn<PodcastEpisodeItem, string | number>(
            'releasedDate',
            'Released Date',
            (item) => item.releaseDate,
        ),
        createElementColumn<PodcastEpisodeItem, string, { url: string }>(
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
        createYesNoColumn<PodcastEpisodeItem, string | number>(
            'isArchived',
            'Is Archived',
            (item) => item.isArchived,
        ),
        createElementColumn<PodcastEpisodeItem, string, { url: string }>(
            'thumbnail',
            'Thumbnail',
            ({ url }) => (
                url
                    ? <img src={url} alt="thumbnail" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item) => ({ url: item.thumbnail?.url || '' }),
        ),
        createElementColumn<PodcastEpisodeItem, string, { episode :PodcastEpisodeItem }>(
            'actions',
            'Actions',
            PodcastEpisodeActions,
            (_key, item) => ({
                episode: item,
            }),
        ),

    ]), []);

    const data = podcastEpisodeResponse?.podcastEpisodes.results;

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Podcast Episode Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <SelectInput
                        placeholder="Is Archived"
                        name="isArchived"
                        options={statusOptions}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.isArchived !== undefined ? String(filter.isArchived) : null}
                        onChange={handleIsDeletedChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Podcast"
                    variant="primary"
                    onClick={handleAddPodcast}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={podcastEpisodeResponse?.podcastEpisodes.totalCount ?? 0}
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
            {showPodcastSeasonModal && (
                <PodcastEpisodeModal
                    onClose={setShowPodcastEpisodeModalFalse}
                    title={selectedEpisode ? 'Edit Podcast episode' : 'Add Podcast episode'}
                    initialValues={selectedEpisode || undefined}
                />
            )}
        </Container>
    );
}

Component.displayName = 'PodcastEpisode';
