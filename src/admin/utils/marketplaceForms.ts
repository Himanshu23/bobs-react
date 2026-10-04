/**
 * Pure form logic for the admin Markets and Restaurants tabs: form state,
 * client-side validation that mirrors the backend rules (§5.1, §5.2) and
 * conversion to request bodies. Form values are strings so inputs can be empty.
 */
import {
  DEFAULT_MARKET_ID,
  DEFAULT_RESTAURANT_ID,
  DaySchedule,
  MarketAdmin,
  MarketRequest,
  RestaurantAdmin,
  RestaurantRequest,
  WEEK_DAYS,
  WeekDay,
} from '../types/marketplace';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

// ---------------------------------------------------------------- markets

export interface MarketFormValues {
  name: string;
  centerLat: string;
  centerLng: string;
  radiusKm: string;
  deliveryFee: string;
  displayOrder: string;
  active: boolean;
}

export const DEFAULT_DELIVERY_FEE = 20;

export const emptyMarketForm = (): MarketFormValues => ({
  name: '',
  centerLat: '',
  centerLng: '',
  radiusKm: '',
  deliveryFee: String(DEFAULT_DELIVERY_FEE),
  displayOrder: '0',
  active: true,
});

export const marketToForm = (market: MarketAdmin): MarketFormValues => ({
  name: market.name ?? '',
  centerLat: market.center?.lat != null ? String(market.center.lat) : '',
  centerLng: market.center?.lng != null ? String(market.center.lng) : '',
  radiusKm: market.radiusKm != null ? String(market.radiusKm) : '',
  deliveryFee:
    market.deliveryFee != null
      ? String(market.deliveryFee)
      : String(DEFAULT_DELIVERY_FEE),
  displayOrder: market.displayOrder != null ? String(market.displayOrder) : '0',
  active: market.active !== false,
});

/** Parses a number field; blank or non-numeric gives null. */
export const parseNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const isBlank = (value: string) => value.trim() === '';

const checkLatLng = (
  lat: string,
  lng: string,
  required: boolean
): { lat?: string; lng?: string } => {
  const errors: { lat?: string; lng?: string } = {};
  if (!required && isBlank(lat) && isBlank(lng)) return errors;

  const latNum = parseNumber(lat);
  const lngNum = parseNumber(lng);
  if (latNum === null) {
    errors.lat = isBlank(lat) ? 'Latitude is required' : 'Must be a number';
  } else if (latNum < -90 || latNum > 90) {
    errors.lat = 'Latitude must be between -90 and 90';
  }
  if (lngNum === null) {
    errors.lng = isBlank(lng) ? 'Longitude is required' : 'Must be a number';
  } else if (lngNum < -180 || lngNum > 180) {
    errors.lng = 'Longitude must be between -180 and 180';
  }
  return errors;
};

const checkInteger = (value: string): string | undefined => {
  if (isBlank(value)) return undefined;
  const parsed = parseNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    return 'Must be a whole number';
  }
  return undefined;
};

export const validateMarketForm = (
  values: MarketFormValues
): FormErrors<MarketFormValues> => {
  const errors: FormErrors<MarketFormValues> = {};
  if (isBlank(values.name)) errors.name = 'Name is required';

  const center = checkLatLng(values.centerLat, values.centerLng, true);
  if (center.lat) errors.centerLat = center.lat;
  if (center.lng) errors.centerLng = center.lng;

  const radius = parseNumber(values.radiusKm);
  if (radius === null) {
    errors.radiusKm = isBlank(values.radiusKm)
      ? 'Radius is required'
      : 'Must be a number';
  } else if (radius <= 0) {
    errors.radiusKm = 'Radius must be greater than 0';
  }

  if (!isBlank(values.deliveryFee)) {
    const fee = parseNumber(values.deliveryFee);
    if (fee === null) errors.deliveryFee = 'Must be a number';
    else if (fee < 0) errors.deliveryFee = 'Delivery fee must be 0 or more';
  }

  const displayOrder = checkInteger(values.displayOrder);
  if (displayOrder) errors.displayOrder = displayOrder;
  return errors;
};

