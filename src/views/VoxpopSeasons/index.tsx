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
    VoxpopSeasonsQuery,
    VoxpopSeasonsQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import VoxpopSeasonActions from './VoxpopSeasonActions';
import VoxpopSeasonModal from './VoxpopSeasonModal';

import styles from './styles.module.css';

type VoxpopSeasonsItem = NonNullable<VoxpopSeasonsQuery['voxpopSeasons']['results'][number]>;

const VOX_POP_SEASONS = gql`
    query VoxpopSeasons(
        $pagination:OffsetPaginationInput ,
        $filters:  VoxPopSeasonFilter,
        $order: VoxPopOrder,
        ) {
            voxpopSeasons(order: $order, pagination: $pagination, filters: $filters) {
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

const keySelector = (item: VoxpopSeasonsItem) => item.id;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showVoxpopSeasonModal, {
            setTrue: setShowVoxpopSeasonModalTrue,
            setFalse: setShowVoxpopSeasonModalFalse,
        }] = useBooleanState(false);
    const [
        selectedVoxpopSeason,
        setSelectedVoxpopSeason,
    ] = useState<Partial<VoxpopSeasonsItem> | null>(null);

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
        data: voxpopSeasonsResponse,
    } = useQuery<VoxpopSeasonsQuery, VoxpopSeasonsQueryVariables>(
        VOX_POP_SEASONS,
        { variables },
    );
    const handleAddVoxpopSeason = useCallback(() => {
        setSelectedVoxpopSeason(null);
        setShowVoxpopSeasonModalTrue();
    }, [setShowVoxpopSeasonModalTrue]);

    const columns = useMemo(() => ([
        createStringColumn<VoxpopSeasonsItem, string | number>(
            'title',
            'Title',
            (item) => item.title,
        ),
        createStringColumn<VoxpopSeasonsItem, string | number>(
            'description',
            'Description',
            (item) => item.description,
        ),
        createNumberColumn<VoxpopSeasonsItem, string>(
            'seasonNumber',
            'Season number',
            (item) => item.seasonNumber,
        ),
        createElementColumn<VoxpopSeasonsItem, string, {
            voxpopSeason: VoxpopSeasonsItem;
        }>(
            'actions',
            'Actions',
            VoxpopSeasonActions,
            (_key, item) => ({
                voxpopSeason: item,
            }),
        ),
    ]), []);

    const data = voxpopSeasonsResponse?.voxpopSeasons.results;
    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Voxpop Seasons Table"
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
                    onClick={handleAddVoxpopSeason}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={voxpopSeasonsResponse?.voxpopSeasons.totalCount ?? 0}
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
            {showVoxpopSeasonModal && (
                <VoxpopSeasonModal
                    onClose={setShowVoxpopSeasonModalFalse}
                    title={selectedVoxpopSeason ? 'Edit Voxpop season' : 'Add Voxpop season'}
                    initialValues={selectedVoxpopSeason || undefined}
                />
            )}
        </Container>
    );
}

Component.displayName = 'VoxpopSeasons';
