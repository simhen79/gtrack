<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Delete my account deletes the user and lets the database cascade to everything
// they own (spec: Data model › Deleting). These read the real migrations from the
// test database's information_schema to keep that true as tables are added.
uses(TestCase::class, RefreshDatabase::class);

// Fail closed: a table with a user_id cascades from users unless it's listed here,
// with the reason and the code that deletes its rows.
$userIdWithoutCascade = [
    'sessions' => 'Laravel\'s table, with no foreign key to users. AccountController::destroy() deletes the golfer\'s sessions before the user.',
];

// Fail closed: a foreign key between two golfer-owned tables cascades unless it's
// listed here, with the reason and where deletion handles it in order. A detail
// table without a user_id counts as golfer-owned through its key to its parent.
$foreignKeysWithoutCascade = [
    'rounds.baseline_id' => 'Restricts, so a Baseline with Rounds can\'t be deleted. AccountController::destroy() deletes the golfer\'s Rounds before the user.',
    'settings.default_baseline_id' => 'Sets null: deleting a Baseline mustn\'t delete the settings. It never holds deletion back, and settings cascade from users.',
];

/** @return Collection<int, object{table: string, column: string, references: string, on_delete: string}> */
function schemaForeignKeys(): Collection
{
    return DB::table('information_schema.key_column_usage as k')
        ->join('information_schema.referential_constraints as r', function ($join) {
            $join->on('r.constraint_schema', '=', 'k.constraint_schema')
                ->on('r.constraint_name', '=', 'k.constraint_name')
                ->on('r.table_name', '=', 'k.table_name');
        })
        ->where('k.table_schema', DB::getDatabaseName())
        ->whereNotNull('k.referenced_table_name')
        ->orderBy('k.table_name')
        ->orderBy('k.column_name')
        ->get(['k.table_name as table', 'k.column_name as column', 'k.referenced_table_name as references', 'r.delete_rule as on_delete']);
}

/**
 * @param  Collection<int, string>  $tablesWithUserId
 * @param  Collection<int, object{table: string, column: string, references: string, on_delete: string}>  $foreignKeys
 * @param  array<string, string>  $listed
 * @return list<string> what's wrong, one message per table
 */
function userIdCascadeFailures(Collection $tablesWithUserId, Collection $foreignKeys, array $listed): array
{
    $cascading = $foreignKeys
        ->filter(fn ($key) => $key->column === 'user_id' && $key->references === 'users' && $key->on_delete === 'CASCADE')
        ->pluck('table');

    $stale = collect(array_keys($listed))
        ->map(fn ($table) => match (true) {
            ! $tablesWithUserId->contains($table) => "{$table} is listed in \$userIdWithoutCascade, but has no user_id: take it off the list.",
            $cascading->contains($table) => "{$table} is listed in \$userIdWithoutCascade, but its user_id cascades from users: take it off the list.",
            default => null,
        });

    return $tablesWithUserId
        ->diff($cascading)
        ->reject(fn ($table) => array_key_exists($table, $listed))
        ->map(fn ($table) => "{$table}.user_id doesn't cascade from users: add cascadeOnDelete() to its foreign key, or list {$table} in \$userIdWithoutCascade with the reason and the code that deletes its rows.")
        ->merge($stale)
        ->filter()
        ->values()
        ->all();
}

/**
 * @param  Collection<int, string>  $tablesWithUserId
 * @param  Collection<int, object{table: string, column: string, references: string, on_delete: string}>  $foreignKeys
 * @param  array<string, string>  $listed
 * @return list<string> what's wrong, one message per foreign key
 */
