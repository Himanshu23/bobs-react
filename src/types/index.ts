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
}

// Category order for display
export const CATEGORY_ORDER = [
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
];

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  veg: boolean;
  rating: number;
  image: string;
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
  name: string;
  quantity: number;
  unitPrice: number;
  size: string;
  style?: string;
  base?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  fulfillmentType: OrderFulfillmentType;
  scheduledTime?: string;
  items: OrderItem[];
  totalAmount: number;
  status?: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}
