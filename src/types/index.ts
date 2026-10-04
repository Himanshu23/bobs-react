type TypeKey = Exclude<ItemOptions['style'], undefined>;
type BaseKey = Exclude<ItemOptions['base'], undefined>;

export enum FoodCategory {
  Starters = 'Starters',
  MainCourse = 'Main Course',
  Chinese = 'Chinese',
  Breads = 'Breads',
  ChineseRice = 'Chinese Rice',
  Noodles = 'Noodles',
  Rolls = 'Rolls',
  Sides = 'Sides',
  Momos = 'Momos',
  Burgers = 'Burgers',
  Soups = 'Soups',
  Rice = 'Rice',
  COMBO = 'COMBO',
  Drinks = 'Drinks',
  Coffee = 'Coffee',
  Shakes = 'Shakes',
  Waffles = 'Waffles',
  Sandwiches = 'Sandwiches',
  IceCream = 'Ice Cream',
}

// Category order for display
export const CATEGORY_ORDER = [
  FoodCategory.COMBO,
  FoodCategory.Starters,
  FoodCategory.MainCourse,
  FoodCategory.Chinese,
  FoodCategory.ChineseRice,
  FoodCategory.Noodles,
  FoodCategory.Momos,
  FoodCategory.Rolls,
  FoodCategory.Burgers,
  FoodCategory.Soups,
  FoodCategory.Breads,
  FoodCategory.Rice,
  FoodCategory.Sides,
  FoodCategory.Drinks,
  FoodCategory.Coffee,
  FoodCategory.Shakes,
  FoodCategory.Waffles,
  FoodCategory.Sandwiches,
  FoodCategory.IceCream,
];

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  veg: boolean;
  rating: number;
  reorderCount?: number;
  image: string;
  /** Whether customers can currently order this item. Missing means available for legacy records. */
  available?: boolean;
  category: FoodCategory;
  priceOptions: {
    wasPrice: {
      size: Partial<Record<ItemOptions['size'], number>>;
      type?: Record<TypeKey, number>;
      base?: Record<BaseKey, number>;
    };
    nowPrice: {
      size: Partial<Record<ItemOptions['size'], number>>;
      type?: Record<TypeKey, number>;
      base?: Record<BaseKey, number>;
    };
  };
  freeClaimPortion?: ItemOptions['size'] | null;
  /**
   * Owning restaurant. The backend always sends it (legacy items resolve to
   * `bobs`); optional here so older cached/static data still type-checks.
   */
  restaurantId?: string;
}

export interface ItemOptions {
  size: 'Full' | 'Half' | 'Quarter';
  style?: 'Gravy' | 'Dry';
  base?: 'Paratha' | 'Roomali';
}

export type CartActions = 'Add' | 'Remove';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  product: FoodItem;
  // veg: boolean;
  // rating: number;
  // wasPrice: number;
  // nowPrice: number;
  quantity: number;
  option: ItemOptions;
  isFreeClaim?: boolean;
  /** Item added via the ₹9 steal-deals promotion */
  isPromotionalAddon?: boolean;
  /** Regular price before promotional discount — shown struck-through in cart */
  originalPrice?: number;
  /** Restaurant the item was added from. Part of the cart line identity. */
  restaurantId?: string;
  /** Snapshot of the restaurant name, for grouping the cart. */
  restaurantName?: string;
  /** Market (cart scope, D5) of the restaurant. */
  marketId?: string;
  priceOptions?: {
    size: {
      full?: number;
      half?: number;
      quarter?: number;
    };
    style: {
      gravy?: number;
      dry?: number;
    };
    base: {
      paratha?: number;
      roomali?: number;
    };
  };
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
}

// Order Types
export enum OrderFulfillmentType {
  PICKUP = 'PICKUP',
  SCHEDULED = 'SCHEDULED',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  foodItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  size: string;
  style?: string;
  base?: string;
  isPromotionalAddon?: boolean;
  isFreeClaim?: boolean;
  originalPrice?: number;
  /** Dish category, stamped by the server on newer orders (size labels). */
  category?: string | null;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  fulfillmentType: OrderFulfillmentType;
  scheduledTime?: string;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  discountCode?: string;
  discountName?: string;
  promotionalSavings?: number;
  deliveryFee?: number;
  taxAmount?: number;
  totalAmount: number;
  status?: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  isPaidOnline: boolean;
  /** Recorded by staff while logged in as admin: no delivery fee. */
  directSale?: boolean | null;
}

export interface OrderResponse {
  orders: Order[];
  totalAmount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  recurring: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  note?: string;
  madeBy: string;
  createdAt: string;
  updatedAt: string;
}
