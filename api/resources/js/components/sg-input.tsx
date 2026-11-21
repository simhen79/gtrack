import { SG_CATEGORIES, parseSG, sgTone } from '@gtrack/design';
import { Button, InputGroup } from '@heroui/react';
import { useId, type KeyboardEvent, type Ref } from 'react';
import { flipSg, signSg, typeSg } from '../lib/strokes-gained';
import { SgCategoryBadge, type SgCategoryKey } from './sg-category';
import { SgValue } from './sg-value';

type Props = {
    category: SgCategoryKey;
    value: string;
    onChange: (value: string) => void;
    /** Enter moves on to the next SG Category. */
    onEnter?: () => void;
    /** Why the value can't be saved, shown under it. */
    error?: string;
    /** Calculated from distance bands, so shown but not typed. */
    locked?: boolean;
    inputRef?: Ref<HTMLInputElement>;
};

/**
 * One SG Category's Strokes Gained, typed with a keyboard. It's negative unless
 * + or the ± button makes it positive; − sets it back.
 */
export function SgInput({ category, value, onChange, onEnter, error, locked = false, inputRef }: Props) {
    const { name } = SG_CATEGORIES.find(({ key }) => key === category)!;
    const errorId = useId();

    return (
        <div className="flex flex-col gap-1 rounded-[16px] bg-surface-secondary p-3 focus-within:ring-2 focus-within:ring-highlight focus-within:ring-inset">
            <div className="flex items-center gap-3">
                <SgCategoryBadge category={category} long />
                {/* 228px holds the 48px ± button and the 180px value field. */}
                <div className="ml-auto">
                    {locked ? (
                        <div
                            className="flex h-14 w-[228px] flex-col items-end justify-center rounded-[12px] bg-surface-tertiary px-3"
                            aria-label={`${name} Strokes Gained, the sum of its distance bands`}
                        >
                            <SgValue value={value} className="text-[24px] leading-none" />
                            <span className="text-[11px] font-bold text-muted">Sum of bands</span>
                        </div>
                    ) : (
                        <SignedInput
                            label={`${name} Strokes Gained`}
                            value={value}
                            onChange={onChange}
                            onEnter={onEnter}
                            invalid={error !== undefined}
                            describedBy={error === undefined ? undefined : errorId}
                            inputRef={inputRef}
                            className="h-14 w-[228px] rounded-[12px] bg-background"
                            inputClassName="text-[24px]"
                            buttonClassName="size-12"
                        />
                    )}
                </div>
            </div>
            {error !== undefined && (
                <p id={errorId} className="text-right text-sm text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

/** A signed Strokes Gained text field with a ± button, also used for distance bands. */
export function SignedInput(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onEnter?: () => void;
    invalid?: boolean;
    /** The id of the message saying why the value can't be saved. */
    describedBy?: string;
    inputRef?: Ref<HTMLInputElement>;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    buttonClassName?: string;
}) {
    const number = props.value ? parseSG(props.value) : null;

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === '+' || event.key === '-') {
            event.preventDefault();
            props.onChange(signSg(props.value, event.key));
        } else if (event.key === 'Enter' && props.onEnter) {
            event.preventDefault();
            props.onEnter();
        }
    };

    return (
        <InputGroup className={props.className} isInvalid={props.invalid}>
            <InputGroup.Input
                ref={props.inputRef}
                aria-label={props.label}
                aria-describedby={props.describedBy}
                aria-invalid={props.invalid || undefined}
                inputMode="decimal"
                autoComplete="off"
                placeholder={props.placeholder}
                value={props.value.replace('-', '−')}
                onChange={(event) => props.onChange(typeSg(props.value, event.target.value))}
                onKeyDown={onKeyDown}
                className={`w-full min-w-0 pr-3 text-right font-extrabold tabular-nums ${number === null ? '' : sgTone(number)} ${props.inputClassName ?? ''}`}
            />
            {/* After the value: the golfer types the number, then flips its sign if it's positive. */}
            <InputGroup.Suffix>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className={props.buttonClassName}
                    aria-label={`Flip the sign of ${props.label}`}
                    excludeFromTabOrder
                    onPress={() => props.onChange(flipSg(props.value))}
                >
                    ±
                </Button>
            </InputGroup.Suffix>
        </InputGroup>
    );
}
