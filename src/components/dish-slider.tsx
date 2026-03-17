import React from 'react';
import { Box } from '@mui/material';
import AwesomeSlider from 'react-awesome-slider';
import 'react-awesome-slider/dist/styles.css';
import withAutoplay from 'react-awesome-slider/dist/autoplay';

import 'react-awesome-slider/dist/custom-animations/cube-animation.css';

const images = [
  {
    src: '/imgs/dishes/paneer-tikka.jpg',
    offer: '🔥 30% OFF on Paneer Tikka!',
    bgColor: '#ffe4b5', // Light orange
  },
  {
    src: '/imgs/dishes/tandoori-afgani-chaap.jpg',
    offer: '✨ Special Afgani Chaap Discount!',
    bgColor: '#f0f8ff', // Light blue
  },
  {
    src: '/imgs/dishes/tandoori-chicken.jpg',
    offer: '🍗 Get 40% OFF on Tandoori Chicken!',
    bgColor: '#ffcccb', // Light red
  },
  {
    src: '/imgs/dishes/tandorri-chap.jpg',
    offer: '🥘 Order Now & Save Big!',
    bgColor: '#d3ffd3', // Light green
  },
];

const AutoplaySlider = withAutoplay(AwesomeSlider);

const DishSlider = () => {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 92,
          right: '-7%',
          transform: 'translateX(-50%)',
          backgroundImage: "url('/imgs/50-per-off-ribbon.png') ", // Change to your image path
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          color: 'white',
          // padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '66px', // Ensures visibility
          height: '77px',
          zIndex: 2,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '250px',
          overflow: 'hidden',
        }}
      >
        <AutoplaySlider
          animation="cubeAnimation"
          infinite={true}
          play={true}
          cancelOnInteraction={false}
          interval={2000}
          style={{
            height: '250px',
            maxHeight: '250px', // Ensures no overflow in height
          }}
          organicArrows={false} // Optional: Removes arrows to save space
        >
          {images.map((image, index) => (
            <div
              key={index}
              data-src={image.src}
              data-caption={image.offer}
              style={{
                backgroundColor: image.bgColor,
                height: '250px', // Fixes each slide's height
                maxHeight: '250px',
                objectFit: 'cover',
              }}
            />
          ))}
        </AutoplaySlider>
      </Box>
    </>
  );
};

export default DishSlider;
