import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Discount } from '../data/discounts';

interface ActiveDiscountsDropdownProps {
  discounts: Discount[];
}

const ActiveDiscountsDropdown: React.FC<ActiveDiscountsDropdownProps> = ({
  discounts,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (discounts.length === 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSelectedIndex((currentIndex) =>
        discounts.length ? (currentIndex + 1) % discounts.length : currentIndex
      );
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [discounts]);

  if (discounts.length === 0) {
    return null;
  }

  const selected = discounts[selectedIndex % discounts.length];

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{
        width: '100%',
        boxShadow: 'none',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 2,
        mb: 2,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: '#f6f9ff',
          minHeight: 52,
          px: 1,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            padding: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              flex: '1 1 0',
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.9rem',
            }}
          >
            {selected.name} — {selected.description}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              backgroundColor: '#e3f2fd',
              borderRadius: 999,
              px: 1,
              py: 0.4,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '0.75rem',
              }}
            >
              {discounts.length} offer{discounts.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, backgroundColor: '#ffffff' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {discounts.map((discount, index) => (
            <Box
              key={discount.id}
              sx={{
                width: '100%',
                p: 2,
                borderRadius: 2,
                border:
                  discount.id === selected.id
                    ? '1px solid #1976d2'
                    : '1px solid rgba(0,0,0,0.08)',
                backgroundColor:
                  discount.id === selected.id ? '#e8f0ff' : '#f9fbff',
                transition:
                  'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {discount.name}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {discount.percent > 0
                    ? `${discount.percent}% off`
                    : `₹${discount.fixedValue} off`}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 1 }}
              >
                {discount.description}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Min order ₹{discount.minValue} | Max cap ₹{discount.maxCap}
                {discount.code ? ` | Code: ${discount.code}` : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ActiveDiscountsDropdown;
