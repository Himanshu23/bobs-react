import React from 'react';
import { Box, Typography } from '@mui/material';
import { CartItem } from '../types';
import { buildReceiptLayout } from '../utils/receiptSections';

interface ReceiptProps {
  cartItems: CartItem[];
  totalPrice: number;
  discountAmount: number;
  finalTotal: number;
  customerName: string;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress: string;
  customerInstructions: string;
  scheduledTime?: string;
  discountCode?: string;
  /** Delivery fee, shown as its own line when given (include it in finalTotal). */
  deliveryFee?: number;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      cartItems,
      totalPrice,
      discountAmount,
      finalTotal,
      customerName,
      deliveryMethod,
      deliveryAddress,
      customerInstructions,
      scheduledTime,
      discountCode,
      deliveryFee,
    },
    ref
  ) => {
    // Items grouped by restaurant, with a subtotal each (multi-restaurant cart).
    const layout = buildReceiptLayout(cartItems);

    const formatTime = (time: string): string => {
      if (!time) return '';
      const [hoursText, minutes] = time.split(':');
      const hours = Number(hoursText);
      if (Number.isNaN(hours) || !minutes) return time;
      const period = hours >= 12 ? 'PM' : 'AM';
      const normalizedHours = hours % 12 || 12;
      return `${normalizedHours}:${minutes} ${period}`;
    };

    const getCurrentDateTime = (): string => {
      const now = new Date();
      return now.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    return (
      <Box
        ref={ref}
        sx={{
          width: '58mm',
          padding: '3mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: '10px',
          lineHeight: 1.2,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 1,
            pb: 1,
            borderBottom: '1px solid #000',
          }}
        >
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              m: 0,
              p: 0,
            }}
          >
            BOB&apos;S KITCHEN
          </Typography>
          <Typography
            sx={{
              fontSize: '8px',
              fontFamily: "'Courier New', monospace",
              color: '#333',
              m: 0,
              p: 0,
              mt: 0.3,
            }}
          >
            {getCurrentDateTime()}
          </Typography>
        </Box>

        {/* Items, grouped by restaurant */}
        <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid #000' }}>
          {layout.sections.map((section, sectionIdx) => (
            <Box
              key={section.restaurantId}
              sx={{
                mt: sectionIdx > 0 ? 0.8 : 0,
                pt: sectionIdx > 0 ? 0.6 : 0,
                borderTop: sectionIdx > 0 ? '1px dashed #000' : 'none',
              }}
            >
              {layout.showHeadings && (
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                    textTransform: 'uppercase',
                    mb: 0.4,
                  }}
                >
                  {section.restaurantName}
                </Typography>
              )}
              {section.lines.map((line) => (
                <Box
                  key={line.key}
                  sx={{
                    mb: 0.6,
                    fontFamily: "'Courier New', monospace",
                    fontSize: '9px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fontFamily: "'Courier New', monospace",
                        flex: 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      {line.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '9px',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '9px',
                      }}
                    >
                      {line.detail}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '9px',
                      }}
                    >
                      ₹{line.amount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {layout.showSubtotals && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '9px',
                      fontStyle: 'italic',
                    }}
                  >
                    {section.restaurantName} subtotal
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '9px',
                    }}
                  >
                    ₹{section.subtotal.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Totals */}
        <Box
          sx={{
            mb: 1,
            pb: 1,
            borderBottom: '1px solid #000',
            fontFamily: "'Courier New', monospace",
            fontSize: '10px',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}
          >
            <Typography
              sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
            >
              Subtotal
            </Typography>
            <Typography
              sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
            >
              ₹{totalPrice.toFixed(2)}
            </Typography>
          </Box>
          {discountAmount > 0 && (
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}
            >
              <Typography
                sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
              >
                Discount {discountCode ? `(${discountCode})` : ''}
              </Typography>
              <Typography
                sx={{
                  color: '#2e7d32',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '9px',
                }}
              >
                -₹{discountAmount.toFixed(2)}
              </Typography>
            </Box>
          )}
          {deliveryFee !== undefined && (
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}
            >
              <Typography
                sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
              >
                Delivery fee
              </Typography>
              <Typography
                sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
              >
                ₹{deliveryFee.toFixed(2)}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 0.5,
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                fontFamily: "'Courier New', monospace",
                fontSize: '11px',
              }}
            >
              TOTAL
            </Typography>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontFamily: "'Courier New', monospace",
                fontSize: '11px',
              }}
            >
              ₹{finalTotal.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Order Details */}
        <Box
          sx={{
            mb: 1,
            pb: 1,
            borderBottom: '1px solid #000',
            fontFamily: "'Courier New', monospace",
            fontSize: '9px',
          }}
        >
          {customerName && (
            <Box sx={{ mb: 0.4 }}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '9px',
                  mb: 0.1,
                }}
              >
                NAME
              </Typography>
              <Typography
                sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
              >
                {customerName}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 0.4 }}>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontFamily: "'Courier New', monospace",
                fontSize: '9px',
                mb: 0.1,
              }}
            >
              {deliveryMethod === 'delivery' ? 'DELIVERY' : 'PICKUP'}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Courier New', monospace",
                fontSize: '8px',
                wordBreak: 'break-word',
              }}
            >
              {deliveryAddress}
            </Typography>
          </Box>

          {scheduledTime && (
            <Box sx={{ mb: 0.4 }}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '9px',
                  mb: 0.1,
                }}
              >
                SCHEDULED
              </Typography>
              <Typography
                sx={{ fontFamily: "'Courier New', monospace", fontSize: '9px' }}
              >
                {formatTime(scheduledTime)}
              </Typography>
            </Box>
          )}

          {customerInstructions && (
            <Box>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '9px',
                  mb: 0.1,
                }}
              >
                NOTES
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '8px',
                  wordBreak: 'break-word',
                }}
              >
                {customerInstructions}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: "'Courier New', monospace",
              fontSize: '9px',
              mb: 0.3,
            }}
          >
            Thank you for ordering!
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Courier New', monospace",
              fontSize: '9px',
            }}
          >
            ✉ 9643310092
          </Typography>
        </Box>
      </Box>
    );
  }
);

Receipt.displayName = 'Receipt';

export default Receipt;
