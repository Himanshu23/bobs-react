import React from 'react';
import { FoodItem } from '../../types';
import PromotionalAddonsTab from './PromotionalAddonsTab';

interface DiscountsTabProps {
  foodItems: FoodItem[];
}

const DiscountsTab: React.FC<DiscountsTabProps> = ({ foodItems }) => {
  return <PromotionalAddonsTab foodItems={foodItems} />;
};

export default DiscountsTab;
