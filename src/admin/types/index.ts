import { Discount } from '../../data/discounts';
import { FoodItem } from '../../types';

export interface AdminOrderItem {
  name: string;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  deliveryMethod: 'delivery' | 'pickup';
  address: string;
  status: 'new' | 'preparing' | 'ready' | 'completed';
  total: number;
  createdAt: string;
  items: AdminOrderItem[];
}

// export interface AdminMenuItem {
//   id: string;
//   name: string;
//   category: string;
//   veg: boolean;
//   image: string;
//   price: number;
//   available: boolean;
// }

export interface AdminDashboardData {
  orders: AdminOrder[];
  menuItems: FoodItem[];
  discounts: Discount[];
}
