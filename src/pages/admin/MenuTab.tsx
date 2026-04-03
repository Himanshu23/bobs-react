import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { FoodItem, CATEGORY_ORDER } from '../../types';
import MenuItemCard from './MenuItemCard';

interface MenuTabProps {
  items: FoodItem[];
  onEditItem?: (item: FoodItem) => void;
}

const MenuTab: React.FC<MenuTabProps> = ({ items, onEditItem }) => {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const categorizedMenuItems = useMemo(() => {
    const groups = items.reduce<Record<string, FoodItem[]>>((result, item) => {
      if (!result[item.category]) {
        result[item.category] = [];
      }

      result[item.category].push(item);
      return result;
    }, {});

    const knownCategories = CATEGORY_ORDER.filter(
      (category) => groups[category]
    );
    const extraCategories = Object.keys(groups)
      .filter((category) => !CATEGORY_ORDER.includes(category as never))
      .sort((left, right) => left.localeCompare(right));

    return [...knownCategories, ...extraCategories].map((category) => ({
      category,
      items: groups[category]
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    }));
  }, [items]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <Stack spacing={2}>
      {categorizedMenuItems.map(({ category, items: categoryItems }) => {
        const vegItems = categoryItems.filter((item) => item.veg);
        const nonVegItems = categoryItems.filter((item) => !item.veg);

        return (
          <Card key={category} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => toggleCategory(category)}
                sx={{ cursor: 'pointer' }}
              >
                <Box />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {category}
                  </Typography>
                  <Chip
                    label={`${categoryItems.length} items`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
                <IconButton
                  size="small"
                  sx={{
                    transform: expandedCategories[category]
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Stack>

              <Collapse in={expandedCategories[category]} timeout="auto">
                <Box sx={{ mt: 2 }}>
                  {/* Veg Items Accordion */}
                  {vegItems.length > 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Chip
                          label={`🥬 Vegetarian (${vegItems.length})`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5} sx={{ width: '100%' }}>
                          {vegItems.map((item) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              onEditItem={onEditItem}
                              backgroundColor="#f1f8f4"
                              hoverColor="#e8f5e9"
                            />
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Non-Veg Items Accordion */}
                  {nonVegItems.length > 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Chip
                          label={`🍗 Non-Vegetarian (${nonVegItems.length})`}
                          variant="outlined"
                          size="small"
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5} sx={{ width: '100%' }}>
                          {nonVegItems.map((item) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              onEditItem={onEditItem}
                              backgroundColor="#fce4ec"
                              hoverColor="#f8bbd0"
                            />
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default MenuTab;
