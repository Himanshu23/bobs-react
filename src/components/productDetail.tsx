import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/store';
import { Box, Button, Typography, Select, MenuItem } from '@mui/material';
import { useLocation } from 'react-router-dom';

const ProductDetail = () => {
  const location = useLocation();
  const { product } = location.state || {};   
  const [quantity, setQuantity] = useState(1);
  const [option, setOption] = useState('Full');
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      option
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <img src={product.image} alt={product.name} style={{ width: '300px', borderRadius: '10px' }} />
      <Typography variant="h5">{product.name}</Typography>
      <Typography>{product.description}</Typography>
      <Typography variant="h6">₹{product.price}</Typography>

      <Select value={option} onChange={(e) => setOption(e.target.value)}>
        <MenuItem value="Full">Full</MenuItem>
        <MenuItem value="Half">Half</MenuItem>
      </Select>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
        <Typography>{quantity}</Typography>
        <Button onClick={() => setQuantity(q => q + 1)}>+</Button>
      </Box>

      <Button variant="contained" color="primary" onClick={handleAddToCart}>
        Add to Cart
      </Button>
    </Box>
  );
};

export default ProductDetail;
