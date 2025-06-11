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
    createNumberColumn,
    createStringColumn,
    Pager,
    Table,
    TextInput,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    PodcastSeasonsQuery,
    PodcastSeasonsQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import PodcastSeasonsActions from './PodcastSeasonActions';
import PodcastSeasonsModal from './PodcastSeasonsModal';

import styles from './styles.module.css';

type PodcastSeasonsItem = NonNullable<PodcastSeasonsQuery['podcastSeasons']['results'][number]>;

const PODCAST_SEASONS = gql`
    query PodcastSeasons(
        $pagination:OffsetPaginationInput ,
        $filters:  PodcastSeasonFilter,
        $order:  PodcastSeasonOrder,
        ) {
        podcastSeasons(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                title
                description
                id
                seasonNumber
            }
            totalCount
        }
    }
`;

const PAGE_SIZE = 10;

const keySelector = (item: PodcastSeasonsItem) => item.id;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showPodcastSeasonModal, {
            setTrue: setShowPodcastSeasonModalTrue,
            setFalse: setShowPodcastSeasonModalFalse,
        }] = useBooleanState(false);
    const [selectedSeason, setSelectedSeason] = useState<Partial<PodcastSeasonsItem> | null>(null);

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        title?: string;
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
        data: podcastSeasonsResponse,
    } = useQuery<PodcastSeasonsQuery, PodcastSeasonsQueryVariables>(
        PODCAST_SEASONS,
        { variables },
    );
    const handleAddPodcast = useCallback(() => {
        setSelectedSeason(null);
        setShowPodcastSeasonModalTrue();
    }, [setShowPodcastSeasonModalTrue]);

    const columns = useMemo(() => ([
        createStringColumn<PodcastSeasonsItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<PodcastSeasonsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createNumberColumn<PodcastSeasonsItem, number>(
            'seasonNumber',
            'Season  number',
            (item) => item.seasonNumber,
        ),
        createElementColumn<PodcastSeasonsItem, string, {
            podcastSeason: PodcastSeasonsItem;
        }>(
            'actions',
            'Actions',
            PodcastSeasonsActions,
            (_key, item) => ({
                podcastSeason: item,
            }),
        ),
    ]), []);

    const data = podcastSeasonsResponse?.podcastSeasons.results;
    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Podcast Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <TextInput
                        placeholder="Title"
                        name="title"
                        value={filter.title}
                        onChange={setFilterField}
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
                    itemsCount={podcastSeasonsResponse?.podcastSeasons.totalCount ?? 0}
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
                <PodcastSeasonsModal
                    onClose={setShowPodcastSeasonModalFalse}
                    title={selectedSeason ? 'Edit Podcast season' : 'Add Podcast season'}
                    initialValues={selectedSeason || undefined}
                />
            )}
        </Container>
    );
}

Component.displayName = 'PodcastSeasons';
