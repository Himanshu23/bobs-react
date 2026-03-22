import { Box, Typography, Paper, Grid } from '@mui/material';
import { ImageNotSupported } from '@mui/icons-material';

const ImageHandlingPreview = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Image Handling Preview
      </Typography>

      <Grid container spacing={4}>
        {/* Valid Image */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              ✅ Image Loaded Successfully
            </Typography>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
              }}
            >
              <img
                src="/imgs/food/downloads/starter-paneer-tikka.jpeg"
                alt="Paneer Tikka"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Image Error Placeholder */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              ⚠️ Image Not Found / Error
            </Typography>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: 1,
                backgroundColor: '#f5f5f5',
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageNotSupported sx={{ color: '#999', fontSize: 60 }} />
            </Box>
          </Paper>
        </Grid>

        {/* Loading State */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              ⏳ Loading (Skeleton)
            </Typography>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: 1,
                backgroundColor: '#e0e0e0',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Usage Guide */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          How It Works:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1. <strong>Image loads successfully</strong> → Displays the image
            with objectFit: &apos;cover&apos;
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            2. <strong>Image fails to load</strong> → Shows placeholder with
            icon
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            3. <strong>No image path</strong> → Component handles gracefully
          </Typography>
          <Typography variant="body2">
            4. <strong>onError handler</strong> → Catches image load errors and
            triggers fallback UI
          </Typography>
        </Box>
      </Box>

      {/* Implementation */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Implementation:
        </Typography>
        <Paper
          sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            overflowX: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <Typography component="pre" sx={{ m: 0 }}>
            {`// Option 1: Use FoodImage component
import FoodImage from './FoodImage';

<FoodImage 
  src={item.image} 
  alt={item.name}
  size={110}
/>

// Option 2: Inline with state
const [imageError, setImageError] = useState(false);

{imageError ? (
  <Box sx={{ placeholder styles }}>
    <ImageNotSupported />
  </Box>
) : (
  <img 
    src={item.image}
    onError={() => setImageError(true)}
  />
)}`}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ImageHandlingPreview;
