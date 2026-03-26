import './App.css';
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { useEffect } from 'react';
import { AppBar } from '@mui/material';

import StaticLanding from './pages/staticLanding';
import FoodList from './pages/foodList';
//import MenuPage from './pages/menuPage';
import Header from './pages/header';
import CartPage from './pages/cartPage';
import CheckoutPage from './pages/checkoutPage';
import { initializeAnalytics, trackPageView } from './utils/analytics';

function AppLayout() {
  const location = useLocation();
  const shouldShowHeader =
    location.pathname !== '/bobs/landing' &&
    location.pathname !== '/bobs/menu' &&
    location.pathname !== '/';

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return (
    <>
      {shouldShowHeader && (
        <AppBar position="static">
          <Header />
        </AppBar>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/bobs" replace />} />
        <Route path="/bobs/landing" element={<StaticLanding />} />
        <Route path="/bobs/foodList" element={<FoodList />} />
        <Route path="/bobs" element={<FoodList />} />
        <Route path="/bobs/menu" element={<FoodList />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
