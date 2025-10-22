require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { EavsData, DetailedStateData, VotingEquipmentData, BoundaryData, DemographicData, FelonyVotingData } = require('./models/votingData.cjs');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Connection error:', err));

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});