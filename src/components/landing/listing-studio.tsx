import Image from 'next/image';

import { STUDIO_PHOTO } from './sample-listings';

function MicIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function DraftField({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </div>
  );
}

/** Illustrates the AI listing studio (F8). The draft shown is an example, not live output. */
export function ListingStudio() {
  return (
    <section
      id="studio"
      aria-labelledby="studio-heading"
      className="scroll-mt-4 border-y-2 border-ink bg-raffia-tint"
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-[clamp(32px,4vw,52px)] px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,104px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-5">
          <div className="flex flex-col gap-3">
            <span className="text-[15px] font-bold">For makers: the listing studio</span>
            <h2
              id="studio-heading"
              className="stretch-75 max-w-[8.5em] text-[clamp(48px,6.6vw,104px)] leading-[0.88] font-extrabold tracking-[-0.025em]"
            >
              Say it in Pidgin. Sell it in English.
            </h2>
          </div>
          <p className="max-w-[27em] text-[clamp(17px,1.35vw,19px)] leading-normal font-medium text-pretty">
            Snap a photo, then type or speak about your piece the way you’d explain it at your stall. Isio drafts the
            listing: title, story, category and a price suggestion with its reasons. You change anything you like, then
            publish.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-start gap-x-12 gap-y-8">
          <div className="flex flex-col gap-3.5">
            <span className="text-base font-bold">What Ese sent</span>
            <div className="flex flex-wrap items-start gap-[18px]">
              <figure className="m-0 flex flex-[0_0_170px] flex-col gap-2">
                <div className="relative aspect-[4/5] overflow-hidden border-2 border-ink bg-paper shadow-hard">
                  <Image
                    src={STUDIO_PHOTO.image}
                    alt={STUDIO_PHOTO.alt}
                    fill
                    placeholder="blur"
                    sizes="170px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-sm font-semibold">Her phone photo</figcaption>
              </figure>
              <blockquote className="m-0 min-w-0 flex-[1_1_240px] rounded-[28px_28px_28px_6px] border-2 border-ink bg-paper p-[clamp(20px,2.4vw,30px)] shadow-hard">
                <p lang="pcm" className="stretch-90 text-[clamp(21px,2vw,28px)] leading-tight font-semibold">
                  “Na pearl and silver beads I dey sew on cloth with my hand. I fit do am for your own fabric, any design
                  wey you want.”
                </p>
              </blockquote>
            </div>
            <p className="flex items-center gap-2.5 pl-2 text-base font-semibold">
              <MicIcon />
              Spoken in Pidgin, then checked by Ese
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="text-base font-bold">Isio’s draft</span>
            <div className="border-2 border-ink bg-paper shadow-hard">
              <div className="flex flex-wrap justify-between gap-3 border-b-2 border-ink bg-indigo px-5 py-3 text-[15px] font-semibold text-paper">
                <span>Not published yet</span>
                <span>Drafted with AI</span>
              </div>
              <div className="flex flex-col gap-5 p-[clamp(20px,2.4vw,32px)]">
                <DraftField label="Title">
                  <span className="stretch-80 text-[clamp(24px,2.4vw,34px)] leading-[1.05] font-extrabold">
                    Hand-beaded embroidery in pearl and silver, to your design
                  </span>
                </DraftField>
                <DraftField label="Story">
                  <span className="text-[17px] leading-[1.55]">
                    Pearl and silver beads, sewn onto fabric by hand by Ese in Warri. She can bead your own fabric in
                    any design you choose.
                  </span>
                </DraftField>
                <div className="flex flex-wrap items-start gap-x-7 gap-y-3 border-t-2 border-ink pt-[18px]">
                  <DraftField label="Category">
                    <span className="self-start rounded-full border border-line-strong bg-coral-tint px-3 py-1 text-[15px] font-bold">
                      Beadwork
                    </span>
                  </DraftField>
                  <div className="flex-[1_1_200px]">
                    <DraftField label="Suggested price">
                      <span className="text-2xl leading-[1.1] font-extrabold">[PRICE] USD</span>
                      <span className="text-[15px]">Why: [AI REASONING]</span>
                    </DraftField>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3" aria-hidden="true">
                  <span className="inline-flex min-h-[50px] items-center rounded-full border border-line-strong bg-paper px-6 text-[17px] font-bold">
                    Edit draft
                  </span>
                  <span className="inline-flex min-h-[50px] items-center rounded-full border border-ink bg-ink px-6 text-[17px] font-bold text-paper">
                    Publish
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
