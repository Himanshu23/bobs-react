import { createContext, useContext } from 'react';
import { CartRestaurantRef } from '../utils/cartUtils';

/**
 * The restaurant whose menu is being browsed. Components that add to the cart
 * (e.g. the product detail drawer) read it to stamp restaurant data on items.
 */
const CurrentRestaurantContext = createContext<CartRestaurantRef | null>(null);

export const CurrentRestaurantProvider = CurrentRestaurantContext.Provider;

export const useCurrentRestaurant = () => useContext(CurrentRestaurantContext);
