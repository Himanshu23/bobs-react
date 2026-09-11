import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
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
import { Controller, useForm } from 'react-hook-form';
import { FoodItem, FoodCategory } from '../../types';
import FoodImage from '../../components/FoodImage';
import {
  useCreateFoodItem,
  useUpdateFoodItem,
} from '../../data/hooks/useFoodItems';

interface EditItemDrawerProps {
  open: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
}

const createDefaultFoodItem = (): FoodItem => ({
  id: `dish-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  name: '',
  description: '',
  veg: true,
  rating: 4,
  image:
    'https://bobsimages.blob.core.windows.net/dishesh/default-placeholder.jpg',
  available: true,
  category: FoodCategory.Starters,
  priceOptions: {
    wasPrice: { size: { Full: 0, Half: 0, Quarter: 0 } },
    nowPrice: { size: { Full: 0, Half: 0, Quarter: 0 } },
  },
  freeClaimPortion: null,
});

const EditItemDrawer: React.FC<EditItemDrawerProps> = ({
  open,
  item,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FoodItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const createItemMutation = useCreateFoodItem();
  const updateItemMutation = useUpdateFoodItem();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FoodItem>({
    defaultValues: createDefaultFoodItem(),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      const nextItem = item
        ? JSON.parse(JSON.stringify(item))
        : createDefaultFoodItem();

      setFormData(nextItem);
      reset(nextItem);
      setUploadError(null);
    }
  }, [open, item, reset]);

  const isCreating = !item;

  const hasRequiredFields = useMemo(() => {
    return Boolean(
      formData?.name?.trim() &&
        formData?.description?.trim() &&
        formData?.category &&
        formData?.image?.trim()
    );
  }, [
    formData?.category,
    formData?.name,
    formData?.description,
    formData?.image,
  ]);

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
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      setFormData((current) => ({
        ...current!,
        image: dataUrl,
      }));
      setIsUploading(false);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData) return;
    const nextPayload = formData;

    if (item) {
      updateItemMutation.mutate(
        { id: nextPayload.id, foodItem: nextPayload },
        {
          onSuccess: () => {
            onSave(nextPayload);
            onClose();
          },
        }
      );
      return;
    }
    createItemMutation.mutate(nextPayload, {
      onSuccess: () => {
        onSave(nextPayload);
        onClose();
      },
    });
  };

  const handleReset = () => {
    if (item) {
      const nextItem = JSON.parse(JSON.stringify(item));
      setFormData(nextItem);
      reset(nextItem);
      return;
    }

    const nextItem = createDefaultFoodItem();
    setFormData(nextItem);
    reset(nextItem);
  };

  const sizes: ('Full' | 'Half' | 'Quarter')[] = ['Full', 'Half', 'Quarter'];
  const styles: ('Gravy' | 'Dry')[] = ['Gravy', 'Dry'];
  const bases: ('Paratha' | 'Roomali')[] = ['Paratha', 'Roomali'];

  console.log('formData', formData);

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
            {isCreating ? 'Add Item' : 'Edit Item'}
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
              {...register('name', {
                required: 'Dish name is required',
              })}
              onChange={(e) => {
                handleBasicInfoChange('name', e.target.value);
              }}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              {...register('description', {
                required: 'Description is required',
              })}
              onChange={(e) =>
                handleBasicInfoChange('description', e.target.value)
              }
            />
            <TextField
              select
              label="Category"
              fullWidth
              value={formData.category}
              {...register('category', {
                required: 'Category is required',
              })}
              onChange={(e) =>
                handleBasicInfoChange('category', e.target.value)
              }
              error={Boolean(errors.category)}
              helperText={errors.category?.message}
            >
              {Object.values(FoodCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <FormControl error={Boolean(errors.veg)}>
              <FormLabel id="veg-nonveg">Veg or Non-Veg</FormLabel>
              <Controller
                name="veg"
                control={control}
                rules={{
                  validate: (value) =>
                    value !== undefined && value !== null
                      ? true
                      : 'Please select Veg or Non-Veg',
                }}
                render={({ field }) => (
                  <RadioGroup
                    row
                    aria-labelledby="veg-nonveg"
                    value={
                      field.value === true
                        ? 'veg'
                        : field.value === false
                          ? 'non-veg'
                          : ''
                    }
                    onChange={(e) => {
                      const nextValue = e.target.value === 'veg';
                      field.onChange(nextValue);
                      handleBasicInfoChange('veg', nextValue);
                    }}
                  >
                    <FormControlLabel
                      value="veg"
                      control={<Radio />}
                      label="Veg"
                    />
                    <FormControlLabel
                      value="non-veg"
                      control={<Radio />}
                      label="Non-Veg"
                    />
                  </RadioGroup>
                )}
              />
              {errors.veg && (
                <FormHelperText>{errors.veg.message}</FormHelperText>
              )}
            </FormControl>
            <TextField
              select
              label="Free Claim Portion"
              fullWidth
              value={formData.freeClaimPortion ?? ''}
              {...register('freeClaimPortion')}
              onChange={(e) =>
                handleBasicInfoChange(
                  'freeClaimPortion',
                  e.target.value || null
                )
              }
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Full">Full</MenuItem>
              <MenuItem value="Half">Half</MenuItem>
              <MenuItem value="Quarter">Quarter</MenuItem>
            </TextField>
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
                {!formData.image && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    An image is required.
                  </Alert>
                )}
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
            onClick={handleSubmit(handleSave)}
            disabled={
              isUploading ||
              createItemMutation.isPending ||
              updateItemMutation.isPending ||
              !hasRequiredFields
            }
            startIcon={
              createItemMutation.isPending || updateItemMutation.isPending ? (
                <CircularProgress size={20} />
              ) : undefined
            }
          >
            {isCreating
              ? createItemMutation.isPending
                ? 'Creating...'
                : 'Create Dish'
              : updateItemMutation.isPending
                ? 'Saving...'
                : 'Save Changes'}
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
