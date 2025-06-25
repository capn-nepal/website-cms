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
    SelectInput,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { createElementColumn } from '#components/CreateElementColumn';
import {
    GalleryItemsQuery,
    GalleryItemsQueryVariables,
    ImageTypeEnum,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import GalleryItemActions from './GalleryItemActions';
import GalleryModal from './GalleryModal';

import styles from './styles.module.css';

type GalleryItem = NonNullable<GalleryItemsQuery['galleryItems']['results'][number]>;

const PAGE_SIZE = 10;

const imageTypeOptions: {
    label: string;
    status: ImageTypeEnum;
}[] = [
    { status: 'ARTWORK', label: 'Artwork' },
    { status: 'IMAGE', label: 'Image' },
];

const keySelector = (item: GalleryItem) => item.id;

const statusKeySelector = (option: { status: ImageTypeEnum }) => option.status;
const statusLabelSelector = (option: { label: string }) => option.label;

const GALLERY_ITEMS = gql`
    query GalleryItems(
        $pagination: OffsetPaginationInput,
        $filters: GalleryItemFilter,
        $order: GalleryItemOrder
    ) {
        galleryItems(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                id
                image {
                    url
                }
                imageType
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

    const {
        filter,
        setFilterField,
    } = useFilterState<{
        imageType?: ImageTypeEnum;
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
            imageType: filter.imageType,
        },
    };
    const {
        refetch: galleryItemRefetch,
        data: galleryItemsResponse,
    } = useQuery<GalleryItemsQuery, GalleryItemsQueryVariables>(
        GALLERY_ITEMS,
        { variables },
    );

    const data = galleryItemsResponse?.galleryItems.results;

    const columns = useMemo(() => [
        createStringColumn<GalleryItem, string | number>(
            'imageType',
            'Image Type',
            (item) => (item.imageType),
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
        createElementColumn<
            GalleryItem,
            string,
            { galleryItem: GalleryItem; }
        >(
            'actions',
            'Actions',
            GalleryItemActions,
            (_key, item) => ({ galleryItem: item }),
        ),
    ], []);

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
                        placeholder="Image type"
                        name="imageType"
                        options={imageTypeOptions}
                        keySelector={statusKeySelector}
                        labelSelector={statusLabelSelector}
                        value={filter.imageType}
                        onChange={setFilterField}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add"
                    variant="primary"
                    onClick={setShowGalleryItemModalTrue}
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
                <GalleryModal
                    onClose={setShowGalleryItemModalFalse}
                    galleryItemRefetch={galleryItemRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'GalleryItems';
