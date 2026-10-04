import {
  ReactNode,
  RefObject,
  TouchEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Box, ButtonBase, Skeleton, useMediaQuery } from '@mui/material';
import {
  RESTAURANT_IMAGE_FALLBACK,
  shouldAutoRotate,
} from '../../utils/restaurantDisplay';

const ROTATE_INTERVAL_MS = 3500;
const SWIPE_THRESHOLD_PX = 40;

interface RestaurantImageCarouselProps {
  images: string[];
  restaurantName: string;
  /** Height of the image area, in px. */
  height?: number;
  /** Images are still being looked up: show a skeleton instead. */
  loading?: boolean;
  /** Restaurant closed: greyscale, faded, no auto-rotation. */
  dimmed?: boolean;
  /** Drawn over the images (e.g. a "Closed" badge). */
  overlay?: ReactNode;
}

/** Rotates only while the element is at least partly on screen. */
const useIsOnScreen = (ref: RefObject<HTMLElement | null>) => {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return onScreen;
};

const usePageVisible = () => {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
};

/**
 * Card image carousel: auto-rotates every few seconds with dot indicators and
 * swipe. Rotation pauses off-screen, when the page is hidden and entirely
 * under prefers-reduced-motion. Clicks on the dots don't reach the card.
 */
const RestaurantImageCarousel = ({
  images,
  restaurantName,
  height = 180,
  loading = false,
  dimmed = false,
  overlay,
}: RestaurantImageCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const onScreen = useIsOnScreen(containerRef);
  const pageVisible = usePageVisible();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {
    noSsr: true,
  });

  const count = images.length;
  const current = count > 0 ? index % count : 0;
  const canRotate = !loading && shouldAutoRotate(count);
  const autoRotate =
    canRotate && !dimmed && onScreen && pageVisible && !reducedMotion;

  // Restarts after each change, so a manual swipe/dot gets a full interval.
  useEffect(() => {
    if (!autoRotate) return undefined;
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % count),
      ROTATE_INTERVAL_MS
    );
    return () => window.clearTimeout(timer);
  }, [autoRotate, count, current]);

  const goTo = (next: number) => setIndex(((next % count) + count) % count);

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    swiped.current = false;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    const endX = event.changedTouches[0]?.clientX;
    if (startX === null || endX === undefined || !canRotate) return;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    swiped.current = true;
    goTo(delta < 0 ? current + 1 : current - 1);
  };

  return (
    <Box
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClickCapture={(event) => {
        // A swipe must not also open the menu.
        if (swiped.current) {
          swiped.current = false;
          event.stopPropagation();
        }
      }}
      sx={{
        position: 'relative',
        height,
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'grey.100',
        touchAction: 'pan-y',
      }}
    >
      {loading ? (
        <Skeleton
          variant="rectangular"
          animation="wave"
          width="100%"
          height="100%"
          aria-label={`Loading ${restaurantName} photos`}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            transform: `translateX(-${current * 100}%)`,
            filter: dimmed ? 'grayscale(1)' : 'none',
            opacity: dimmed ? 0.55 : 1,
            transition: reducedMotion ? 'none' : 'transform 450ms ease',
          }}
        >
          {images.map((src, i) => (
            <Box
              key={`${i}-${src}`}
              component="img"
              src={failed[src] ? RESTAURANT_IMAGE_FALLBACK : src}
              alt={
                count > 1
                  ? `${restaurantName}, photo ${i + 1} of ${count}`
                  : restaurantName
              }
              aria-hidden={i === current ? undefined : true}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => {
                if (!failed[src])
                  setFailed((prev) => ({ ...prev, [src]: true }));
              }}
              sx={{
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                userSelect: 'none',
              }}
            />
          ))}
        </Box>
      )}

      {overlay}

      {canRotate && (
        <>
          {/* Soft shade so the dots stay visible on light photos. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              height: 40,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 6,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {images.map((src, i) => (
              <ButtonBase
                key={`${i}-${src}`}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === current ? 'true' : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(i);
                }}
                sx={{
                  // 20px hit area around a small dot.
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  '&::after': {
                    content: '""',
                    width: i === current ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor:
                      i === current ? 'common.white' : 'rgba(255,255,255,0.6)',
                    transition: reducedMotion ? 'none' : 'width 250ms ease',
                  },
                  '&.Mui-focusVisible::after': {
                    outline: '2px solid',
                    outlineColor: 'common.white',
                    outlineOffset: 2,
                  },
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default RestaurantImageCarousel;