function golferKeyCascadeFailures(Collection $tablesWithUserId, Collection $foreignKeys, array $listed): array
{
    // A table with a key into golfer-owned rows holds detail rows they own, and so on down.
    $golferOwned = $tablesWithUserId;
    do {
        $before = $golferOwned->count();
        $golferOwned = $golferOwned
            ->merge($foreignKeys->filter(fn ($key) => $golferOwned->contains($key->references))->pluck('table'))
            ->unique();
    } while ($golferOwned->count() > $before);

    $golferKeys = $foreignKeys
        ->filter(fn ($key) => $golferOwned->contains($key->references))
        ->keyBy(fn ($key) => "{$key->table}.{$key->column}");

    $stale = collect(array_keys($listed))
        ->map(fn ($name) => match ($golferKeys->get($name)?->on_delete) {
            null => "{$name} is listed in \$foreignKeysWithoutCascade, but is no foreign key into a golfer-owned table: take it off the list.",
            'CASCADE' => "{$name} is listed in \$foreignKeysWithoutCascade, but cascades: take it off the list.",
            default => null,
        });

    return $golferKeys
        ->reject(fn ($key, $name) => $key->on_delete === 'CASCADE' || array_key_exists($name, $listed))
        ->map(fn ($key, $name) => "{$name} → {$key->references} is ON DELETE {$key->on_delete}: add cascadeOnDelete(), or list {$name} in \$foreignKeysWithoutCascade with the reason and where deletion handles it in order.")
        ->merge($stale)
        ->filter()
        ->values()
        ->all();
}

/** A foreign key as information_schema describes it, for checking the checks. */
function foreignKey(string $table, string $column, string $references, string $onDelete): object
{
    return (object) ['table' => $table, 'column' => $column, 'references' => $references, 'on_delete' => $onDelete];
}

it('cascades every golfer-owned table from users', function () use ($userIdWithoutCascade) {
    expect(userIdCascadeFailures(tablesWithUserId(), schemaForeignKeys(), $userIdWithoutCascade))->toBe([]);
});

it('cascades every foreign key into a golfer-owned table', function () use ($foreignKeysWithoutCascade) {
    expect(golferKeyCascadeFailures(tablesWithUserId(), schemaForeignKeys(), $foreignKeysWithoutCascade))->toBe([]);
});

it('counts a detail table without a user_id as golfer-owned, so its key to its parent cascades', function () {
    $keys = collect([
        foreignKey('rounds', 'user_id', 'users', 'CASCADE'),
        foreignKey('round_holes', 'round_id', 'rounds', 'RESTRICT'),
        foreignKey('round_hole_notes', 'round_hole_id', 'round_holes', 'NO ACTION'),
    ]);

    expect(golferKeyCascadeFailures(collect(['rounds']), $keys, []))->toBe([
        'round_holes.round_id → rounds is ON DELETE RESTRICT: add cascadeOnDelete(), or list round_holes.round_id in $foreignKeysWithoutCascade with the reason and where deletion handles it in order.',
        'round_hole_notes.round_hole_id → round_holes is ON DELETE NO ACTION: add cascadeOnDelete(), or list round_hole_notes.round_hole_id in $foreignKeysWithoutCascade with the reason and where deletion handles it in order.',
    ]);
});

it('fails on a listed table that now cascades or has gone, so the list stays true', function () {
    $keys = collect([foreignKey('rounds', 'user_id', 'users', 'CASCADE')]);

    expect(userIdCascadeFailures(collect(['rounds']), $keys, ['rounds' => 'a reason', 'gone' => 'a reason']))->toBe([
        'rounds is listed in $userIdWithoutCascade, but its user_id cascades from users: take it off the list.',
        'gone is listed in $userIdWithoutCascade, but has no user_id: take it off the list.',
    ]);
});

it('fails on a listed foreign key that now cascades or has gone, so the list stays true', function () {
    $keys = collect([
        foreignKey('rounds', 'user_id', 'users', 'CASCADE'),
        foreignKey('round_stats', 'round_id', 'rounds', 'CASCADE'),
    ]);

    expect(golferKeyCascadeFailures(collect(['rounds']), $keys, ['round_stats.round_id' => 'a reason', 'rounds.gone_id' => 'a reason']))->toBe([
        'round_stats.round_id is listed in $foreignKeysWithoutCascade, but cascades: take it off the list.',
        'rounds.gone_id is listed in $foreignKeysWithoutCascade, but is no foreign key into a golfer-owned table: take it off the list.',
    ]);
});
