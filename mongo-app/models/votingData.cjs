const mongoose = require('mongoose');
const { eavsDataSchema, detailedStateDataSchema, votingEquipmentDataSchema, boundaryDataSchema, demographicDataSchema, felonyVotingDataSchema, indexes } = require('../schema.cjs');

const eavsDataSchemaMongoose = new mongoose.Schema(eavsDataSchema);

const detailedStateDataSchemaMongoose = new mongoose.Schema(detailedStateDataSchema);

const votingEquipmentDataSchemaMongoose = new mongoose.Schema(votingEquipmentDataSchema);

const boundaryDataSchemaMongoose = new mongoose.Schema(boundaryDataSchema);

const demographicDataSchemaMongoose = new mongoose.Schema(demographicDataSchema);

const felonyVotingDataSchemaMongoose = new mongoose.Schema(felonyVotingDataSchema);

Object.entries(indexes).forEach(([field, indexConfig]) => {
  eavsDataSchemaMongoose.index({ [field]: indexConfig }); 
  detailedStateDataSchemaMongoose.index({ [field]: indexConfig });
  votingEquipmentDataSchemaMongoose.index({ [field]: indexConfig });
  boundaryDataSchemaMongoose.index({ [field]: indexConfig });
  demographicDataSchemaMongoose.index({ [field]: indexConfig });
  felonyVotingDataSchemaMongoose.index({ [field]: indexConfig });
});

// Create Mongoose models
const EavsData = mongoose.model('EavsData', eavsDataSchemaMongoose);
const DetailedStateData = mongoose.model('DetailedStateData', detailedStateDataSchemaMongoose);
const VotingEquipmentData = mongoose.model('VotingEquipmentData', votingEquipmentDataSchemaMongoose);
const BoundaryData = mongoose.model('BoundaryData', boundaryDataSchemaMongoose);
const DemographicData = mongoose.model('DemographicData', demographicDataSchemaMongoose);
const FelonyVotingData = mongoose.model('FelonyVotingData', felonyVotingDataSchemaMongoose);

// Export
module.exports = {
  EavsData,
  DetailedStateData,
  VotingEquipmentData,
  BoundaryData,
  DemographicData,
  FelonyVotingData
};