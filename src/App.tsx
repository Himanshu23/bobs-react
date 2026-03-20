import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar } from '@mui/material';

import StaticLanding from './pages/staticLanding';
import FoodList from './pages/foodList';
import MenuPage from './pages/menuPage';
import Header from './pages/header';
import CartPage from './pages/cartPage';
import CheckoutPage from './pages/checkoutPage';

function App() {
  const shouldShowHeader =
    location.pathname !== '/bobs/landing' && location.pathname !== '/bobs/menu';

  return (
    <Router>
      {shouldShowHeader && (
        <AppBar position="static">
          <Header />
        </AppBar>
      )}
      <Routes>
        <Route path="/bobs/landing" element={<StaticLanding />} />
        <Route path="/bobs/foodList" element={<FoodList />} />
        <Route path="/" element={<StaticLanding />} />
        <Route path="/bobs/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
