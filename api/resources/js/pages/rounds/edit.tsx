import {
    Alert,
    Button,
    Card,
    ComboBox,
    FieldError,
    Input,
    Label,
    Link,
    ListBox,
    NumberField,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@heroui/react';
import { parseSG } from '@gtrack/design';
import type { BaselineData, CourseData, RoundFormData, RoundStatsData, SgBandData, SgCategory } from '@gtrack/types';
import { Head, useForm } from '@inertiajs/react';
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AdvancedButton, AdvancedSheet, advancedErrorCount, advancedSummary } from '../../components/advanced-stats';
import { DeleteRound } from '../../components/delete-round';
import { RoundDate } from '../../components/round-date';
import { SgCategoryBadge, type SgCategoryKey } from '../../components/sg-category';
import { SgInput } from '../../components/sg-input';
import { SgKeypad } from '../../components/sg-keypad';
import { SgValue } from '../../components/sg-value';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';
import { sgForServer, sumSg } from '../../lib/strokes-gained';

const SG_CATEGORIES = [
    { field: 'sg_off_the_tee', key: 'ott', category: 'off_the_tee', label: 'Off the Tee' },
    { field: 'sg_approach', key: 'app', category: 'approach', label: 'Approach' },
    { field: 'sg_short_game', key: 'shg', category: 'short_game', label: 'Short Game' },
    { field: 'sg_putting', key: 'put', category: 'putting', label: 'Putting' },
] as const satisfies readonly { field: string; key: SgCategoryKey; category: SgCategory; label: string }[];

type SgField = (typeof SG_CATEGORIES)[number]['field'];

const DETAIL_FIELDS = ['played_on', 'course_name', 'tees', 'holes', 'par', 'handicap_index', 'course_handicap'];

/** Picks the new-Baseline text field instead of an existing Baseline. */
const NEW_BASELINE = 'new';

/**
 * HeroUI selects a ToggleButton in accent-soft; the design system selects it on segment,
 * over a surface-secondary track so the unselected options still read as buttons.
 */
const SELECTED_SEGMENT = 'data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground';
const TRACK = 'w-max rounded-full bg-surface-secondary p-1';

/**
 * Holes is one control sized like the inputs beside it: 36px with a 12px corner. Its two
 * halves meet edge to edge, unselected on the field background, selected on segment.
 */
const HOLE = 'h-full w-full min-w-0 rounded-none bg-transparent';

/** From here the page has room for the full-width form, typed on a keyboard. */
const WIDE = '(min-width: 80rem)';

/** From here the advanced stats open in a panel from the right rather than a sheet from the bottom. */
const TABLET = '(min-width: 48rem)';

type Props = { round: RoundFormData; baselines: BaselineData[]; courses: CourseData[]; sg_bands: SgBandData[] };

type RoundForm = ReturnType<typeof useRoundForm>;

/**
 * Round entry, under a save bar that stays in view. At desktop width, Score, Details and then
 * Strokes Gained use the full width, as the Drill form does, with the live total in the bar; each
 * SG Category's row opens its advanced stats in a flyout from the right. Narrower, layout C:
 * Strokes Gained on the keypad, with the carried-over details folded under one line, and a list
 * of the SG Categories below that opens each one's advanced stats in a sheet from the bottom.
 */
export default function EditRound({ round, baselines, courses, sg_bands }: Props) {
    const wide = useMediaQuery(WIDE);
    const form = useRoundForm(round, baselines, courses, sg_bands);

    return (
        <>
            <Head title={form.editing ? 'Edit Round' : 'Enter a Round'} />
            {wide ? <WideEntry form={form} baselines={baselines} /> : <NarrowEntry form={form} baselines={baselines} />}
        </>
    );
}

EditRound.layout = ({ round }: Props) => ({ title: round.id === null ? 'Enter a Round' : 'Edit Round' }) satisfies ShellProps;

/**
 * The form, plus what follows from the distance bands: once any band of Approach or
 * Putting is entered, that SG Category's value is the sum of its bands, as the server
 * will save it.
 */
