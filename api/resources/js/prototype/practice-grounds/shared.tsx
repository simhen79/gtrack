/** PROTOTYPE ONLY (#28). Small pieces the variants share; each variant owns its own layout. */
import { Archive } from '@gravity-ui/icons';
import { AlertDialog, Button, Checkbox, Label, ToggleButton } from '@heroui/react';
import { useState } from 'react';
import { ConfirmDialog, ConfirmName } from '../../components/confirm-dialog';
import type { Ground } from './model';

/** Selected but not an action, so `highlight` lime, per the design-system README's second principle. */
const SELECTED_HIGHLIGHT = 'data-[selected=true]:bg-highlight data-[selected=true]:text-highlight-foreground';

export function Tick({ label, isSelected, onChange }: { label: string; isSelected: boolean; onChange: (on: boolean) => void }) {
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

export function FeatureChip({ label, isSelected, onChange }: { label: string; isSelected: boolean; onChange: (on: boolean) => void }) {
    return (
        <ToggleButton size="sm" isSelected={isSelected} onChange={onChange} className={`rounded-full ${SELECTED_HIGHLIGHT}`}>
            {label}
        </ToggleButton>
    );
}

/**
 * Archive as an icon button on a card, asking first in the same dialog as ConfirmDialog (which only
 * takes a text trigger). If the cards win, ConfirmDialog should take an icon trigger instead.
 */
export function ArchiveIconButton({ ground, onArchive }: { ground: Ground; onArchive: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog isOpen={open} onOpenChange={setOpen}>
            <Button isIconOnly size="sm" variant="ghost" aria-label={`Archive ${ground.name}`}>
                <Archive className="size-4" />
            </Button>
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[420px]">
                        <AlertDialog.Header className="flex-row items-center justify-between gap-3">
                            <AlertDialog.Heading>Archive this Practice Ground?</AlertDialog.Heading>
                            <AlertDialog.Icon status="danger" />
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="text-muted">
                                <ConfirmName>{ground.name}</ConfirmName> leaves your list and can’t be picked for new sessions. Sessions you’ve already played there keep it.
                                You can restore it from Archived.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot="close" variant="tertiary">
                                Keep Practice Ground
                            </Button>
                            <Button
                                variant="danger"
                                onPress={() => {
                                    onArchive();
                                    setOpen(false);
                                }}
                            >
                                Archive Practice Ground
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    );
}

/** Archive, asked first in the shared ConfirmDialog. In the prototype it only changes memory. */
export function ArchiveGround({ ground, onArchive, fullWidth = false, short = false }: { ground: Ground; onArchive: () => void; fullWidth?: boolean; short?: boolean }) {
    return (
        <ConfirmDialog
            trigger={short ? 'Archive' : 'Archive Practice Ground'}
            className={fullWidth ? 'w-full' : undefined}
            heading="Archive this Practice Ground?"
            keep="Keep Practice Ground"
            confirm="Archive Practice Ground"
            onConfirm={(visit) => {
                visit.onStart();
                onArchive();
                visit.onFinish();
            }}
        >
            <ConfirmName>{ground.name}</ConfirmName> leaves your list and can’t be picked for new sessions. Sessions you’ve already played there keep it. You can
            restore it from Archived.
        </ConfirmDialog>
    );
}
