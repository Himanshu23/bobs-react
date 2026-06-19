import React from 'react';
import { Box } from '@mui/material';

import { FoodItem, CartActions, ItemOptions } from '../types';

interface MostReorderedSectionProps {
  items: FoodItem[];
  searchQuery: string;
  onCartAction: (id: string, action: CartActions, option?: ItemOptions) => void;
}

const MostReorderedSection: React.FC<MostReorderedSectionProps> = ({
  items,
  searchQuery,
}) => {
  if (searchQuery.trim() !== '' || items.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1,
        }}
      >
        {/* <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Most reordered
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Popular dishes customers keep coming back for.
          </Typography>
        </Box> */}
        {/* Carousel indicator */}
        {/* <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {items.map((_, index) => (
            <Box
              key={index}
              onClick={() => {
                setAutoRotate(false);
                setCurrentIndex(index);
                setTimeout(() => setAutoRotate(true), 10000);
              }}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor:
                  index === currentIndex ? 'primary.main' : '#ddd',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor:
                    index === currentIndex ? 'primary.main' : '#999',
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box> */}
      </Box>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/* Left Navigation Button */}
        {/* {items.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            size="small"
            sx={{
              position: 'absolute',
              left: -20,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )} */}

        {/* Carousel Container */}
        {/* <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 2,
            px: 1,
            py: 1,
            flex: 1,
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 4,
            },
          }}
        >
          {items.map((food) => (
            <Box
              key={`top_${food.id}`}
              sx={{ minWidth: 360, flex: '0 0 auto' }}
            >
              <FoodItemCard
                item={food}
                handleCart={onCartAction}
                searchQuery={searchQuery}
              />
            </Box>
          ))}
        </Box> */}

        {/* Right Navigation Button */}
        {/* {items.length > 1 && (
          <IconButton
            onClick={handleNext}
            size="small"
            sx={{
              position: 'absolute',
              right: -20,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )} */}
      </Box>
    </Box>
  );
};

export default MostReorderedSection;