/** Assumes validateMarketForm passed. Blank optional fields are sent as null. */
export const marketFormToRequest = (
  values: MarketFormValues
): MarketRequest => ({
  name: values.name.trim(),
  center: {
    lat: parseNumber(values.centerLat) as number,
    lng: parseNumber(values.centerLng) as number,
  },
  radiusKm: parseNumber(values.radiusKm) as number,
  deliveryFee: parseNumber(values.deliveryFee),
  displayOrder: parseNumber(values.displayOrder),
  active: values.active,
});

// -------------------------------------------------------- opening hours

/** One row of the opening-hours editor (D15). Times are "HH:mm" (24h). */
export interface ScheduleRowForm {
  day: WeekDay;
  open: string;
  close: string;
  closed: boolean;
}

export const DEFAULT_OPEN_TIME = '11:00';
export const DEFAULT_CLOSE_TIME = '23:00';

export const DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

/** 24h "HH:mm", 00:00–23:59 (the server's rule). */
export const isValidTime = (value: string): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** All 7 days open 11:00–23:00: the prefill when hours are switched on. */
export const defaultScheduleRows = (): ScheduleRowForm[] =>
  WEEK_DAYS.map((day) => ({
    day,
    open: DEFAULT_OPEN_TIME,
    close: DEFAULT_CLOSE_TIME,
    closed: false,
  }));

/**
 * Editor rows from a stored schedule, always Mon..Sun. A missing day gets the
 * default hours; null/empty gives the default rows.
 */
export const scheduleToRows = (
  schedule?: DaySchedule[] | null
): ScheduleRowForm[] =>
  WEEK_DAYS.map((day) => {
    const entry = schedule?.find((item) => item.day === day);
    return {
      day,
      open: entry?.open || DEFAULT_OPEN_TIME,
      close: entry?.close || DEFAULT_CLOSE_TIME,
      closed: Boolean(entry?.closed),
    };
  });

/** "Copy Monday to all days": every row gets the first row's hours. */
export const copyFirstDayToAll = (
  rows: ScheduleRowForm[]
): ScheduleRowForm[] => {
  const [first] = rows;
  if (!first) return rows;
  return rows.map((row) => ({
    ...row,
    open: first.open,
    close: first.close,
    closed: first.closed,
  }));
};

/** Small hint under a row: overnight, 24 hours, or null. */
export const scheduleRowHint = (row: ScheduleRowForm): string | null => {
  if (row.closed || !isValidTime(row.open) || !isValidTime(row.close)) {
    return null;
  }
  if (row.open === row.close) return '24 hours';
  if (row.close < row.open) return 'Closes after midnight';
  return null;
};

/**
 * Per-row errors (index-aligned; undefined = ok). Closed days aren't checked:
 * their times are ignored, and invalid ones are replaced by the defaults.
 */
export const validateScheduleRows = (
  rows: ScheduleRowForm[]
): (string | undefined)[] =>
  rows.map((row) => {
    if (row.closed) return undefined;
    if (!isValidTime(row.open)) return 'Open time must be HH:mm';
    if (!isValidTime(row.close)) return 'Close time must be HH:mm';
    return undefined;
  });

/** Error for the whole schedule: all 7 days exactly once, valid times. */
export const scheduleError = (rows: ScheduleRowForm[]): string | undefined => {
  const days = rows.map((row) => row.day);
  const allDays =
    rows.length === WEEK_DAYS.length &&
    WEEK_DAYS.every((day) => days.filter((d) => d === day).length === 1);
  if (!allDays) return 'Opening hours need every day, Monday to Sunday';
  const rowErrors = validateScheduleRows(rows);
  const index = rowErrors.findIndex(Boolean);
  return index >= 0
    ? `${DAY_LABELS[rows[index].day]}: ${rowErrors[index]}`
    : undefined;
};

