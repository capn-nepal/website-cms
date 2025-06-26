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
    createStringColumn,
    Pager,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    ArtWorksQuery,
    ArtWorksQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';

import ArtWorkActions from './ArtWorkActions';
import ArtWorkModal from './ArtWorkModal';

import styles from './styles.module.css';

type ArtWorkItems = NonNullable<ArtWorksQuery['artWorks']['results'][number]>;

const PAGE_SIZE = 10;

const keySelector = (item: ArtWorkItems) => item.id;

const ART_WORK_ITEMS = gql`
    query ArtWorks(
        $pagination: OffsetPaginationInput,
        $order: ArtworkOrder,
    ) {
        artWorks(order: $order, pagination: $pagination) {
            pageInfo {
                limit
                offset
            }
            results {
                id
                image {
                    url
                }
                name
            }
            totalCount
        }
    }
`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);
    const [
        showArtWorkModal, {
            setTrue: setShowArtWorkModalTrue,
            setFalse: setShowArtWorkModalFalse,
        }] = useBooleanState(false);

    const variables = {
        pagination: {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
    };
    const {
        refetch: artWorkRefetch,
        data: artWorkResponse,
    } = useQuery<ArtWorksQuery, ArtWorksQueryVariables>(
        ART_WORK_ITEMS,
        { variables },
    );

    const data = artWorkResponse?.artWorks.results;

    const columns = useMemo(() => [
        createStringColumn<ArtWorkItems, string | number>(
            'name',
            'Name',
            (item) => (item.name),
        ),
        createStringColumn<ArtWorkItems, string | number>(
            'id',
            'ArtWork Id',
            (item) => (item.id),
        ),
        createElementColumn<ArtWorkItems, string, { url: string }>(
            'image',
            'Image',
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
            (_, item) => ({ url: item.image.url }),
        ),
        createElementColumn<ArtWorkItems, string,
         {
            artWorks: ArtWorkItems;
            refetchArtWork:(
            ) => void }>(
                'actions',
                'Actions',
                ArtWorkActions,
                (_key, item) => ({
                    artWorks: item,
                    refetchArtWork: artWorkRefetch,
                }),
                ),
    ], [artWorkRefetch]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="ArtWork Table"
            actions={(
                <Button
                    name="Add"
                    variant="primary"
                    onClick={setShowArtWorkModalTrue}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={artWorkResponse?.artWorks.totalCount ?? 0}
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
            {showArtWorkModal && (
                <ArtWorkModal
                    onClose={setShowArtWorkModalFalse}
                    artWorkRefetch={artWorkRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'ArtWorks';
