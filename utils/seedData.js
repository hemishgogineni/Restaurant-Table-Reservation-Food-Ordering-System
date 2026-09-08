const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');

const seedDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_reservation_db');
    }

    console.log('Seeding Database...');
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Reservation.deleteMany({});
    await Order.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create 18 restaurant branches
    const restaurantData = [
      ['Gourmet Reserve Central', 'Hosur Road, Bengaluru, Karnataka 560029', '080 4012 9100'],
      ['Gourmet Reserve Indiranagar', '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038', '080 4012 9101'],
      ['Gourmet Reserve Koramangala', '80 Feet Road, Koramangala, Bengaluru, Karnataka 560034', '080 4012 9102'],
      ['Gourmet Reserve Whitefield', 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066', '080 4012 9103'],
      ['Gourmet Reserve Jayanagar', '9th Block, Jayanagar, Bengaluru, Karnataka 560069', '080 4012 9104'],
      ['Gourmet Reserve Malleshwaram', 'Sampige Road, Malleshwaram, Bengaluru, Karnataka 560003', '080 4012 9105'],
      ['Gourmet Reserve Electronic City', 'Neeladri Road, Electronic City, Bengaluru, Karnataka 560100', '080 4012 9106'],
      ['Gourmet Reserve HSR Layout', '27th Main Road, HSR Layout, Bengaluru, Karnataka 560102', '080 4012 9107'],
      ['Gourmet Reserve MG Road', 'Mahatma Gandhi Road, Bengaluru, Karnataka 560001', '080 4012 9108'],
      ['Gourmet Reserve Yelahanka', 'New Town, Yelahanka, Bengaluru, Karnataka 560064', '080 4012 9109'],
      ['Gourmet Reserve Rajajinagar', 'Dr Rajkumar Road, Rajajinagar, Bengaluru, Karnataka 560010', '080 4012 9110'],
      ['Gourmet Reserve Banashankari', 'Kanakapura Road, Banashankari, Bengaluru, Karnataka 560050', '080 4012 9111'],
      ['Gourmet Reserve Marathahalli', 'Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037', '080 4012 9112'],
      ['Gourmet Reserve Hebbal', 'Bellary Road, Hebbal, Bengaluru, Karnataka 560024', '080 4012 9113'],
      ['Gourmet Reserve Bellandur', 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103', '080 4012 9114'],
      ['Gourmet Reserve Kalyan Nagar', 'HRBR Layout, Kalyan Nagar, Bengaluru, Karnataka 560043', '080 4012 9115'],
      ['Gourmet Reserve Vijayanagar', 'Chord Road, Vijayanagar, Bengaluru, Karnataka 560040', '080 4012 9116'],
      ['Gourmet Reserve Devanahalli', 'Airport Road, Devanahalli, Karnataka 562110', '080 4012 9117']
    ];

    const branches = await Branch.insertMany(restaurantData.map(([name, address, phone]) => ({
      name,
      address,
      seatingCapacity: 120,
      phone
    })));
    const branch = branches[0];

    // Create Users
    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@christ.edu',
      passwordHash,
      role: 'customer',
      phone: '9876543210'
    });

    const kitchenStaff = await User.create({
      name: 'Chef Gordon',
      email: 'kitchen@christ.edu',
      passwordHash,
      role: 'kitchen',
      branchId: branch._id
    });

    const manager = await User.create({
      name: 'Admin Manager',
      email: 'admin@christ.edu',
      passwordHash,
      role: 'admin',
      branchId: branch._id
    });

    // Create four bookable tables at every restaurant
    const tableData = branches.flatMap((restaurant) => [
      { branchId: restaurant._id, tableNumber: 'T-01', capacity: 2 },
      { branchId: restaurant._id, tableNumber: 'T-02', capacity: 4 },
      { branchId: restaurant._id, tableNumber: 'T-03', capacity: 6 },
      { branchId: restaurant._id, tableNumber: 'T-04', capacity: 8 }
    ]);
    const tables = await Table.insertMany(tableData);
    const branchTables = tables.filter((table) => table.branchId.equals(branch._id));
    const [t1, t2, t3, t4] = branchTables;

    // Create a 64-item catalog in eight categories for every restaurant
    const menuCatalog = [
      ['Paneer Butter Masala', 'Vegetarian', 280, 'Cottage cheese cubes in rich tomato gravy'],
      ['Palak Paneer', 'Vegetarian', 260, 'Paneer simmered in creamy spinach gravy'],
      ['Vegetable Biryani', 'Vegetarian', 240, 'Fragrant basmati rice with seasonal vegetables'],
      ['Dal Makhani', 'Vegetarian', 220, 'Slow-cooked black lentils with butter and cream'],
      ['Chole Bhature', 'Vegetarian', 210, 'Spiced chickpeas with fluffy fried bread'],
      ['Masala Dosa', 'Vegetarian', 180, 'Crisp dosa with potato masala and chutneys'],
      ['Mushroom Kadai', 'Vegetarian', 250, 'Mushrooms tossed in a smoky kadai masala'],
      ['Garlic Naan', 'Vegetarian', 60, 'Leavened flatbread topped with minced garlic'],
      ['Chicken Biryani', 'Non-Vegetarian', 340, 'Aromatic basmati rice cooked with succulent chicken'],
      ['Butter Chicken', 'Non-Vegetarian', 360, 'Tandoori chicken in a silky tomato sauce'],
      ['Mutton Rogan Josh', 'Non-Vegetarian', 420, 'Tender mutton in fragrant Kashmiri spices'],
      ['Chicken Tikka Masala', 'Non-Vegetarian', 350, 'Charred chicken in a creamy spiced gravy'],
      ['Fish Curry', 'Non-Vegetarian', 380, 'Coastal fish curry with coconut and spices'],
      ['Prawn Pepper Fry', 'Non-Vegetarian', 430, 'Juicy prawns tossed with cracked pepper'],
      ['Tandoori Chicken', 'Non-Vegetarian', 390, 'Yogurt-marinated chicken roasted in the tandoor'],
      ['Egg Keema Pav', 'Non-Vegetarian', 230, 'Spiced egg mince served with toasted pav'],
      ['Crispy Corn', 'Starters', 160, 'Crunchy corn kernels with chilli and spring onion'],
      ['Paneer 65', 'Starters', 220, 'Crispy fried paneer with curry leaves'],
      ['Veg Spring Rolls', 'Starters', 180, 'Crisp rolls filled with seasoned vegetables'],
      ['Hara Bhara Kebab', 'Starters', 190, 'Spinach and pea kebabs with mint chutney'],
      ['Chicken Wings', 'Starters', 280, 'Glazed wings with a smoky house sauce'],
      ['Chicken Seekh Kebab', 'Starters', 300, 'Minced chicken kebabs grilled with herbs'],
      ['Fish Fingers', 'Starters', 290, 'Golden crumbed fish with tartar dip'],
      ['Prawn Tempura', 'Starters', 360, 'Lightly battered prawns with citrus aioli'],
      ['Margherita Pizza', 'Italian', 320, 'Tomato, mozzarella and basil on a thin crust'],
      ['Penne Arrabbiata', 'Italian', 280, 'Penne pasta in a spicy tomato sauce'],
      ['Fettuccine Alfredo', 'Italian', 340, 'Ribbon pasta in parmesan cream sauce'],
      ['Mushroom Risotto', 'Italian', 360, 'Creamy arborio rice with herbs and mushrooms'],
      ['Lasagna Verde', 'Italian', 390, 'Layered pasta with spinach, ricotta and tomato'],
      ['Chicken Pepperoni Pizza', 'Italian', 420, 'Stone-baked pizza with chicken pepperoni'],
      ['Pesto Gnocchi', 'Italian', 350, 'Soft potato gnocchi with basil pesto'],
      ['Garlic Bread with Cheese', 'Italian', 180, 'Toasted garlic bread with melted mozzarella'],
      ['Mexican Bean Tacos', 'Mexican', 240, 'Soft tacos filled with beans, salsa and guacamole'],
      ['Chicken Fajitas', 'Mexican', 360, 'Sizzling chicken with peppers and tortillas'],
      ['Veg Enchiladas', 'Mexican', 300, 'Tortillas baked with vegetables and chilli sauce'],
      ['Beef Burrito Bowl', 'Mexican', 390, 'Seasoned beef, rice, beans and pico de gallo'],
      ['Guacamole Nachos', 'Mexican', 260, 'Crisp nachos with guacamole and melted cheese'],
      ['Quesadilla Suprema', 'Mexican', 320, 'Grilled tortilla with cheese, vegetables and salsa'],
      ['Mexican Street Corn', 'Mexican', 180, 'Roasted corn with lime, chilli and cheese'],
      ['Churros with Chocolate', 'Mexican', 220, 'Cinnamon sugar churros with chocolate dip'],
      ['Virgin Mojito', 'Beverages', 150, 'Refreshing mint and lime mocktail'],
      ['Mango Lassi', 'Beverages', 140, 'Chilled yogurt drink blended with ripe mango'],
      ['Fresh Lime Soda', 'Beverages', 100, 'Sparkling lime soda served sweet or salty'],
      ['Iced Peach Tea', 'Beverages', 130, 'Cold-brewed tea with peach and lemon'],
      ['Cold Coffee', 'Beverages', 170, 'Chilled coffee blended with milk and ice'],
      ['Watermelon Cooler', 'Beverages', 150, 'Fresh watermelon with basil and lime'],
      ['Masala Chai', 'Beverages', 90, 'Indian tea brewed with warming spices'],
      ['Berry Lemonade', 'Beverages', 160, 'House lemonade with mixed berry puree'],
      ['Chocolate Milkshake', 'Milkshakes', 220, 'Thick chocolate shake topped with cocoa'],
      ['Strawberry Milkshake', 'Milkshakes', 220, 'Fresh strawberry shake with whipped cream'],
      ['Mango Milkshake', 'Milkshakes', 210, 'Creamy Alphonso mango milkshake'],
      ['Oreo Milkshake', 'Milkshakes', 240, 'Cookies and cream shake with Oreo crumble'],
      ['Banana Caramel Shake', 'Milkshakes', 230, 'Banana shake finished with caramel'],
      ['Peanut Butter Shake', 'Milkshakes', 250, 'Roasted peanut butter blended with milk'],
      ['Pistachio Milkshake', 'Milkshakes', 260, 'Nutty pistachio shake with saffron'],
      ['Vanilla Bean Shake', 'Milkshakes', 210, 'Classic vanilla bean milkshake'],
      ['Vanilla Ice Cream', 'Ice Creams', 120, 'Classic creamy vanilla scoop'],
      ['Chocolate Ice Cream', 'Ice Creams', 130, 'Rich dark chocolate ice cream'],
      ['Mango Ice Cream', 'Ice Creams', 140, 'Seasonal mango ice cream'],
      ['Tender Coconut Ice Cream', 'Ice Creams', 160, 'Smooth coconut ice cream with tender coconut'],
      ['Strawberry Sundae', 'Ice Creams', 220, 'Strawberry ice cream with sauce and nuts'],
      ['Brownie with Ice Cream', 'Ice Creams', 260, 'Warm chocolate brownie with vanilla scoop'],
      ['Gulab Jamun Ice Cream', 'Ice Creams', 200, 'Gulab jamun served with saffron ice cream'],
      ['Salted Caramel Gelato', 'Ice Creams', 190, 'Silky gelato with salted caramel swirls']
    ];

    const menuItems = await MenuItem.insertMany(branches.flatMap((restaurant) => menuCatalog.map(([name, category, price, description]) => ({
      branchId: restaurant._id,
      name,
      category,
      price,
      description
    }))));
    const branchMenu = menuItems.filter((item) => item.branchId.equals(branch._id));
    const m1 = branchMenu.find((item) => item.name === 'Paneer Butter Masala');
    const m2 = branchMenu.find((item) => item.name === 'Garlic Naan');
    const m3 = branchMenu.find((item) => item.name === 'Chicken Biryani');
    const m4 = branchMenu.find((item) => item.name === 'Virgin Mojito');
    const m5 = branchMenu.find((item) => item.name === 'Gulab Jamun Ice Cream');

    // Create Reservation
    const resDate = new Date();
    resDate.setHours(resDate.getHours() + 2);
    const reservation = await Reservation.create({
      customerId: customer._id,
      branchId: branch._id,
      tableId: t2._id,
      dateTime: resDate,
      guestsCount: 4,
      status: 'confirmed'
    });

    // Create Sample Orders
    const order1 = await Order.create({
      customerId: customer._id,
      branchId: branch._id,
      tableId: t2._id,
      orderType: 'dine-in',
      items: [
        { menuItemId: m1._id, name: m1.name, price: m1.price, quantity: 2, subtotal: 560 },
        { menuItemId: m2._id, name: m2.name, price: m2.price, quantity: 4, subtotal: 240 },
        { menuItemId: m4._id, name: m4.name, price: m4.price, quantity: 2, subtotal: 300 }
      ],
      status: 'Placed',
      subtotal: 1100,
      taxAmount: 55,
      serviceCharge: 55,
      totalAmount: 1210,
      remarks: 'Less spicy please'
    });

    console.log('Database Seeded Successfully!');
    console.log(`Demo Credentials:
    Customer: customer@christ.edu / password123
    Kitchen Staff: kitchen@christ.edu / password123
    Admin/Manager: admin@christ.edu / password123`);

    return { branch, customer, kitchenStaff, manager, t1, t2, m1, m2, order1, reservation };
  } catch (err) {
    console.error('Seeding Error:', err.message);
  }
};

if (require.main === module) {
  seedDB().then(() => mongoose.connection.close());
}

module.exports = seedDB;
