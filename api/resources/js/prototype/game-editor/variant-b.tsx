/**
 * PROTOTYPE ONLY (#25), variant B: tabs and a live preview. The editor sits in tabs on the left, one
 * part at a time, each tab marked when it has a problem. On the right, sticky: the Game as a golfer
 * reads it at a chosen Level, then every publish check ticked or crossed, and the one action.
 */
import { Button } from "@heroui/react";
import { useState } from "react";
import { SgCategoryBadge, sgCategoryKey } from "../../components/sg-category";
import { useMediaQuery } from "../../lib/media";
import {
    CategoryPicker,
    DistanceGroups,
    FacilityPicker,
    LevelsTable,
    OpenFields,
    Problems,
    ScorePicker,
    Text,
    TimeFields,
} from "./fields";
import { NAMES, rulesAt, type EditorModel, type Field } from "./model";

const TABS: { key: string; label: string; fields: Field[] }[] = [
    { key: "game", label: "Game", fields: ["name", "pad_values"] },
    {
        key: "where",
        label: "Where and time",
        fields: ["facilities", "distance_groups", "time"],
    },
    { key: "rules", label: "Rules", fields: ["rules", "scoring"] },
    { key: "levels", label: "Levels", fields: ["levels"] },
    { key: "more", label: "Variations and source", fields: [] },
];

const ALL_CHECKS = [
    "Name",
    "Facilities",
    "Distance groups",
    "Balls or minutes",
    "Rules",
    "Scoring",
    "Five Levels or none",
    "Every Level sets each placeholder",
    "Targets run the right way",
];

