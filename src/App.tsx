import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar } from '@mui/material';

import LandingPage from './pages/landing';
import FoodList from './pages/foodList';
import Header from './pages/header';
import CartPage from './pages/cartPage';
import CheckoutPage from './pages/checkoutPage';

function App() {
  const shouldShowHeader = location.pathname !== '/bobs/landing';

  return (
    <Router>
      {shouldShowHeader && (
        <AppBar position="static">
          <Header />
        </AppBar>
      )}
      <Routes>
        <Route path="/bobs/landing" element={<LandingPage />} />
        <Route path="/bobs/foodList" element={<FoodList />} />
        <Route path="/" element={<FoodList />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
