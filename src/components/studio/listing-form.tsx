'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { FormError } from '@/components/auth/form-error';
import { buttonClasses } from '@/components/ui/button-link';
import { SelectField } from '@/components/ui/select-field';
import { TextArea } from '@/components/ui/text-area';
import { TextField } from '@/components/ui/text-field';
import { formatNairaApprox, fromPayPalValue } from '@/lib/money';
import {
  CATEGORY_LABEL,
  DESCRIPTION_MAX,
  isPublished,
  type ListingInput,
  listingInput,
  listGaps,
  type PublishField,
  type PublishGap,
  publishGaps,
  STORY_MAX,
  TITLE_MAX,
} from '@/services/catalog/listing-input';
import {
  type ApiErrorBody,
  LISTING_CATEGORIES,
  type Listing,
  type ListingCategory,
  type ListingImage,
  type ListingKind,
  type ListingResponse,
  type ListingStatus,
} from '@/types/shared';

import { PHOTOS_ADD_ID, PhotoPicker } from './photo-picker';
import { StatusChip } from './status-chip';

/**
 * The manual listing form, used for new listings and edits. Built as a plain
 * form first: the AI listing studio (F8) fills these same fields with a draft.
 */

type TextFieldName = 'title' | 'description' | 'story' | 'category' | 'price' | 'shipping' | 'stock' | 'turnaroundDays';
type Field = TextFieldName | 'images';
type Values = Record<Exclude<TextFieldName, 'category'>, string> & {
  kind: ListingKind;
  category: ListingCategory | '';
  images: ListingImage[];
};

export type ListingNotice = 'draft' | 'published' | 'saved' | 'sold-out' | 'on-sale' | 'archived';

const FIELD_ORDER: readonly Field[] = ['images', 'title', 'description', 'story', 'category', 'price', 'shipping', 'stock', 'turnaroundDays'];
const fieldId = (field: Field) => (field === 'images' ? PHOTOS_ADD_ID : `listing-${field}`);

/** Where each server field and publish gap shows its message. */
const FIELD_FOR: Record<keyof ListingInput | PublishField, Field | null> = {
  kind: null,
  title: 'title',
  description: 'description',
  story: 'story',
  category: 'category',
  priceCents: 'price',
  shippingCents: 'shipping',
  stock: 'stock',
  turnaroundDays: 'turnaroundDays',
  images: 'images',
  paypalEmail: null,
};

const GAP_MESSAGE: Record<PublishField, string> = {
  images: 'Add at least one photo.',
  title: 'Add a title.',
  description: 'Add a description.',
  category: 'Choose a category.',
  priceCents: 'Add a price above $0.',
  turnaroundDays: 'Add how many days it takes to make.',
  paypalEmail: 'Add your PayPal email.',
};

const dollars = (cents: number) => (cents === 0 ? '' : (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2));

function initialValues(listing: Listing | null): Values {
  return {
    kind: listing?.kind ?? 'PRODUCT',
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    story: listing?.story ?? '',
    category: listing?.category ?? '',
    price: listing ? dollars(listing.price.cents) : '',
    shipping: listing ? dollars(listing.shipping.cents) : '',
    stock: listing?.stock?.toString() ?? '',
    turnaroundDays: listing?.turnaroundDays?.toString() ?? '',
    images: listing?.images ?? [],
  };
}

/** "45", "45.50", "$1,200" → cents. Blank is 0 (fine for a draft). Null means it isn't an amount. */
function parseCents(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned === '') return 0;
  try {
    return fromPayPalValue(cleaned).cents;
  } catch {
    return null;
  }
}

/** Blank is null; anything else must be a whole number. */
function parseWhole(text: string): number | null | 'invalid' {
  const cleaned = text.trim();
  if (cleaned === '') return null;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : 'invalid';
}

type Parsed = { ok: true; input: ListingInput } | { ok: false; errors: Partial<Record<Field, string>> };

