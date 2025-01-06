import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar } from '@mui/material';

import LandingPage from './pages/landing';
import FoodList from './pages/foodList';
import Header from './pages/header';
import CartPage from './pages/cartPage';
import ProductDetail from './components/productDetail';

function App() {
  const [cart, setCart] = useState<any>({ items: [], totalItems: 0 }); // Make cart state more structured
  return (
    <Router>
      <AppBar position="static">
        <Header />
      </AppBar>

      <Routes>
        <Route path="/bobs/landing" element={<LandingPage />} />
        <Route path="/bobs/foodList" element={<FoodList  />} />
        <Route path="/" element={<FoodList  />} />
        <Route path="/cart" element={<CartPage  />} />
        <Route path="/product" element={<ProductDetail  />}/>
      </Routes>
    </Router>
  );
}

export default App;
