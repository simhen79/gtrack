import type { FacilityData, PracticeGroundData, PracticeGroundsData } from '@gtrack/types';
import { BottomSheet, Button, Card, Dialog, FieldError, Input, Label, TextArea, TextField } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from '@/components/icons';
import { Invalid } from '@/lib/api';
import { useSession } from '@/lib/session';
import { fonts } from '@/lib/theme';

/** The Facilities' short names, for a card's strip and feature rows. */
const SHORT: Record<string, string> = { range_bay: 'Range', chipping_area: 'Chipping', putting_green: 'Putting', practice_bunker: 'Bunker' };

type GroundForm = { name: string; note: string; facility_ids: string[]; feature_ids: string[] };

/** Who the editor is open on: a new Practice Ground, one of the golfer's, or nobody. */
type Editing = { ground: PracticeGroundData | null } | null;

/** A card per Practice Ground, as on the web, with the editor in a BottomSheet. */
export default function PracticeGrounds() {
  const { call } = useSession();
  const [data, setData] = useState<PracticeGroundsData | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(() => call<PracticeGroundsData>('/practice-grounds').then(setData), [call]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return null;

  const card = (ground: PracticeGroundData) => (
    <GroundCard key={ground.id} ground={ground} facilities={data.facilities} onOpen={() => setEditing({ ground })} />
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-6">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[34px] text-foreground" style={{ fontFamily: fonts.serif }}>
          Practice Grounds
        </Text>
        <Button size="sm" variant="secondary" onPress={() => setEditing({ ground: null })}>
          <Button.Label>+ Add</Button.Label>
        </Button>
      </View>

      {data.practice_grounds.length > 0 ? (
        data.practice_grounds.map(card)
      ) : (
        <Card>
          <Card.Body>
            <Card.Description>
              No Practice Grounds yet. Add the places you practise, with the Facilities each has, so Practice Sessions only include what you can play there.
            </Card.Description>
          </Card.Body>
        </Card>
      )}

      {data.archived.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => setShowArchived((shown) => !shown)}>
          <Text className="text-[13px] text-muted underline" style={{ fontFamily: fonts.bold }}>
            {showArchived ? 'Hide' : 'Show'} {data.archived.length} archived
          </Text>
        </Pressable>
      )}
      {showArchived && data.archived.map(card)}

      <Editor
        editing={editing}
        facilities={data.facilities}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </ScrollView>
  );
}

