import { Archive, ArrowRotateLeft, Check, Pencil } from '@gravity-ui/icons';
import type { FacilityData, PracticeGroundData } from '@gtrack/types';
import { Alert, Button, FieldError, Form, Input, Label, Sheet, TextArea, TextField, ToggleButton } from '@heroui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog, ConfirmName } from '../../components/confirm-dialog';
import type { ShellProps } from '../../layouts/app-shell';
import { useMediaQuery } from '../../lib/media';

type Props = {
    practice_grounds: PracticeGroundData[];
    archived: PracticeGroundData[];
    facilities: FacilityData[];
    /** The editor is open on a new Practice Ground. */
    adding: boolean;
    /** The Practice Ground open in the editor. */
    editing: PracticeGroundData | null;
};

type GroundForm = { name: string; note: string; facility_ids: string[]; feature_ids: string[] };

const INDEX = '/practice-grounds';

/** Moving between the list and its editor keeps the page as it was, such as the archived ones shown. */
const STAY = { preserveScroll: true, preserveState: true } as const;

/** The Facilities' short names, for a card's strip and feature rows. */
const SHORT: Record<string, string> = { range_bay: 'Range', chipping_area: 'Chipping', putting_green: 'Putting', practice_bunker: 'Bunker' };

/** Selected but not an action: `highlight` lime, per the design-system README's second principle. */
const LIT = 'bg-highlight text-highlight-foreground';
const SELECTED_HIGHLIGHT = 'data-[selected=true]:bg-highlight data-[selected=true]:text-highlight-foreground';

const CARDS = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4';

const open = (ground: PracticeGroundData) => router.get(`${INDEX}/${ground.id}/edit`, {}, STAY);
const close = () => router.get(INDEX, {}, STAY);
const archive = (ground: PracticeGroundData, visit?: { onStart: () => void; onFinish: () => void }) =>
    router.post(`${INDEX}/${ground.id}/archive`, {}, { preserveScroll: true, ...visit });
const restore = (ground: PracticeGroundData) => router.post(`${INDEX}/${ground.id}/restore`, {}, { preserveScroll: true });

