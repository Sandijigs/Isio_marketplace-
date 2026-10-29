import { FormSkeleton } from '@/components/studio/form-skeleton';

export default function ProfileLoading() {
  return <FormSkeleton label="Loading your stall details…" fields={6} />;
}