function useRoundForm(round: RoundFormData, baselines: BaselineData[], courses: CourseData[], sgBands: SgBandData[]) {
    const editing = round.id !== null;
    const form = useForm({
        played_on: round.played_on,
        course_name: round.course_name,
        tees: round.tees ?? '',
        holes: round.holes ?? 18,
        par: round.par?.toString() ?? '',
        score: round.score?.toString() ?? '',
        handicap_index: round.handicap_index ?? '',
        course_handicap: round.course_handicap?.toString() ?? '',
        baseline_id: round.baseline_id ?? (baselines.length === 0 ? NEW_BASELINE : ''),
        new_baseline: '',
        sg_off_the_tee: round.sg_off_the_tee ?? '',
        sg_approach: round.sg_approach ?? '',
        sg_short_game: round.sg_short_game ?? '',
        sg_putting: round.sg_putting ?? '',
        stats: round.stats,
        bands: { ...round.bands } as Record<string, string>,
    });
    // The SG Category whose advanced stats are open in the flyout, if any.
    const [advancedFor, setAdvancedFor] = useState<SgCategory | null>(null);

    const enteredBands = Object.entries(form.data.bands).filter(([, value]) => parseSG(value) !== null);
    const bandTotal = (category: SgCategory): string | null => {
        const ids = new Set(sgBands.filter((band) => band.sg_category === category).map((band) => band.id));
        const values = enteredBands.filter(([id]) => ids.has(id)).map(([, value]) => value);
        return values.length > 0 ? sumSg(values) : null;
    };
    const locked = Object.fromEntries(SG_CATEGORIES.map(({ field, category }) => [field, bandTotal(category)])) as Record<SgField, string | null>;
    const sg = (field: SgField) => locked[field] ?? form.data[field];
    const errors = form.errors as Partial<Record<string, string>>;
    const advancedValues = {
        stats: form.data.stats,
        onStatChange: (field: keyof RoundStatsData, value: number | null) => form.setData('stats', { ...form.data.stats, [field]: value }),
        sgBands,
        bands: form.data.bands,
        onBandChange: (id: string, value: string) => form.setData('bands', { ...form.data.bands, [id]: value }),
        errors,
    };
    const fieldOf = (category: SgCategory) => SG_CATEGORIES.find((entry) => entry.category === category)!.field;

    const submit = (event?: FormEvent) => {
        event?.preventDefault();
        form.transform(({ baseline_id, new_baseline, ...data }) => ({
            ...data,
            ...Object.fromEntries(SG_CATEGORIES.map(({ field }) => [field, sgForServer(sg(field))])),
            baseline_id: baseline_id === NEW_BASELINE ? null : baseline_id,
            new_baseline: baseline_id === NEW_BASELINE ? new_baseline : null,
            tees: data.tees || null,
            par: data.par || null,
            bands: Object.fromEntries(enteredBands.map(([id, value]) => [id, sgForServer(value)])),
        }));
        // A save that fails returns to the top, so the banner and the fields show below the save bar, not behind it.
        if (editing) {
            form.put(`/rounds/${round.id}`);
        } else {
            form.post('/rounds');
        }
    };

    return {
        ...form,
        errors,
        editing,
        courses,
        sgBands,
        locked,
        sg,
        total: sumSg(SG_CATEGORIES.map(({ field }) => sg(field))),
        submit,
        deletable: editing ? { id: round.id!, course_name: round.course_name, played_on: round.played_on } : null,
        /** Opens one SG Category's advanced stats; `standalone` when it doesn't sit under that category's row. */
        advancedButton: (category: SgCategory, standalone = false) => (
            <AdvancedButton
                key={category}
                category={category}
                standalone={standalone}
                summary={advancedSummary(category, advancedValues)}
                errorCount={advancedErrorCount(category, advancedValues)}
                onPress={() => setAdvancedFor(category)}
            />
        ),
        /** The flyout with the open category's advanced stats: from the right when wide, from the bottom narrower. */
        advancedSheet: (placement: 'right' | 'bottom') => (
            <AdvancedSheet
                category={advancedFor}
                onClose={() => setAdvancedFor(null)}
                placement={placement}
                value={advancedFor ? sg(fieldOf(advancedFor)) : ''}
                fromBands={advancedFor !== null && locked[fieldOf(advancedFor)] !== null}
                {...advancedValues}
            />
        ),
    };
}

