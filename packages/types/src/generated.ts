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
};
export type RoundSummaryData = {
id: string,
played_on: string,
course_name: string,
holes: number,
score: number,
baseline: string,
sg_total: string,
};
export type SignedInUserData = {
id: string,
email: string,
};
