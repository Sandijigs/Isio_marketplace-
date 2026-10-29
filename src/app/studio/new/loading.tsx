import { FormSkeleton } from '@/components/studio/form-skeleton';

export default function NewListingLoading() {
  return <FormSkeleton label="Loading the listing form…" fields={6} />;
}