/** Request entries, Mon..Sun. Closed days with bad times get the defaults. */
export const scheduleRowsToRequest = (rows: ScheduleRowForm[]): DaySchedule[] =>
  WEEK_DAYS.map((day) => {
    const row = rows.find((item) => item.day === day);
    if (!row) {
      return {
        day,
        open: DEFAULT_OPEN_TIME,
        close: DEFAULT_CLOSE_TIME,
        closed: true,
      };
    }
    return {
      day,
      open: isValidTime(row.open) ? row.open : DEFAULT_OPEN_TIME,
      close: isValidTime(row.close) ? row.close : DEFAULT_CLOSE_TIME,
      closed: row.closed,
    };
  });

// ------------------------------------------------------------ restaurants

export interface RestaurantFormValues {
  name: string;
  slug: string;
  marketId: string;
  phone: string;
  address: string;
  locationLat: string;
  locationLng: string;
  imageUrl: string;
  cuisineTags: string[];
  commissionPercent: string;
  discountSharePercent: string;
  displayOrder: string;
  active: boolean;
  /** Opening hours set? Off = always open (no weeklySchedule). */
  hoursEnabled: boolean;
  /**
   * The restaurant already has a stored schedule. A PUT can't clear it
   * (null/omitted keeps it, D15), so the editor stays on.
   */
  hasStoredSchedule: boolean;
  schedule: ScheduleRowForm[];
  acceptingOrders: boolean;
}

export const emptyRestaurantForm = (marketId = ''): RestaurantFormValues => ({
  name: '',
  slug: '',
  marketId,
  phone: '',
  address: '',
  locationLat: '',
  locationLng: '',
  imageUrl: '',
  cuisineTags: [],
  commissionPercent: '0',
  discountSharePercent: '0',
  displayOrder: '0',
  active: true,
  hoursEnabled: false,
  hasStoredSchedule: false,
  schedule: defaultScheduleRows(),
  acceptingOrders: true,
});

export const restaurantToForm = (
  restaurant: RestaurantAdmin
): RestaurantFormValues => ({
  name: restaurant.name ?? '',
  slug: restaurant.slug ?? '',
  marketId: restaurant.marketId ?? '',
  phone: restaurant.phone ?? '',
  address: restaurant.address ?? '',
  locationLat:
    restaurant.location?.lat != null ? String(restaurant.location.lat) : '',
  locationLng:
    restaurant.location?.lng != null ? String(restaurant.location.lng) : '',
  imageUrl: restaurant.imageUrl ?? '',
  cuisineTags: restaurant.cuisineTags ?? [],
  commissionPercent: String(restaurant.commissionPercent ?? 0),
  discountSharePercent: String(restaurant.discountSharePercent ?? 0),
  displayOrder: String(restaurant.displayOrder ?? 0),
  active: restaurant.active !== false,
  hoursEnabled: Boolean(restaurant.weeklySchedule?.length),
  hasStoredSchedule: Boolean(restaurant.weeklySchedule?.length),
  schedule: scheduleToRows(restaurant.weeklySchedule),
  acceptingOrders: restaurant.acceptingOrders !== false,
});

/**
 * Client-side preview of the backend slug rule: lower-case, accents removed,
 * apostrophes dropped, other non-alphanumerics collapsed to "-".
 * "Bob's Café" → "bobs-cafe". The server stays the source of truth.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const checkPercent = (value: string): string | undefined => {
  if (isBlank(value)) return undefined;
  const parsed = parseNumber(value);
  if (parsed === null) return 'Must be a number';
  if (parsed < 0 || parsed > 100) return 'Must be between 0 and 100';
  return undefined;
};

export const validateRestaurantForm = (
  values: RestaurantFormValues
): FormErrors<RestaurantFormValues> => {
  const errors: FormErrors<RestaurantFormValues> = {};
  if (isBlank(values.name)) errors.name = 'Name is required';
  if (isBlank(values.phone)) errors.phone = 'Phone is required';
  if (isBlank(values.marketId)) errors.marketId = 'Market is required';

  if (!isBlank(values.slug) && slugify(values.slug) === '') {
    errors.slug = 'Slug must contain letters or numbers';
  }

  // Location is optional, but if one coordinate is given both are needed.
  const location = checkLatLng(values.locationLat, values.locationLng, false);
  if (location.lat) errors.locationLat = location.lat;
  if (location.lng) errors.locationLng = location.lng;

  const commission = checkPercent(values.commissionPercent);
  if (commission) errors.commissionPercent = commission;
  const discountShare = checkPercent(values.discountSharePercent);
  if (discountShare) errors.discountSharePercent = discountShare;

  const displayOrder = checkInteger(values.displayOrder);
  if (displayOrder) errors.displayOrder = displayOrder;

  if (values.hoursEnabled) {
    const hours = scheduleError(values.schedule);
    if (hours) errors.schedule = hours;
  }
  return errors;
};

/**
 * Assumes validateRestaurantForm passed. Opening hours (D15):
 * - hours on → the 7-day `weeklySchedule`;
 * - hours off on CREATE → `weeklySchedule: null` (always open);
 * - hours off on EDIT → omitted, so the server keeps the stored value.
 */
