import { AlertDialog, Button } from '@heroui/react';
import { useState, type ReactNode } from 'react';

/** What the confirm button hands its Inertia visit, so the dialog shows progress and closes when it's done. */
export type ConfirmVisit = { onStart: () => void; onFinish: () => void };

type Props = {
    /** The button that opens the dialog, such as "Delete Round". */
    trigger: string;
    /** Shows only this icon on the trigger, with `trigger` as its label, as on a card's header. */
    triggerIcon?: ReactNode;
    /** "danger-soft" beside other actions; "danger" when it's the only action on its card. */
    triggerVariant?: 'danger-soft' | 'danger';
    size?: 'md' | 'lg';
    className?: string;
    /** "<Verb> this <thing>?", such as "Delete this Round?". */
    heading: string;
    /** What goes and what stays, naming the thing in bold, ending with whether it can be undone. */
    children: ReactNode;
    /** "Keep <thing>", such as "Keep Round". */
    keep: string;
    /** Repeats the trigger's verb, such as "Delete Round". Defaults to the trigger. */
    confirm?: string;
    onConfirm: (visit: ConfirmVisit) => void;
};

/**
 * Every destructive confirm in the app: the heading with the danger icon on its right,
 * the consequences, then "Keep <thing>" and the danger confirm. See the design-system README.
 */
export function ConfirmDialog({
    trigger,
    triggerIcon,
    triggerVariant = 'danger-soft',
    size,
    className,
    heading,
    children,
    keep,
    confirm = trigger,
    onConfirm,
}: Props) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);

    return (
        <AlertDialog isOpen={open} onOpenChange={setOpen}>
            {triggerIcon ? (
                <Button isIconOnly size="sm" variant="ghost" aria-label={trigger} className={className}>
                    {triggerIcon}
                </Button>
            ) : (
                <Button variant={triggerVariant} size={size} className={className}>
                    {trigger}
                </Button>
            )}
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[420px]">
                        <AlertDialog.Header className="flex-row items-center justify-between gap-3">
                            <AlertDialog.Heading>{heading}</AlertDialog.Heading>
                            <AlertDialog.Icon status="danger" />
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="text-muted">{children}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot="close" variant="tertiary">
                                {keep}
                            </Button>
                            <Button
                                variant="danger"
                                isPending={pending}
                                onPress={() =>
                                    onConfirm({
                                        onStart: () => setPending(true),
                                        onFinish: () => {
                                            setPending(false);
                                            setOpen(false);
                                        },
                                    })
                                }
                            >
                                {confirm}
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    );
}

/** The name of the thing a confirm is about, in the body. */
export function ConfirmName({ children }: { children: ReactNode }) {
    return <span className="font-bold text-foreground">{children}</span>;
}
