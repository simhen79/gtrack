import { Calendar, DateField, DatePicker, FieldError, Label } from '@heroui/react';
import { parseDate } from '@internationalized/date';

/** The design system's calendar: the selected day on segment, today ringed in highlight. */
const CELL =
    'data-[selected=true]:bg-segment data-[selected=true]:text-segment-foreground data-[today=true]:ring-2 data-[today=true]:ring-highlight data-[today=true]:ring-inset';

type Props = {
    /** The date as the form holds it, YYYY-MM-DD. */
    value: string;
    onChange: (value: string) => void;
    error?: string;
};

/**
 * A Round's date: typed segment by segment, or picked from the calendar. The
 * design system's DatePicker, not the browser's own date input.
 */
export function RoundDate({ value, onChange, error }: Props) {
    return (
        <DatePicker
            name="played_on"
            isRequired
            isInvalid={error !== undefined}
            value={value ? parseDate(value) : null}
            onChange={(date) => onChange(date?.toString() ?? '')}
        >
            <Label>Date</Label>
            <DateField.Group fullWidth>
                <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                <DateField.Suffix>
                    <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                </DateField.Suffix>
            </DateField.Group>
            <FieldError>{error}</FieldError>
            <DatePicker.Popover>
                <Calendar aria-label="Round date">
                    <Calendar.Header>
                        <Calendar.Heading />
                        <Calendar.NavButton slot="previous" />
                        <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                        <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                        <Calendar.GridBody>{(date) => <Calendar.Cell date={date} className={CELL} />}</Calendar.GridBody>
                    </Calendar.Grid>
                </Calendar>
            </DatePicker.Popover>
        </DatePicker>
    );
}
