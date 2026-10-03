import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { CartItem } from '../types';
import {
  AppDispatch,
  RootState,
  addToCart,
  startNewCartWith,
} from '../redux/store';
import { getMarketGuardDecision, normalizeCartItem } from '../utils/cartUtils';
import { useMarkets } from '../data/hooks/useMarkets';
import { trackEvent } from '../utils/analytics';

interface CartGuardContextValue {
  /**
   * Adds an item to the cart, asking first when it comes from a different
   * market than the current cart (D5).
   */
  addToCartGuarded: (item: CartItem) => void;
}

const CartGuardContext = createContext<CartGuardContextValue | null>(null);

interface PendingAdd {
  item: CartItem;
  cartMarketId: string;
}

export function CartGuardProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { data: markets } = useMarkets();
  const [pending, setPending] = useState<PendingAdd | null>(null);

  const addToCartGuarded = useCallback(
    (rawItem: CartItem) => {
      const item = normalizeCartItem(rawItem);
      const decision = getMarketGuardDecision(cartItems, item.marketId);
      if (decision.type === 'conflict') {
        trackEvent('cart_market_conflict', {
          cart_market_id: decision.cartMarketId,
          item_market_id: item.marketId,
        });
        setPending({ item, cartMarketId: decision.cartMarketId });
        return;
      }
      dispatch(addToCart(item));
    },
    [cartItems, dispatch]
  );

  const value = useMemo(() => ({ addToCartGuarded }), [addToCartGuarded]);

  const cartMarketName = pending
    ? (markets?.find((market) => market.id === pending.cartMarketId)?.name ??
      pending.cartMarketId)
    : '';

  const handleKeep = () => setPending(null);
  const handleStartNew = () => {
    if (pending) {
      trackEvent('cart_market_start_new', {
        previous_market_id: pending.cartMarketId,
        market_id: pending.item.marketId,
      });
      dispatch(startNewCartWith(pending.item));
    }
    setPending(null);
  };

  return (
    <CartGuardContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(pending)} onClose={handleKeep}>
        <DialogTitle>Start a new cart?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your cart has items from {cartMarketName}. Start a new cart? Your
            current cart will be cleared.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKeep}>Keep current cart</Button>
          <Button variant="contained" onClick={handleStartNew}>
            Start new cart
          </Button>
        </DialogActions>
      </Dialog>
    </CartGuardContext.Provider>
  );
}

/**
 * Guarded add-to-cart. Outside a provider it falls back to a plain dispatch,
 * so components keep working in isolation.
 */
export const useGuardedAddToCart = () => {
  const context = useContext(CartGuardContext);
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    (item: CartItem) => {
      if (context) {
        context.addToCartGuarded(item);
      } else {
        dispatch(addToCart(item));
      }
    },
    [context, dispatch]
  );
};