function WideEntry({ form, baselines }: { form: RoundForm; baselines: BaselineData[] }) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const focusAfter = (index: number) => {
        const next = SG_CATEGORIES.findIndex(({ field }, i) => i > index && form.locked[field] === null);
        inputs.current[next]?.focus();
    };

    return (
        <form className="flex w-full flex-col gap-8" onSubmit={form.submit} noValidate>
            <SaveBar form={form}>
                <div className="ml-auto text-right">
                    <p className="text-[13px] font-bold text-muted">Total Strokes Gained</p>
                    <SgValue value={form.total} className="text-[32px] leading-none" />
                </div>
            </SaveBar>

            <Errors errors={form.errors} />

            <Section n={1} title="Score">
                <div className="grid grid-cols-3 items-start gap-4">
                    <NumberInput form={form} name="score" label="Score" isRequired />
                    <HolesPicker form={form} />
                    <NumberInput form={form} name="course_handicap" label="Course Handicap" isRequired />
                </div>
            </Section>

            <Section n={2} title="Details">
                <div className="grid grid-cols-3 items-start gap-4">
                    <RoundDate value={form.data.played_on} onChange={(value) => form.setData('played_on', value)} error={form.errors.played_on} />
                    <div className="col-span-2">
                        <CoursePicker form={form} />
                    </div>
                    <NumberInput form={form} name="handicap_index" label="Handicap Index" decimals={1} isRequired />
                    <TeesPicker form={form} />
                    <NumberInput form={form} name="par" label="Par (optional)" />
                    <div className="col-span-3">
                        <BaselinePicker form={form} baselines={baselines} />
                    </div>
                </div>
            </Section>

            <Section n={3} title="Strokes Gained">
                {/* Two columns: Off the Tee, Approach / Short Game, Putting, each with a button that opens its
                    advanced stats in a flyout from the right. */}
                <div className="grid grid-cols-2 gap-2">
                    {SG_CATEGORIES.map(({ field, key, category }, index) => (
                        <div key={field} className="flex flex-col rounded-[16px] bg-surface-secondary">
                            <SgInput
                                category={key}
                                value={form.sg(field)}
                                locked={form.locked[field] !== null}
                                onChange={(value) => form.setData(field, value)}
                                onEnter={() => focusAfter(index)}
                                error={form.errors[field]}
                                inputRef={(input) => {
                                    inputs.current[index] = input;
                                }}
                            />
                            <div className="px-1 pb-1">{form.advancedButton(category)}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {form.advancedSheet('right')}
        </form>
    );
}

function NarrowEntry({ form, baselines }: { form: RoundForm; baselines: BaselineData[] }) {
    // A bottom sheet on a phone; with a tablet's width, the panel from the right, as on desktop.
    const tablet = useMediaQuery(TABLET);
    const firstOpen = SG_CATEGORIES.findIndex(({ field }) => form.locked[field] === null);
    const [activeSg, setActiveSg] = useState<number | null>(form.editing || firstOpen < 0 ? null : firstOpen);
    const [showDetails, setShowDetails] = useState(form.data.course_name === '');
    const detailsHaveErrors = DETAIL_FIELDS.some((field) => field in form.errors);
    const sgField = activeSg === null ? null : SG_CATEGORIES[activeSg].field;
    const nextAfter = (index: number) => {
        const next = SG_CATEGORIES.findIndex(({ field }, i) => i > index && form.locked[field] === null);
        return next < 0 ? null : next;
    };

    return (
        <div className="flex max-w-md flex-col gap-4">
            <div className="flex items-center justify-between">
                <Link href="/rounds">Rounds</Link>
                <span className="text-sm text-muted">
                    {new Date(`${form.data.played_on}T00:00`).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            </div>

            <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    setActiveSg(null);
                    form.submit(event);
                }}
                noValidate
            >
                <SaveBar form={form} />

                <Errors errors={form.errors} />

                <div className="flex items-end justify-between">
                    <h2 className="text-[20px] font-extrabold">Strokes Gained</h2>
                    <span aria-label="Total Strokes Gained">
                        <SgValue value={form.total} className="text-[32px]" />
                    </span>
                </div>

                <Card>
                    <Card.Content className="flex flex-col gap-2">
                        {SG_CATEGORIES.map(({ field, key, label }, index) => (
                            <SgRow
                                key={field}
                                category={key}
                                label={label}
                                value={form.sg(field)}
                                active={activeSg === index}
                                locked={form.locked[field] !== null}
                                error={form.errors[field]}
                                onPress={() => setActiveSg(index)}
                            />
                        ))}
                    </Card.Content>
                </Card>

                {sgField && activeSg !== null ? (
                    <SgKeypad
                        key={sgField}
                        value={form.data[sgField]}
                        onChange={(value) => form.setData(sgField, value)}
                        onNext={() => setActiveSg(nextAfter(activeSg))}
                        isLast={nextAfter(activeSg) === null}
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-[6rem_1fr] items-start gap-3">
                            <TextField
                                name="score"
                                inputMode="numeric"
                                isRequired
                                isInvalid={'score' in form.errors}
                                value={form.data.score}
                                onChange={(value) => form.setData('score', value)}
                            >
                                <Label>Score</Label>
                                <Input />
                                <FieldError>{form.errors.score}</FieldError>
                            </TextField>
                            <BaselinePicker form={form} baselines={baselines} compact />
                        </div>

                        {showDetails || detailsHaveErrors ? (
                            <Card>
                                <Card.Content className="flex flex-col gap-3">
                                    <RoundDate value={form.data.played_on} onChange={(value) => form.setData('played_on', value)} error={form.errors.played_on} />
                                    <CoursePicker form={form} />
                                    <HolesPicker form={form} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field form={form} name="handicap_index" label="Handicap Index" inputMode="decimal" isRequired />
                                        <Field form={form} name="course_handicap" label="Course Handicap" inputMode="numeric" isRequired />
                                        <TeesPicker form={form} />
                                        <Field form={form} name="par" label="Par (optional)" inputMode="numeric" />
                                    </div>
                                </Card.Content>
                            </Card>
                        ) : (
                            <Card>
                                <Card.Content className="flex flex-row items-center justify-between gap-3">
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            {[form.data.course_name, form.data.tees, `${form.data.holes} holes`]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        <p className="text-muted">
                                            HI {form.data.handicap_index} · CH {form.data.course_handicap}
                                        </p>
                                    </div>
                                    <Button variant="ghost" onPress={() => setShowDetails(true)}>
                                        Change
                                    </Button>
                                </Card.Content>
                            </Card>
                        )}

                        <Card>
                            <Card.Content className="flex flex-col gap-1 p-2">
                                {SG_CATEGORIES.map(({ category }) => form.advancedButton(category, true))}
                            </Card.Content>
                        </Card>
                        {form.advancedSheet(tablet ? 'right' : 'bottom')}
                    </>
                )}
            </form>
        </div>
    );
}

/**
 * Save Round, and Delete Round when editing, in a bar above the form that sticks to the top as the golfer scrolls.
 * It sticks at 0 inside a strip of page background, so the form never shows through above it.
 */
function SaveBar({ form, children }: { form: RoundForm; children?: ReactNode }) {
    return (
        <div className="sticky top-0 z-20 -mt-2 bg-(--background) pt-2 md:-mt-4 md:pt-4">
            <div className="flex items-center gap-2 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)]">
                <Button type="submit" size="lg" className="flex-1 sm:flex-none" isPending={form.processing}>
                    Save Round
                </Button>
                {form.deletable && <DeleteRound round={form.deletable} size="lg" />}
                {children}
            </div>
        </div>
    );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-[24px] bg-surface p-5">
            <h2 className="flex items-center gap-3 text-[20px] font-extrabold">
                <span className="flex size-7 items-center justify-center rounded-full bg-segment text-[13px] text-segment-foreground">{n}</span>
                {title}
            </h2>
            {children}
        </section>
    );
}

function Errors({ errors }: { errors: Partial<Record<string, string>> }) {
    const list = [...new Set(Object.values(errors))];

    return (
        list.length > 0 && (
            <Alert status="danger">
                <Alert.Content>
                    <Alert.Title>This Round can’t be saved yet</Alert.Title>
                    <Alert.Description>
                        <ul className="list-disc pl-4">
                            {list.map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    </Alert.Description>
                </Alert.Content>
            </Alert>
        )
    );
}

/** A Strokes Gained value at phone width, opening the keypad; read-only once its bands make it up. */
function SgRow(props: {
    category: SgCategoryKey;
    label: string;
    value: string;
    active: boolean;
    locked: boolean;
    /** Why the value can't be saved, shown under the row. */
    error?: string;
    onPress: () => void;
}) {
    const errorId = useId();
    const border = props.active ? 'border-highlight border-2' : props.error !== undefined ? 'border-danger' : 'border-(--field-border)';

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
                <SgCategoryBadge category={props.category} long />
                {props.locked ? (
                    <span
                        aria-label={`${props.label} Strokes Gained, the sum of its distance bands`}
                        className="flex h-12 min-w-24 flex-col items-end justify-center rounded-[12px] bg-surface-tertiary px-3"
                    >
                        <SgValue value={props.value} className="text-xl leading-none" />
                        <span className="text-[11px] font-bold text-muted">Sum of bands</span>
                    </span>
                ) : (
                    <button
                        type="button"
                        aria-label={`${props.label} Strokes Gained`}
                        aria-pressed={props.active}
                        aria-describedby={props.error === undefined ? undefined : errorId}
                        onClick={props.onPress}
                        className={`h-12 min-w-24 rounded-[12px] border bg-(--field-background) px-3 text-right ${border}`}
                    >
                        {props.active ? (
                            <span className="text-xl font-extrabold tabular-nums">{(props.value || '0').replace('-', '−')}</span>
                        ) : (
                            <SgValue value={props.value} className="text-xl" />
                        )}
                    </button>
                )}
            </div>
            {props.error !== undefined && (
                <p id={errorId} className="text-right text-sm text-danger">
                    {props.error}
                </p>
            )}
        </div>
    );
}

function HolesPicker({ form }: { form: RoundForm }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Holes</span>
            <ToggleButtonGroup
                aria-label="Holes"
                selectionMode="single"
                disallowEmptySelection
                className="grid h-9 w-full grid-cols-2 overflow-hidden rounded-[12px] border border-(--field-border) bg-(--field-background)"
                selectedKeys={[String(form.data.holes)]}
                onSelectionChange={(keys) => form.setData('holes', Number([...keys][0]))}
            >
                <ToggleButton id="9" className={`${HOLE} ${SELECTED_SEGMENT}`}>
                    9
                </ToggleButton>
                <ToggleButton id="18" className={`${HOLE} ${SELECTED_SEGMENT}`}>
                    18
                </ToggleButton>
            </ToggleButtonGroup>
        </div>
    );
}

