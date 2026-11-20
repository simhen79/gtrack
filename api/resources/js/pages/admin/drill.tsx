import { Alert, Button, buttonVariants, Card, Checkbox, FieldError, Form, Input, Label, Link, NumberField, TextArea, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { DistanceGroupData, DrillData, FacilityData, SgCategory } from '@gtrack/types';
import { Head, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AdminTabs } from '../../components/admin-tabs';
import { SgCategoryBadge, sgCategoryKey } from '../../components/sg-category';
import type { ShellProps } from '../../layouts/app-shell';

type Props = { drill: DrillData | null; facilities: FacilityData[]; distance_groups: DistanceGroupData[] };

const SG_CATEGORIES: { category: SgCategory; label: string }[] = [
    { category: 'off_the_tee', label: 'Off the Tee' },
    { category: 'approach', label: 'Approach' },
    { category: 'short_game', label: 'Short Game' },
    { category: 'putting', label: 'Putting' },
];

/** HeroUI selects a ToggleButton in accent-soft; the design system selects it on segment. */
const SELECTED_SEGMENT = 'data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground';

type DrillForm = {
    name: string;
    sg_category: SgCategory;
    balls: number | null;
    estimated_minutes: number | null;
    seconds_per_ball: number | null;
    setup: string;
    source_concept: string;
    source_url: string;
    facility_ids: string[];
    feature_ids: string[];
    distance_group_ids: string[];
};

/** Adds a Drill, or edits one in place: a Drill has no Drafts and no versions. */
export default function Drill({ drill, facilities, distance_groups }: Props) {
    const form = useForm<DrillForm>({
        name: drill?.name ?? '',
        sg_category: drill?.sg_category ?? 'off_the_tee',
        balls: drill?.balls ?? null,
        estimated_minutes: drill?.estimated_minutes ?? null,
        seconds_per_ball: drill?.seconds_per_ball ?? null,
        setup: drill?.setup ?? '',
        source_concept: drill?.source_concept ?? '',
        source_url: drill?.source_url ?? '',
        facility_ids: drill?.facility_ids ?? [],
        feature_ids: drill?.feature_ids ?? [],
        distance_group_ids: drill?.distance_group_ids ?? [],
    });
    const groups = distance_groups.filter((group) => group.sg_category === form.data.sg_category);

    const save = () => {
        form.transform((data) => ({ ...data, source_concept: data.source_concept || null, source_url: data.source_url || null }));
        if (drill) {
            form.put(`/admin/drills/${drill.id}`);
        } else {
            form.post('/admin/drills');
        }
    };

    const pickCategory = (category: SgCategory) => {
        // Distance groups belong to one SG Category, so they don't carry over.
        const kept = distance_groups.filter((group) => group.sg_category === category).map((group) => group.id);
        form.setData((data) => ({ ...data, sg_category: category, distance_group_ids: data.distance_group_ids.filter((id) => kept.includes(id)) }));
    };

    const toggleFacility = (facility: FacilityData, on: boolean) => {
        // A feature only makes sense on a Facility the Drill needs.
        const features = facility.features.map((feature) => feature.id);
        form.setData((data) => ({
            ...data,
            facility_ids: on ? [...data.facility_ids, facility.id] : data.facility_ids.filter((id) => id !== facility.id),
            feature_ids: on ? data.feature_ids : data.feature_ids.filter((id) => !features.includes(id)),
        }));
    };

    const toggle = (field: 'feature_ids' | 'distance_group_ids', id: string, on: boolean) =>
        form.setData(field, on ? [...form.data[field], id] : form.data[field].filter((other) => other !== id));

    return (
        <div className="flex flex-col gap-4">
            <Head title={drill ? `Edit ${drill.name}` : 'Add a Drill'} />
            <AdminTabs />

            {/* aria: the browser doesn't block the save, so the server's messages show under each field. */}
            <Form
                validationBehavior="aria"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    save();
                }}
            >
                {/* The save action stays in view: a bar above the form that sticks to the top as the admin scrolls. */}
                <div className="sticky top-2 z-20 flex gap-2 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)] md:top-4">
                    <Button type="submit" size="lg" className="flex-1 sm:flex-none" isPending={form.processing}>
                        Save Drill
                    </Button>
                    <Link
                        href={drill ? `/admin/catalogue?item=${drill.id}` : '/admin/catalogue'}
                        className={buttonVariants({ variant: 'tertiary', size: 'lg', className: 'no-underline hover:no-underline' })}
                    >
                        Cancel
                    </Link>
                </div>

                {form.hasErrors && (
                    <Alert status="danger">
                        <Alert.Content>
                            <Alert.Title>The Drill wasn’t saved. Check the fields marked below.</Alert.Title>
                        </Alert.Content>
                    </Alert>
                )}

                <Card>
                    <Card.Content className="flex flex-col gap-5">
                        <TextField isRequired isInvalid={'name' in form.errors} value={form.data.name} onChange={(value) => form.setData('name', value)}>
                            <Label>Name</Label>
                            <Input />
                            <FieldError>{form.errors.name}</FieldError>
                        </TextField>

                        <Section label="SG Category" error={form.errors.sg_category}>
                            <ToggleButtonGroup
                                aria-label="SG Category"
                                selectionMode="single"
                                disallowEmptySelection
                                isDetached
                                className="flex-wrap justify-start"
                                selectedKeys={[form.data.sg_category]}
                                onSelectionChange={(keys) => pickCategory([...keys][0] as SgCategory)}
                            >
                                {SG_CATEGORIES.map(({ category, label }) => (
                                    <ToggleButton key={category} id={category} className={`gap-2 ${SELECTED_SEGMENT}`}>
                                        <SgCategoryBadge category={sgCategoryKey(category)} />
                                        {label}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Section>

                        <TextField isRequired isInvalid={'setup' in form.errors} value={form.data.setup} onChange={(value) => form.setData('setup', value)}>
                            <Label>Setup</Label>
                            <TextArea rows={5} />
                            <FieldError>{form.errors.setup}</FieldError>
                        </TextField>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Facilities and features</Card.Title>
                    </Card.Header>
                    <Card.Content className="flex flex-col gap-4">
                        {form.errors.facility_ids && <p className="text-sm text-danger">{form.errors.facility_ids}</p>}
                        {facilities.map((facility) => {
                            const needed = form.data.facility_ids.includes(facility.id);

                            return (
                                <div key={facility.id} className="flex flex-col gap-2">
                                    <Tick label={facility.name} isSelected={needed} onChange={(on) => toggleFacility(facility, on)} />
                                    {needed && facility.features.length > 0 && (
                                        <div className="ms-7 flex flex-wrap gap-x-5 gap-y-2">
                                            {facility.features.map((feature) => (
                                                <Tick
                                                    key={feature.id}
                                                    label={feature.name}
                                                    isSelected={form.data.feature_ids.includes(feature.id)}
                                                    onChange={(on) => toggle('feature_ids', feature.id, on)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {form.errors.feature_ids && <p className="text-sm text-danger">{form.errors.feature_ids}</p>}

                        {groups.length > 0 && (
                            <Section label="Distance groups" error={form.errors.distance_group_ids}>
                                <div className="flex flex-wrap gap-x-5 gap-y-2">
                                    {groups.map((group) => (
                                        <Tick
                                            key={group.id}
                                            label={group.label}
                                            isSelected={form.data.distance_group_ids.includes(group.id)}
                                            onChange={(on) => toggle('distance_group_ids', group.id, on)}
                                        />
                                    ))}
                                </div>
                            </Section>
                        )}
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Time</Card.Title>
                        <Card.Description>Give the balls, or the estimated minutes when it isn’t counted in balls.</Card.Description>
                    </Card.Header>
                    <Card.Content className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Whole form={form} name="balls" label="Balls" />
                        <Whole form={form} name="estimated_minutes" label="Estimated minutes" />
                        <Whole form={form} name="seconds_per_ball" label="Seconds per ball" description="Blank uses the Facility’s pace." />
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Source</Card.Title>
                    </Card.Header>
                    <Card.Content className="flex flex-col gap-4">
                        <TextField isInvalid={'source_concept' in form.errors} value={form.data.source_concept} onChange={(value) => form.setData('source_concept', value)}>
                            <Label>Concept</Label>
                            <TextArea rows={2} />
                            <FieldError>{form.errors.source_concept}</FieldError>
                        </TextField>
                        <TextField type="url" isInvalid={'source_url' in form.errors} value={form.data.source_url} onChange={(value) => form.setData('source_url', value)}>
                            <Label>Link</Label>
                            <Input />
                            <FieldError>{form.errors.source_url}</FieldError>
                        </TextField>
                    </Card.Content>
                </Card>
            </Form>
        </div>
    );
}

Drill.layout = (props: Props) => ({ title: props.drill ? 'Edit Drill' : 'Add a Drill' }) satisfies ShellProps;

function Section({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <p className="text-sm text-danger">{error}</p>}
        </div>
    );
}

function Tick({ label, isSelected, onChange }: { label: string; isSelected: boolean; onChange: (on: boolean) => void }) {
    return (
        <Checkbox isSelected={isSelected} onChange={onChange}>
            <Checkbox.Content>
                <Checkbox.Control>
                    <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{label}</Label>
            </Checkbox.Content>
        </Checkbox>
    );
}

function Whole(props: {
    form: ReturnType<typeof useForm<DrillForm>>;
    name: 'balls' | 'estimated_minutes' | 'seconds_per_ball';
    label: string;
    description?: string;
}) {
    const { form, name } = props;

    return (
        <NumberField
            minValue={1}
            step={1}
            isInvalid={name in form.errors}
            formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
            value={form.data[name] ?? Number.NaN}
            onChange={(value) => form.setData(name, Number.isNaN(value) ? null : value)}
        >
            <Label>{props.label}</Label>
            <NumberField.Group>
                <NumberField.Input className="tabular-nums" />
            </NumberField.Group>
            {props.description && <p className="text-[13px] text-muted">{props.description}</p>}
            <FieldError>{form.errors[name]}</FieldError>
        </NumberField>
    );
}
