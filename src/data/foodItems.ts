export default {
  "foodItems": [
      {
          "id": "1",
          "name": "Paneer Tikka",
          "price": 250,
          "image": "/imgs/dishes/paneer-tikka.jpg",
          "description": "Delicious grilled paneer with spices.",
          "veg": true,
          "rating": 3,
          "wasPrice": 200,
          "nowPrice": 100,
          "options": {
              "quantity": ["Half", "Full"],
              "style": ["Dry"]
          },
          "priceOptions": {
            size: {
              "Quarter": 75,
              "Half": 150,
              "full": 300
            },
          }
      },
   
  ]
}
