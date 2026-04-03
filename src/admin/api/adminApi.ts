// import foodItemsData from '../../data/foodItems';
// import { DISCOUNTS } from '../../data/discounts';
// import { FoodItem } from '../../types';
// import { AdminDashboardData, AdminOrder } from '../types';

// const ADMIN_STORAGE_KEY = 'bob_admin_dashboard';

// const getDefaultMenuItems = (): AdminMenuItem[] =>
//   foodItemsData.foodItems.map((item: FoodItem) => ({
//     id: item.id,
//     name: item.name,
//     category: item.category,
//     veg: item.veg,
//     image: item.image,
//     price: Math.min(...Object.values(item.priceOptions.nowPrice.size)),
//     available: true,
//   }));

// const getDefaultOrders = (): AdminOrder[] => [
//   {
//     id: 'ORD-1001',
//     customerName: 'Rahul',
//     deliveryMethod: 'delivery',
//     address: 'Habitat Old - Tower A2, Flat 504',
//     status: 'new',
//     total: 548,
//     createdAt: '10 min ago',
//     items: [
//       { name: 'Paneer Butter Masala', quantity: 1 },
//       { name: 'Butter Naan', quantity: 2 },
//     ],
//   },
//   {
//     id: 'ORD-1002',
//     customerName: 'Aisha',
//     deliveryMethod: 'pickup',
//     address: 'Pickup counter',
//     status: 'preparing',
//     total: 398,
//     createdAt: '22 min ago',
//     items: [
//       { name: 'Veg Fried Rice', quantity: 1 },
//       { name: 'Cheese Garlic Naan', quantity: 1 },
//       { name: 'Plain Curd', quantity: 1 },
//     ],
//   },
//   {
//     id: 'ORD-1003',
//     customerName: 'Karan',
//     deliveryMethod: 'delivery',
//     address: 'Sector 63, Tower D6, Flat 1102',
//     status: 'ready',
//     total: 699,
//     createdAt: '35 min ago',
//     items: [
//       { name: 'Chicken Punjabi', quantity: 1 },
//       { name: 'Rumali Roti', quantity: 4 },
//     ],
//   },
//   {
//     id: 'ORD-1004',
//     customerName: 'Priya',
//     deliveryMethod: 'delivery',
//     address: 'DLF South Avenue, Tower 3, Apt 801',
//     status: 'completed',
//     total: 850,
//     createdAt: '1 hr ago',
//     items: [
//       { name: 'Dal Makhani', quantity: 1 },
//       { name: 'Butter Chicken', quantity: 1 },
//       { name: 'Garlic Naan', quantity: 3 },
//       { name: 'Gulab Jamun', quantity: 1 },
//     ],
//   },
// ];

// const getDefaultContent = (): AdminContentState => ({
//   heroinitializeStorage = (): AdminDashboardData => {
//   const data: AdminDashboardData = {
//     orders: getDefaultOrders(),
//     menuItems: getDefaultMenuItems(),
//     discounts: DISCOUNTS
//   localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
//   return data;
// };

// Validate credentials
export const validateAdminCredentials = (
  id: string,
  password: string
): boolean => {
  const validId = 'koko';
  const validPassword = 'koko102136';
  return id === validId && password === validPassword;
};

// Get dashboard data
// export const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
//   // Simulate network delay
//   await new Promise((resolve) => setTimeout(resolve, 500));

//   const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
//   if (stored) {
//     return JSON.parse(stored);
//   }
//   return initializeStorage();
// };

// Update order status
// export const updateAdminOrderStatus = async (
//   orderId: string,
//   status: AdminOrder['status']
// ): Promise<AdminDashboardData> => {
//   await new Promise((resolve) => setTimeout(resolve, 300));

//   const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
//   const data = stored ? JSON.parse(stored) : initializeStorage();

//   const order = data.orders.find((o) => o.id === orderId);
//   if (order) {
//     order.status = status;
//   }

//   localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
//   return data as AdminDashboardData;
// };

// Toggle menu item availability
// export const toggleAdminMenuItemAvailability = async (
//   itemId: string
// ): Promise<AdminDashboardData> => {
//   await new Promise((resolve) => setTimeout(resolve, 300));

//   const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
//   const data = stored ? JSON.parse(stored) : initializeStorage();

//   const item = data.menuItems.find((m) => m.id === itemId);
//   if (item) {
//     item.available = !item.available;
//   }

//   localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
//   return data as AdminDashboardData;
// };

// Toggle discount
// export const toggleAdminDiscount = async (
//   discountId: string
// ): Promise<AdminDashboardData> => {
//   await new Promise((resolve) => setTimeout(resolve, 300));

//   const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
//   const data: AdminDashboardData = stored
//     ? JSON.parse(stored)
//     : initializeStorage();

//   const discount = data.discounts.find((d) => d.id === discountId);
//   if (discount) {
//     discount.active = !discount.active;
//   }

//   localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
//   return data as AdminDashboardData;
// };