function toInput(values: Values): Parsed {
  const errors: Partial<Record<Field, string>> = {};
  const priceCents = parseCents(values.price);
  if (priceCents === null) errors.price = 'Enter the price in dollars, like 45 or 45.50.';
  const shippingCents = parseCents(values.shipping);
  if (shippingCents === null) errors.shipping = 'Enter shipping in dollars, like 12, or leave it blank for free.';
  const stock = values.kind === 'PRODUCT' ? parseWhole(values.stock) : null;
  if (stock === 'invalid') errors.stock = 'Enter a whole number, or leave it blank if you make each one to order.';
  const turnaroundDays = values.kind === 'SERVICE' ? parseWhole(values.turnaroundDays) : null;
  if (turnaroundDays === 'invalid') errors.turnaroundDays = 'Enter a whole number of days, like 14.';

  const result = listingInput.safeParse({
    kind: values.kind,
    title: values.title,
    description: values.description,
    story: values.story,
    category: values.category === '' ? null : values.category,
    priceCents: priceCents ?? 0,
    shippingCents: shippingCents ?? 0,
    stock: stock === 'invalid' ? null : stock,
    turnaroundDays: turnaroundDays === 'invalid' ? null : turnaroundDays,
    images: values.images,
  });
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof ListingInput | undefined;
      const field = key ? FIELD_FOR[key] : null;
      if (field && !errors[field]) errors[field] = issue.message;
    }
  }
  if (Object.keys(errors).length > 0 || !result.success) return { ok: false, errors };
  return { ok: true, input: result.data };
}

function isApiError(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'error' in body;
}

function focusField(field: Field) {
  document.getElementById(fieldId(field))?.focus();
}

