/**
 * PROTOTYPE ONLY (#25), variant A: one long form, like the Drill editor. A sticky bar holds the one
 * action (Publish v2, or Save v1 when only in-place fields changed), the version note and how many
 * checks still fail. Each card shows its own problems under its fields; no summary banner.
 */
import { Button, Chip } from "@heroui/react";
import { useState, type ReactNode } from "react";
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
import type { EditorModel } from "./model";
import { focusFirstProblem } from "./shared";

function Card({
    title,
    note,
    children,
    versioned = false,
}: {
    title: string;
    note?: string;
    children: ReactNode;
    versioned?: boolean;
}) {
    return (
        <section className="flex flex-col gap-4 rounded-[24px] bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[18px] font-bold">{title}</h2>
                {versioned && (
                    <span className="text-[12px] font-bold text-muted">
                        Changing this publishes a new version
                    </span>
                )}
            </div>
            {note && <p className="-mt-2 text-[13px] text-muted">{note}</p>}
            {children}
        </section>
    );
}

export function VariantA({ model }: { model: EditorModel }) {
    const [done, setDone] = useState<string | null>(null);
    const publish = () =>
        model.checks.length > 0
            ? focusFirstProblem()
            : setDone(
                  `${model.action.replace(/^(Publish|Save)/, "$1ed")} (prototype: nothing saved).`,
              );

    return (
        <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-20 -mt-2 bg-(--background) pt-2 md:-mt-4 md:pt-4">
                <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)]">
                    <Button size="lg" onPress={publish}>
                        {model.action}
                    </Button>
                    <Button size="lg" variant="tertiary">
                        Cancel
                    </Button>
                    <p className="min-w-0 flex-1 text-[13px] text-muted">
                        {model.versionNote}
                    </p>
                    {model.checks.length > 0 ? (
                        <Chip
                            color="danger"
                            size="sm"
                        >{`${model.checks.length} to fix before publishing`}</Chip>
                    ) : (
                        <Chip color="success" size="sm">
                            Ready to publish
                        </Chip>
                    )}
                </div>
            </div>
            {done && (
                <p className="rounded-[16px] bg-surface-secondary p-3 text-[14px] font-bold">
                    {done}
                </p>
            )}

            <Card title="Game">
                <Text model={model} name="name" label="Name" field="name" />
                <Problems model={model} field="name" />
                <CategoryPicker model={model} />
                <ScorePicker model={model} />
            </Card>

            <Card title="Facilities and features" versioned>
                <FacilityPicker model={model} />
                <DistanceGroups model={model} />
            </Card>

            <Card
                title="Time"
                note="Give the balls, or the estimated minutes when it isn’t counted in balls. Changing the ball count publishes a new version."
            >
                <TimeFields model={model} />
            </Card>

            <Card title="Rules and scoring" versioned>
                <Text
                    model={model}
                    name="rules"
                    label="Rules"
                    rows={3}
                    field="rules"
                    hint={`Put a Level’s setting in braces, such as {zone}. ${model.keys.length ? `Uses ${model.keys.map((k) => `{${k}}`).join(", ")}.` : ""}`}
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
            </Card>

            <Card
                title="Levels"
                note="Five Levels or none. Settings and targets save in place, without a new version."
            >
                <LevelsTable model={model} />
            </Card>

            <Card title="Variations">
                <OpenFields model={model} />
            </Card>

            <Card title="Source">
                <Text
                    model={model}
                    name="source_concept"
                    label="Concept"
                    rows={2}
                />
                <Text model={model} name="source_url" label="Link" />
            </Card>
        </div>
    );
}
