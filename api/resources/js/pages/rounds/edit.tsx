import {
    Alert,
    Button,
    Card,
    FieldError,
    Input,
    Label,
    Link,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@heroui/react';
import type { BaselineData, RoundFormData } from '@gtrack/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { SgKeypad } from '../../components/sg-keypad';
import { formatSg, sumSg } from '../../lib/strokes-gained';

const SG_CATEGORIES = [
    { field: 'sg_off_the_tee', label: 'Off the Tee' },
    { field: 'sg_approach', label: 'Approach' },
    { field: 'sg_short_game', label: 'Short Game' },
    { field: 'sg_putting', label: 'Putting' },
] as const;

type SgField = (typeof SG_CATEGORIES)[number]['field'];

const DETAIL_FIELDS = ['played_on', 'course_name', 'tees', 'holes', 'par', 'handicap_index', 'course_handicap'];

/** Picks the new-Baseline text field instead of an existing Baseline. */
const NEW_BASELINE = 'new';

type Props = { round: RoundFormData; baselines: BaselineData[] };

/**
 * Layout C: Strokes Gained leads, and the course and handicap details carried
 * over from the last Round sit folded away under one line.
 */
export default function EditRound({ round, baselines }: Props) {
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
    });
    const [activeSg, setActiveSg] = useState<number | null>(editing ? null : 0);
    const [showDetails, setShowDetails] = useState(round.course_name === '');
    const detailsHaveErrors = DETAIL_FIELDS.some((field) => field in form.errors);
    const errorList = Object.values(form.errors);

    const submit = (event?: FormEvent) => {
        event?.preventDefault();
        setActiveSg(null);
        form.transform(({ baseline_id, new_baseline, ...data }) => ({
            ...data,
            baseline_id: baseline_id === NEW_BASELINE ? null : baseline_id,
            new_baseline: baseline_id === NEW_BASELINE ? new_baseline : null,
            tees: data.tees || null,
            par: data.par || null,
        }));
        if (editing) {
            form.put(`/rounds/${round.id}`, { preserveScroll: true });
        } else {
            form.post('/rounds', { preserveScroll: true });
        }
    };

    const destroy = () => {
        if (window.confirm('Delete this Round? This can’t be undone.')) {
            router.delete(`/rounds/${round.id}`);
        }
    };

    const sgField = activeSg === null ? null : SG_CATEGORIES[activeSg].field;

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
            <Head title={editing ? 'Edit Round' : 'Enter a Round'} />

            <div className="flex items-center justify-between">
                <Link href="/rounds">Rounds</Link>
                <span className="text-muted text-sm">
                    {new Date(`${form.data.played_on}T00:00`).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            </div>

            <div className="flex items-end justify-between">
                <h1 className="text-2xl font-semibold">Strokes Gained</h1>
                <span className="text-3xl font-semibold tabular-nums" aria-label="Total Strokes Gained">
                    {formatSg(sumSg(SG_CATEGORIES.map(({ field }) => form.data[field])))}
                </span>
            </div>

            {errorList.length > 0 && (
                <Alert status="danger">
                    <Alert.Content>
                        <Alert.Title>This Round can’t be saved yet</Alert.Title>
                        <Alert.Description>
                            <ul className="list-disc pl-4">
                                {errorList.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
                <Card>
                    <Card.Content className="flex flex-col gap-2">
                        {SG_CATEGORIES.map(({ field, label }, index) => (
                            <SgRow
                                key={field}
                                label={label}
                                value={form.data[field]}
                                active={activeSg === index}
                                invalid={field in form.errors}
                                onPress={() => setActiveSg(index)}
                            />
                        ))}
                    </Card.Content>
                </Card>

                {sgField && activeSg !== null ? (
                    <SgKeypad
                        key={sgField}
                        value={form.data[sgField]}
                        onChange={(value) => form.setData(sgField as SgField, value)}
                        onNext={() => setActiveSg(activeSg < SG_CATEGORIES.length - 1 ? activeSg + 1 : null)}
                        isLast={activeSg === SG_CATEGORIES.length - 1}
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
                            </TextField>
                            <BaselinePicker
                                baselines={baselines}
                                value={form.data.baseline_id}
                                newName={form.data.new_baseline}
                                errors={form.errors}
                                onChange={(value) => form.setData('baseline_id', value)}
                                onNewNameChange={(value) => form.setData('new_baseline', value)}
                            />
                        </div>

                        {showDetails || detailsHaveErrors ? (
                            <Card>
                                <Card.Content className="flex flex-col gap-3">
                                    <Field form={form} name="played_on" label="Date" type="date" isRequired />
                                    <Field form={form} name="course_name" label="Course" isRequired />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Holes</span>
                                        <ToggleButtonGroup
                                            aria-label="Holes"
                                            selectionMode="single"
                                            disallowEmptySelection
                                            selectedKeys={[String(form.data.holes)]}
                                            onSelectionChange={(keys) => form.setData('holes', Number([...keys][0]))}
                                        >
                                            <ToggleButton id="9">9</ToggleButton>
                                            <ToggleButton id="18">
                                                <ToggleButtonGroup.Separator />
                                                18
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field form={form} name="handicap_index" label="Handicap Index" inputMode="decimal" isRequired />
                                        <Field form={form} name="course_handicap" label="Course Handicap" inputMode="numeric" isRequired />
                                        <Field form={form} name="tees" label="Tees (optional)" />
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

                        <Button type="submit" size="lg" isPending={form.processing}>
                            Save Round
                        </Button>
                        {editing && (
                            <Button variant="danger-soft" onPress={destroy}>
                                Delete Round
                            </Button>
                        )}
                    </>
                )}
            </form>
        </main>
    );
}

function SgRow(props: { label: string; value: string; active: boolean; invalid: boolean; onPress: () => void }) {
    const border = props.active ? 'border-accent border-2 bg-accent-soft' : props.invalid ? 'border-danger' : 'border-border';

    return (
        <div className="flex items-center justify-between gap-3">
            <span>{props.label}</span>
            <button
                type="button"
                aria-label={`${props.label} Strokes Gained`}
                aria-pressed={props.active}
                onClick={props.onPress}
                className={`h-12 min-w-24 rounded-xl border px-3 text-right text-xl font-semibold tabular-nums ${border}`}
            >
                {props.active ? props.value || '0' : formatSg(props.value)}
            </button>
        </div>
    );
}

function BaselinePicker(props: {
    baselines: BaselineData[];
    value: string;
    newName: string;
    errors: Record<string, string>;
    onChange: (value: string) => void;
    onNewNameChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Baseline</span>
            <ToggleButtonGroup
                aria-label="Baseline"
                selectionMode="single"
                disallowEmptySelection
                className="flex-wrap"
                isDetached
                selectedKeys={props.value ? [props.value] : []}
                onSelectionChange={(keys) => props.onChange(String([...keys][0]))}
            >
                {props.baselines.map((baseline) => (
                    <ToggleButton key={baseline.id} id={baseline.id}>
                        {baseline.name}
                    </ToggleButton>
                ))}
                <ToggleButton id={NEW_BASELINE}>+ New</ToggleButton>
            </ToggleButtonGroup>
            {props.value === NEW_BASELINE && (
                <TextField
                    name="new_baseline"
                    aria-label="New Baseline name"
                    isInvalid={'new_baseline' in props.errors}
                    value={props.newName}
                    onChange={props.onNewNameChange}
                >
                    <Input placeholder="e.g. Scratch" />
                    <FieldError>{props.errors.new_baseline}</FieldError>
                </TextField>
            )}
            {props.errors.baseline_id && <p className="text-danger text-sm">{props.errors.baseline_id}</p>}
        </div>
    );
}

type FormFields = { [key: string]: string | number };

function Field(props: {
    form: { data: FormFields; errors: Partial<Record<string, string>>; setData: (key: never, value: string) => void };
    name: string;
    label: string;
    type?: string;
    inputMode?: 'decimal' | 'numeric';
    isRequired?: boolean;
}) {
    const { form, name } = props;

    return (
        <TextField
            name={name}
            type={props.type}
            inputMode={props.inputMode}
            isRequired={props.isRequired}
            isInvalid={name in form.errors}
            value={String(form.data[name] ?? '')}
            onChange={(value) => form.setData(name as never, value)}
        >
            <Label>{props.label}</Label>
            <Input />
            <FieldError>{form.errors[name]}</FieldError>
        </TextField>
    );
}
