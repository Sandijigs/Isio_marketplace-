import { STATUS_LABEL } from '@/services/catalog/listing-input';
import type { ListingStatus } from '@/types/shared';

// Light 1px borders, like every pill. Live is the one that stands out.
const STYLES: Record<ListingStatus, string> = {
  DRAFT: 'border-line-strong bg-paper text-ink',
  ACTIVE: 'border-ink bg-ink text-paper',
  SOLD_OUT: 'border-raffia-deep bg-raffia text-ink',
  ARCHIVED: 'border-line-strong bg-line text-ink',
};

export function StatusChip({ status, className = '' }: Readonly<{ status: ListingStatus; className?: string }>) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm leading-tight font-bold ${STYLES[status]} ${className}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
