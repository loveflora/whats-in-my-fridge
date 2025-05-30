require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const fridgeRoutes = require('./routes/fridge');
const categoryRoutes = require('./routes/category');
const shoppingListRoutes = require('./routes/shoppingList');
const menuRoutes = require('./routes/menu');
const friendsRoutes = require('./routes/friends');
const groupsRoutes = require('./routes/groups');
const notificationsRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whats-in-my-fridge')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fridge', fridgeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shopping', shoppingListRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/notifications', notificationsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
