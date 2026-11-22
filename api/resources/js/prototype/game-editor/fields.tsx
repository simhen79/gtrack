/** PROTOTYPE ONLY (#25). The editor's controls, shared by the variants; each variant owns its layout. */
import type { SgCategory } from "@gtrack/types";
import {
    Button,
    Checkbox,
    Input,
    Label,
    TextArea,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@heroui/react";
import { useState, type ReactNode } from "react";
import { SgCategoryBadge, sgCategoryKey } from "../../components/sg-category";
import {
    NAMES,
    rulesAt,
    type EditorModel,
    type Field,
    type GameDraft,
} from "./model";

const SELECTED =
    "data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground";
const LIT =
    "data-[selected=true]:bg-highlight data-[selected=true]:text-highlight-foreground";

export function Problems({
    model,
    field,
}: {
    model: EditorModel;
    field: Field;
}) {
    const list = model.checksFor(field);
    return list.length === 0 ? null : (
        <div className="flex flex-col gap-0.5" data-has-error>
            {list.map((check) => (
                <p key={check.message} className="text-sm text-danger">
                    {check.message}
                </p>
            ))}
        </div>
    );
}

export function Text({
    model,
    name,
    label,
    rows,
    field,
    hint,
}: {
    model: EditorModel;
    name: keyof GameDraft;
    label: string;
    rows?: number;
    field?: Field;
    hint?: ReactNode;
}) {
    return (
        <TextField
            value={String(model.game[name])}
            onChange={(value) => model.set(name, value as never)}
            isInvalid={field ? model.checksFor(field).length > 0 : false}
        >
            <Label>{label}</Label>
            {rows ? <TextArea rows={rows} /> : <Input />}
            {hint && <p className="text-[13px] text-muted">{hint}</p>}
        </TextField>
    );
}

export function Tick({
    label,
    isSelected,
    onChange,
}: {
    label: string;
    isSelected: boolean;
    onChange: (on: boolean) => void;
}) {
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

export function CategoryPicker({ model }: { model: EditorModel }) {
    // A published Game's SG Category is locked: a different category is a different Game.
    if (model.published) {
        return (
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">SG Category</span>
                <span className="flex items-center gap-2 text-[14px]">
                    <SgCategoryBadge
                        category={sgCategoryKey(model.game.sg_category)}
                    />
                    {NAMES[model.game.sg_category]}
                </span>
                <span className="text-[12px] text-muted">
                    Fixed once published. For another SG Category, write a new
                    Game.
                </span>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">SG Category</span>
            <ToggleButtonGroup
                aria-label="SG Category"
                selectionMode="single"
                disallowEmptySelection
                isDetached
                className="flex-wrap justify-start"
                selectedKeys={[model.game.sg_category]}
                onSelectionChange={(keys) =>
                    model.pickCategory([...keys][0] as SgCategory)
                }
            >
                {(Object.keys(NAMES) as SgCategory[]).map((category) => (
                    <ToggleButton
                        key={category}
                        id={category}
                        className={`gap-2 ${SELECTED}`}
                    >
                        <SgCategoryBadge category={sgCategoryKey(category)} />
                        {NAMES[category]}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </div>
    );
}

export function ScorePicker({ model }: { model: EditorModel }) {
    const pick = (
        label: string,
        value: string,
        options: [string, string][],
        onChange: (v: string) => void,
    ) => (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{label}</span>
            <ToggleButtonGroup
                aria-label={label}
                selectionMode="single"
                disallowEmptySelection
                className="w-max rounded-full bg-surface-secondary p-1"
                selectedKeys={[value]}
                onSelectionChange={(keys) => onChange(String([...keys][0]))}
            >
                {options.map(([id, text]) => (
                    <ToggleButton key={id} id={id} className={SELECTED}>
                        {text}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </div>
    );
    return (
        <div className="flex flex-wrap items-start gap-6">
            {pick(
                "Better score",
                model.game.better,
                [
                    ["higher", "Higher"],
                    ["lower", "Lower"],
                ],
                (v) => model.set("better", v as GameDraft["better"]),
            )}
            {pick(
                "Entered with",
                model.game.entry,
                [
                    ["counter", "Counter"],
                    ["pad", "Points pad"],
                    ["timer", "Timer"],
                ],
                (v) => model.set("entry", v as GameDraft["entry"]),
            )}
            {model.game.entry === "pad" && (
                <div className="w-56">
                    <Text
                        model={model}
                        name="pad_values"
                        label="Pad values"
                        field="pad_values"
                        hint="Comma-separated, such as 0, 1, 2, 3."
                    />
                    <Problems model={model} field="pad_values" />
                </div>
            )}
        </div>
    );
}

export function FacilityPicker({
    model,
    compact = false,
}: {
    model: EditorModel;
    compact?: boolean;
}) {
    return (
        <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
            {model.facilities.map((facility) => {
                const has = model.game.facility_ids.includes(facility.id);
                return (
                    <div key={facility.id} className="flex flex-col gap-2">
                        <Tick
                            label={facility.name}
                            isSelected={has}
                            onChange={(on) =>
                                model.toggleFacility(facility, on)
                            }
                        />
                        {has && facility.features.length > 0 && (
                            <div className="ms-7 flex flex-wrap gap-2">
                                {facility.features.map((feature) => (
                                    <ToggleButton
                                        key={feature.id}
                                        size="sm"
                                        className={`rounded-full ${LIT}`}
                                        isSelected={model.game.feature_ids.includes(
                                            feature.id,
                                        )}
                                        onChange={(on) =>
                                            model.toggleIn(
                                                "feature_ids",
                                                feature.id,
                                                on,
                                            )
                                        }
                                    >
                                        {feature.name}
                                    </ToggleButton>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            <Problems model={model} field="facilities" />
        </div>
    );
}

export function DistanceGroups({ model }: { model: EditorModel }) {
    if (model.groups.length === 0)
        return (
            <p className="text-[13px] text-muted">
                {NAMES[model.game.sg_category]} Games have no distance groups.
            </p>
        );
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Distance groups</span>
            <div className="flex flex-wrap gap-2">
                {model.groups.map((group) => (
                    <ToggleButton
                        key={group.id}
                        size="sm"
                        className={`rounded-full ${LIT}`}
                        isSelected={model.game.distance_group_ids.includes(
                            group.id,
                        )}
                        onChange={(on) =>
                            model.toggleIn("distance_group_ids", group.id, on)
                        }
                    >
                        {group.label}
                    </ToggleButton>
                ))}
            </div>
            <Problems model={model} field="distance_groups" />
        </div>
    );
}

export function TimeFields({ model }: { model: EditorModel }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Text model={model} name="balls" label="Balls" field="time" />
                <Text
                    model={model}
                    name="estimated_minutes"
                    label="Estimated minutes"
                    field="time"
                />
                <Text
                    model={model}
                    name="seconds_per_ball"
                    label="Seconds per ball"
                    hint="Blank uses the Facility’s pace."
                />
            </div>
            <Problems model={model} field="time" />
        </div>
    );
}

export function OpenFields({ model }: { model: EditorModel }) {
    const [draft, setDraft] = useState("");
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Open fields</span>
            <span className="text-[13px] text-muted">
                What a Variation may reword. None means the Game has no
                Variations.
            </span>
            <div className="flex flex-wrap items-center gap-2">
                {model.game.open.map((item) => (
                    <span
                        key={item}
                        className="flex items-center gap-1 rounded-full bg-surface-secondary py-1 ps-3 pe-1 text-[13px] font-medium"
                    >
                        {item}
                        <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="rounded-full px-1.5 text-muted hover:text-foreground"
                            onClick={() =>
                                model.set(
                                    "open",
                                    model.game.open.filter((o) => o !== item),
                                )
                            }
                        >
                            ×
                        </button>
                    </span>
                ))}
                <form
                    className="flex items-center gap-1"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (draft.trim())
                            model.set("open", [
                                ...model.game.open,
                                draft.trim(),
                            ]);
                        setDraft("");
                    }}
                >
                    <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Add, such as target order"
                        className="w-48 rounded-full border border-(--field-border) bg-(--field-background) px-3 py-1 text-[13px]"
                    />
                </form>
            </div>
        </div>
    );
}

/** The five Level rows: a column per rules placeholder, then up and down. `readsAs` adds the rules as read. */
export function LevelsTable({
    model,
    readsAs = false,
}: {
    model: EditorModel;
    readsAs?: boolean;
}) {
    const { game, keys } = model;
    if (game.levels.length === 0) {
        return (
            <div className="flex flex-col items-start gap-2">
                <p className="text-[13px] text-muted">
                    No Levels: the Game plays the same every time and moves no
                    Level.
                </p>
                <Button variant="secondary" size="sm" onPress={model.addLevels}>
                    Add five Levels
                </Button>
                <Problems model={model} field="levels" />
            </div>
        );
    }
    const cell =
        "w-full min-w-14 rounded-[10px] border border-(--field-border) bg-(--field-background) px-2 py-1.5 text-right tabular-nums";
    return (
        <div className="flex flex-col gap-2">
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-x-2 border-spacing-y-1.5 text-[14px]">
                    <thead>
                        <tr className="text-left text-[12px] font-bold text-muted">
                            <th className="w-16">Level</th>
                            {keys.map((key) => (
                                <th key={key}>{`{${key}}`}</th>
                            ))}
                            <th className="w-24">Up at</th>
                            <th className="w-24">Down at</th>
                            {readsAs && (
                                <th className="hidden md:table-cell">
                                    Reads as
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {game.levels.map((level, index) => (
                            <tr key={index}>
                                <td className="font-bold">{index + 1}</td>
                                {keys.map((key) => (
                                    <td key={key}>
                                        <input
                                            aria-label={`Level ${index + 1} ${key}`}
                                            aria-invalid={
                                                !level.settings[key] ||
                                                undefined
                                            }
                                            value={level.settings[key] ?? ""}
                                            onChange={(event) =>
                                                model.setSetting(
                                                    index,
                                                    key,
                                                    event.target.value,
                                                )
                                            }
                                            className={`${cell} ${!level.settings[key] ? "border-danger" : ""}`}
                                        />
                                    </td>
                                ))}
                                {(["up", "down"] as const).map((which) => (
                                    <td key={which}>
                                        <input
                                            aria-label={`Level ${index + 1} ${which} target`}
                                            value={level[which]}
                                            onChange={(event) =>
                                                model.setTarget(
                                                    index,
                                                    which,
                                                    event.target.value,
                                                )
                                            }
                                            className={cell}
                                        />
                                    </td>
                                ))}
                                {readsAs && (
                                    <td className="hidden text-[13px] text-muted md:table-cell">
                                        {rulesAt(game, index + 1)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {keys.length === 0 && (
                <p className="text-[13px] text-muted">
                    The rules use no {"{placeholder}"}, so the Levels differ
                    only by their targets.
                </p>
            )}
            <Problems model={model} field="levels" />
            <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onPress={model.removeLevels}
            >
                Remove Levels
            </Button>
        </div>
    );
}

/** The Handicap Index bands that set a starting Level; their own small admin page, the same in every variant. */
export function StartingLevels() {
    const [bands, setBands] = useState([
        { from: "below 0.0", level: "5" },
        { from: "0.0–2.9", level: "4" },
        { from: "3.0–9.9", level: "3" },
        { from: "10.0–19.9", level: "2" },
        { from: "20.0 and above", level: "1" },
    ]);
    return (
        <section className="flex flex-col gap-3 rounded-[24px] border-2 border-dashed border-(--field-border) p-5">
            <div>
                <h2 className="text-[18px] font-bold">Starting Levels</h2>
                <p className="text-[13px] text-muted">
                    A golfer who has never played a Game starts at the Level for
                    their Handicap Index. Its own small page; the same in every
                    variant.
                </p>
            </div>
            <table className="w-max text-[14px]">
                <thead>
                    <tr className="text-left text-[12px] font-bold text-muted">
                        <th className="pe-6">Handicap Index</th>
                        <th>Starting Level</th>
                    </tr>
                </thead>
                <tbody>
                    {bands.map((band, index) => (
                        <tr key={band.from}>
                            <td className="pe-6 py-1">{band.from}</td>
                            <td>
                                <input
                                    aria-label={`Starting Level for ${band.from}`}
                                    value={band.level}
                                    onChange={(event) =>
                                        setBands((all) =>
                                            all.map((b, i) =>
                                                i === index
                                                    ? {
                                                          ...b,
                                                          level: event.target
                                                              .value,
                                                      }
                                                    : b,
                                            ),
                                        )
                                    }
                                    className="w-16 rounded-[10px] border border-(--field-border) bg-(--field-background) px-2 py-1 text-right tabular-nums"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
