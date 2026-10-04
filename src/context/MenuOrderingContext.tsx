import { createContext, useContext } from 'react';

/**
 * Whether the menu being browsed takes orders now (D15). When the restaurant
 * is closed, the menu stays browsable but add/remove controls are disabled.
 * Outside a restaurant menu it defaults to orderable.
 */
export interface MenuOrdering {
  orderable: boolean;
  /** e.g. "Closed now · Opens tomorrow at 11:00 AM"; null when open. */
  closedText: string | null;
}

const MenuOrderingContext = createContext<MenuOrdering>({
  orderable: true,
  closedText: null,
});

export const MenuOrderingProvider = MenuOrderingContext.Provider;

export const useMenuOrdering = () => useContext(MenuOrderingContext);