/** A card per Practice Ground, with the archived ones behind a toggle. Adding or editing opens the editor in a Sheet. */
export default function PracticeGrounds({ practice_grounds, archived, facilities, adding, editing }: Props) {
    const [showArchived, setShowArchived] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <Head title="Practice Grounds" />

            {practice_grounds.length > 0 ? (
                <div className={CARDS}>
                    {practice_grounds.map((ground) => (
                        <GroundCard key={ground.id} ground={ground} facilities={facilities} />
                    ))}
                </div>
            ) : (
                <p className="rounded-[24px] bg-surface p-5 text-muted">
                    No Practice Grounds yet. Add the places you practise, with the Facilities each has, so Practice Sessions only include what you can play there.
                </p>
            )}

            {archived.length > 0 && (
                <div className="flex flex-col gap-3">
                    <button type="button" className="self-start text-[13px] font-bold text-muted underline" onClick={() => setShowArchived((shown) => !shown)}>
                        {showArchived ? 'Hide' : 'Show'} {archived.length} archived
                    </button>
                    {showArchived && (
                        <div className={CARDS}>
                            {archived.map((ground) => (
                                <GroundCard key={ground.id} ground={ground} facilities={facilities} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <EditorSheet ground={editing} isOpen={adding || editing !== null} facilities={facilities} />
        </div>
    );
}

/**
 * Asks first, in the shared confirm dialog: from a card's header as an icon, or full width in the
 * editor. Either way the server returns to the list, which closes the editor.
 */
function ArchiveGround({ ground, icon = false }: { ground: PracticeGroundData; icon?: boolean }) {
    return (
        <ConfirmDialog
            trigger={icon ? `Archive ${ground.name}` : 'Archive Practice Ground'}
            triggerIcon={icon ? <Archive className="size-4" /> : undefined}
            className={icon ? undefined : 'w-full'}
            heading="Archive this Practice Ground?"
            keep="Keep Practice Ground"
            confirm="Archive Practice Ground"
            onConfirm={(visit) => archive(ground, visit)}
        >
            <ConfirmName>{ground.name}</ConfirmName> leaves your list and can’t be picked for new Practice Sessions. Practice Sessions you’ve already played there
            keep it. You can restore it from the archived ones.
        </ConfirmDialog>
    );
}

/**
 * A div, not a button: Edit and Archive are buttons of their own in its header. The rest of
 * the card is a separate button that also opens the editor.
 */
function GroundCard({ ground, facilities }: { ground: PracticeGroundData; facilities: FacilityData[] }) {
    const archivedOn = ground.archived_at ? new Date(ground.archived_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

    return (
        <div className={`flex flex-col gap-3 rounded-[24px] bg-surface p-5 transition hover:ring-2 hover:ring-highlight ${archivedOn ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[18px] font-extrabold">{ground.name}</span>
                    {archivedOn && <span className="text-[12px] font-bold text-muted">Archived {archivedOn}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                    <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${ground.name}`} onPress={() => open(ground)}>
                        <Pencil className="size-4" />
                    </Button>
                    {archivedOn ? (
                        <Button isIconOnly size="sm" variant="ghost" aria-label={`Restore ${ground.name}`} onPress={() => restore(ground)}>
                            <ArrowRotateLeft className="size-4" />
                        </Button>
                    ) : (
                        <ArchiveGround ground={ground} icon />
                    )}
                </span>
            </div>
            <button type="button" onClick={() => open(ground)} className="flex flex-col gap-3 text-left" aria-label={`Open ${ground.name}`}>
                <FacilityStrip ground={ground} facilities={facilities} />
                <FeatureRows ground={ground} facilities={facilities} />
                {ground.note && <span className="line-clamp-2 text-[13px] text-muted">{ground.note}</span>}
            </button>
        </div>
    );
}

/** All four Facilities: lit when the ground has one, struck through and dimmed when it doesn't. */
function FacilityStrip({ ground, facilities }: { ground: PracticeGroundData; facilities: FacilityData[] }) {
    return (
        <div className="grid grid-cols-4 gap-1.5">
            {facilities.map((facility) => {
                const has = ground.facility_ids.includes(facility.id);
                return (
                    <div
                        key={facility.id}
                        className={`rounded-[12px] px-2 py-2 text-center text-[12px] font-bold ${has ? LIT : 'bg-surface-secondary text-muted line-through opacity-60'}`}
                    >
                        <span className="sr-only">{has ? 'Has ' : 'No '}</span>
                        {SHORT[facility.key] ?? facility.name}
                    </div>
                );
            })}
        </div>
    );
}

/** Each Facility's ticked features on a row of their own, divided from the next. */
function FeatureRows({ ground, facilities }: { ground: PracticeGroundData; facilities: FacilityData[] }) {
    const rows = facilities
        .map((facility) => ({ facility, features: facility.features.filter((feature) => ground.feature_ids.includes(feature.id)) }))
        .filter(({ features }) => features.length > 0);

    if (rows.length === 0) return null;

    return (
        <div className="flex flex-col divide-y divide-(--field-border) rounded-[14px] bg-surface-secondary">
            {rows.map(({ facility, features }) => (
                <div key={facility.id} className="flex items-baseline gap-3 px-3 py-2">
                    <span className="w-16 shrink-0 text-[12px] font-bold text-muted">{SHORT[facility.key] ?? facility.name}</span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-medium">
                        {features.map((feature) => (
                            <span key={feature.id}>{feature.name}</span>
                        ))}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** From the right at tablet width and up, as Round entry's advanced stats are; from the bottom on a phone. */
function EditorSheet({ ground, isOpen, facilities }: { ground: PracticeGroundData | null; isOpen: boolean; facilities: FacilityData[] }) {
    const right = useMediaQuery('(min-width: 48rem)');

    return (
        <Sheet isOpen={isOpen} onOpenChange={(stillOpen) => !stillOpen && close()} placement={right ? 'right' : 'bottom'}>
            <Sheet.Backdrop variant="transparent">
                <Sheet.Content className={right ? 'w-full max-w-[520px]' : 'max-h-[90vh]'}>
                    {/* Square on the edge it slides in from, so it reads as attached to the screen. */}
                    <Sheet.Dialog aria-label="Practice Ground" className={right ? 'rounded-r-none' : 'rounded-b-none'}>
                        {isOpen && <Editor key={ground?.id ?? 'new'} ground={ground} facilities={facilities} />}
                    </Sheet.Dialog>
                </Sheet.Content>
            </Sheet.Backdrop>
        </Sheet>
    );
}

function Editor({ ground, facilities }: { ground: PracticeGroundData | null; facilities: FacilityData[] }) {
    const form = useForm<GroundForm>({
        name: ground?.name ?? '',
        note: ground?.note ?? '',
        facility_ids: ground?.facility_ids ?? [],
        feature_ids: ground?.feature_ids ?? [],
    });

    const save = () => {
        form.transform((data) => ({ ...data, note: data.note.trim() || null }));
        if (ground) {
            form.put(`${INDEX}/${ground.id}`, { preserveScroll: true });
        } else {
            form.post(INDEX, { preserveScroll: true });
        }
    };

    // Taking a Facility away takes its features with it: a feature only sits on a Facility the ground has.
    const toggleFacility = (facility: FacilityData, on: boolean) => {
        const features = facility.features.map((feature) => feature.id);
        form.setData((data) => ({
            ...data,
            facility_ids: on ? [...data.facility_ids, facility.id] : data.facility_ids.filter((id) => id !== facility.id),
            feature_ids: on ? data.feature_ids : data.feature_ids.filter((id) => !features.includes(id)),
        }));
    };

    const toggleFeature = (id: string, on: boolean) =>
        form.setData('feature_ids', on ? [...form.data.feature_ids, id] : form.data.feature_ids.filter((other) => other !== id));

    const setupError = form.errors.facility_ids ?? form.errors.feature_ids;

    return (
        <Form
            validationBehavior="aria"
            className="contents"
            onSubmit={(event) => {
                event.preventDefault();
                save();
            }}
        >
            <Sheet.Header>
                <Sheet.Heading className="text-[20px] font-extrabold">
                    {ground === null ? 'Add a Practice Ground' : ground.archived_at ? 'Archived Practice Ground' : 'Practice Ground'}
                </Sheet.Heading>
            </Sheet.Header>
            <Sheet.Body className="flex flex-col gap-5 overflow-y-auto">
                {form.hasErrors && (
                    <Alert status="danger">
                        <Alert.Content>
                            <Alert.Title>The Practice Ground wasn’t saved. Check the fields marked below.</Alert.Title>
                        </Alert.Content>
                    </Alert>
                )}

                <TextField isRequired isInvalid={'name' in form.errors} value={form.data.name} onChange={(value) => form.setData('name', value)}>
                    <Label>Name</Label>
                    <Input />
                    <FieldError>{form.errors.name}</FieldError>
                </TextField>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Facilities and features</span>
                    {/* One block per Facility, divided: its toggle row, then its features right under it. */}
                    <div className="flex flex-col divide-y divide-(--field-border) rounded-[16px] bg-surface-secondary">
                        {facilities.map((facility) => {
                            const has = form.data.facility_ids.includes(facility.id);
                            return (
                                <div key={facility.id} className="flex flex-col gap-3 p-3">
                                    <button
                                        type="button"
                                        aria-pressed={has}
                                        onClick={() => toggleFacility(facility, !has)}
                                        className={`flex items-center justify-between rounded-[12px] px-4 py-3 text-left font-bold ${has ? LIT : 'bg-surface text-muted'}`}
                                    >
                                        {facility.name}
                                        {/* A white check in a black circle when the ground has it; an empty circle when it doesn't. */}
                                        {has ? (
                                            <span className="flex size-6 items-center justify-center rounded-full bg-black text-white" aria-hidden>
                                                <Check className="size-3.5" />
                                            </span>
                                        ) : (
                                            <span className="size-6 rounded-full border-2 border-(--field-border)" aria-hidden />
                                        )}
                                    </button>
                                    {has && facility.features.length > 0 && (
                                        <div className="flex flex-wrap gap-2 ps-2" role="group" aria-label={`${facility.name} features`}>
                                            {facility.features.map((feature) => (
                                                <ToggleButton
                                                    key={feature.id}
                                                    size="sm"
                                                    isSelected={form.data.feature_ids.includes(feature.id)}
                                                    onChange={(on) => toggleFeature(feature.id, on)}
                                                    className={`rounded-full ${SELECTED_HIGHLIGHT}`}
                                                >
                                                    {feature.name}
                                                </ToggleButton>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {setupError && <p className="text-sm text-danger">{setupError}</p>}
                </div>

                <TextField isInvalid={'note' in form.errors} value={form.data.note} onChange={(value) => form.setData('note', value)}>
                    <Label>Note (optional)</Label>
                    <TextArea rows={3} />
                    <FieldError>{form.errors.note}</FieldError>
                </TextField>
            </Sheet.Body>
            <Sheet.Footer className="flex flex-col gap-2">
                <Button type="submit" size="lg" className="w-full" isPending={form.processing}>
                    Save Practice Ground
                </Button>
                {ground &&
                    (ground.archived_at ? (
                        <Button variant="secondary" className="w-full" onPress={() => restore(ground)}>
                            Restore Practice Ground
                        </Button>
                    ) : (
                        <ArchiveGround ground={ground} />
                    ))}
            </Sheet.Footer>
        </Form>
    );
}

PracticeGrounds.layout = { title: 'Practice Grounds', action: { label: 'Add a Practice Ground', short: 'Add', href: '/practice-grounds/create' } } satisfies ShellProps;
