import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

const images = [
  { src: "/imgs/dishes/paneer-tikka.jpg", offer: "🔥 30% OFF on Paneer Tikka!" },
  { src: "/imgs/dishes/tandoori-afgani-chaap.jpg", offer: "✨ Special Afgani Chaap Discount!" },
  { src: "/imgs/dishes/tandoori-chicken.jpg", offer: "🍗 Get 40% OFF on Tandoori Chicken!" },
  { src: "/imgs/dishes/tandorri-chap.jpg", offer: "🥘 Order Now & Save Big!" },
];

const DishSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1500); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "300px",
        overflow: "hidden",
      }}
    >
      {/* Image Slide */}
      <Box
        component="img"
        src={images[currentIndex].src}
        alt={`Slide ${currentIndex + 1}`}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.5s ease-in-out",
        }}
      />

      {/* Offer Text Overlay */}
      
       
    </Box>
  );
};

export default DishSlider;
