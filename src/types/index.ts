export interface FoodItem {
  id: string;
  name: string;
  description: string;
  veg: boolean;
  rating: number;
  image: string;
  priceOptions: {
    size?: {
      [key: string]: number; // e.g., { "Full": 500, "Half": 300, "Quarter": 200 }
    };
    type?: {
      [key: string]: number; // e.g., { "Dry": 400, "Gravy": 450 }
    };
    base?: {
      [key: string]: number; // e.g., { "Paratha": 50, "Roomali": 40 }
    };
  };
  wasPrice?: number;
  nowPrice?: number;
}

export interface ItemOptions{
  size: 'Full' | 'Half' | 'Quarter';
  style?: 'Gravy' | 'Dry';
  base?: 'Paratha' | 'Roomali';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  // veg: boolean;
  // rating: number;
  // wasPrice: number;
  // nowPrice: number;
  quantity: number;
  option?: ItemOptions;
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
  