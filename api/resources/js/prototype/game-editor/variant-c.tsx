/**
 * PROTOTYPE ONLY (#25), variant C: Levels first, split by what makes a new version. The five Level
 * rows lead, full width, each with the rules as a golfer reads them at that Level. Below, the form
 * splits in two: what publishes a new version (rules, scoring, ball count, Facilities, features)
 * and what saves in place. A sticky bar on top holds the one action and the first check to fix.
 */
import { Button } from "@heroui/react";
import { useState, type ReactNode } from "react";
import { SgCategoryBadge, sgCategoryKey } from "../../components/sg-category";
import {
    CategoryPicker,
    DistanceGroups,
    FacilityPicker,
    LevelsTable,
    OpenFields,
    Problems,
    ScorePicker,
    Text,
} from "./fields";
import type { EditorModel } from "./model";
import { focusFirstProblem } from "./shared";

function Zone({
    title,
    tone,
    children,
}: {
    title: string;
    tone: "version" | "place";
    children: ReactNode;
}) {
    return (
        <section
            className={`flex flex-col gap-4 rounded-[24px] p-5 ${tone === "version" ? "bg-surface ring-2 ring-warning/60" : "bg-surface"}`}
        >
            <h2 className="text-[16px] font-bold">{title}</h2>
            {children}
        </section>
    );
}

export function VariantC({ model }: { model: EditorModel }) {
    const [done, setDone] = useState<string | null>(null);
    const { game } = model;

    return (
        <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-20 -mt-2 bg-(--background) pt-2 md:-mt-4 md:pt-4">
                <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)]">
                    <Button
                        size="lg"
                        onPress={() =>
                            model.checks.length > 0
                                ? focusFirstProblem()
                                : setDone(
                                      `${model.action.replace(/^(Publish|Save)/, "$1ed")} (prototype: nothing saved).`,
                                  )
                        }
                    >
                        {model.action}
                    </Button>
                    <div className="min-w-0 flex-1 text-[13px]">
                        {model.checks.length === 0 ? (
                            <span className="font-bold text-success">
                                All publish checks pass.
                            </span>
                        ) : (
                            <span className="font-bold text-danger">
                                {model.checks.length} to fix:{" "}
                                {model.checks[0].message}
                                {model.checks.length > 1 ? " …" : ""}
                            </span>
                        )}
                        <span className="block text-muted">
                            {done ?? model.versionNote}
                        </span>
                    </div>
                </div>
            </div>
            <header className="flex flex-wrap items-center gap-3 rounded-[24px] bg-surface p-5">
                <SgCategoryBadge
                    category={sgCategoryKey(game.sg_category)}
                    long
                />
                <input
                    aria-label="Name"
                    aria-invalid={!game.name.trim() || undefined}
                    value={game.name}
                    placeholder="Name the Game"
                    onChange={(event) => model.set("name", event.target.value)}
                    className="min-w-60 flex-1 rounded-[12px] bg-transparent px-2 py-1 text-[24px] font-extrabold outline-none focus:bg-(--field-background) focus:ring-2 focus:ring-highlight"
                />
                <span className="rounded-full bg-surface-secondary px-3 py-1 text-[12px] font-bold">
                    {model.published
                        ? `v${model.published.version} · published ${model.published.publishedOn}`
                        : "New Game"}
                </span>
            </header>

            <section className="flex flex-col gap-3 rounded-[24px] bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[18px] font-bold">Levels</h2>
                    <span className="text-[12px] font-bold text-muted">
                        Saved in place: no new version
                    </span>
                </div>
                <LevelsTable model={model} readsAs />
            </section>

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                <Zone
                    title={
                        model.published
                            ? `Changes here publish v${model.published.version + 1}`
                            : "Locked once published"
                    }
                    tone="version"
                >
                    <Text
                        model={model}
                        name="rules"
                        label="Rules"
                        rows={3}
                        field="rules"
                        hint="Put a Level’s setting in braces, such as {zone}."
                    />
                    <Problems model={model} field="rules" />
                    <Text
                        model={model}
                        name="scoring"
                        label="Scoring"
                        rows={2}
                        field="scoring"
                    />
                    <Problems model={model} field="scoring" />
                    <div className="grid grid-cols-2 gap-3">
                        <Text
                            model={model}
                            name="balls"
                            label="Balls"
                            field="time"
                        />
                        <Text
                            model={model}
                            name="estimated_minutes"
                            label="Or estimated minutes"
                            field="time"
                        />
                    </div>
                    <Problems model={model} field="time" />
                    <FacilityPicker model={model} compact />
                </Zone>
                <Zone title="Saved in place" tone="place">
                    <CategoryPicker model={model} />
                    <ScorePicker model={model} />
                    <DistanceGroups model={model} />
                    <Text
                        model={model}
                        name="seconds_per_ball"
                        label="Seconds per ball"
                        hint="Blank uses the Facility’s pace."
                    />
                    <OpenFields model={model} />
                    <Text
                        model={model}
                        name="source_concept"
                        label="Source concept"
                        rows={2}
                    />
                    <Text model={model} name="source_url" label="Source link" />
                </Zone>
            </div>
            <Problems model={model} field="name" />
        </div>
    );
}
