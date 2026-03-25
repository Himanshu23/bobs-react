import { FoodItem, FoodCategory } from '../types';

export default {
  foodItems: [
    {
      id: '1',
      name: 'Paneer Tikka [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-paneer-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 313.95 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '2',
      name: 'Veg Fried Rice',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-veg.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 156.45 }, type: {} },
        nowPrice: { size: { Full: 99, Half: 149 } },
      },
    },
    {
      id: '3',
      name: 'Cheese Garlic Naan',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-cheese-garlic.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 90 } },
      },
    },
    {
      id: '4',
      name: 'Paneer Butter Masala',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-butter-masala.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 299, Half: 199 } },
      },
    },
    {
      id: '5',
      name: 'Chicken Tikka Masala',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-tikka-masala.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 754.95, Half: 481.95, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '6',
      name: 'Laccha Paratha',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-laccha.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 52.5 } },
        nowPrice: { size: { Full: 30 } },
      },
    },
    {
      id: '7',
      name: 'Mushroom Matar',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-mushroom-matar.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 169, Half: 239 } },
      },
    },
    {
      id: '8',
      name: 'Rumali Roti',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roomali-roti.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 26.25 } },
        nowPrice: { size: { Full: 20 } },
      },
    },
    // {
    //   id: '9',
    //   name: 'Pasta',
    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/tandoori-chicken.jpg',
    //   category: 'Pasta',
    //   priceOptions: {
    //     wasPrice: { size: { Full: 261.45 } },
    //     nowPrice: { size: { Full: 139 } },
    //   },
    // },
    {
      id: '10',
      name: 'Hariyali Paneer Tikka Roll',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-paneer-haryali-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 129 } },
      },
    },
    {
      id: '11',
      name: 'Cheese Roll',
      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 156.45 } },
        nowPrice: { size: { Full: 150 } },
      },
    },
    {
      id: '12',
      name: 'Tandoori Chicken',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-tandoori.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 681.45, Half: 366.45 } },
        nowPrice: { size: { Full: 350, Half: 199 } },
      },
    },
    {
      id: '13',
      name: 'Chicken Punjabi',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-punjabi.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 754.95, Half: 481.95, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '14',
      name: 'Butter Naan',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-naan-butter.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 68.25 } },
        nowPrice: { size: { Full: 40 } },
      },
    },
    {
      id: '15',
      name: 'Dal Bukhara',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/mail-daal-bukhara.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 345.45, Half: 208.95 } },
        nowPrice: { size: { Full: 149, Half: 179 } },
      },
    },
    {
      id: '16',
      name: 'Hariyali Chicken Tikka Roll',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chicken-haryali-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 240.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '17',
      name: 'Plain Curd',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/raita-plain-curd.jpeg',
      category: FoodCategory.Sides,
      priceOptions: {
        wasPrice: { size: { Full: 84.0 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '18',
      name: 'Bobs Special Mutton Keema Naan',
      description: '',
      veg: false,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '19',
      name: 'Schezwan Noodles',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-schezwan.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 187.95 } },
        nowPrice: { size: { Full: 149, Half: 99 } },
      },
    },
    {
      id: '20',
      name: 'Dal Makhani',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-dal-makhani.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 345.45, Half: 208.95 } },
        nowPrice: { size: { Full: 149, Half: 199 } },
      },
    },
    {
      id: '21',
      name: 'Mushroom Kadhai',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-mushroom-kadhai.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 239, Half: 169 } },
      },
    },
    {
      id: '22',
      name: 'Afghani Chicken',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-afgani.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 733.95, Half: 418.95 } },
        nowPrice: { size: { Full: 399, Half: 249 } },
      },
    },
    {
      id: '23',
      name: 'Boondi Raita',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/raita-boondi.jpeg',
      category: FoodCategory.Sides,
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '24',
      name: 'Tandoori Butter Roti',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roti-tandoori-butter.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 36.75 } },
        nowPrice: { size: { Full: 15 } },
      },
    },
    {
      id: '25',
      name: 'Paneer Malai Tikka [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-paneer-malai-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 366.45 } },
        nowPrice: { size: { Full: 219 } },
      },
    },
    {
      id: '26',
      name: 'Paneer Tawa',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-tawa.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '27',
      name: 'Malai Kofta',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-malai-kofta.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 408.45, Half: 282.45 } },
        nowPrice: { size: { Full: 299, Half: 199 } },
      },
    },
    {
      id: '28',
      name: 'Garlic Naan',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-naan-garlic.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 84.0 } },
        nowPrice: { size: { Full: 50 } },
      },
    },
    {
      id: '29',
      name: 'Malai Chicken Tikka Roll',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chicken-malai-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 240.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '30',
      name: 'Chicken Kali Mirch Gravy',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-kali-mirch.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 838.95, Half: 576.45 } },
        nowPrice: { size: { Full: 399, Half: 549 } },
      },
    },
    {
      id: '31',
      name: 'Bobs Special Paneer Gravy',

      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 450.45 } },
        nowPrice: { size: { Full: 299 } },
      },
    },
    {
      id: '32',
      name: 'Paneer Matar',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-matar.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 179, Half: 249 } },
      },
    },
    {
      id: '33',
      name: 'Chicken Rara',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-rara.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 838.95, Half: 576.45 } },
        nowPrice: { size: { Full: 399, Half: 549 } },
      },
    },
    {
      id: '34',
      name: 'Steamed Rice',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/rice-steamed.jpeg',
      category: 'Rice',
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 89 } },
      },
    },
    // {
    //   id: '35',
    //   name: 'Gravy',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-chilli-gravy.jpeg',
    //   category: FoodCategory.MainCourse,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 20.0 } },
    //     nowPrice: { size: { Full: 20.0 } },
    //   },
    // },
    {
      id: '36',
      name: 'Paneer Lababdar',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-lababdar.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 249, Half: 179 } },
      },
    },
    {
      id: '37',
      name: 'Chicken Curry',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-curry.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 765.45, Half: 492.45, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '38',
      name: 'Methi Paratha',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-methi.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 68.25 } },
        nowPrice: { size: { Full: 40 } },
      },
    },
    {
      id: '39',
      name: 'Chicken Kali Mirch Tikka [8 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-kali-mirch-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 418.95 } },
        nowPrice: { size: { Full: 219 } },
      },
    },
    {
      id: '40',
      name: 'Malai Paneer Tikka Roll',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-malai-paneer-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 129 } },
      },
    },
    {
      id: '41',
      name: 'Tandoori Chicken Tikka Roll',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chicken-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '42',
      name: 'Bobs Special Chicken Gravy',

      description: '',
      veg: false,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 880.95, Half: 586.95 } },
        nowPrice: { size: { Full: 549, Half: 399 } },
      },
    },
    {
      id: '43',
      name: 'Achari Paneer Tikka [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-paneer-achari-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 334.95 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '44',
      name: 'Malabar Parantha',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-malabar.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 57.75 } },
        nowPrice: { size: { Full: 45 } },
      },
    },
    {
      id: '45',
      name: 'Butter Chicken Special',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-butter-special.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 838.95, Half: 576.45 } },
        nowPrice: { size: { Full: 550, Half: 400 } },
      },
    },
    {
      id: '46',
      name: 'Hakka Noodles',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-hakka-noodles.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 166.95 } },
        nowPrice: { size: { Full: 149, Half: 99 } },
      },
    },
    {
      id: '47',
      name: 'Schezwan Fried Rice',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-schezwan.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 156.45 } },
        nowPrice: { size: { Full: 149, Half: 99 } },
      },
    },
    {
      id: '48',
      name: 'Veg Kolhapuri',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-veg-kolhapuri.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 177.45 } },
        nowPrice: { size: { Full: 179, Half: 119 } },
      },
    },
    {
      id: '49',
      name: 'Plain Naan',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-naan-plain.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 52.5 } },
        nowPrice: { size: { Full: 30 } },
      },
    },
    {
      id: '50',
      name: 'Tandoori Aloo Paratha',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-aloo.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 84.0 } },
        nowPrice: { size: { Full: 50 } },
      },
    },
    {
      id: '51',
      name: 'Chilli Paneer',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-paneer-chilli-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 229.95 } },
        nowPrice: { size: { Full: 219, Half: 159 } },
      },
    },
    {
      id: '52',
      name: 'Tandoori Paneer Tikka Roll',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-paneer-tikka.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 177.45 } },
        nowPrice: { size: { Full: 129 } },
      },
    },
    {
      id: '53',
      name: 'Mutton Seekh [2 Seekh]',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-seekh-kabab.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 324.45 } },
        nowPrice: { size: { Full: 250 } },
      },
    },
    {
      id: '54',
      name: 'Paneer Kali Mirch Gravy',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-kali-mirch.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 418.95, Half: 292.95 } },
        nowPrice: { size: { Full: 299, Half: 199 } },
      },
    },
    {
      id: '55',
      name: 'Tandoori Paneer Paratha',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/breads-paratha-paneer.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 70 } },
      },
    },
    {
      id: '56',
      name: 'Jeera Rice',

      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/rice-jeera.jpeg',
      category: 'Rice',
      priceOptions: {
        wasPrice: { size: { Full: 147.0 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '57',
      name: 'Chilli Potato',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-chilli-potato.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 240.45, Half: 177.45 } },
        nowPrice: { size: { Full: 99, Half: 149 } },
      },
    },
    {
      id: '58',
      name: 'Chili Chicken',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-chilli-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 271.95 } },
        nowPrice: { size: { Full: 229, Half: 169 } },
      },
    },
    {
      id: '59',
      name: 'Chicken Seekh [2 Seekh]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-seekh-kabab.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 271.95 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '60',
      name: 'Chicken Tikka [8 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 397.95 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '61',
      name: 'Chilli Garlic Fried Rice',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-chilli-garlic.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 156.45 } },
        nowPrice: { size: { Full: 149, Half: 99 } },
      },
    },
    {
      id: '62',
      name: 'Mix Veg Raita',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/raita-mix-veg.jpeg',
      category: FoodCategory.Sides,
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '63',
      name: 'Chicken Malai Tikka [8 Pieces]',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-malai-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 418.95 } },
        nowPrice: { size: { Full: 219 } },
      },
    },
    {
      id: '64',
      name: 'Aloo Naan',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-naan-aloo.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 105.0 } },
        nowPrice: { size: { Full: 60 } },
      },
    },
    {
      id: '65',
      name: 'Chilli Garlic Noodles',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-chilli-garlic.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 187.95 } },
        nowPrice: { size: { Full: 148, Half: 99 } },
      },
    },
    {
      id: '66',
      name: 'Veg Cheese Burger',
      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: 'Burgers',
      priceOptions: {
        wasPrice: { size: { Full: 103.95 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '67',
      name: 'Malai Chaap Roll',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chaap-malai.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 177.45 }, base: { Paratha: 0, Roomali: 0 } },
        nowPrice: { size: { Full: 99 }, base: { Paratha: 0, Roomali: 0 } },
      },
    },
    {
      id: '68',
      name: 'Mushroom Masala',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-mushroom-masala.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 229, Half: 169 } },
      },
    },
    {
      id: '69',
      name: 'Hari Mirch Paratha',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-hari-mirch.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 63.0 } },
        nowPrice: { size: { Full: 40.0 } },
      },
    },
    {
      id: '70',
      name: 'Veg Manchurian',
      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 208.95 } },
        nowPrice: {
          size: { Full: 139, Half: 199 },
          type: { Gravy: 20, Dry: 0 },
        },
      },
    },
    {
      id: '71',
      name: 'Chicken Kadhai',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-kadhai.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 754.95, Half: 481.95, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '72',
      name: 'Missi Roti',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-missi.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 52.5 } },
        nowPrice: { size: { Full: 40 } },
      },
    },
    {
      id: '73',
      name: 'Chicken Cheese Burger',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/burgers-chicken-cheese-burger.jpeg',
      category: 'Burgers',
      priceOptions: {
        wasPrice: { size: { Full: 156.45 } },
        nowPrice: { size: { Full: 119 } },
      },
    },
    {
      id: '74',
      name: 'Chicken Lababdar',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-lababdaar.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 754.95, Half: 481.95, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '75',
      name: 'Tandoori Chaap',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chaap-tandoori.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 282.45, Half: 177.45 } },
        nowPrice: { size: { Full: 159, Half: 99 } },
      },
    },
    {
      id: '76',
      name: 'Mushroom Tikka',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-mushroom-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 271.95 } },
        nowPrice: { size: { Full: 169 } },
      },
    },
    {
      id: '77',
      name: 'Tandoori Chaap Roll',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chaap-tandoori.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 156.45 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '78',
      name: 'Bobs Special Chicken Keema Naan',
      description: '',
      veg: false,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '79',
      name: 'Mix Veg',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-mix-veg.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 345.45, Half: 208.95 } },
        nowPrice: { size: { Full: 179, Half: 119 } },
      },
    },
    {
      id: '80',
      name: 'Navratan Korma',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-navratan-korma.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 303.45, Half: 219.45 } },
        nowPrice: { size: { Full: 179, Half: 119 } },
      },
    },
    {
      id: '81',
      name: 'Paneer Kadhai',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-kadhai.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 179, Half: 249 } },
      },
    },
    {
      id: '82',
      name: 'Hariyali Chaap Roll',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chaap-haryali.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 177.45 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '83',
      name: 'Tandoori Afghani Chaap',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chaap-tandoori.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 208.95 } },
        nowPrice: { size: { Full: 119, Half: 179 } },
      },
    },
    {
      id: '84',
      name: 'Kali Mirch Chaap',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chaap-kali-mirch.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 313.95, Half: 208.95 } },
        nowPrice: { size: { Full: 119, Half: 179 } },
      },
    },
    {
      id: '85',
      name: 'Chicken Hariyali Tikka [8 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-haryali-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 397.95 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '86',
      name: 'Tandoori Roti',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roti-tandoori-plain.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 26.25 } },
        nowPrice: { size: { Full: 15 } },
      },
    },
    {
      id: '87',
      name: 'Chicken Manchurian',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-manchurian-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 376.95, Half: 271.95 } },
        nowPrice: { size: { Full: 229, Half: 169 } },
      },
    },
    {
      id: '88',
      name: 'Paneer Naan',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-naan-paneer.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 147.0 } },
        nowPrice: { size: { Full: 80 } },
      },
    },
    {
      id: '89',
      name: 'Burani Raita',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/raita-boondi.jpeg',
      category: FoodCategory.Sides,
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '90',
      name: 'Paneer Shahi',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-shahi.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 299, Half: 199 } },
      },
    },
    {
      id: '91',
      name: 'Paneer Palak',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-paneer-palak.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 387.45, Half: 271.95 } },
        nowPrice: { size: { Full: 299, Half: 199 } },
      },
    },
    {
      id: '92',
      name: 'Tawa Chaap',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chaap-tawa.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 229, Half: 169 } },
      },
    },
    {
      id: '93',
      name: 'Chaap Butter Masala',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chaap-butter-masala.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 239, Half: 169 } },
      },
    },
    {
      id: '94',
      name: 'Kadhai Chaap',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chaap-kadhai.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 239, Half: 169 } },
      },
    },
    {
      id: '95',
      name: 'Chicken Butter Masala',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/main-chicken-butter-masala.jpeg',
      category: FoodCategory.MainCourse,
      priceOptions: {
        wasPrice: { size: { Full: 754.95, Half: 481.95, Quarter: 313.95 } },
        nowPrice: { size: { Full: 499, Half: 349, Quarter: 199 } },
      },
    },
    {
      id: '96',
      name: 'Achari Chaap',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chaap-achari.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 282.45, Half: 177.45 } },
        nowPrice: { size: { Full: 99, Half: 159 } },
      },
    },
    {
      id: '97',
      name: 'Paneer Hariyali Tikka [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-paneer-haryali-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 334.95 } },
        nowPrice: { size: { Full: 199 } },
      },
    },
    {
      id: '98',
      name: 'Tandoori Tangdi [2/4 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-tandoori-tangdi.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 313.95 } },
        nowPrice: { size: { Full: 259, Half: 159 } },
      },
    },
    {
      id: '99',
      name: 'Malai Tangdi',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-malai-tangadi.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 366.45 } },
        nowPrice: { size: { Full: 279, Half: 179 } },
      },
    },
    {
      id: '100',
      name: 'Chicken Fried Rice',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-chicken.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 208.95 } },
        nowPrice: { size: { Full: 199, Half: 149 } },
      },
    },
    {
      id: '101',
      name: 'Chicken Chilli Garlic Fried Rice',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-chicken-chilli-garlic.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 208.95 } },
        nowPrice: { size: { Full: 199, Half: 149 } },
      },
    },
    {
      id: '102',
      name: 'Chicken Schezwan Fried Rice',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-egg-chilli.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 208.95 } },
        nowPrice: { size: { Full: 199, Half: 149 } },
      },
    },
    {
      id: '103',
      name: 'Egg Fried Rice',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-egg.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 177.45 } },
        nowPrice: { size: { Full: 174, Half: 124 } },
      },
    },
    {
      id: '104',
      name: 'Egg Chilli Garlic Fried Rice',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-egg-chilli-garlic.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Quarter: 177.45 } },
        nowPrice: { size: { Full: 174, Quarter: 124 } },
      },
    },
    {
      id: '105',
      name: 'Egg Schezwan Fried Rice',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-egg-schezwan.jpeg',
      category: FoodCategory.ChineseRice,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 177.45 } },
        nowPrice: { size: { Full: 174, Half: 124 } },
      },
    },
    {
      id: '106',
      name: 'Chicken Hakka Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-chicken-hakka.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 219.45 } },
        nowPrice: { size: { Full: 149, Half: 199 } },
      },
    },
    {
      id: '107',
      name: 'Chicken Chilli Garlic Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-chilli-garlic.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 199, Half: 149 } },
      },
    },
    {
      id: '108',
      name: 'Chicken Schezwan Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodels-chicken-schezwan.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 229.95 } },
        nowPrice: { size: { Full: 169, Half: 119 } },
      },
    },
    {
      id: '109',
      name: 'Egg Hakka Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-egg-hakka.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Half: 177.45 } },
        nowPrice: { size: { Full: 169, Half: 119 } },
      },
    },
    {
      id: '110',
      name: 'Egg Chilli Garlic Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-egg-chilli-garlic.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Quarter: 187.95 } },
        nowPrice: { size: { Full: 169, Quarter: 119 } },
      },
    },
    {
      id: '111',
      name: 'Egg Schezwan Noodles',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodles-egg-schezwan.jpeg',
      category: FoodCategory.Noodles,
      priceOptions: {
        wasPrice: { size: { Full: 334.95, Quarter: 187.95 } },
        nowPrice: { size: { Full: 169, Quarter: 119 } },
      },
    },
    {
      id: '112',
      name: 'Veg Manchurian Gravy',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-manchurian-veg-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 345.45, Half: 240.45 } },
        nowPrice: { size: { Full: 199, Half: 139 } },
      },
    },
    {
      id: '113',
      name: 'Chicken Manchurian Gravy',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-manchurian-chicken-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 397.95, Half: 292.95 } },
        nowPrice: { size: { Full: 249, Half: 189 } },
      },
    },
    {
      id: '114',
      name: 'Chilli Paneer Gravy',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-paneer-chilli-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 366.45, Half: 261.45 } },
        nowPrice: { size: { Full: 261.45, Half: 186.54 } },
      },
    },
    {
      id: '115',
      name: 'Chilli Chicken Gravy',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-chilli-gravy.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 397.95, Half: 303.45 } },
        nowPrice: { size: { Full: 239, Half: 179 } },
      },
    },
    {
      id: '116',
      name: 'Spring Roll [2 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-spring-roll.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 240.45 } },
        nowPrice: { size: { Full: 139 } },
      },
    },
    {
      id: '117',
      name: 'Veg Momos [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/momo-veg.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 103.95 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '118',
      name: 'Chicken Momos [6 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-chicken.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 156.45 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '119',
      name: 'Paneer Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-paneer.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 156.45 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '120',
      name: 'Veg Fried Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-veg-fried.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 124.95 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    {
      id: '121',
      name: 'Chicken Fried Momos [6 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-chicken-fried.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 177.45 } },
        nowPrice: { size: { Full: 119 } },
      },
    },
    {
      id: '122',
      name: 'Paneer Fried Momos [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-paneer-fried.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 177.45 } },
        nowPrice: { size: { Full: 119 } },
      },
    },
    {
      id: '123',
      name: 'Veg Tandoori Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-veg-tandoori.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 129 } },
      },
    },
    {
      id: '124',
      name: 'Paneer Tandoori Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-paneer-tandoori.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '125',
      name: 'Chicken Tandoori Momos [6 Pieces]',
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-chicken-tandoori.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '126',
      name: 'Malai Chicken',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-malai.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 399 } },
        nowPrice: { size: { Full: 219 } },
      },
    },
    {
      id: '127',
      name: 'Veg Kurkure Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-veg-kurkure.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 119 } },
      },
    },
    {
      id: '128',
      name: 'Paneer Kurkure Momos [6 Pieces]',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-paneer-kurkure.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '129',
      name: 'Chicken Kurkure Momos [6 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-chicken-kurkure.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '130',
      name: 'Veg Afghani Momos [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-veg-afghani.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 208.95 } },
        nowPrice: { size: { Full: 149 } },
      },
    },
    {
      id: '131',
      name: 'Chicken Lollipop [5 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-lollipop.jpeg',
      category: 'Chinese',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 249 } },
      },
    },
    // {
    //   id: '132',
    //   name: 'Paratha',
    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/bread-paratha-aloo.jpeg',
    //   category: FoodCategory.Breads,
    //   priceOptions: {
    //     wasPrice: { size: {} },
    //     nowPrice: { size: { Full: 0.0 } },
    //   },
    // },
    {
      id: '133',
      name: 'Paneer Afghani Momos [6 Pieces]',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/momo-paneer-afghani.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 261.45 } },
        nowPrice: { size: { Full: 169 } },
      },
    },
    {
      id: '134',
      name: 'Chicken Afghani Momos [6 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/chicken-afghani-momos.jpeg',
      category: 'Momos',
      priceOptions: {
        wasPrice: { size: { Full: 282.45 } },
        nowPrice: { size: { Full: 169 } },
      },
    },
    {
      id: '135',
      name: 'Hot and Sour Soup',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/soup-hot-and-sour.jpeg',
      category: 'Soups',
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 99 } },
      },
    },
    // {
    //   id: '136',
    //   name: 'Mutton Rogan Josh [5 Pieces]',

    //   description: '',
    //   veg: false,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/tandoori-chicken.jpg',
    //   category: FoodCategory.MainCourse,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 523.95 } },
    //     nowPrice: { size: { Full: 523.95 } },
    //   },
    // },
    {
      id: '137',
      name: "Bob's Special Peri Peri Fried Chicken",
      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-peri-peri-fried.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 733.95, Half: 418.95 } },
        nowPrice: { size: { Full: 418.95, Half: 239.14 } },
      },
    },
    {
      id: '138',
      name: 'French Fries',
      description: '',
      veg: true,
      rating: 4,
      image: 'https://bobsimages.blob.core.windows.net/dishesh/no-image.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 124.95 } },
        nowPrice: { size: { Full: 79 } },
      },
    },
    {
      id: '139',
      name: 'Tandoori Chicken Wings [5 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-tandoori-wings.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 366.45 } },
        nowPrice: { size: { Full: 200 } },
      },
    },
    {
      id: '140',
      name: 'Peri Peri Chicken Wings [5 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-peri-peri-fried.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 387.45 } },
        nowPrice: { size: { Full: 200 } },
      },
    },
    {
      id: '141',
      name: 'Peri Peri Chicken Tikka [8 Pieces]',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-chicken-peri-peri-tikka.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 376.95 } },
        nowPrice: { size: { Full: 219 } },
      },
    },
    {
      id: '142',
      name: 'Onion Missi Roti',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-missi.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 30 } },
        nowPrice: { size: { Full: 30 } },
      },
    },
    {
      id: '143',
      name: 'Tandoori Onion Roti',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roti-tandoori-onion.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 42.0 } },
        nowPrice: { size: { Full: 25 } },
      },
    },
    // {
    //   id: '144',
    //   name: 'Egg',

    //   description: '',
    //   veg: false,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/chinese-noodels-schezwan-egg.jpeg',
    //   category: 'Others',
    //   priceOptions: {
    //     wasPrice: { size: { Full: 20.0 } },
    //     nowPrice: { size: { Full: 20.0 } },
    //   },
    // },
    // {
    //   id: '145',
    //   name: 'Chicken',

    //   description: '',
    //   veg: false,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/chinese-chicken-chilli-gravy.jpeg',
    //   category: 'Others',
    //   priceOptions: {
    //     wasPrice: { size: { Full: 50.0 } },
    //     nowPrice: { size: { Full: 50.0 } },
    //   },
    // },
    {
      id: '146',
      name: 'Veg Manchow Soup',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/soup-mancho.jpeg',
      category: 'Soups',
      priceOptions: {
        wasPrice: { size: { Full: 126.0 } },
        nowPrice: { size: { Full: 99.0 } },
      },
    },
    {
      id: '147',
      name: 'Chilli Chicken Roll',

      description: '',
      veg: false,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/roll-chilli-chicken.jpeg',
      category: FoodCategory.Rolls,
      priceOptions: {
        wasPrice: { size: { Full: 366.45 } },
        nowPrice: { size: { Full: 149.0 } },
      },
    },
    // {
    //   id: '148',
    //   name: 'GOAT Chilli Paneer Roll',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/roll-chilli-paneer.jpeg',
    //   category: FoodCategory.Starters,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 366.45 } },
    //     nowPrice: { size: { Full: 129 } },
    //   },
    // },
    // {
    //   id: '149',
    //   name: 'GOAT Fried Rice',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/chinese-rice-chicken-chilli-garlic.jpeg',
    //   category: 'Rice',
    //   priceOptions: {
    //     wasPrice: { size: { Full: 471.45, Half: 261.45 } },
    //     nowPrice: { size: { Full: 261.45, Half: 144.99 } },
    //   },
    // },
    // {
    //   id: '150',
    //   name: 'GOAT Kadhai Chaap',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/main-chaap-kadhai.jpeg',
    //   category: FoodCategory.MainCourse,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 471.45, Half: 313.95 } },
    //     nowPrice: { size: { Full: 313.95, Half: 209.07 } },
    //   },
    // },
    {
      id: '151',
      name: 'Crispy Corn',

      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/starter-crispy-corn.jpeg',
      category: FoodCategory.Starters,
      priceOptions: {
        wasPrice: { size: { Full: 292.95 } },
        nowPrice: { size: { Full: 200 } },
      },
    },
    // {
    //   id: '152',
    //   name: 'Chutney [30 ml]',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/tandoori-chicken.jpg',
    //   category: FoodCategory.Sides,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 15.0 } },
    //     nowPrice: { size: { Full: 15.0 } },
    //   },
    // },
    // {
    //   id: '153',
    //   name: 'Sirka Onion [1 Packet]',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/tandoori-chicken.jpg',
    //   category: FoodCategory.Sides,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 15.0 } },
    //     nowPrice: { size: { Full: 15.0 } },
    //   },
    // },
    // {
    //   id: '154',
    //   name: 'Red Chutney [30 ml]',
    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/tandoori-chicken.jpg',
    //   category: FoodCategory.Sides,
    //   priceOptions: {
    //     wasPrice: { size: { Full: 15.0 } },
    //     nowPrice: { size: { Full: 15.0 } },
    //   },
    // },
    // {
    //   id: '155',
    //   name: 'Honey Chilli Potato',

    //   description: '',
    //   veg: true,
    //   rating: 4,
    //   image: 'https://bobsimages.blob.core.windows.net/dishesh/chinese-chilli-potato.jpeg',
    //   category: 'Snacks',
    //   priceOptions: {
    //     wasPrice: { size: { Full: 282.45, Half: 208.95 } },
    //     nowPrice: { size: { Full: 208.95, Half: 154.58 } },
    //   },
    // },
    {
      id: '156',
      name: 'Tawa Roti',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roti-tawa.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 15 } },
        nowPrice: { size: { Full: 15 } },
      },
    },
    {
      id: '157',
      name: 'Tawa Butter Roti',
      description: '',
      veg: true,
      rating: 4,
      image:
        'https://bobsimages.blob.core.windows.net/dishesh/bread-roti-tawa-butter.jpeg',
      category: FoodCategory.Breads,
      priceOptions: {
        wasPrice: { size: { Full: 26.25 } },
        nowPrice: { size: { Full: 25 } },
      },
    },
  ] as FoodItem[],
};
