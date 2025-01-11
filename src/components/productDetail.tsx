import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/store";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Drawer,
  IconButton,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ProductDetailModal = ({ open, onClose, product }: any) => {
  const dispatch = useDispatch();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("Full");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBase, setSelectedBase] = useState("");

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        // type: selectedType,
        // base: selectedBase,
        price: (selectedSize ? product.priceOptions.size[selectedSize] : 0) +
          (selectedType ? product.priceOptions.type[selectedType] : 0) +
          (selectedBase ? product.priceOptions.base[selectedBase] : 0),
        image: product.image,
        quantity,
        option: {
          size: 'Full',
          style: 'Dry',
          base: 'Paratha'
        }
      })
    );
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: "16px 16px 0 0", padding: 2 } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h5">{product.name}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <img
          src={product.image}
          alt={product.name}
          style={{ width: "300px", borderRadius: "10px" }}
        />
        <Typography variant="body1">{product.description}</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {/* Size Options */}
          {product.priceOptions.size && (
  <Card>
    <CardContent>
      <Typography variant="h6">Select Size</Typography>
      <FormControl component="fieldset">
        <RadioGroup
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
        >
          {Object.entries(product.priceOptions.size).map(([size, price]) => (
            <FormControlLabel
              key={size}
              value={size}
              control={<Radio />}
              label={`${size} - ₹${price}`}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </CardContent>
  </Card>
)}


          {/* Type Options */}
          {product.priceOptions.type && (
            <Card>
              <CardContent>
                <Typography variant="h6">Select Type</Typography>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  fullWidth
                >
                  {Object.entries(product.priceOptions.type).map(([type, price]) => (
                    <MenuItem key={type} value={type}>
                      {`${type} - ₹${price}`}
                    </MenuItem>
                  ))}
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Base Options */}
          {product.priceOptions.base && (
            <Card>
              <CardContent>
                <Typography variant="h6">Select Base</Typography>
                <Select
                  value={selectedBase}
                  onChange={(e) => setSelectedBase(e.target.value)}
                  fullWidth
                >
                  {Object.entries(product.priceOptions.base).map(([base, price]) => (
                    <MenuItem key={base} value={base}>
                      {`${base} - ₹${price}`}
                    </MenuItem>
                  ))}
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Quantity */}
          {product.priceOptions.size && (
            <Card>
              <CardContent>
                <Typography variant="h6">Quantity</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</Button>
                  <Typography>{quantity}</Typography>
                  <Button onClick={() => setQuantity((q) => q + 1)}>+</Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Add to Cart */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleAddToCart}
          disabled={
            (product.priceOptions.size && !selectedSize) ||
            (product.priceOptions.type && !selectedType) ||
            (product.priceOptions.base && !selectedBase)
          }
        >
          Add to Cart
        </Button>
      </Box>
    </Drawer>
  );
};

export default ProductDetailModal;
