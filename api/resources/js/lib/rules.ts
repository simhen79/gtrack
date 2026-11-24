import type { GameLevelData } from '@gtrack/types';

/** A `{placeholder}` in a Game's rules, as the server reads it: a name that starts with a letter. */
const PLACEHOLDER = /\{([A-Za-z]\w*)\}/g;

/** `zone` for `{zone}` and the like, in the order the rules first use them. */
export function placeholders(rules: string): string[] {
    return [...new Set([...rules.matchAll(PLACEHOLDER)].map((match) => match[1]))];
}

/** The rules as a golfer reads them with a Level's settings put in. A setting left blank stays a placeholder. */
export function rulesAt(rules: string, settings: Record<string, string>): string {
    return rules.replace(PLACEHOLDER, (all, key: string) => settings[key]?.trim() || all);
}

/** Level 3, which the targets are set for: the Level an admin reads a Game at, if it has Levels. */
export function calibrationLevel(levels: GameLevelData[]): GameLevelData | undefined {
    return levels.find((level) => level.level === 3);
}
