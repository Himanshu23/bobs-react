import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import StaticLanding from './pages/staticLanding';
import FoodList from './pages/foodList';
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
import { initializeAnalytics, trackPageView } from './utils/analytics';
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
    const isFoodList =
      location.pathname === '/bobs/foodList' ||
      location.pathname === '/bobs' ||
      location.pathname === '/bobs/menu';

    if (
      isFoodList &&
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
        navigate('/addresses?return=/bobs/foodList');
      }}
    />
  );
}

function AppLayout() {
  const location = useLocation();
  const isMenuLaunch =
    location.pathname === '/bobs/foodList' ||
    location.pathname === '/bobs' ||
    location.pathname === '/bobs/menu';
  const promoLaunch = usePromotionalAddonLaunch(isMenuLaunch);
  const shouldShowHeader =
    location.pathname !== '/bobs/landing' &&
    location.pathname !== '/bobs/menu' &&
    location.pathname !== '/' &&
    !location.pathname.startsWith('/addresses');

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
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
          <Route path="/" element={<Navigate to="/bobs/foodList" replace />} />
          <Route path="/bobs/landing" element={<StaticLanding />} />
          <Route path="/bobs/foodList" element={<FoodList />} />
          <Route path="/bobs" element={<FoodList />} />
          <Route path="/bobs/menu" element={<FoodList />} />
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
          <AppLayout />
        </AddressProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
