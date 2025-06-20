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
    VoxpopEpisodesQuery,
    VoxpopEpisodesQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import VoxpopEpisodeActions from './VoxpopEpisodeActions';
import VoxpopEpisodeModal from './VoxpopEpisodeModal';

import styles from './styles.module.css';

type VoxpopEpisodeItem = NonNullable<VoxpopEpisodesQuery['voxpopEpisodes']['results'][number]>;

const VOX_POP_EPISODE = gql`
    query VoxpopEpisodes(
        $pagination:OffsetPaginationInput ,
        $filters:  VoxPopEpisodeFilter
        $order:  VoxPopEpisodeOrder,
        ) {
        voxpopEpisodes(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                episodeNumber
                id
                isArchived
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

const keySelector = (item: VoxpopEpisodeItem) => item.id;
const statusKeySelector = (option: {
    isArchived: boolean; label: string;
 }) => String(option.isArchived);
const statusLabelSelector = (option: { isArchived: boolean; label: string }) => option.label;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showVoxpopEpisodeModal, {
            setTrue: setShowVoxpopEpisodeModalTrue,
            setFalse: setShowVoxpopEpisodeModalFalse,
        }] = useBooleanState(false);

    const [
        selectedEpisode,
        setSelectedEpisode,
    ] = useState<Partial<VoxpopEpisodeItem> | null>(null);

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
        data: voxpopEpisodeResponse,
        refetch: voxpopEpisodeRefetch,
    } = useQuery<VoxpopEpisodesQuery, VoxpopEpisodesQueryVariables>(
        VOX_POP_EPISODE,
        { variables },
    );
    const handleAddVoxpopEpisode = useCallback(() => {
        setSelectedEpisode(null);
        setShowVoxpopEpisodeModalTrue();
    }, [setShowVoxpopEpisodeModalTrue]);

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
        createStringColumn<VoxpopEpisodeItem, string>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<VoxpopEpisodeItem, string | number>(
            'episodeNumber',
            'Episode Number',
            (item) => String(item.episodeNumber),
        ),
        createDateColumn<VoxpopEpisodeItem, string>(
            'releaseDate',
            'Released Date',
            (item) => item.releaseDate,
        ),
        createElementColumn<VoxpopEpisodeItem, string, { url: string }>(
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
        createYesNoColumn<VoxpopEpisodeItem, boolean | undefined>(
            'isArchived',
            'Is Archived',
            (item) => item.isArchived,
        ),
        createElementColumn<VoxpopEpisodeItem, string, { url: string }>(
            'thumbnail',
            'Thumbnail',
            ({ url }) => (
                url
                    ? <img src={url} alt="thumbnail" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    : <Chip label="No Image" variant="default" />
            ),
            (_key, item) => ({ url: item.thumbnail?.url || '' }),
        ),
        createElementColumn<VoxpopEpisodeItem, string, {
            voxpopEpisode: VoxpopEpisodeItem;
            onEdit:(
                episode: VoxpopEpisodeItem) => void;
                voxpopEpisodeRefetch:(
                ) => void;
                }>(
                'actions',
                'Actions',
                VoxpopEpisodeActions,
                (_key, item) => ({
                    voxpopEpisode: item,
                    voxpopEpisodeRefetch,
                    onEdit: setSelectedEpisode,
                }),
                ),

    ]), [voxpopEpisodeRefetch]);

    const data = voxpopEpisodeResponse?.voxpopEpisodes.results;

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Voxpop Episode Table"
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
                    name="Add Voxpop Episode"
                    variant="primary"
                    onClick={handleAddVoxpopEpisode}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={voxpopEpisodeResponse?.voxpopEpisodes.totalCount ?? 0}
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
            {showVoxpopEpisodeModal && (
                <VoxpopEpisodeModal
                    onClose={setShowVoxpopEpisodeModalFalse}
                    title={selectedEpisode ? 'Edit Voxpop episode' : 'Add Voxpop episode'}
                    initialValues={selectedEpisode || undefined}
                    voxpopEpisodeRefetch={voxpopEpisodeRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'VoxpopEpisode';
