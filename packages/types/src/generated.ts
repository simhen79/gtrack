export type AdminUserData = {
id: string,
email: string,
roles: Role[],
last_signed_in_at: string | null,
disabled_at: string | null,
};
export type AuthData = {
user: SignedInUserData | null,
permissions: string[],
};
export type BaselineData = {
id: string,
name: string,
is_default: boolean,
};
export type CatalogueData = {
games: GameVersionData[],
drills: DrillData[],
};
export type CourseData = {
name: string,
tees: string[],
};
export type CursorPaginatedDataCollection<TKey, TValue> = CursorPaginator<TKey, TValue>;
export type CursorPaginator<TKey, TValue> = {
data: TKey extends string ? Record<TKey, TValue> : TValue[],
links: {
url: string | null,
label: string,
active: boolean,
}[],
meta: {
path: string,
per_page: number,
next_cursor: string | null,
next_page_url: string | null,
prev_cursor: string | null,
prev_page_url: string | null,
},
};
export type CursorPaginatorInterface<TKey, TValue> = CursorPaginator<TKey, TValue>;
export type DistanceGroupData = {
id: string,
sg_category: SgCategory,
label: string,
};
export type DrillData = {
id: string,
name: string,
sg_category: SgCategory,
balls: number | null,
estimated_minutes: number | null,
seconds_per_ball: number | null,
setup: string,
source_concept: string | null,
source_url: string | null,
facility_ids: string[],
feature_ids: string[],
distance_group_ids: string[],
retired_at: string | null,
};
export type FacilityData = {
id: string,
key: string,
name: string,
features: FeatureData[],
};
export type FeatureData = {
id: string,
key: string,
name: string,
};
export type GameOrigin = 'llm' | 'hand_written' | 'first_load';
export type GameStatus = 'draft' | 'published' | 'retired';
export type GameVersionData = {
id: string,
game_id: string,
version: number,
status: GameStatus,
origin: GameOrigin,
name: string,
sg_category: SgCategory,
balls: number | null,
estimated_minutes: number | null,
seconds_per_ball: number | null,
rules: string,
scoring: string,
score_better: ScoreBetter,
score_entry: ScoreEntry,
source_concept: string | null,
source_url: string | null,
facility_ids: string[],
feature_ids: string[],
distance_group_ids: string[],
open: string[],
pad_values: number[],
variations: VariationData[],
published_at: string | null,
retired_at: string | null,
};
export type LengthAwarePaginator<TKey, TValue> = {
data: TKey extends string ? Record<TKey, TValue> : TValue[],
links: {
url: string | null,
label: string,
active: boolean,
}[],
meta: {
total: number,
current_page: number,
first_page_url: string,
from: number | null,
last_page: number,
last_page_url: string,
next_page_url: string | null,
path: string,
per_page: number,
prev_page_url: string | null,
to: number | null,
},
};
export type LengthAwarePaginatorInterface<TKey, TValue> = LengthAwarePaginator<TKey, TValue>;
export type MeData = {
id: string,
email: string,
name: string | null,
permissions: string[],
};
export type PaginatedDataCollection<TKey, TValue> = LengthAwarePaginator<TKey, TValue>;
export type PracticeGroundData = {
id: string,
name: string,
note: string | null,
facility_ids: string[],
feature_ids: string[],
archived_at: string | null,
};
export type PracticeGroundsData = {
practice_grounds: PracticeGroundData[],
archived: PracticeGroundData[],
facilities: FacilityData[],
};
export type Role = 'admin' | 'golfer';
export type RoundFormData = {
id: string | null,
played_on: string,
course_name: string,
tees: string | null,
holes: number | null,
par: number | null,
score: number | null,
handicap_index: string | null,
course_handicap: number | null,
baseline_id: string | null,
sg_off_the_tee: string | null,
sg_approach: string | null,
sg_short_game: string | null,
sg_putting: string | null,
stats: RoundStatsData,
bands: Record<string, string>,
};
export type RoundStatsData = {
fairways_hit_percent: number | null,
fairways_missed_left_percent: number | null,
fairways_missed_right_percent: number | null,
penalties: number | null,
approach_miss_long_percent: number | null,
approach_miss_short_percent: number | null,
approach_miss_left_percent: number | null,
approach_miss_right_percent: number | null,
up_and_downs_percent: number | null,
sand_saves_percent: number | null,
};
export type RoundSummaryData = {
id: string,
played_on: string,
course_name: string,
holes: number,
score: number,
baseline: string,
sg_total: string,
sg_off_the_tee: string,
sg_approach: string,
sg_short_game: string,
sg_putting: string,
stats: RoundStatsData,
bands: Record<string, string>,
};
export type ScoreBetter = 'higher' | 'lower';
export type ScoreEntry = 'counter' | 'pad' | 'timer';
export type SgBandData = {
id: string,
sg_category: SgCategory,
label: string,
distance_group: string | null,
};
export type SgBandTrendData = {
id: string,
label: string,
value: string | null,
};
export type SgCategory = 'off_the_tee' | 'approach' | 'short_game' | 'putting';
export type SgTrendData = {
category: SgCategory,
values: string[],
recent: string | null,
last_20: string | null,
bands: SgBandTrendData[],
};
export type SignedInUserData = {
id: string,
email: string,
};
export type TrendRoundData = {
id: string,
played_on: string,
course_name: string,
holes: number,
score: number,
};
export type VariationData = {
id: string,
wording: string,
miss_direction: string | null,
is_plain: boolean,
};
