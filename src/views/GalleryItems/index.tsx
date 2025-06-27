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
    Pager,
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    GalleryItemsQuery,
    GalleryItemsQueryVariables,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import GalleryItemActions from './GalleryItemActions';
import GalleryItemModal from './GalleryItemModal';

import styles from './styles.module.css';

type GalleryItem = NonNullable<GalleryItemsQuery['galleryItems']['results'][number]>;

const PAGE_SIZE = 10;

const keySelector = (item: GalleryItem) => item.id;

const isArchivedOptions = [
    { status: true, label: 'Yes' },
    { status: false, label: 'No' },
];

const statusKeySelector = (option: { status: boolean }) => String(option.status);
const statusLabelSelector = (option: { status: boolean; label: string }) => option.label;

const GALLERY_ITEMS = gql`
    query GalleryItems(
        $pagination: OffsetPaginationInput,
        $filters: GalleryItemFilter,
        $order: GalleryItemOrder
    ) {
        galleryItems(
            order: $order,
            pagination: $pagination,
            filters: $filters
            ) {
            pageInfo {
                limit
                offset
            }
            results {
                caption
                gallery {
                    description
                    id
                    isArchived
                    name
                }
                id
                image{
                    url
                }
                isArchived
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
            setTrue: setShowGalleryItemModalTrue,
            setFalse: setShowGalleryItemModalFalse,
        }] = useBooleanState(false);
    const [
        selectedGalleryItem,
        setSelectedGalleryItem,
    ] = useState<Partial<GalleryItem> | null>(null);

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
        refetch: galleryItemRefetch,
        data: galleryItemsResponse,
    } = useQuery<GalleryItemsQuery, GalleryItemsQueryVariables>(
        GALLERY_ITEMS,
        { variables },
    );
    const onChange = useCallback(
        (newValue: string | undefined) => {
            let isDeleted;
            if (newValue === 'true') {
                isDeleted = true;
            } else if (newValue === 'false') {
                isDeleted = false;
            } else {
                isDeleted = undefined;
            }

            setFilterField(isDeleted, 'isArchived');
        },
        [setFilterField],
    );
    const handleAddGalleryItem = useCallback(() => {
        setSelectedGalleryItem(null);
        setShowGalleryItemModalTrue();
    }, [setShowGalleryItemModalTrue]);

    const data = galleryItemsResponse?.galleryItems.results;

    const columns = useMemo(() => [
        createStringColumn<GalleryItem, string | number>(
            'caption',
            'Caption',
            (item) => (item.caption),
        ),
        createElementColumn<GalleryItem, string, { url: string }>(
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
        createStringColumn<GalleryItem, string | number>(
            'gallery',
            'Gallery',
            (item) => (item.gallery.name),
        ),
        createElementColumn<
            GalleryItem,
            string,
            {
                galleryItem: GalleryItem;
                refetchGalleryItem:(
                ) =>void;

                    }
                    >(
                    'actions',
                    'Actions',
                    GalleryItemActions,
                    (_key, item) => ({
                        galleryItem: item,
                        refetchGalleryItem: galleryItemRefetch,
                    }),
                    ),
    ], [galleryItemRefetch]);

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
                        value={filter.isArchived !== undefined
                            ? String(filter.isArchived) : undefined}
                        onChange={onChange}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add"
                    variant="primary"
                    onClick={handleAddGalleryItem}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={galleryItemsResponse?.galleryItems.totalCount ?? 0}
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
                <GalleryItemModal
                    onClose={setShowGalleryItemModalFalse}
                    title={selectedGalleryItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
                    galleryItemRefetch={galleryItemRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'GalleryItems';
