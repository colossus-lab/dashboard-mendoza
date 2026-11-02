import credits from '../../data/generated/image-credits.json';

export interface PhotoCredit {
  key: string;
  alt: string;
  place: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
  fileName: string;
  width: number;
  height: number;
  widths: number[];
}

export const PHOTO_CREDITS = credits as Record<string, PhotoCredit>;

interface PhotoProps {
  imageKey: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function photoSrc(photo: PhotoCredit, width: number) {
  return `/images/mendoza/${photo.key}-${width}.webp`;
}

export function Photo({ imageKey, sizes, className = '', priority = false }: PhotoProps) {
  const photo = PHOTO_CREDITS[imageKey];
  if (!photo) return null;
  const largest = photo.widths[photo.widths.length - 1];

  return (
    <img
      className={`photo ${className}`}
      src={photoSrc(photo, largest)}
      srcSet={photo.widths.map(w => `${photoSrc(photo, w)} ${w}w`).join(', ')}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

export function PhotoCaption({ imageKey }: { imageKey: string }) {
  const photo = PHOTO_CREDITS[imageKey];
  if (!photo) return null;

  return (
    <p className="photo-caption">
      {photo.place} · Foto:{' '}
      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.author}</a>{' '}
      · {photo.license}
    </p>
  );
}