/** `compact` shortens the hint, for the phone layout where it sits beside Score. */
function BaselinePicker({ form, baselines, compact = false }: { form: RoundForm; baselines: BaselineData[]; compact?: boolean }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col">
                <span className="text-sm font-medium">Baseline</span>
                <span className="text-[13px] text-muted">
                    {compact
                        ? 'What your Strokes Gained is measured against.'
                        : 'Who your Strokes Gained is measured against, such as Tour, scratch or a 10 handicap. Trends only compare Rounds on the same Baseline.'}
                </span>
            </div>
            <ToggleButtonGroup
                aria-label="Baseline"
                selectionMode="single"
                disallowEmptySelection
                className={`flex-wrap ${TRACK}`}
                selectedKeys={form.data.baseline_id ? [form.data.baseline_id] : []}
                onSelectionChange={(keys) => form.setData('baseline_id', String([...keys][0]))}
            >
                {baselines.map((baseline) => (
                    <ToggleButton key={baseline.id} id={baseline.id} className={SELECTED_SEGMENT}>
                        {baseline.name}
                    </ToggleButton>
                ))}
                <ToggleButton id={NEW_BASELINE} className={SELECTED_SEGMENT}>
                    + New
                </ToggleButton>
            </ToggleButtonGroup>
            {form.data.baseline_id === NEW_BASELINE && (
                <TextField
                    name="new_baseline"
                    aria-label="New Baseline name"
                    isInvalid={'new_baseline' in form.errors}
                    value={form.data.new_baseline}
                    onChange={(value) => form.setData('new_baseline', value)}
                >
                    <Input placeholder="e.g. Scratch" />
                    <FieldError>{form.errors.new_baseline}</FieldError>
                </TextField>
            )}
            {form.errors.baseline_id && <p className="text-sm text-danger">{form.errors.baseline_id}</p>}
        </div>
    );
}

