import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import StaticLanding from './pages/staticLanding';
import RestaurantListPage from './pages/restaurantListPage';
import RestaurantMenuPage from './pages/restaurantMenuPage';
import Header from './pages/header';
import CartPage from './pages/cartPage';
import CheckoutPage from './pages/checkoutPage';
import AdminPage from './pages/adminPage';
import LoginPage from './pages/LoginPage';
import AddressesPage from './pages/addressesPage';
import AddAddressPage from './pages/addAddressPage';
import ProtectedRoute from './components/ProtectedRoute';
import AddressConfirmDialog from './components/address/AddressConfirmDialog';
import { AddressProvider, useAddressBook } from './context/AddressContext';
import { CartGuardProvider } from './context/CartGuardContext';
import { RestaurantHeaderProvider } from './context/RestaurantHeaderContext';
import { isBrowsePath } from './utils/marketplaceRoutes';
import { DEFAULT_RESTAURANT_ID } from './types/marketplace';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import { getPageTitle, isPageViewSentByPage } from './utils/analyticsConfig';
import { queryClient } from './admin/api/queryClient';
import PromotionalAddonLaunchDialog, {
  usePromotionalAddonLaunch,
} from './components/promotionalAddons/PromotionalAddonLaunchDialog';
import {
  hasShownAddressConfirmThisSession,
  markAddressConfirmShownThisSession,
} from './utils/addressStorage';

function AddressLaunchDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAddress, addresses } = useAddressBook();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      isBrowsePath(location.pathname) &&
      addresses.length > 0 &&
      selectedAddress &&
      !hasShownAddressConfirmThisSession()
    ) {
      setOpen(true);
      markAddressConfirmShownThisSession();
    }
  }, [location.pathname, addresses.length, selectedAddress]);

  if (!selectedAddress) {
    return null;
  }

  return (
    <AddressConfirmDialog
      open={open}
      address={selectedAddress}
      onConfirm={() => setOpen(false)}
      onChange={() => {
        setOpen(false);
        navigate(`/addresses?return=${encodeURIComponent(location.pathname)}`);
      }}
    />
  );
}

function AppLayout() {
  const location = useLocation();
  const isMenuLaunch = isBrowsePath(location.pathname);
  const promoLaunch = usePromotionalAddonLaunch(isMenuLaunch);
  const shouldShowHeader =
    location.pathname !== '/bobs/landing' &&
    location.pathname !== '/bobs/menu' &&
    !location.pathname.startsWith('/addresses');

  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Title + one page_view per route change. Restaurant menus send their own
  // once the restaurant name (the title) is known: see RestaurantMenuPage.
  // The ref keeps StrictMode's double effect from sending it twice.
  const lastPageViewRef = useRef<string | null>(null);
  useEffect(() => {
    const page = `${location.pathname}${location.search}`;
    const isNewPage = lastPageViewRef.current !== page;
    lastPageViewRef.current = page;
    // Menu pages set their own title and page_view (this effect runs after
    // theirs, so don't overwrite the restaurant title).
    if (isPageViewSentByPage(location.pathname)) return;
    document.title = getPageTitle(location.pathname);
    if (isNewPage) {
      trackPageView(page, document.title);
    }
  }, [location.pathname, location.search]);

  return (
    <>
      {shouldShowHeader && <Header />}
      <div
        style={{
          paddingTop: shouldShowHeader ? 0 : 'env(safe-area-inset-top, 0px)',
        }}
      >
        <Routes>
          {/* Browsing (D11): market → restaurant list → one restaurant's menu */}
          <Route path="/" element={<RestaurantListPage />} />
          <Route path="/m/:marketId" element={<RestaurantListPage />} />
          <Route path="/m/:marketId/r/:slug" element={<RestaurantMenuPage />} />
          {/* Legacy links and QR codes: Bob's own menu */}
          <Route path="/bobs/landing" element={<StaticLanding />} />
          <Route
            path="/bobs/foodList"
            element={<RestaurantMenuPage slug={DEFAULT_RESTAURANT_ID} />}
          />
          <Route
            path="/bobs"
            element={<RestaurantMenuPage slug={DEFAULT_RESTAURANT_ID} />}
          />
          <Route
            path="/bobs/menu"
            element={<RestaurantMenuPage slug={DEFAULT_RESTAURANT_ID} />}
          />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/addresses/new" element={<AddAddressPage />} />
          <Route path="/addresses/:id/edit" element={<AddAddressPage />} />
          <Route
            path="/bobs/admin/login"
            element={
              <LoginPage
                onLoginSuccess={() => (window.location.href = '/bobs/admin')}
              />
            }
          />
          <Route
            path="/bobs/admin"
            element={<ProtectedRoute element={<AdminPage />} />}
          />
        </Routes>
      </div>
      <AddressLaunchDialog />
      <PromotionalAddonLaunchDialog
        open={promoLaunch.open}
        onClose={promoLaunch.close}
        onBrowseMenu={promoLaunch.close}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AddressProvider>
          <CartGuardProvider>
            <RestaurantHeaderProvider>
              <AppLayout />
            </RestaurantHeaderProvider>
          </CartGuardProvider>
        </AddressProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
