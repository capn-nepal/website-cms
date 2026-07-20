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
    TeamMembersQuery,
    TeamMembersQueryVariables,
    TeamMemberTypeEnum,
} from '#generated/types/graphql';
import useBooleanState from '#hooks/useBooleanState';
import useFilterState from '#hooks/useFilterState';

import TeamActions from './TeamActions';
import TeamModal from './TeamModal';

import styles from './styles.module.css';

type TeamsItem = NonNullable<TeamMembersQuery['teamMembers']['results'][number]>;

const TEAMS = gql`
    query TeamMembers(
        $pagination:OffsetPaginationInput ,
        $filters: TeamMemberFilter,
        $order: TeamMemberOrder,
        ) {
        teamMembers(order: $order, pagination: $pagination, filters: $filters) {
            pageInfo {
                limit
                offset
            }
            results {
                designation
                firstName
                id
                lastName
                memberPhoto {
                    url
                }
                memberType
                middleName
            }
            totalCount
        }
    }
`;

const PAGE_SIZE = 10;
const memberTypeOptions :{
    label: string;
    memberType: TeamMemberTypeEnum;
}[] = [
    { memberType: 'TEAM_MEMBER', label: 'Team Member' },
    { memberType: 'BOARD_MEMBER', label: 'Board Member' },
];

const keySelector = (item: TeamsItem) => item.id;

const memberKeySelector = (option:{memberType:TeamMemberTypeEnum}) => option.memberType;
const memberLabelSelector = (option: {label: string }) => String(option.label);

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [page, setPage] = useState(1);

    const [
        showAddTeamMemberModal, {
            setTrue: setShowAddTeamMemberModalTrue,
            setFalse: setShowAddTeamMemberModalFalse,
        }] = useBooleanState(false);

    const [
        selectedTeamMember,
        setSelectedTeamMember,
    ] = useState<Partial<TeamsItem> | undefined>(undefined);
    const {
        filter,
        setFilterField,
    } = useFilterState<{
        memberType?: TeamMemberTypeEnum
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
            memberType: filter.memberType,
        },
    };
    const {
        refetch: teamRefetch,
        data: teamMemberResponse,
    } = useQuery<TeamMembersQuery, TeamMembersQueryVariables>(
        TEAMS,
        { variables },
    );

    const data = teamMemberResponse?.teamMembers.results;
    const handleTeamMember = useCallback(() => {
        setSelectedTeamMember(undefined);
        setShowAddTeamMemberModalTrue();
    }, [setShowAddTeamMemberModalTrue]);

    const columns = useMemo(() => ([
        createStringColumn<TeamsItem, string>(
            'firstName',
            'First Name',
            (item) => item.firstName,
        ),
        createStringColumn<TeamsItem, string>(
            'middleName',
            'Middle Name',
            (item) => item.middleName,
        ),
        createStringColumn<TeamsItem, string>(
            'lastName',
            'Last Name',
            (item) => item.lastName,
        ),
        createStringColumn<TeamsItem, string>(
            'designation',
            'Designation',
            (item) => item.designation,
        ),
        createStringColumn<TeamsItem, string>(
            'teamMember',
            'Team Member',
            (item) => item.memberType,
        ),
        createElementColumn<TeamsItem, string, { url: string }>(
            'memberPhoto',
            'Member Photo',
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
            (_, item) => ({ url: item.memberPhoto?.url || '' }),
        ),
        createElementColumn<TeamsItem, string, {
            teamMember: TeamsItem;
            onEdit:(
                teamMember: TeamsItem) => void;
                }>(
                'actions',
                'Actions',
                TeamActions as React.FC<{
                    teamMember: TeamsItem;
                    onEdit: (teamMember: TeamsItem) => void;
                }>,
                (_key, item) => ({
                    teamMember: item,
                    teamRefetch,
                    onEdit: setSelectedTeamMember,

                }),
                ),
    ]), [teamRefetch]);

    return (
        <Container
            className={styles.container}
            childrenContainerClassName={styles.content}
            showHeader
            headingLevel={6}
            heading="Team Table"
            headingDescription={(
                <div className={styles.filterActions}>
                    <SelectInput
                        placeholder="Member type"
                        name="memberType"
                        options={memberTypeOptions}
                        keySelector={memberKeySelector}
                        labelSelector={memberLabelSelector}
                        value={filter.memberType}
                        onChange={setFilterField}
                    />
                </div>
            )}
            actions={(
                <Button
                    name="Add Team"
                    variant="primary"
                    onClick={handleTeamMember}
                    icons={<IoAdd />}
                >
                    Add
                </Button>
            )}
            footerActions={(
                <Pager
                    activePage={page}
                    onActivePageChange={setPage}
                    itemsCount={teamMemberResponse?.teamMembers.totalCount ?? 0}
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
            {showAddTeamMemberModal && (
                <TeamModal
                    onClose={setShowAddTeamMemberModalFalse}
                    title={selectedTeamMember ? 'Edit Team Member' : 'Add Team Member'}
                    teamRefetch={teamRefetch}
                />
            )}
        </Container>
    );
}

Component.displayName = 'teams';
