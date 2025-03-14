require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const fridgeRoutes = require('./routes/fridge');
const shoppingListRoutes = require('./routes/shoppingList');
const menuRoutes = require('./routes/menu');
const friendsRoutes = require('./routes/friends');

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
app.use('/api/shopping-list', shoppingListRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/friends', friendsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
