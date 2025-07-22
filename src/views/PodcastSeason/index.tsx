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
    SelectInput,
    Table,
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
const statusOption = [
    { isArchived: true, label: 'true' },
    { isArchived: false, label: 'false' },
];

const statusKeySelector = (option: {
    isArchived: boolean;
    label: string,
}) => String(option.isArchived);
const statusLabelSelector = (option: {
     isArchived: boolean;
     label: string }) => String(option.label);

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
        filters: filter.isArchived !== undefined ? { isArchived: filter.isArchived } : undefined,
    };
    const {
        data: podcastSeasonsResponse,
        refetch: podcastSeasonUpdate,
    } = useQuery<PodcastSeasonsQuery, PodcastSeasonsQueryVariables>(
        PODCAST_SEASONS,
        { variables },
    );
    const handleAddPodcast = useCallback(() => {
        setSelectedSeason(null);
        setShowPodcastSeasonModalTrue();
    }, [setShowPodcastSeasonModalTrue]);

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
        createNumberColumn<PodcastSeasonsItem, string | number>(
            'seasonNumber',
            'Season number',
            (item) => item.seasonNumber,
        ),
        createElementColumn<PodcastSeasonsItem, string, {
            podcastSeason: PodcastSeasonsItem;
            onPodcastSeasonUpdate:(
            ) => void;
            onEdit: (report:PodcastSeasonsItem) => void;
                }>(
                'actions',
                'Actions',
                PodcastSeasonsActions,
                (_key, item) => ({
                    podcastSeason: item,
                    onPodcastSeasonUpdate: podcastSeasonUpdate,
                    onEdit: (report: PodcastSeasonsItem) => {
                        setSelectedSeason(report);
                        setShowPodcastSeasonModalTrue();
                    },
                }),
                ),
    ]), [podcastSeasonUpdate, setShowPodcastSeasonModalTrue]);

    const data = podcastSeasonsResponse?.podcastSeasons.results;
    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Podcast season Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <SelectInput
                        placeholder="Is Deleted"
                        name="isDeleted"
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
                    onPodcastSeasonUpdate={podcastSeasonUpdate}
                />
            )}
        </Container>
    );
}

Component.displayName = 'PodcastSeasons';