function GroundCard({ ground, facilities, onOpen }: { ground: PracticeGroundData; facilities: FacilityData[]; onOpen: () => void }) {
  const rows = facilities
    .map((facility) => ({ facility, features: facility.features.filter((feature) => ground.feature_ids.includes(feature.id)) }))
    .filter(({ features }) => features.length > 0);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${ground.name}`}
      className={`gap-3 rounded-[24px] bg-surface p-5 ${ground.archived_at ? 'opacity-60' : ''}`}
    >
      <View>
        <Text className="text-[18px] text-foreground" style={{ fontFamily: fonts.extraBold }} numberOfLines={1}>
          {ground.name}
        </Text>
        {ground.archived_at && (
          <Text className="text-[12px] text-muted" style={{ fontFamily: fonts.bold }}>
            Archived {new Date(ground.archived_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
      {/* All four Facilities: lit when the ground has one, struck through and dimmed when it doesn't. */}
      <View className="flex-row gap-1.5">
        {facilities.map((facility) => {
          const has = ground.facility_ids.includes(facility.id);
          return (
            <View key={facility.id} className={`flex-1 rounded-[12px] py-2 ${has ? 'bg-highlight' : 'bg-surface-secondary opacity-60'}`}>
              <Text
                className={`text-center text-[12px] ${has ? 'text-highlight-foreground' : 'text-muted line-through'}`}
                style={{ fontFamily: fonts.bold }}
                accessibilityLabel={`${facility.name}: ${has ? 'has it' : 'not here'}`}
              >
                {SHORT[facility.key] ?? facility.name}
              </Text>
            </View>
          );
        })}
      </View>
      {rows.length > 0 && (
        <View className="rounded-[14px] bg-surface-secondary">
          {rows.map(({ facility, features }, index) => (
            <View key={facility.id} className={`flex-row gap-3 px-3 py-2 ${index > 0 ? 'border-t border-separator' : ''}`}>
              <Text className="w-16 text-[12px] text-muted" style={{ fontFamily: fonts.bold }}>
                {SHORT[facility.key] ?? facility.name}
              </Text>
              <Text className="flex-1 text-[13px] text-foreground" style={{ fontFamily: fonts.body }}>
                {features.map((feature) => feature.name).join('   ')}
              </Text>
            </View>
          ))}
        </View>
      )}
      {ground.note && (
        <Text className="text-[13px] text-muted" style={{ fontFamily: fonts.body }} numberOfLines={2}>
          {ground.note}
        </Text>
      )}
    </Pressable>
  );
}

function Editor({ editing, facilities, onClose, onSaved }: { editing: Editing; facilities: FacilityData[]; onClose: () => void; onSaved: () => void }) {
  return (
    <BottomSheet isOpen={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={['90%']} backgroundClassName="rounded-t-[24px] bg-overlay">
          {editing && <EditorBody key={editing.ground?.id ?? 'new'} ground={editing.ground} facilities={facilities} onSaved={onSaved} />}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function EditorBody({ ground, facilities, onSaved }: { ground: PracticeGroundData | null; facilities: FacilityData[]; onSaved: () => void }) {
  const { call } = useSession();
  const [form, setForm] = useState<GroundForm>({
    name: ground?.name ?? '',
    note: ground?.note ?? '',
    facility_ids: ground?.facility_ids ?? [],
    feature_ids: ground?.feature_ids ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const run = async (request: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await request();
      onSaved();
    } catch (error) {
      if (!(error instanceof Invalid)) throw error;
      setErrors(error.errors);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(() =>
      call(ground ? `/practice-grounds/${ground.id}` : '/practice-grounds', {
        method: ground ? 'PUT' : 'POST',
        body: { ...form, note: form.note.trim() || null },
      }),
    );

  // Taking a Facility away takes its features with it: a feature only sits on a Facility the ground has.
  const toggleFacility = (facility: FacilityData, on: boolean) => {
    const features = facility.features.map((feature) => feature.id);
    setForm((data) => ({
      ...data,
      facility_ids: on ? [...data.facility_ids, facility.id] : data.facility_ids.filter((id) => id !== facility.id),
      feature_ids: on ? data.feature_ids : data.feature_ids.filter((id) => !features.includes(id)),
    }));
  };

  const toggleFeature = (id: string, on: boolean) =>
    setForm((data) => ({ ...data, feature_ids: on ? [...data.feature_ids, id] : data.feature_ids.filter((other) => other !== id) }));

  const setupError = (errors.facility_ids ?? errors.feature_ids)?.[0];

  return (
    <ScrollView contentContainerClassName="gap-5 p-5 pb-10">
      <BottomSheet.Title className="text-[20px] text-foreground" style={{ fontFamily: fonts.extraBold }}>
        {ground === null ? 'Add a Practice Ground' : ground.archived_at ? 'Archived Practice Ground' : 'Practice Ground'}
      </BottomSheet.Title>

      <TextField isInvalid={!!errors.name}>
        <Label>Name</Label>
        <Input value={form.name} onChangeText={(name) => setForm((data) => ({ ...data, name }))} />
        <FieldError>{errors.name?.[0]}</FieldError>
      </TextField>

      <View className="gap-2">
        <Text className="text-[13px] text-foreground" style={{ fontFamily: fonts.bold }}>
          Facilities and features
        </Text>
        <View className="rounded-[16px] bg-surface-secondary">
          {facilities.map((facility, index) => {
            const has = form.facility_ids.includes(facility.id);
            return (
              <View key={facility.id} className={`gap-3 p-3 ${index > 0 ? 'border-t border-separator' : ''}`}>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: has }}
                  onPress={() => toggleFacility(facility, !has)}
                  className={`flex-row items-center justify-between rounded-[12px] px-4 py-3 ${has ? 'bg-highlight' : 'bg-surface'}`}
                >
                  <Text className={has ? 'text-highlight-foreground' : 'text-muted'} style={{ fontFamily: fonts.bold }}>
                    {facility.name}
                  </Text>
                  {/* A white check in a black circle when the ground has it; an empty circle when it doesn't. */}
                  {has ? (
                    <View className="size-6 items-center justify-center rounded-full bg-black">
                      <Icon name="Check" color="white" size={14} />
                    </View>
                  ) : (
                    <View className="size-6 rounded-full border-2 border-separator" />
                  )}
                </Pressable>
                {has && facility.features.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 ps-2">
                    {facility.features.map((feature) => {
                      const ticked = form.feature_ids.includes(feature.id);
                      return (
                        <Pressable
                          key={feature.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: ticked }}
                          onPress={() => toggleFeature(feature.id, !ticked)}
                          className={`rounded-full px-3 py-1.5 ${ticked ? 'bg-highlight' : 'bg-surface'}`}
                        >
                          <Text className={`text-[13px] ${ticked ? 'text-highlight-foreground' : 'text-foreground'}`} style={{ fontFamily: fonts.bold }}>
                            {feature.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        {setupError && <Text className="text-[13px] text-danger">{setupError}</Text>}
      </View>

      <TextField isInvalid={!!errors.note}>
        <Label>Note (optional)</Label>
        <TextArea value={form.note} onChangeText={(note) => setForm((data) => ({ ...data, note }))} numberOfLines={3} />
        <FieldError>{errors.note?.[0]}</FieldError>
      </TextField>

      <Button size="lg" isDisabled={busy} onPress={save}>
        <Button.Label>Save Practice Ground</Button.Label>
      </Button>
      {ground &&
        (ground.archived_at ? (
          <Button variant="secondary" isDisabled={busy} onPress={() => run(() => call(`/practice-grounds/${ground.id}/restore`, { method: 'POST' }))}>
            <Button.Label>Restore Practice Ground</Button.Label>
          </Button>
        ) : (
          <ArchiveGround ground={ground} busy={busy} onArchive={() => run(() => call(`/practice-grounds/${ground.id}/archive`, { method: 'POST' }))} />
        ))}
    </ScrollView>
  );
}

/** Asks first, in the same layout and words as the web's confirm dialog. */
function ArchiveGround({ ground, busy, onArchive }: { ground: PracticeGroundData; busy: boolean; onArchive: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog isOpen={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="danger-soft">
          <Button.Label>Archive Practice Ground</Button.Label>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <Dialog.Title>Archive this Practice Ground?</Dialog.Title>
          <Dialog.Description>
            <Text className="text-foreground" style={{ fontFamily: fonts.bold }}>
              {ground.name}
            </Text>{' '}
            leaves your list and can’t be picked for new Practice Sessions. Practice Sessions you’ve already played there keep it. You can restore it from the
            archived ones.
          </Dialog.Description>
          <View className="gap-2">
            <Button variant="tertiary" onPress={() => setOpen(false)}>
              <Button.Label>Keep Practice Ground</Button.Label>
            </Button>
            <Button
              variant="danger"
              isDisabled={busy}
              onPress={() => {
                setOpen(false);
                onArchive();
              }}
            >
              <Button.Label>Archive Practice Ground</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
