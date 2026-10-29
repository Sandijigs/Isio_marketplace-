import { FormSkeleton } from '@/components/studio/form-skeleton';

export default function EditListingLoading() {
  return <FormSkeleton label="Loading your listing…" fields={6} />;
}
