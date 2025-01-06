export interface FoodItem {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    veg: boolean;
    rating: number;
    wasPrice: number;
    nowPrice: number;
  }
  
  export interface CartItem extends FoodItem{
    quantity: number;
    option: string;
  }
  
  export interface CartState {
    items: CartItem[];
    totalItems: number;
  }
  