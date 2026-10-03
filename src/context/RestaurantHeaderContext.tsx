import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Restaurant } from '../types/marketplace';

/**
 * Lets the restaurant menu page hand its restaurant (and its back action) to
 * the global app header, which is rendered outside the routes. No refetch:
 * the page publishes what it already loaded.
 */
interface RestaurantHeaderState {
  restaurant: Restaurant | null;
  /** The page is still loading the restaurant. */
  loading: boolean;
}

interface RestaurantHeaderContextValue extends RestaurantHeaderState {
  /** Runs the menu page's back action; false when no page has registered one. */
  goBack: () => boolean;
}

interface RestaurantHeaderPublisher {
  publish: (state: RestaurantHeaderState, onBack: () => void) => void;
  clear: () => void;
}

const EMPTY_STATE: RestaurantHeaderState = { restaurant: null, loading: true };

const RestaurantHeaderContext = createContext<RestaurantHeaderContextValue>({
  ...EMPTY_STATE,
  goBack: () => false,
});

const RestaurantHeaderPublisherContext =
  createContext<RestaurantHeaderPublisher | null>(null);

export const RestaurantHeaderProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<RestaurantHeaderState>(EMPTY_STATE);
  // The back handler changes every page render; keep it out of state so
  // publishing it doesn't re-render the app.
  const onBackRef = useRef<(() => void) | null>(null);

  const publish = useCallback(
    (next: RestaurantHeaderState, onBack: () => void) => {
      onBackRef.current = onBack;
      setState((prev) =>
        prev.restaurant === next.restaurant && prev.loading === next.loading
          ? prev
          : next
      );
    },
    []
  );

  const clear = useCallback(() => {
    onBackRef.current = null;
    setState(EMPTY_STATE);
  }, []);

  const goBack = useCallback(() => {
    if (!onBackRef.current) return false;
    onBackRef.current();
    return true;
  }, []);

  const publisher = useMemo(() => ({ publish, clear }), [publish, clear]);
  const value = useMemo(() => ({ ...state, goBack }), [state, goBack]);

  return (
    <RestaurantHeaderPublisherContext.Provider value={publisher}>
      <RestaurantHeaderContext.Provider value={value}>
        {children}
      </RestaurantHeaderContext.Provider>
    </RestaurantHeaderPublisherContext.Provider>
  );
};

/** Header side: the current menu page's restaurant and back action. */
export const useRestaurantHeader = () => useContext(RestaurantHeaderContext);

/**
 * Menu page side: publish the restaurant to the header before paint (layout
 * effect, so the header never shows a stale restaurant), and clear on leave.
 */
export const usePublishRestaurantHeader = (
  restaurant: Restaurant | null,
  loading: boolean,
  onBack: () => void
) => {
  const publisher = useContext(RestaurantHeaderPublisherContext);

  useLayoutEffect(() => {
    publisher?.publish({ restaurant, loading }, onBack);
  });

  useLayoutEffect(() => () => publisher?.clear(), [publisher]);
};
