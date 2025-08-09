import React, { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { cn } from '@/lib/utils';

interface Image {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  thumbnailSrc?: string;
}

interface ImageViewerProps {
  images: Image[];
  className?: string;
  thumbnailClassName?: string;
  showThumbnails?: boolean;
}

function ImageViewer({
  images,
  className,
  thumbnailClassName,
  showThumbnails = true,
}: ImageViewerProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Convert our images to the format expected by the lightbox
  const slides = images.map((image) => ({
    src: image.src,
    alt: image.alt || '',
    title: image.title,
    description: image.description,
  }));

  const openLightbox = (selectedIndex: number) => {
    setIndex(selectedIndex);
    setOpen(true);
  };

  return (
    <>
      {/* Thumbnail grid */}
      {showThumbnails && (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3', className)}>
          {images.map((image, i) => (
            <div
              key={i}
              className={cn(
                'cursor-pointer overflow-hidden rounded-md hover:opacity-90 transition-opacity',
                'aspect-square relative group',
                thumbnailClassName
              )}
              onClick={() => openLightbox(i)}
            >
              <img
                src={image.thumbnailSrc || image.src}
                alt={image.alt || `Image ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {image.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        index={index}
        plugins={[Captions, Fullscreen, Slideshow, Thumbnails, Zoom, Counter]}
        captions={{ showToggle: true }}
        counter={{ container: { style: { top: '30px' } } }}
        thumbnails={{ showToggle: true, position: 'bottom' }}
        zoom={{ wheelZoomDistanceFactor: 100, pinchZoomDistanceFactor: 100 }}
        carousel={{ preload: 3 }}
        render={{
          buttonPrev: slides.length <= 1 ? () => null : undefined,
          buttonNext: slides.length <= 1 ? () => null : undefined,
        }}
      />
    </>
  );
}

// Single image version for convenience
interface SingleImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  thumbnailSrc?: string;
  className?: string;
}

function SingleImageViewer({
  src,
  alt,
  title,
  description,
  thumbnailSrc,
  className,
}: SingleImageViewerProps): React.ReactElement {
  return (
    <ImageViewer
      images={[{ src, alt, title, description, thumbnailSrc }]}
      className={cn('grid-cols-1', className)}
    />
  );
}

export { SingleImageViewer };
export default ImageViewer;