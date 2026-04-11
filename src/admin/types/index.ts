import { Discount } from '../../data/discounts';
import { FoodItem } from '../../types';

export interface AdminOrderItem {
  foodItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  size: string;
  style?: string;
  base?: string;
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

export interface AdminDashboardData {
  orders: AdminOrder[];
  menuItems: FoodItem[];
  discounts: Discount[];
}
