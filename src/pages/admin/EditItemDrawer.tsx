import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { FoodItem, FoodCategory } from '../../types';
import FoodImage from '../../components/FoodImage';
import { useUpdateFoodItem } from '../../data/hooks/useFoodItems';

interface EditItemDrawerProps {
  open: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
}

const EditItemDrawer: React.FC<EditItemDrawerProps> = ({
  open,
  item,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FoodItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const updateItemMutation = useUpdateFoodItem();

  useEffect(() => {
    if (open && item) {
      setFormData(JSON.parse(JSON.stringify(item))); // Deep copy
      setUploadError(null);
    }
  }, [open, item]);

  if (!formData) return null;

  const handleBasicInfoChange = (field: keyof FoodItem, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePriceChange = (
    priceType: 'wasPrice' | 'nowPrice',
    variantType: 'size' | 'type' | 'base',
    key: string,
    value: number
  ) => {
    setFormData({
      ...formData,
      priceOptions: {
        ...formData.priceOptions,
        [priceType]: {
          ...formData.priceOptions[priceType],
          [variantType]: {
            ...((formData.priceOptions[priceType][
              variantType as keyof (typeof formData.priceOptions)[typeof priceType]
            ] || {}) as Record<string, number>),
            [key]: value,
          },
        },
      },
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // TODO: Replace with your actual Azure upload logic
      // For now, this creates a local file URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData({ ...formData, image: dataUrl });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // Example: If using Azure Blob directly via SAS URL or backend API:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const { imageUrl } = await response.json();
      // setFormData({ ...formData, image: imageUrl });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (formData) {
      updateItemMutation.mutate(
        { id: formData.id, foodItem: formData },
        {
          onSuccess: () => {
            onSave(formData);
            onClose();
          },
        }
      );
    }
  };

  const handleReset = () => {
    if (item) {
      setFormData(JSON.parse(JSON.stringify(item)));
    }
  };

  const sizes: ('Full' | 'Half' | 'Quarter')[] = ['Full', 'Half', 'Quarter'];
  const styles: ('Gravy' | 'Dry')[] = ['Gravy', 'Dry'];
  const bases: ('Paratha' | 'Roomali')[] = ['Paratha', 'Roomali'];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          p: 0,
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Edit Item
          </Typography>
        </Stack>

        {uploadError && (
          <Alert
            severity="error"
            onClose={() => setUploadError(null)}
            sx={{ mb: 2 }}
          >
            {uploadError}
          </Alert>
        )}

        {updateItemMutation.isError && (
          <Alert
            severity="error"
            onClose={() => updateItemMutation.reset()}
            sx={{ mb: 2 }}
          >
            {updateItemMutation.error?.message ||
              'Failed to save item. Please try again.'}
          </Alert>
        )}

        {updateItemMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Item saved successfully!
          </Alert>
        )}

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
          {/* Basic Info Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Basic Information
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Item Name"
              fullWidth
              value={formData.name}
              onChange={(e) => handleBasicInfoChange('name', e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                handleBasicInfoChange('description', e.target.value)
              }
            />
            <TextField
              select
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) =>
                handleBasicInfoChange('category', e.target.value)
              }
            >
              {Object.values(FoodCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.veg}
                    onChange={(e) =>
                      handleBasicInfoChange('veg', e.target.checked)
                    }
                  />
                }
                label="Vegetarian"
              />
            </FormGroup>
          </Stack>

          {/* Image Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Image
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                {formData.image && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FoodImage
                      src={formData.image}
                      alt={formData.name}
                      size={150}
                    />
                  </Box>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={
                    isUploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  disabled={isUploading}
                  fullWidth
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Supported: JPG, PNG, AVIF
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Pricing by Size
          </Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Was Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Now Price (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={`size-${size}`}>
                    <TableCell>{size}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.wasPrice?.size?.[
                            size
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'wasPrice',
                            'size',
                            size,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.nowPrice?.size?.[
                            size
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'nowPrice',
                            'size',
                            size,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Type/Style Pricing Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Pricing by Style (Type)
          </Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Style</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Was Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Now Price (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {styles.map((style) => (
                  <TableRow key={`style-${style}`}>
                    <TableCell>{style}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.wasPrice?.type?.[
                            style as keyof typeof formData.priceOptions.wasPrice.type
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'wasPrice',
                            'type',
                            style,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.nowPrice?.type?.[
                            style as keyof typeof formData.priceOptions.nowPrice.type
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'nowPrice',
                            'type',
                            style,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Base Pricing Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Pricing by Base
          </Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Base</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Was Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Now Price (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bases.map((base) => (
                  <TableRow key={`base-${base}`}>
                    <TableCell>{base}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.wasPrice?.base?.[
                            base as keyof typeof formData.priceOptions.wasPrice.base
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'wasPrice',
                            'base',
                            base,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={
                          (formData.priceOptions?.nowPrice?.base?.[
                            base as keyof typeof formData.priceOptions.nowPrice.base
                          ] as number) || ''
                        }
                        onChange={(e) =>
                          handlePriceChange(
                            'nowPrice',
                            'base',
                            base,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Action Buttons - Fixed at bottom */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ pt: 2, borderTop: '1px solid #ddd' }}
        >
          <Button variant="outlined" fullWidth onClick={handleReset}>
            Reset
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={isUploading || updateItemMutation.isPending}
            startIcon={
              updateItemMutation.isPending ? (
                <CircularProgress size={20} />
              ) : undefined
            }
          >
            {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="text" fullWidth onClick={onClose}>
            Close
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EditItemDrawer;