export function VariantB({ model }: { model: EditorModel }) {
    const wide = useMediaQuery("(min-width: 64rem)");
    const [tab, setTab] = useState("game");
    const [level, setLevel] = useState(3);
    const [done, setDone] = useState<string | null>(null);
    const { game } = model;
    const hasLevels = game.levels.length === 5;
    const target = hasLevels ? game.levels[level - 1] : null;

    const editor = (
        <div className="flex flex-col gap-4 rounded-[24px] bg-surface p-5">
            <div
                role="tablist"
                className="flex flex-wrap gap-1 rounded-full bg-surface-secondary p-1"
            >
                {TABS.map((t) => {
                    const problems = t.fields.some(
                        (field) => model.checksFor(field).length > 0,
                    );
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold ${tab === t.key ? "bg-segment text-segment-foreground" : "text-muted"}`}
                        >
                            {t.label}
                            {problems && (
                                <span
                                    className="size-2 rounded-full bg-danger"
                                    aria-label="has a problem"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            {tab === "game" && (
                <div className="flex flex-col gap-4">
                    <Text model={model} name="name" label="Name" field="name" />
                    <Problems model={model} field="name" />
                    <CategoryPicker model={model} />
                    <ScorePicker model={model} />
                </div>
            )}
            {tab === "where" && (
                <div className="flex flex-col gap-5">
                    <p className="text-[12px] font-bold text-muted">
                        Facilities, features and the ball count publish a new
                        version when changed.
                    </p>
                    <FacilityPicker model={model} />
                    <DistanceGroups model={model} />
                    <TimeFields model={model} />
                </div>
            )}
            {tab === "rules" && (
                <div className="flex flex-col gap-4">
                    <p className="text-[12px] font-bold text-muted">
                        Changing the rules or scoring publishes a new version.
                    </p>
                    <Text
                        model={model}
                        name="rules"
                        label="Rules"
                        rows={4}
                        field="rules"
                        hint="Put a Level’s setting in braces, such as {zone}."
                    />
                    <Problems model={model} field="rules" />
                    <Text
                        model={model}
                        name="scoring"
                        label="Scoring"
                        rows={3}
                        field="scoring"
                    />
                    <Problems model={model} field="scoring" />
                </div>
            )}
            {tab === "levels" && <LevelsTable model={model} />}
            {tab === "more" && (
                <div className="flex flex-col gap-4">
                    <OpenFields model={model} />
                    <Text
                        model={model}
                        name="source_concept"
                        label="Source concept"
                        rows={2}
                    />
                    <Text model={model} name="source_url" label="Source link" />
                </div>
            )}
        </div>
    );

    const failing = new Set(model.checks.map((check) => check.field));
    const checkState = (name: string) => {
        const map: Record<string, boolean> = {
            Name: !failing.has("name"),
            Facilities: !failing.has("facilities"),
            "Distance groups": !failing.has("distance_groups"),
            "Balls or minutes": !failing.has("time"),
            Rules: !failing.has("rules"),
            Scoring: !failing.has("scoring"),
            "Five Levels or none": !model.checks.some((c) =>
                /five Levels or none|add five Levels/.test(c.message),
            ),
            "Every Level sets each placeholder": !model.checks.some((c) =>
                /has no \{/.test(c.message),
            ),
            "Targets run the right way": !model.checks.some((c) =>
                /target/.test(c.message),
            ),
        };
        return map[name];
    };

    const preview = (
        <aside className="flex flex-col gap-4 rounded-[24px] bg-surface p-5 lg:sticky lg:top-4">
            <div className="flex items-center gap-2">
                <SgCategoryBadge
                    category={sgCategoryKey(game.sg_category)}
                    long
                />
                <span className="text-[12px] font-bold text-muted">
                    {model.published ? `v${model.published.version}` : "New"}
                </span>
            </div>
            <h2 className="text-[22px] font-extrabold">
                {game.name || "Untitled Game"}
            </h2>
            {hasLevels && (
                <div
                    className="flex items-center gap-1"
                    role="radiogroup"
                    aria-label="Preview at Level"
                >
                    <span className="me-2 text-[12px] font-bold text-muted">
                        As played at Level
                    </span>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={level === n}
                            onClick={() => setLevel(n)}
                            className={`size-8 rounded-full text-[13px] font-bold ${level === n ? "bg-highlight text-highlight-foreground" : "bg-surface-secondary"}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            )}
            <div className="rounded-[16px] bg-surface-secondary p-4">
                <p className="text-[12px] font-bold text-muted">Rules</p>
                <p className="text-[15px]">
                    {(hasLevels ? rulesAt(game, level) : game.rules) || "—"}
                </p>
                <p className="mt-3 text-[12px] font-bold text-muted">Scoring</p>
                <p className="text-[15px]">{game.scoring || "—"}</p>
                {target && (
                    <p className="mt-3 text-[13px]">
                        Moves up after two scores{" "}
                        {game.better === "higher" ? "of" : "of"}{" "}
                        <b>{target.up || "?"}</b>{" "}
                        {game.better === "higher" ? "or more" : "or less"}, down
                        after two of <b>{target.down || "?"}</b>{" "}
                        {game.better === "higher" ? "or less" : "or more"}.
                    </p>
                )}
                <p className="mt-3 text-[12px] text-muted">
                    {NAMES[game.sg_category]} ·{" "}
                    {game.balls
                        ? `${game.balls} balls`
                        : game.estimated_minutes
                          ? `${game.estimated_minutes} min`
                          : "no time yet"}
                </p>
            </div>
            <ul className="flex flex-col gap-1 text-[13px]">
                {ALL_CHECKS.map((name) => (
                    <li
                        key={name}
                        className={`flex items-center gap-2 ${checkState(name) ? "text-muted" : "font-bold text-danger"}`}
                    >
                        <span aria-hidden>{checkState(name) ? "✓" : "✕"}</span>
                        {name}
                    </li>
                ))}
            </ul>
            <p className="text-[13px] text-muted">{model.versionNote}</p>
            <Button
                size="lg"
                className="w-full"
                isDisabled={model.checks.length > 0}
                onPress={() =>
                    setDone(
                        `${model.action.replace(/^(Publish|Save)/, "$1ed")} (prototype: nothing saved).`,
                    )
                }
            >
                {model.checks.length > 0
                    ? `${model.checks.length} to fix before publishing`
                    : model.action}
            </Button>
            {done && <p className="text-[14px] font-bold">{done}</p>}
        </aside>
    );

    return wide ? (
        <div className="grid grid-cols-[1fr_400px] items-start gap-4">
            {editor}
            {preview}
        </div>
    ) : (
        <div className="flex flex-col gap-4">
            {editor}
            {preview}
        </div>
    );
}
