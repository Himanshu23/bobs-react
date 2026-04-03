// import foodItemsData from '../data/foodItems';
// import { DISCOUNTS, Discount } from '../data/discounts';
// import { FoodItem } from '../types';

// export interface AdminOrderItem {
//   name: string;
//   quantity: number;
// }

// export interface AdminOrder {
//   id: string;
//   customerName: string;
//   deliveryMethod: 'delivery' | 'pickup';
//   address: string;
//   status: 'new' | 'preparing' | 'ready' | 'completed';
//   total: number;
//   createdAt: string;
//   items: AdminOrderItem[];
// }

// export interface AdminMenuItem {
//   id: string;
//   name: string;
//   category: string;
//   veg: boolean;
//   image: string;
//   price: number;
//   available: boolean;
// }

// export interface AdminDashboardData {
//   orders: AdminOrder[];
//   menuItems: AdminMenuItem[];
//   discounts: Discount[];
// }

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
//     featured: false,
//   }));

// const getDefaultOrders = (): AdminOrder[] => [
//   {
//     id: 'ORD-1001',
//     customerName: 'Rahul',
//     deliveryMethod: 'delivery',
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
// ];

// const getDefaultContent = (): AdminContentState => ({
//   heroTitle: "Bob's Kitchen Admin Preview",
//   heroSubtitle: 'Control menu visibility, track orders, and stage promotions.',
//   announcement: "Tonight's online special is live until 11:30 PM.",
//   featuredCategories: [],
// });

// const getDefaultDashboardData = (): AdminDashboardData => ({
//   orders: getDefaultOrders(),
//   menuItems: getDashboardData = (): AdminDashboardData => ({
//   orders: getDefaultOrders(),
//   menuItems: getDefaultMenuItems(),
//   discounts: DISCOUNTS.map((discount) => ({ ...discount })

//     return JSON.parse(saved) as AdminDashboardData;
//   } catch (error) {
//     console.error('Failed to load admin dashboard data:', error);
//     return getDefaultDashboardData();
//   }
// };

// const saveDashboardData = (data: AdminDashboardData): void => {
//   try {
//     localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
//   } catch (error) {
//     console.error('Failed to save admin dashboard data:', error);
//   }
// };

// const withLatency = async <T>(value: T): Promise<T> => {
//   await new Promise((resolve) => setTimeout(resolve, 180));
//   return value;
// };

// export const getAdminDashboardData = async (): Promise<AdminDashboardData> =>
//   withLatency(loadDashboardData());

// export const updateAdminOrderStatus = async (
//   orderId: string,
//   status: AdminOrder['status']
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.orders = nextData.orders.map((order) =>
//     order.id === orderId ? { ...order, status } : order
//   );
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };

// export const toggleAdminMenuItemAvailability = async (
//   itemId: string
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.menuItems = nextData.menuItems.map((item) =>
//     item.id === itemId ? { ...item, available: !item.available } : item
//   );
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };

// export const toggleAdminMenuItemFeatured = async (
//   itemId: string
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.menuItems = nextData.menuItems.map((item) =>
//     item.id === itemId ? { ...item, featured: !item.featured } : item
//   );
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };

// export const updateAdminMenuItemImage = async (
//   itemId: string,
//   image: string
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.menuItems = nextData.menuItems.map((item) =>
//     item.id === itemId ? { ...item, image: image.trim() } : item
//   );
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };

// export const toggleAdminDiscount = async (
//   discountId: string
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.discounts = nextData.discounts.map((discount) =>
//     discount.id === discountId
//       ? { ...discount, active: !discount.active }
//       : discount
//   );
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };

// export const updateAdminContent = async (
//   content: AdminContentState
// ): Promise<AdminDashboardData> => {
//   const nextData = loadDashboardData();
//   nextData.content = content;
//   saveDashboardData(nextData);
//   return withLatency(nextData);
// };