/** The course, typed or picked from the golfer's earlier Rounds. */
function CoursePicker({ form }: { form: RoundForm }) {
    return (
        <SuggestField
            form={form}
            name="course_name"
            label="Course"
            options={form.courses.map((course) => course.name)}
            isRequired
        />
    );
}

/** The tees, typed or picked from those the golfer played the chosen course from. */
function TeesPicker({ form }: { form: RoundForm }) {
    const tees = form.courses.find((course) => course.name === form.data.course_name)?.tees ?? [];

    // Keyed by course: the suggestions are read when the field mounts, so a new course remounts it.
    return <SuggestField key={form.data.course_name} form={form} name="tees" label="Tees (optional)" options={tees} />;
}

/** A text field that suggests earlier values as it's typed into, and takes a new one too. */
function SuggestField(props: { form: RoundForm; name: 'course_name' | 'tees'; label: string; options: string[]; isRequired?: boolean }) {
    const { form, name } = props;

    return (
        <ComboBox
            name={name}
            allowsCustomValue
            menuTrigger="focus"
            isRequired={props.isRequired}
            isInvalid={name in form.errors}
            inputValue={form.data[name]}
            onInputChange={(value) => form.setData(name, value)}
            defaultItems={props.options.map((option) => ({ id: option, name: option }))}
        >
            <Label>{props.label}</Label>
            <ComboBox.InputGroup>
                <Input />
                {props.options.length > 0 && <ComboBox.Trigger />}
            </ComboBox.InputGroup>
            <ComboBox.Popover>
                <ListBox>
                    {(item: { id: string; name: string }) => (
                        <ListBox.Item id={item.id} textValue={item.name}>
                            {item.name}
                        </ListBox.Item>
                    )}
                </ListBox>
            </ComboBox.Popover>
            <FieldError>{form.errors[name]}</FieldError>
        </ComboBox>
    );
}

