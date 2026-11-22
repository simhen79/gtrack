/**
 * PROTOTYPE ONLY (#25). A Game version held in memory, its publish checks and which edits make a new
 * version, so the editor variants can be clicked through without the server. Facilities, features
 * and distance groups are the real reference rows. Nothing persists.
 */
import type {
    DistanceGroupData,
    FacilityData,
    SgCategory,
} from "@gtrack/types";
import { useState } from "react";

export type Level = {
    settings: Record<string, string>;
    up: string;
    down: string;
};

export type GameDraft = {
    name: string;
    sg_category: SgCategory;
    facility_ids: string[];
    feature_ids: string[];
    distance_group_ids: string[];
    balls: string;
    estimated_minutes: string;
    seconds_per_ball: string;
    rules: string;
    scoring: string;
    better: "higher" | "lower";
    entry: "counter" | "pad" | "timer";
    pad_values: string;
    open: string[];
    levels: Level[];
    source_concept: string;
    source_url: string;
};

/** The published version being edited, or null for a new Game. */
export type Published = {
    version: number;
    publishedOn: string;
    game: GameDraft;
} | null;

export type Check = { field: Field; message: string };

export type Field =
    | "name"
    | "facilities"
    | "distance_groups"
    | "time"
    | "rules"
    | "scoring"
    | "levels"
    | "pad_values";

/** Changing any of these publishes a new version; everything else saves in place. */
const VERSIONED: { key: keyof GameDraft; label: string }[] = [
    { key: "rules", label: "rules" },
    { key: "scoring", label: "scoring" },
    { key: "balls", label: "ball count" },
    { key: "facility_ids", label: "Facilities" },
    { key: "feature_ids", label: "features" },
];

export const NAMES: Record<SgCategory, string> = {
    off_the_tee: "Off the Tee",
    approach: "Approach",
    short_game: "Short Game",
    putting: "Putting",
};

/** The Facilities each SG Category can be played at, by Facility key. Not in the spec yet: picked in this prototype. */
export const FACILITIES_FOR: Record<SgCategory, string[]> = {
    off_the_tee: ["range_bay"],
    approach: ["range_bay"],
    short_game: ["chipping_area", "practice_bunker", "range_bay"],
    putting: ["putting_green"],
};

/** `{zone}` and the like, in the order the rules first use them. */
export function placeholders(rules: string): string[] {
    return [
        ...new Set(
            [...rules.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]),
        ),
    ];
}

/** The rules as a golfer reads them at a Level, with its settings put in. */
export function rulesAt(game: GameDraft, level: number): string {
    const settings = game.levels[level - 1]?.settings ?? {};
    return game.rules.replace(
        /\{([a-z_]+)\}/g,
        (all, key: string) => settings[key] || all,
    );
}

function emptyLevels(keys: string[]): Level[] {
    return [1, 2, 3, 4, 5].map(() => ({
        settings: Object.fromEntries(keys.map((key) => [key, ""])),
        up: "",
        down: "",
    }));
}

function seed(
    facilities: FacilityData[],
    groups: DistanceGroupData[],
): Published {
    const range = facilities.find((facility) => facility.key === "range_bay");
    const flags = range?.features.find(
        (feature) => feature.key === "target_flags",
    );
    const group = groups.find(
        (g) => g.sg_category === "approach" && /^100/.test(g.label),
    );
    return {
        version: 1,
        publishedOn: "3 March",
        game: {
            name: "Flag Zone 100-150",
            sg_category: "approach",
            facility_ids: range ? [range.id] : [],
            feature_ids: flags ? [flags.id] : [],
            distance_group_ids: group ? [group.id] : [],
            balls: "10",
            estimated_minutes: "",
            seconds_per_ball: "",
            rules: "Pick a flag between 100 and 150 m. Land within {zone} m of it, first bounce.",
            scoring: "1 point per ball that lands inside the zone.",
            better: "higher",
            entry: "counter",
            pad_values: "",
            open: ["target order", "scenario wording"],
            levels: [
                { settings: { zone: "30" }, up: "6", down: "2" },
                { settings: { zone: "25" }, up: "6", down: "2" },
                { settings: { zone: "20" }, up: "6", down: "2" },
                { settings: { zone: "15" }, up: "5", down: "2" },
                { settings: { zone: "10" }, up: "5", down: "1" },
            ],
            source_concept: "Classic flag-zone ladder.",
            source_url: "",
        },
    };
}

const blank = (): GameDraft => ({
    name: "",
    sg_category: "approach",
    facility_ids: [],
    feature_ids: [],
    distance_group_ids: [],
    balls: "",
    estimated_minutes: "",
    seconds_per_ball: "",
    rules: "",
    scoring: "",
    better: "higher",
    entry: "counter",
    pad_values: "",
    open: [],
    levels: [],
    source_concept: "",
    source_url: "",
});

export type EditorModel = ReturnType<typeof useGameEditor>;

