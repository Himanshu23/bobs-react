import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Box,
  Button,
  Paper,
} from "@mui/material";
import { FoodItem } from "../types";
import { useState } from "react";

interface QuantityButtonsProps {
  product: FoodItem;
}
export const QuantityButtons = ({ product }: QuantityButtonsProps) => {
  const [quantity, setQuantity] = useState(1);
  return (
    <Card
      sx={{
        padding: "5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "55px",
        flexShrink: 0, // Prevents shrinking in flex container
      }}
    >
      <CardContent
        sx={{
          padding: "0px !important",
          textAlign: "center",
          width: "50%",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Button
            sx={{ minWidth: "30px", padding: "5px" }}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            -
          </Button>
          <Typography sx={{ minWidth: "30px" }}>{quantity}</Typography>
          <Button
            sx={{ minWidth: "30px", padding: "5px" }}
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