type TextFieldName = 'course_name' | 'tees' | 'handicap_index' | 'course_handicap' | 'par';

function Field(props: {
    form: RoundForm;
    name: TextFieldName;
    label: string;
    inputMode?: 'decimal' | 'numeric';
    isRequired?: boolean;
}) {
    const { form, name } = props;

    return (
        <TextField
            name={name}
            inputMode={props.inputMode}
            isRequired={props.isRequired}
            isInvalid={name in form.errors}
            value={form.data[name]}
            onChange={(value) => form.setData(name, value)}
        >
            <Label>{props.label}</Label>
            <Input />
            <FieldError>{form.errors[name]}</FieldError>
        </TextField>
    );
}

/** A whole number (or one decimal) held as text in the form, typed with a keyboard. */
function NumberInput(props: {
    form: RoundForm;
    name: 'score' | 'course_handicap' | 'handicap_index' | 'par';
    label: string;
    decimals?: number;
    isRequired?: boolean;
}) {
    const { form, name } = props;
    const value = form.data[name];

    return (
        <NumberField
            name={name}
            isRequired={props.isRequired}
            isInvalid={name in form.errors}
            formatOptions={{ maximumFractionDigits: props.decimals ?? 0, useGrouping: false }}
            value={value === '' ? Number.NaN : Number(value)}
            onChange={(number) => form.setData(name, Number.isNaN(number) ? '' : number.toFixed(props.decimals ?? 0))}
        >
            <Label>{props.label}</Label>
            <NumberField.Group>
                <NumberField.Input className="tabular-nums" />
            </NumberField.Group>
            <FieldError>{form.errors[name]}</FieldError>
        </NumberField>
    );
}