export function useGameEditor(
    facilities: FacilityData[],
    distanceGroups: DistanceGroupData[],
    mode: "edit" | "new",
) {
    const [published] = useState<Published>(() =>
        mode === "edit" ? seed(facilities, distanceGroups) : null,
    );
    const [game, setGame] = useState<GameDraft>(() =>
        published ? structuredClone(published.game) : blank(),
    );
    const set = <K extends keyof GameDraft>(key: K, value: GameDraft[K]) =>
        setGame((current) => ({ ...current, [key]: value }));

    const keys = placeholders(game.rules);
    const groups = distanceGroups.filter(
        (group) => group.sg_category === game.sg_category,
    );
    const changes = published
        ? VERSIONED.filter(
              ({ key }) =>
                  JSON.stringify(game[key]) !==
                  JSON.stringify(published.game[key]),
          ).map(({ label }) => label)
        : [];

    const checks: Check[] = [];
    if (!game.name.trim())
        checks.push({ field: "name", message: "Give the Game a name." });
    if (game.facility_ids.length === 0)
        checks.push({
            field: "facilities",
            message: "Pick at least one Facility.",
        });
    if (
        (game.sg_category === "approach" || game.sg_category === "putting") &&
        game.distance_group_ids.length === 0
    ) {
        checks.push({
            field: "distance_groups",
            message: `An ${NAMES[game.sg_category]} Game needs at least one distance group.`,
        });
    }
    if (!game.balls && !game.estimated_minutes)
        checks.push({
            field: "time",
            message: "Give a number of balls or the estimated minutes.",
        });
    if (!game.rules.trim())
        checks.push({ field: "rules", message: "Write the rules." });
    if (!game.scoring.trim())
        checks.push({ field: "scoring", message: "Say how it’s scored." });
    if (game.entry === "pad" && !game.pad_values.trim())
        checks.push({
            field: "pad_values",
            message: "A points pad needs its values, such as 0, 1, 2, 3.",
        });
    if (game.levels.length !== 0 && game.levels.length !== 5)
        checks.push({
            field: "levels",
            message: "A Game has five Levels or none.",
        });
    if (keys.length > 0 && game.levels.length === 0)
        checks.push({
            field: "levels",
            message: `The rules use ${keys.map((k) => `{${k}}`).join(", ")}, so add five Levels to set it.`,
        });
    game.levels.forEach((level, index) => {
        const missing = keys.filter((key) => !level.settings[key]);
        if (missing.length > 0)
            checks.push({
                field: "levels",
                message: `Level ${index + 1} has no ${missing.map((k) => `{${k}}`).join(", ")}.`,
            });
        if (level.up === "" || level.down === "") {
            checks.push({
                field: "levels",
                message: `Level ${index + 1} needs an up and a down target.`,
            });
        } else if (
            game.better === "higher"
                ? Number(level.up) <= Number(level.down)
                : Number(level.up) >= Number(level.down)
        ) {
            checks.push({
                field: "levels",
                message: `Level ${index + 1}: with ${game.better} is better, the up target must be ${game.better === "higher" ? "above" : "below"} the down target.`,
            });
        }
    });

    return {
        /** Only the Facilities the picked SG Category can be played at. */
        facilities: facilities.filter((facility) =>
            FACILITIES_FOR[game.sg_category].includes(facility.key),
        ),
        groups,
        published,
        game,
        keys,
        checks,
        changes,
        /** What pressing the main action does. */
        action: !published
            ? "Publish v1"
            : changes.length > 0
              ? `Publish v${published.version + 1}`
              : `Save v${published.version}`,
        versionNote: !published
            ? "New Game: publishes as v1."
            : changes.length > 0
              ? `Changing the ${changes.join(", ")} publishes v${published.version + 1}, replacing v${published.version} (published ${published.publishedOn}). Earlier scores stay, labelled v${published.version}.`
              : `Level settings, targets and the rest save into v${published.version} in place.`,
        set,
        setSetting: (level: number, key: string, value: string) =>
            setGame((current) => ({
                ...current,
                levels: current.levels.map((l, i) =>
                    i === level
                        ? { ...l, settings: { ...l.settings, [key]: value } }
                        : l,
                ),
            })),
        setTarget: (level: number, which: "up" | "down", value: string) =>
            setGame((current) => ({
                ...current,
                levels: current.levels.map((l, i) =>
                    i === level ? { ...l, [which]: value } : l,
                ),
            })),
        addLevels: () => set("levels", emptyLevels(keys)),
        removeLevels: () => set("levels", []),
        toggleFacility: (facility: FacilityData, on: boolean) =>
            setGame((current) => ({
                ...current,
                facility_ids: on
                    ? [...current.facility_ids, facility.id]
                    : current.facility_ids.filter((id) => id !== facility.id),
                feature_ids: on
                    ? current.feature_ids
                    : current.feature_ids.filter(
                          (id) =>
                              !facility.features.some(
                                  (feature) => feature.id === id,
                              ),
                      ),
            })),
        toggleIn: (
            key: "feature_ids" | "distance_group_ids",
            id: string,
            on: boolean,
        ) =>
            setGame((current) => ({
                ...current,
                [key]: on
                    ? [...current[key], id]
                    : current[key].filter((other) => other !== id),
            })),
        pickCategory: (category: SgCategory) =>
            setGame((current) => {
                // Facilities the new category can't use go, and their features with them.
                const kept = facilities.filter(
                    (f) =>
                        current.facility_ids.includes(f.id) &&
                        FACILITIES_FOR[category].includes(f.key),
                );
                return {
                    ...current,
                    sg_category: category,
                    facility_ids: kept.map((f) => f.id),
                    feature_ids: current.feature_ids.filter((id) =>
                        kept.some((f) =>
                            f.features.some((feature) => feature.id === id),
                        ),
                    ),
                    distance_group_ids: current.distance_group_ids.filter(
                        (id) =>
                            distanceGroups.some(
                                (g) =>
                                    g.id === id && g.sg_category === category,
                            ),
                    ),
                };
            }),
        checksFor: (field: Field) =>
            checks.filter((check) => check.field === field),
    };
}
