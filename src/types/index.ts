type TypeKey = Exclude<ItemOptions['style'], undefined>;
type BaseKey = Exclude<ItemOptions['base'], undefined>;

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  veg: boolean;
  rating: number;
  image: string;
  category: string;
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
  // wasPrice?: number;
  // nowPrice?: number;
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
