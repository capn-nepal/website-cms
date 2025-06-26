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
    createStringColumn,
    createYesNoColumn,
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    GalleriesQuery,
    GalleriesQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import GalleryActions from './GalleryActions';
import GalleryModal from './GalleryModal';

import styles from './styles.module.css';

type GalleryItem = NonNullable<GalleriesQuery['galleries']['results'][number]>;

const PAGE_SIZE = 10;

const keySelector = (item: GalleryItem) => item.id;

const isArchivedOptions = [
    { isArchived: true, label: 'Yes' },
    { isArchived: false, label: 'No' },
];

const statusKeySelector = (option: {
    isArchived: boolean; label: string }) => String(option.isArchived);
const statusLabelSelector = (option: {
     isArchived: boolean; label: string }) => String(option.label);

const GALLERY = gql`
    query  galleries(
        $pagination: OffsetPaginationInput,
        $filters: GalleryFilter,
        $order: GalleryOrder
    ) {
        galleries(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                description
                id
                isArchived
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
        showGalleryItemModal, {
            setTrue: setShowGalleryModalTrue,
            setFalse: setShowGalleryModalFalse,
        }] = useBooleanState(false);
    const [selectedGallery, setSelectedEvent] = useState<Partial<GalleryItem> | null>(null);

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
            isArchived: filter.isArchived,
        },
    };
    const {
        refetch: galleryRefetch,
        data: galleryResponse,
    } = useQuery<GalleriesQuery, GalleriesQueryVariables>(
        GALLERY,
        { variables },
    );
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
    const handleAddGallery = useCallback(() => {
        setSelectedEvent(null);
        setShowGalleryModalTrue();
    }, [setShowGalleryModalTrue]);
    const data = galleryResponse?.galleries.results;

    const columns = useMemo(() => [
        createStringColumn<GalleryItem, string | number>(
            'name',
            'Name',
            (item) => (item.name),
        ),
        createStringColumn<GalleryItem, string | number>(
            'description',
            'Description',
            (item) => (item.description),
        ),
        createYesNoColumn<GalleryItem, boolean>(
            'isArchived',
            'IsArchived',
            (item) => (item.isArchived),
        ),
        createElementColumn<
        GalleryItem,
        string,
        {
            galleryItem: GalleryItem;
            refetchGallery:(
            ) => void;
                }
                >(
                'actions',
                'Actions',
                GalleryActions,
                (_key, item) => ({
                    galleryItem: item,
                    refetchGallery: galleryRefetch,
                }),
                ),
    ], [galleryRefetch]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Gallery Items Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <SelectInput
                        placeholder="Is Archived"
                        name="isArchived"
                        options={isArchivedOptions}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.isArchived !== undefined ? String(filter.isArchived) : null}
                        onChange={onChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add"
                    variant="primary"
                    onClick={handleAddGallery}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={galleryResponse?.galleries.totalCount ?? 0}
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
            {showGalleryItemModal && (
                <GalleryModal
                    onClose={setShowGalleryModalFalse}
                    galleryRefetch={galleryRefetch}
                    title={selectedGallery ? 'Edit Gallery' : 'Add GAllery'}
                />
            )}
        </Container>
    );
}

Component.displayName = 'Gallery';