export const restaurantFormToRequest = (
  values: RestaurantFormValues,
  { isCreate = false }: { isCreate?: boolean } = {}
): RestaurantRequest => {
  const lat = parseNumber(values.locationLat);
  const lng = parseNumber(values.locationLng);
  const hours: Pick<RestaurantRequest, 'weeklySchedule'> = values.hoursEnabled
    ? { weeklySchedule: scheduleRowsToRequest(values.schedule) }
    : isCreate
      ? { weeklySchedule: null }
      : {};
  return {
    ...hours,
    acceptingOrders: values.acceptingOrders,
    name: values.name.trim(),
    slug: values.slug.trim(),
    marketId: values.marketId,
    phone: values.phone.trim(),
    // Blank optional text is sent as null so an untouched field stays null.
    address: values.address.trim() || null,
    location: lat !== null && lng !== null ? { lat, lng } : null,
    imageUrl: values.imageUrl.trim() || null,
    cuisineTags: values.cuisineTags.map((tag) => tag.trim()).filter(Boolean),
    commissionPercent: parseNumber(values.commissionPercent),
    discountSharePercent: parseNumber(values.discountSharePercent),
    displayOrder: parseNumber(values.displayOrder),
    active: values.active,
  };
};

export const hasErrors = <T>(errors: FormErrors<T>): boolean =>
  Object.values(errors).some(Boolean);

// ------------------------------------------------------ deactivation hints

/** Warnings to show before a restaurant goes from active to inactive. */
export const restaurantDeactivationWarnings = (
  restaurantId: string | undefined,
  restaurantName: string
): string[] => {
  const warnings = [
    `All of ${restaurantName || 'this restaurant'}'s menu items will be hidden from the storefront. Admins still see them in the Menu tab.`,
  ];
  if (restaurantId === DEFAULT_RESTAURANT_ID) {
    warnings.push(
      `This is the default restaurant (${DEFAULT_RESTAURANT_ID}). Legacy menu items without a restaurant belong to it, so the whole current menu will disappear from the storefront.`
    );
  }
  return warnings;
};

/** Warnings to show before a market goes from active to inactive. */
export const marketDeactivationWarnings = (
  marketId: string | undefined,
  marketName: string,
  restaurantCount: number
): string[] => {
  const warnings = [
    `Every restaurant in ${marketName || 'this market'} (${restaurantCount}) and all of their menu items will be hidden from the storefront.`,
  ];
  if (marketId === DEFAULT_MARKET_ID) {
    warnings.push(
      `This is the default market (${DEFAULT_MARKET_ID}). Legacy menu items count as being in it, so the whole current menu will disappear from the storefront.`
    );
  }
  return warnings;
};

// ------------------------------------------------------------- menu items

/** An item's restaurant id as the backend resolves it (legacy → `bobs`). */
export const resolveRestaurantId = (restaurantId?: string | null): string =>
  restaurantId && restaurantId.trim() ? restaurantId : DEFAULT_RESTAURANT_ID;

export type ItemVisibilityIssue = 'restaurant-inactive' | 'market-inactive';

