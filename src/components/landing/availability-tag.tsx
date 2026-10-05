import { AVAILABILITY_LABEL, type Availability } from './stall-filter';

// Light 1px borders, matching the header pills.
const STYLES: Record<Availability, string> = {
  ready: 'border-ink bg-ink text-paper',
  commission: 'border-raffia-deep bg-raffia text-ink',
  'made-to-order': 'border-line-strong bg-paper text-ink',
};

export function AvailabilityTag({
  availability,
  className = '',
}: Readonly<{ availability: Availability; className?: string }>) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm leading-tight font-bold ${STYLES[availability]} ${className}`}
    >
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}