export function ListingForm({
  listing: initialListing,
  hasPaypalEmail,
  handle,
  usdToNgnRate,
  initialNotice = null,
}: Readonly<{
  listing: Listing | null;
  hasPaypalEmail: boolean;
  handle: string;
  usdToNgnRate: number;
  initialNotice?: ListingNotice | null;
}>) {
  const router = useRouter();
  const [listing, setListing] = useState(initialListing);
  const [values, setValues] = useState<Values>(() => initialValues(initialListing));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ListingStatus | 'save' | null>(null);
  const [notice, setNotice] = useState<ListingNotice | null>(initialNotice);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  const status: ListingStatus = listing?.status ?? 'DRAFT';
  const archived = status === 'ARCHIVED';
  const parsed = toInput(values);
  const priceCents = parseCents(values.price);
  const turnaround = parseWhole(values.turnaroundDays);
  // From the raw values, so a typo in another field never makes the checklist claim it's ready.
  const gaps: PublishGap[] = publishGaps(
    {
      kind: values.kind,
      title: values.title,
      description: values.description,
      category: values.category === '' ? null : values.category,
      priceCents: priceCents ?? 0,
      turnaroundDays: turnaround === 'invalid' ? null : turnaround,
      images: values.images,
    },
    hasPaypalEmail,
  );
  const isService = values.kind === 'SERVICE';

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (field !== 'kind') setErrors((e) => ({ ...e, [field]: undefined }));
    setNotice(null);
  }

  function showErrors(fieldErrors: Partial<Record<Field, string>>) {
    setErrors(fieldErrors);
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (first) focusField(first);
  }

  function announce(next: ListingNotice) {
    setNotice(next);
    requestAnimationFrame(() => noticeRef.current?.focus());
  }

  async function send(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<Listing | null> {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json: unknown = await res.json().catch(() => null);
    if (res.ok) return (json as ListingResponse).listing;
    setFormError(isApiError(json) ? json.error.message : 'Couldn’t save your listing. Try again.');
    return null;
  }

  /** Archive without sending the form's fields, so an unfinished edit never blocks taking a piece down. */
  async function archive(id: string) {
    setBusy('ARCHIVED');
    try {
      const saved = await send(`/api/listings/${id}`, 'PATCH', { status: 'ARCHIVED' });
      if (!saved) return;
      setListing(saved);
      setValues(initialValues(saved));
      setErrors({});
      setConfirmingArchive(false);
      router.refresh();
      announce('archived');
    } catch {
      setFormError('Couldn’t reach Isio. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  /** Save the fields, optionally moving to `target`. Checks the publish rules first when the result is live. */
  async function save(target?: ListingStatus) {
    setFormError(null);
    setNotice(null);
    const resulting = target ?? status;
    // Archiving skips every check: a creative must always be able to take a piece down.
    if (target === 'ARCHIVED' && listing) return archive(listing.id);
    if (!parsed.ok) return showErrors(parsed.errors);

    if (isPublished(resulting) && gaps.length > 0) {
      const fieldErrors: Partial<Record<Field, string>> = {};
      for (const gap of gaps) {
        const field = FIELD_FOR[gap.field];
        if (field) fieldErrors[field] = GAP_MESSAGE[gap.field];
      }
      setFormError(`To ${status === 'DRAFT' ? 'publish' : 'keep this listing live'}, add ${listGaps(gaps)}.`);
      return showErrors(fieldErrors);
    }

    setBusy(target ?? 'save');
    try {
      if (!listing) {
        const created = await send('/api/listings', 'POST', parsed.input);
        if (!created) return;
        const published = target === 'ACTIVE' ? await send(`/api/listings/${created.id}`, 'PATCH', { status: 'ACTIVE' }) : null;
        // Even if publishing failed, the draft exists now: move to its page so nothing is saved twice.
        router.replace(`/studio/listings/${created.id}?saved=${published ? 'published' : 'draft'}`);
        return;
      }
      const saved = await send(`/api/listings/${listing.id}`, 'PATCH', { ...parsed.input, ...(target ? { status: target } : {}) });
      if (!saved) return;
      setListing(saved);
      setValues(initialValues(saved));
      setConfirmingArchive(false);
      router.refresh();
      announce(
        target === 'ACTIVE'
          ? status === 'DRAFT'
            ? 'published'
            : 'on-sale'
          : target === 'SOLD_OUT'
            ? 'sold-out'
            : status === 'DRAFT'
              ? 'draft'
              : 'saved',
      );
    } catch {
      setFormError('Couldn’t reach Isio. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  const stallLink = (
    <Link href={`/@${handle}`} className="font-bold text-ink underline underline-offset-4 hover:text-indigo">
      See it on your stall
    </Link>
  );
  const NOTICES: Record<ListingNotice, React.ReactNode> = {
    draft: <span>Draft saved. Only you can see it.</span>,
    published: (
      <>
        <span>Listing published.</span>
        {stallLink}
      </>
    ),
    saved: (
      <>
        <span>Changes saved.</span>
        {status === 'ACTIVE' ? stallLink : null}
      </>
    ),
    'sold-out': <span>Marked as sold out. Buyers won’t see it until you put it back on sale.</span>,
    'on-sale': (
      <>
        <span>Back on sale.</span>
        {stallLink}
      </>
    ),
    archived: (
      <>
        <span>Listing archived. Buyers can’t see it any more.</span>
        <Link href="/studio" className="font-bold text-ink underline underline-offset-4 hover:text-indigo">
          Back to your studio
        </Link>
      </>
    ),
  };

  const disabled = archived || busy !== null;
  const showChecklist = !archived && (status === 'DRAFT' || gaps.length > 0);

  return (
    <form onSubmit={(e) => (e.preventDefault(), void save())} noValidate className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-semibold">Status</span>
        <StatusChip status={status} />
      </div>

      {archived ? (
        <p className="border-2 border-ink bg-line px-4 py-3 text-base font-semibold">
          This listing is archived. Buyers can’t see it, and it can’t be changed. List the piece again if you have
          another.
        </p>
      ) : null}

      <FormError message={formError} />

      <fieldset className="flex flex-col gap-3" disabled={disabled}>
        <legend className="mb-1.5 text-[17px] font-bold">What are you listing?</legend>
        {(
          [
            ['PRODUCT', 'A finished piece', 'It’s made and ready, or you make one each time it sells.'],
            ['SERVICE', 'Made to order', 'Buyers ask for something of their own, like a portrait or a custom piece. You quote each one.'],
          ] as const
        ).map(([kind, label, hint]) => (
          <label
            key={kind}
            className={`flex cursor-pointer items-start gap-3 border-2 px-4 py-3 ${values.kind === kind ? 'border-ink bg-raffia-tint' : 'border-line-strong bg-paper hover:border-ink'}`}
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={values.kind === kind}
              onChange={() => update('kind', kind)}
              className="mt-1 size-5 shrink-0 accent-ink"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-[17px] font-bold">{label}</span>
              <span className="text-[15px] font-medium text-ink/75">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <PhotoPicker images={values.images} onChange={(images) => update('images', images)} error={errors.images} disabled={disabled} />

      <TextField
        id={fieldId('title')}
        label="Title"
        hint="What a buyer would search for, like “Red coral bead necklace”."
        maxLength={TITLE_MAX}
        value={values.title}
        error={errors.title}
        disabled={disabled}
        onChange={(e) => update('title', e.target.value)}
      />
      <TextArea
        id={fieldId('description')}
        label="Description"
        hint="Size, colours, materials, and anything a buyer should know before they pay."
        maxLength={DESCRIPTION_MAX}
        value={values.description}
        error={errors.description}
        disabled={disabled}
        onChange={(e) => update('description', e.target.value)}
      />
      <TextArea
        id={fieldId('story')}
        label="The story behind it (optional)"
        hint="In your own words: how you made it, or what it means to you."
        maxLength={STORY_MAX}
        value={values.story}
        error={errors.story}
        disabled={disabled}
        onChange={(e) => update('story', e.target.value)}
      />
      <SelectField
        id={fieldId('category')}
        label="Category"
        value={values.category}
        error={errors.category}
        disabled={disabled}
        onChange={(e) => update('category', e.target.value as ListingCategory | '')}
      >
        <option value="">Choose a category</option>
        {LISTING_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABEL[c]}
          </option>
        ))}
      </SelectField>

      <fieldset className="flex min-w-0 flex-col gap-5" disabled={disabled}>
        <legend className="mb-1.5 text-[17px] font-bold">Price and delivery</legend>
        <TextField
          id={fieldId('price')}
          label={isService ? 'Starting price, in US dollars' : 'Price, in US dollars'}
          hint={
            priceCents && priceCents > 0
              ? `${formatNairaApprox({ cents: priceCents, currency: 'USD' }, usdToNgnRate)}. Buyers pay in dollars through PayPal.`
              : isService
                ? 'The least you charge. You quote each buyer after reading their request.'
                : 'Buyers pay in dollars through PayPal.'
          }
          inputMode="decimal"
          placeholder="45"
          value={values.price}
          error={errors.price}
          onChange={(e) => update('price', e.target.value)}
        />
        <TextField
          id={fieldId('shipping')}
          label="Shipping, in US dollars"
          hint="What you charge to send it abroad. Leave it blank for free shipping."
          inputMode="decimal"
          placeholder="0"
          value={values.shipping}
          error={errors.shipping}
          onChange={(e) => update('shipping', e.target.value)}
        />
        {isService ? (
          <TextField
            id={fieldId('turnaroundDays')}
            label="Days it takes to make"
            hint="From the deposit to sending it, on a normal week."
            inputMode="numeric"
            placeholder="14"
            value={values.turnaroundDays}
            error={errors.turnaroundDays}
            onChange={(e) => update('turnaroundDays', e.target.value)}
          />
        ) : (
          <TextField
            id={fieldId('stock')}
            label="How many you have (optional)"
            hint="Leave it blank if you make one each time it sells."
            inputMode="numeric"
            placeholder="1"
            value={values.stock}
            error={errors.stock}
            onChange={(e) => update('stock', e.target.value)}
          />
        )}
      </fieldset>

      {showChecklist ? (
        <section aria-labelledby="publish-check-heading" className="flex flex-col gap-3 border-2 border-ink bg-indigo-tint p-4">
          <h2 id="publish-check-heading" className="text-[19px] font-extrabold">
            {gaps.length === 0
              ? 'Ready to publish.'
              : status === 'DRAFT'
                ? 'To publish, add:'
                : 'To keep this listing live, add:'}
          </h2>
          {gaps.length === 0 ? (
            <p className="text-base font-medium">Everything buyers need is here.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {gaps.map((gap) => {
                const field = FIELD_FOR[gap.field];
                return (
                  <li key={gap.field} className="flex gap-2 text-base font-semibold">
                    <span aria-hidden="true">–</span>
                    {field ? (
                      <button
                        type="button"
                        onClick={() => focusField(field)}
                        className="cursor-pointer text-left underline underline-offset-4 hover:text-indigo"
                      >
                        {gap.label}
                      </button>
                    ) : (
                      <Link href="/studio/profile" className="text-ink underline underline-offset-4 hover:text-indigo">
                        {gap.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {!archived ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {status === 'DRAFT' ? (
            <>
              <button type="button" disabled={disabled} onClick={() => void save('ACTIVE')} className={`${buttonClasses('ink', 'lg')} w-full cursor-pointer sm:w-auto`}>
                {busy === 'ACTIVE' ? 'Publishing…' : 'Publish listing'}
              </button>
              <button type="submit" disabled={disabled} className={`${buttonClasses('outline', 'lg')} w-full cursor-pointer sm:w-auto`}>
                {busy === 'save' ? 'Saving…' : 'Save draft'}
              </button>
            </>
          ) : (
            <>
              <button type="submit" disabled={disabled} className={`${buttonClasses('ink', 'lg')} w-full cursor-pointer sm:w-auto`}>
                {busy === 'save' ? 'Saving…' : 'Save changes'}
              </button>
              {status === 'ACTIVE' ? (
                <button type="button" disabled={disabled} onClick={() => void save('SOLD_OUT')} className={`${buttonClasses('outline', 'lg')} w-full cursor-pointer sm:w-auto`}>
                  {busy === 'SOLD_OUT' ? 'Saving…' : 'Mark as sold out'}
                </button>
              ) : (
                <button type="button" disabled={disabled} onClick={() => void save('ACTIVE')} className={`${buttonClasses('outline', 'lg')} w-full cursor-pointer sm:w-auto`}>
                  {busy === 'ACTIVE' ? 'Saving…' : 'Put back on sale'}
                </button>
              )}
            </>
          )}
          {listing ? (
            confirmingArchive ? (
              <div role="group" aria-labelledby="archive-question" className="flex w-full flex-col gap-3 border-2 border-ink p-4">
                <p id="archive-question" className="text-base font-semibold">
                  Archive this listing? Buyers won’t see it again, and it can’t be undone.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" disabled={disabled} onClick={() => void save('ARCHIVED')} className={`${buttonClasses('ink', 'md')} cursor-pointer`}>
                    {busy === 'ARCHIVED' ? 'Archiving…' : 'Yes, archive it'}
                  </button>
                  <button type="button" disabled={disabled} onClick={() => setConfirmingArchive(false)} className={`${buttonClasses('outline', 'md')} cursor-pointer`}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" disabled={disabled} onClick={() => setConfirmingArchive(true)} className={`${buttonClasses('outline', 'lg')} w-full cursor-pointer sm:w-auto`}>
                Archive listing
              </button>
            )
          ) : null}
        </div>
      ) : null}

      <div role="status" aria-live="polite">
        {notice ? (
          <p
            ref={noticeRef}
            tabIndex={-1}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-2 border-ink bg-raffia-tint px-4 py-3 text-base font-semibold"
          >
            {NOTICES[notice]}
          </p>
        ) : null}
      </div>
    </form>
  );
}