/**
 * Why an item is hidden from the storefront by the §5.3 rules (null = shown):
 * its restaurant exists and is inactive, or its restaurant's market exists and
 * is inactive. A restaurant with no record yet counts as being in `market1`.
 */
export const itemVisibilityIssue = (
  restaurantId: string | undefined | null,
  restaurantsById: Record<string, Pick<RestaurantAdmin, 'active' | 'marketId'>>,
  marketsById: Record<string, Pick<MarketAdmin, 'active'>>
): ItemVisibilityIssue | null => {
  const restaurant = restaurantsById[resolveRestaurantId(restaurantId)];
  if (restaurant && !restaurant.active) return 'restaurant-inactive';
  const market =
    marketsById[restaurant ? restaurant.marketId : DEFAULT_MARKET_ID];
  if (market && !market.active) return 'market-inactive';
  return null;
};

export interface RestaurantOption {
  id: string;
  label: string;
}

/**
 * Options for the food-item restaurant selector. `bobs` is always offered
 * (the backend accepts it even before its record exists, §5.3), and so is the
 * item's current restaurant when it has no record.
 */
export const buildRestaurantOptions = (
  restaurants: Pick<RestaurantAdmin, 'id' | 'name' | 'active'>[],
  currentRestaurantId?: string
): RestaurantOption[] => {
  const options: RestaurantOption[] = restaurants.map((restaurant) => ({
    id: restaurant.id,
    label: `${restaurant.name}${restaurant.active ? '' : ' (inactive)'}`,
  }));
  const has = (id: string) => options.some((option) => option.id === id);
  if (!has(DEFAULT_RESTAURANT_ID)) {
    options.unshift({ id: DEFAULT_RESTAURANT_ID, label: "Bob's (default)" });
  }
  if (currentRestaurantId && !has(currentRestaurantId)) {
    options.push({ id: currentRestaurantId, label: currentRestaurantId });
  }
  return options;
};

/**
 * Warning for the create-restaurant form: before migration 001/004 has run
 * there is no `bobs` record, and creating one by hand would collide with it.
 */
export const bobsCollisionWarning = (
  values: Pick<RestaurantFormValues, 'name' | 'slug'>,
  restaurants: Pick<RestaurantAdmin, 'id'>[]
): string | null => {
  if (
    restaurants.some((restaurant) => restaurant.id === DEFAULT_RESTAURANT_ID)
  ) {
    return null;
  }
  const slug = values.slug.trim() ? slugify(values.slug) : slugify(values.name);
  if (slug !== DEFAULT_RESTAURANT_ID) return null;
  return `There is no "${DEFAULT_RESTAURANT_ID}" restaurant record yet. The data migration creates it (id "${DEFAULT_RESTAURANT_ID}") and assigns the existing menu to it. Run the migration instead of creating Bob's here, or the two will collide.`;
};

// ------------------------------------------------------ open-now status

export interface RestaurantOpenStatus {
  label: string;
  color: 'success' | 'default' | 'warning';
}

/**
 * Status chip from the server-computed fields (D15): "Paused" (orange),
 * "Open now" (green) or "Closed · <next opening>" (grey). Null for an
 * inactive restaurant (its Active chip says enough) or when the server
 * doesn't send `openNow` yet.
 */
export const restaurantOpenStatus = (
  restaurant: Pick<
    RestaurantAdmin,
    'active' | 'acceptingOrders' | 'openNow' | 'closedReason' | 'nextOpensLabel'
  >
): RestaurantOpenStatus | null => {
  if (!restaurant.active) return null;
  if (
    restaurant.closedReason === 'PAUSED' ||
    restaurant.acceptingOrders === false
  ) {
    return { label: 'Paused', color: 'warning' };
  }
  if (restaurant.openNow === undefined || restaurant.openNow === null) {
    return null;
  }
  if (restaurant.openNow) return { label: 'Open now', color: 'success' };
  const next = restaurant.nextOpensLabel;
  return {
    label: next && next !== 'Closed' ? `Closed · ${next}` : 'Closed',
    color: 'default',
  };
};
