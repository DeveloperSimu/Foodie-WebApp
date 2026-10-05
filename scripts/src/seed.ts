import bcrypt from "bcryptjs";
import { db, usersTable, foodItemsTable, shortsTable, cookingIdeasTable, ideaReviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const expandedDishes = (cafe1: number, cafe2: number) => {
  const dishes: Array<[string, string, string, string, number]> = [
  ["Aloo Gobi", "Classic potato and cauliflower curry with warming spices.", "9.99", "Veg", cafe1],
  ["Vegetable Korma", "Mixed vegetables in creamy cashew gravy.", "11.49", "Veg", cafe1],
  ["Rajma Masala", "Red kidney beans slow-cooked in tomato gravy.", "10.49", "Veg", cafe1],
  ["Malai Kofta", "Paneer potato dumplings in royal gravy.", "12.99", "Veg", cafe1],
  ["Baingan Bharta", "Smoky roasted eggplant with onion and tomato.", "9.49", "Veg", cafe1],
  ["Matar Paneer", "Paneer and green peas in fragrant tomato sauce.", "11.99", "Veg", cafe1],
  ["Chicken Tikka", "Char-grilled yogurt-marinated chicken.", "14.49", "Non-Veg", cafe1],
  ["Lamb Kebab", "Juicy minced lamb skewers with herbs.", "16.49", "Non-Veg", cafe1],
  ["Fish Curry", "Tender fish in tangy coconut curry.", "15.99", "Non-Veg", cafe1],
  ["Chicken Korma", "Tender chicken in mild cashew cream sauce.", "15.49", "Non-Veg", cafe1],
  ["Prawn Masala", "Succulent prawns in spicy onion masala.", "17.49", "Non-Veg", cafe1],
  ["Chicken Seekh Kebab", "Minced chicken kebabs with aromatic herbs.", "14.99", "Non-Veg", cafe1],
  ["Hot and Sour Soup", "Spicy tangy soup with vegetables and tofu.", "7.49", "Chinese", cafe2],
  ["Spring Rolls", "Crispy rolls filled with seasoned vegetables.", "7.99", "Chinese", cafe2],
  ["Manchow Soup", "Indo-Chinese soup topped with fried noodles.", "7.99", "Chinese", cafe2],
  ["Szechuan Chicken", "Chicken tossed in fiery Szechuan sauce.", "14.99", "Chinese", cafe2],
  ["Honey Chilli Potato", "Crispy potatoes glazed with sweet chilli.", "8.99", "Chinese", cafe2],
  ["Garlic Noodles", "Wok-tossed noodles with roasted garlic.", "9.49", "Chinese", cafe2],
  ["Vegetable Spring Rice", "Fried rice with seasonal vegetables.", "9.99", "Chinese", cafe2],
  ["Kung Pao Tofu", "Crispy tofu with peanuts and chilli.", "11.49", "Chinese", cafe2],
  ["Four Cheese Pizza", "Wood-fired pizza with four cheeses.", "15.99", "Italian", cafe1],
  ["Spaghetti Carbonara", "Spaghetti with creamy egg and parmesan.", "14.49", "Italian", cafe1],
  ["Lasagna", "Layered pasta with tomato sauce and cheese.", "15.49", "Italian", cafe1],
  ["Mushroom Risotto", "Creamy arborio rice with wild mushrooms.", "14.99", "Italian", cafe1],
  ["Pesto Pasta", "Pasta with fresh basil pesto and parmesan.", "13.49", "Italian", cafe1],
  ["Garlic Bread", "Toasted bread with garlic butter and herbs.", "6.49", "Italian", cafe1],
  ["Bruschetta", "Toast topped with tomato, basil, and olive oil.", "7.49", "Italian", cafe1],
  ["Chicken Wings", "Crispy wings with spicy house sauce.", "12.99", "Fast Food", cafe2],
  ["Chicken Wrap", "Grilled chicken and salad in flatbread.", "10.49", "Fast Food", cafe2],
  ["Hot Dog", "Sausage in toasted bun with mustard.", "8.99", "Fast Food", cafe2],
  ["Cheese Nachos", "Tortilla chips loaded with cheese.", "8.49", "Fast Food", cafe2],
  ["Fish and Chips", "Golden fried fish with seasoned fries.", "13.99", "Fast Food", cafe2],
  ["Chicken Nuggets", "Golden chicken nuggets with dipping sauce.", "9.49", "Fast Food", cafe2],
  ["Veggie Tacos", "Tortillas filled with vegetables and salsa.", "9.99", "Fast Food", cafe2],
  ["Jalapeno Poppers", "Crispy jalapenos with cheese filling.", "8.99", "Fast Food", cafe2],
  ["Kheer", "Creamy cardamom rice pudding with nuts.", "5.49", "Desserts", cafe1],
  ["Jalebi", "Crispy golden spirals in sugar syrup.", "5.99", "Desserts", cafe1],
  ["Kulfi", "Dense Indian ice cream with pistachio.", "5.99", "Desserts", cafe1],
  ["Gajar Halwa", "Warm carrot pudding with milk and ghee.", "6.49", "Desserts", cafe1],
  ["Rasgulla", "Soft cottage cheese balls in syrup.", "5.49", "Desserts", cafe1],
  ["Mango Cheesecake", "Cheesecake topped with fresh mango glaze.", "7.49", "Desserts", cafe1],
  ["Ice Cream Sundae", "Vanilla ice cream with chocolate sauce.", "6.99", "Desserts", cafe1],
  ["Cold Coffee", "Chilled blended coffee with creamy foam.", "5.49", "Beverages", cafe1],
  ["Fresh Lime Soda", "Refreshing sweet or salted lime soda.", "3.99", "Beverages", cafe1],
  ["Watermelon Juice", "Freshly pressed chilled watermelon juice.", "4.49", "Beverages", cafe1],
  ["Iced Tea", "Chilled black tea with lemon.", "4.49", "Beverages", cafe1],
  ["Coconut Water", "Naturally refreshing tender coconut water.", "4.99", "Beverages", cafe1],
  ["Blueberry Smoothie", "Creamy yogurt smoothie with blueberries.", "6.49", "Beverages", cafe1],
  ["Virgin Mojito", "Sparkling mint and lime cooler.", "5.99", "Beverages", cafe1],
  ];
  return dishes.map(([name, description, price, category, cafeId], index) => ({
  name, description, price,           imageUrl: `https://loremflickr.com/900/700/${name.toLowerCase().replace(/\s+/g, "-")}?lock=${27 + index}`,
  category, cafeId, available: true, rating: "4.5", reviewCount: 40 + index,
  }));
};

const knownDishNames = [
  "Butter Chicken", "Paneer Tikka Masala", "Hakka Noodles", "Kung Pao Chicken", "Dim Sum Basket",
  "Veg Manchurian", "Dal Makhani", "Chicken Biryani", "Margherita Pizza", "Classic Chicken Burger",
  "Gulab Jamun", "Mango Lassi",
  ...expandedDishes(1, 2).map((food) => food.name),
];

const selectedImageOverrides: Record<string, string> = {
  "Rajma Masala": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Rajma_Masala_%2832081557778%29.jpg/960px-Rajma_Masala_%2832081557778%29.jpg",
  "Palak Paneer": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Palak_Paneer_curry_on_plate.jpg/960px-Palak_Paneer_curry_on_plate.jpg",
  "Butter Chicken": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Butter_Chicken%2C_City_Grill_Kottayam.jpg/960px-Butter_Chicken%2C_City_Grill_Kottayam.jpg",
  "Kheer": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Kheer_Rice_Pudding_Indian_Sweet_Buffalo_New_York.jpg/960px-Kheer_Rice_Pudding_Indian_Sweet_Buffalo_New_York.jpg",
  "Gajar Halwa": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Delicious_Gajar_Ka_Halwa.jpg/960px-Delicious_Gajar_Ka_Halwa.jpg",
  "Jalapeno Poppers": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Jalapeno_poppers.png",
  "Manchow Soup": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Chicken_Manchow_Soup.jpg/960px-Chicken_Manchow_Soup.jpg",
  "Fish Curry": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Meen_curry_%28fish_curry%29_from_Kerala%2C_traditionally_prepared_in_earthern_pot.jpg/960px-Meen_curry_%28fish_curry%29_from_Kerala%2C_traditionally_prepared_in_earthern_pot.jpg",
  "Malai Kofta": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Malai_Kofta_Curry.jpg/960px-Malai_Kofta_Curry.jpg",
  "Aloo Gobi": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Aloo_Gobi_Sabzi.jpg/960px-Aloo_Gobi_Sabzi.jpg",
  "Chilli Paneer": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/A_full_plate_chilli_paneer_in_Kolkata%2C_West_Bengal.jpg/960px-A_full_plate_chilli_paneer_in_Kolkata%2C_West_Bengal.jpg",
  "Chicken Biryani": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Chicken_biriyani-_My_cafe_restaurant_-_Meghalaya_DSC_009.jpg/960px-Chicken_biriyani-_My_cafe_restaurant_-_Meghalaya_DSC_009.jpg",
  "Paneer Tikka Masala": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Paneer_Tikka_Masala_%282026%29_01.jpg/960px-Paneer_Tikka_Masala_%282026%29_01.jpg",
  "Baingan Bharta": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Baigan_Bharta_from_Nagpur.JPG/960px-Baigan_Bharta_from_Nagpur.JPG",
  "Hot and Sour Soup": "https://loremflickr.com/900/700/hot-and-sour-soup?lock=201",
  "Hot Dog": "https://loremflickr.com/900/700/hot-dog?lock=303",
  "Jalebi": "/jalebi.png",
  "Rasmalai": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Rasmalai_3.jpg/960px-Rasmalai_3.jpg",
  "Rasgulla": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Rasmalai_3.jpg/960px-Rasmalai_3.jpg",
  "Spring Rolls": "https://loremflickr.com/900/700/spring-rolls?lock=101",
  "Coconut Water": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Coconut_water_at_restaurant_in_Ko_Samui.jpg/960px-Coconut_water_at_restaurant_in_Ko_Samui.jpg",
  "Mushroom Risotto": "https://loremflickr.com/900/700/mushroom-risotto?lock=102",
};

const dishImage = (name: string) =>
  selectedImageOverrides[name] ??
  `https://loremflickr.com/900/700/${name.toLowerCase().replace(/\s+/g, "-")}?lock=${knownDishNames.indexOf(name) + 1}`;

const legacyImages: Record<string, string> = {
  "Butter Chicken": "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85",
  "Paneer Tikka Masala": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85",
  "Hakka Noodles": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&q=85",
  "Kung Pao Chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=900&q=85",
  "Dim Sum Basket": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=900&q=85",
  "Veg Manchurian": "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85",
  "Dal Makhani": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900&q=85",
  "Chicken Biryani": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=900&q=85",
  "Margherita Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&q=85",
  "Classic Chicken Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85",
  "Gulab Jamun": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900&q=85",
  "Mango Lassi": "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=900&q=85",
};

async function seed() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("password123", 10);

  const existingCafe = await db.select().from(usersTable).where(eq(usersTable.email, "spicegarden@foodie.com"));
  if (existingCafe.length > 0) {
    const [cafe1] = existingCafe;
    const [cafe2] = await db.select().from(usersTable).where(eq(usersTable.email, "goldenwok@foodie.com"));
    const existingFood = await db.select().from(foodItemsTable);

    if (cafe2 && existingFood.length > 0) {
      for (const name of knownDishNames) {
        await db.update(foodItemsTable).set({ imageUrl: legacyImages[name] ?? dishImage(name) }).where(eq(foodItemsTable.name, name));
      }
      const existingNames = new Set(existingFood.map((food) => food.name));
      const missingFood = [
        { name: "Margherita Pizza", description: "Wood-fired pizza with tomato, fresh mozzarella, basil, and olive oil.", price: "13.99", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 114 },
        { name: "Classic Chicken Burger", description: "Crispy chicken fillet with lettuce, tomato, and house sauce in a toasted bun.", price: "10.99", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 92 },
        { name: "Gulab Jamun", description: "Soft milk-solid dumplings soaked in fragrant cardamom sugar syrup.", price: "5.99", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 76 },
        { name: "Mango Lassi", description: "Refreshing creamy yogurt drink blended with ripe Alphonso mangoes.", price: "4.99", imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 64 },
        { name: "Palak Paneer", description: "Tender paneer in a silky spinach gravy with gentle spices.", price: "11.99", imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=900&q=85", category: "Veg", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 71 },
        { name: "Chole Bhature", description: "Spiced chickpeas served with fluffy fried bhatura bread.", price: "10.49", imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=900&q=85", category: "Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 84 },
        { name: "Tandoori Chicken", description: "Juicy chicken marinated in yogurt and roasted with smoky spices.", price: "15.49", imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85", category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 103 },
        { name: "Mutton Rogan Josh", description: "Slow-braised tender mutton in a fragrant Kashmiri gravy.", price: "18.99", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85", category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 66 },
        { name: "Schezwan Fried Rice", description: "Wok-tossed rice with vegetables and bold Schezwan chili sauce.", price: "10.99", imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=85", category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.5", reviewCount: 79 },
        { name: "Chilli Paneer", description: "Crispy paneer tossed with peppers, onions, and spicy Indo-Chinese sauce.", price: "11.49", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85", category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 91 },
        { name: "Penne Arrabbiata", description: "Penne pasta in a spicy tomato, garlic, and basil sauce.", price: "12.49", imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.5", reviewCount: 58 },
        { name: "Creamy Alfredo Pasta", description: "Silky fettuccine tossed in parmesan cream sauce with herbs.", price: "13.49", imageUrl: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 73 },
        { name: "Loaded French Fries", description: "Crispy fries topped with cheese, herbs, and house seasoning.", price: "7.49", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.4", reviewCount: 62 },
        { name: "Crispy Veg Burger", description: "Crunchy vegetable patty with lettuce, tomato, and creamy sauce.", price: "9.49", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.5", reviewCount: 81 },
        { name: "Rasmalai", description: "Soft paneer dumplings soaked in chilled saffron milk.", price: "6.49", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 69 },
        { name: "Chocolate Brownie", description: "Warm fudgy chocolate brownie served with a rich cocoa finish.", price: "6.99", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 95 },
        { name: "Strawberry Milkshake", description: "Thick creamy milkshake blended with ripe strawberries.", price: "5.49", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 54 },
        { name: "Masala Chai", description: "Steaming Indian tea brewed with milk and aromatic spices.", price: "3.49", imageUrl: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 112 },
        ...expandedDishes(cafe1.id, cafe2.id),
      ].filter((food) => !existingNames.has(food.name));

      if (missingFood.length > 0) {
        await db.insert(foodItemsTable).values(missingFood);
        console.log("Additional menu items restored");
      } else {
        console.log("Already seeded, skipping.");
      }
    } else if (cafe2) {
      await db.insert(foodItemsTable).values([
        { name: "Butter Chicken", description: "Creamy tomato-based curry with tender chicken pieces. A North Indian classic.", price: "14.99", imageUrl: null, category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 120 },
        { name: "Paneer Tikka Masala", description: "Grilled cottage cheese in a spiced tomato-cream gravy. Rich and aromatic.", price: "12.99", imageUrl: null, category: "Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 98 },
        { name: "Hakka Noodles", description: "Wok-tossed noodles with crisp veggies and savory sauces — Indo-Chinese perfection.", price: "9.99", imageUrl: null, category: "Chinese", cafeId: cafe1.id, available: true, rating: "4.5", reviewCount: 75 },
        { name: "Kung Pao Chicken", description: "Spicy stir-fried chicken with peanuts, chili, and Sichuan pepper.", price: "15.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.9", reviewCount: 210 },
        { name: "Dim Sum Basket", description: "6-piece assorted steamed dumplings — prawn, pork, and vegetable varieties.", price: "11.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 87 },
        { name: "Veg Manchurian", description: "Crispy vegetable balls in a tangy, spicy Manchurian sauce. A crowd favourite.", price: "8.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.4", reviewCount: 63 },
        { name: "Dal Makhani", description: "Slow-cooked black lentils simmered overnight with butter and cream.", price: "10.99", imageUrl: null, category: "Veg", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 88 },
        { name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken, saffron, and caramelized onions.", price: "16.99", imageUrl: null, category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.9", reviewCount: 304 },
        { name: "Margherita Pizza", description: "Wood-fired pizza with tomato, fresh mozzarella, basil, and olive oil.", price: "13.99", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 114 },
        { name: "Classic Chicken Burger", description: "Crispy chicken fillet with lettuce, tomato, and house sauce in a toasted bun.", price: "10.99", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 92 },
        { name: "Gulab Jamun", description: "Soft milk-solid dumplings soaked in fragrant cardamom sugar syrup.", price: "5.99", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 76 },
        { name: "Mango Lassi", description: "Refreshing creamy yogurt drink blended with ripe Alphonso mangoes.", price: "4.99", imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 64 },
      ]);
      console.log("Food items restored");
    } else {
      console.log("Already seeded, skipping.");
    }
    process.exit(0);
  }

  const [cafe1, cafe2, user1, user2] = await db.insert(usersTable).values([
    { name: "Spice Garden Cafe", email: "spicegarden@foodie.com", passwordHash: hash, role: "cafe", bio: "Authentic Indian & Chinese cuisine crafted with love" },
    { name: "Golden Wok", email: "goldenwok@foodie.com", passwordHash: hash, role: "cafe", bio: "Premium Chinese restaurant with 20 years of tradition" },
    { name: "Alice Sharma", email: "alice@foodie.com", passwordHash: hash, role: "user", bio: "Food lover from Mumbai" },
    { name: "Rahul Kumar", email: "rahul@foodie.com", passwordHash: hash, role: "user", bio: "Always exploring new cuisines" },
  ]).returning();

  console.log("Users created");

  await db.insert(foodItemsTable).values([
    { name: "Butter Chicken", description: "Creamy tomato-based curry with tender chicken pieces. A North Indian classic.", price: "14.99", imageUrl: null, category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 120 },
    { name: "Paneer Tikka Masala", description: "Grilled cottage cheese in a spiced tomato-cream gravy. Rich and aromatic.", price: "12.99", imageUrl: null, category: "Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 98 },
    { name: "Hakka Noodles", description: "Wok-tossed noodles with crisp veggies and savory sauces — Indo-Chinese perfection.", price: "9.99", imageUrl: null, category: "Chinese", cafeId: cafe1.id, available: true, rating: "4.5", reviewCount: 75 },
    { name: "Kung Pao Chicken", description: "Spicy stir-fried chicken with peanuts, chili, and Sichuan pepper.", price: "15.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.9", reviewCount: 210 },
    { name: "Dim Sum Basket", description: "6-piece assorted steamed dumplings — prawn, pork, and vegetable varieties.", price: "11.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 87 },
    { name: "Veg Manchurian", description: "Crispy vegetable balls in a tangy, spicy Manchurian sauce. A crowd favourite.", price: "8.99", imageUrl: null, category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.4", reviewCount: 63 },
    { name: "Dal Makhani", description: "Slow-cooked black lentils simmered overnight with butter and cream.", price: "10.99", imageUrl: null, category: "Veg", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 88 },
    { name: "Chicken Biryani", description: "Fragrant basmati rice layered with spiced chicken, saffron, and caramelized onions.", price: "16.99", imageUrl: null, category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.9", reviewCount: 304 },
    { name: "Palak Paneer", description: "Tender paneer in a silky spinach gravy with gentle spices.", price: "11.99", imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=900&q=85", category: "Veg", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 71 },
    { name: "Chole Bhature", description: "Spiced chickpeas served with fluffy fried bhatura bread.", price: "10.49", imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=900&q=85", category: "Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 84 },
    { name: "Tandoori Chicken", description: "Juicy chicken marinated in yogurt and roasted with smoky spices.", price: "15.49", imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85", category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 103 },
    { name: "Mutton Rogan Josh", description: "Slow-braised tender mutton in a fragrant Kashmiri gravy.", price: "18.99", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85", category: "Non-Veg", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 66 },
    { name: "Schezwan Fried Rice", description: "Wok-tossed rice with vegetables and bold Schezwan chili sauce.", price: "10.99", imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=85", category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.5", reviewCount: 79 },
    { name: "Chilli Paneer", description: "Crispy paneer tossed with peppers, onions, and spicy Indo-Chinese sauce.", price: "11.49", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85", category: "Chinese", cafeId: cafe2.id, available: true, rating: "4.6", reviewCount: 91 },
    { name: "Penne Arrabbiata", description: "Penne pasta in a spicy tomato, garlic, and basil sauce.", price: "12.49", imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.5", reviewCount: 58 },
    { name: "Creamy Alfredo Pasta", description: "Silky fettuccine tossed in parmesan cream sauce with herbs.", price: "13.49", imageUrl: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=900&q=85", category: "Italian", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 73 },
    { name: "Loaded French Fries", description: "Crispy fries topped with cheese, herbs, and house seasoning.", price: "7.49", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.4", reviewCount: 62 },
    { name: "Crispy Veg Burger", description: "Crunchy vegetable patty with lettuce, tomato, and creamy sauce.", price: "9.49", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=85", category: "Fast Food", cafeId: cafe2.id, available: true, rating: "4.5", reviewCount: 81 },
    { name: "Rasmalai", description: "Soft paneer dumplings soaked in chilled saffron milk.", price: "6.49", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 69 },
    { name: "Chocolate Brownie", description: "Warm fudgy chocolate brownie served with a rich cocoa finish.", price: "6.99", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=85", category: "Desserts", cafeId: cafe1.id, available: true, rating: "4.7", reviewCount: 95 },
    { name: "Strawberry Milkshake", description: "Thick creamy milkshake blended with ripe strawberries.", price: "5.49", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.6", reviewCount: 54 },
    { name: "Masala Chai", description: "Steaming Indian tea brewed with milk and aromatic spices.", price: "3.49", imageUrl: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=900&q=85", category: "Beverages", cafeId: cafe1.id, available: true, rating: "4.8", reviewCount: 112 },
  ]);

  console.log("Food items created");
  for (const name of knownDishNames) {
    await db.update(foodItemsTable).set({ imageUrl: dishImage(name) }).where(eq(foodItemsTable.name, name));
  }
  await db.insert(foodItemsTable).values(expandedDishes(cafe1.id, cafe2.id));
  console.log("Expanded menu created");

  await db.insert(shortsTable).values([
    { title: "Perfect Butter Chicken in 15 Minutes", description: "Quick weeknight butter chicken that tastes like it simmered all day.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnailUrl: null, authorId: cafe1.id },
    { title: "Wok Technique for Chinese Noodles", description: "Master the high-heat wok flip for perfectly charred noodles.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnailUrl: null, authorId: cafe2.id },
    { title: "How to Make Fluffy Naan at Home", description: "No tandoor? No problem. Get pillowy naan in a cast iron pan.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnailUrl: null, authorId: cafe1.id },
  ]);

  console.log("Shorts created");

  const [idea1, idea2] = await db.insert(cookingIdeasTable).values([
    {
      title: "Smoky Restaurant-Style Dal Tadka at Home",
      content: "The secret to restaurant-style dal tadka is the dhungar (smoking) technique. After cooking the dal, place a small piece of coal in a foil cup in the center of the pot. Pour a teaspoon of ghee on the coal — it will smoke immediately. Cover the pot for 2 minutes. The smoky flavor infuses the entire dal. Finish with a tadka of cumin, dried red chilies, garlic, and a pinch of hing in ghee poured sizzling over the dal.",
      imageUrl: null,
      authorId: user1.id,
      likesCount: 47,
      reviewCount: 3,
      tags: ["dal", "indian", "technique", "vegetarian"],
    },
    {
      title: "Chinese Five-Spice Roast Duck — Simplified",
      content: "You don't need a Peking duck oven for amazing five-spice duck. Air-dry the duck in the fridge uncovered for 24 hours after rubbing with five-spice, salt, and sugar. This dries the skin dramatically. Roast at 400°F for 45 minutes, then blast at 450°F for 15 minutes for crackling skin. The aromatic five-spice — star anise, cloves, cinnamon, Sichuan pepper, and fennel — penetrates beautifully during the long dry rest.",
      imageUrl: null,
      authorId: cafe2.id,
      likesCount: 92,
      reviewCount: 2,
      tags: ["chinese", "duck", "five-spice", "roast"],
    },
  ]).returning();

  await db.insert(ideaReviewsTable).values([
    { ideaId: idea1.id, authorId: user2.id, comment: "Tried the dhungar technique tonight — absolute game changer! The smokiness elevated a simple dal into something special.", rating: 5 },
    { ideaId: idea1.id, authorId: cafe1.id, comment: "We use this in our kitchen every day. Great tip for home cooks!", rating: 5 },
    { ideaId: idea2.id, authorId: user1.id, comment: "The 24-hour air-dry tip is brilliant. Skin came out perfectly crispy.", rating: 5 },
  ]);

  console.log("Ideas and reviews created");
  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
