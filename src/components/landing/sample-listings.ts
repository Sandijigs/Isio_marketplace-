import type { StaticImageData } from 'next/image';

import beadwork from '@/assets/demo/beadwork.jpg';
import calabash from '@/assets/demo/calabash.jpg';
import earrings from '@/assets/demo/earrings.jpg';
import lantern from '@/assets/demo/lantern.jpg';
import masks from '@/assets/demo/masks.jpg';
import pottery from '@/assets/demo/pottery.jpg';
import wallBaskets from '@/assets/demo/wall-baskets.jpg';
import weaving from '@/assets/demo/weaving.jpg';
import wovenBag from '@/assets/demo/woven-bag.jpg';

import type { Availability } from './stall-filter';

/**
 * Sample pieces for the landing page until the catalog (F4/F5) serves real listings.
 * Maker names and towns are placeholders and are labelled as samples on the page.
 * Photos are used with permission and are not covered by the MIT licence.
 */
export interface SamplePiece {
  id: string;
  title: string;
  maker: string;
  town: string;
  availability: Availability;
  image: StaticImageData;
  alt: string;
}

export const SAMPLE_LISTINGS: readonly SamplePiece[] = [
  {
    id: 'beaded-embroidery',
    title: 'Hand-beaded embroidery, to your design',
    maker: 'Ese',
    town: 'Warri',
    availability: 'commission',
    image: beadwork,
    alt: 'A hand sewing pearl and silver beads onto mint green fabric',
  },
  {
    id: 'calabash-gourds',
    title: 'Engraved calabash gourds',
    maker: 'Musa',
    town: 'Bida',
    availability: 'ready',
    image: calabash,
    alt: 'Calabash gourds with burnt black patterns',
  },
  {
    id: 'wooden-masks',
    title: 'Carved wooden masks, set of three',
    maker: 'Ejiro',
    town: 'Sapele',
    availability: 'ready',
    image: masks,
    alt: 'Three carved and painted wooden masks laid side by side',
  },
  {
    id: 'beaded-earrings',
    title: 'Beaded drop earrings',
    maker: 'Funmi',
    town: 'Abeokuta',
    availability: 'ready',
    image: earrings,
    alt: 'A hand reaching for beaded earrings on a display stand',
  },
  {
    id: 'round-woven-bag',
    title: 'Round woven bag with a leather Africa map',
    maker: 'Zainab',
    town: 'Kano',
    availability: 'ready',
    image: wovenBag,
    alt: 'Hands holding a round woven bag with a stitched leather map of Africa',
  },
  {
    id: 'lantern-figure',
    title: 'Wire and jute lantern figure',
    maker: 'Osaro',
    town: 'Benin City',
    availability: 'made-to-order',
    image: lantern,
    alt: 'A wire figure wrapped in jute, carrying a black metal lantern',
  },
];

export const HERO_PIECES = {
  pottery: {
    title: 'Hand-thrown clay pot',
    maker: 'Amaka',
    town: 'Enugu',
    image: pottery,
    alt: 'Hands shaping a clay pot on a potter’s wheel',
  },
  weaving: {
    title: 'Woven basket',
    maker: 'Tari',
    town: 'Yenagoa',
    image: weaving,
    alt: 'Hands weaving an orange, blue and white basket',
  },
  wallBaskets: {
    title: 'Coiled wall baskets',
    maker: 'Hauwa',
    town: 'Zaria',
    image: wallBaskets,
    alt: 'Colourful coiled baskets hanging on an orange wall',
  },
} as const;

export const STUDIO_PHOTO = { image: beadwork, alt: 'Ese’s phone photo of her hand sewing beads onto fabric' };
export const ASSISTANT_PICK = { image: earrings, alt: 'Beaded earrings on a display stand' };
