/**
 * MongoDB Schema for US Voting Data Application
 * Based on EAVS dataset, boundary data, and demographic data for 48 mainland states (2016-2024)
 * Includes detailed state schemas for specific states with enhanced data
 */

// General EAVS Data Schema - The primary data collection for voting statistics
const eavsDataSchema = {
  _id: "ObjectId", // MongoDB's default primary key
  year: {
    type: "Number",
    required: true,
    description: "Election year (2016, 2020, 2024)"
  },
  fipsCode: {
    type: "String",
    required: true,
    description: "FIPS code for the jurisdiction (state/county/town)"
  },
  jurisdictionName: {
    type: "String",
    required: true,
    description: "Name of the jurisdiction"
  },
  stateFull: {
    type: "String",
    required: true,
    description: "Full state name"
  },
  stateAbbr: {
    type: "String",
    required: true,
    description: "State abbreviation"
  },
  
  // Registration Data (GUI-7, GUI-17)
  A1a: {
    type: "Number", // Total Reg
    description: "GUI-7, GUI-17: Total registered voters (2024)"
  },
  A1b: {
    type: "Number", // Total Active  
    description: "GUI-7: Total active registered voters (2024)"
  },
  A1c: {
    type: "Number", // Total Inactive
    description: "GUI-7: Total inactive registered voters (2024)"
  },
  
  // Provisional Ballot Data (GUI-3, GUI-5)
  E1a: {
    type: "Number", // Total Provisional Ballots Cast
    description: "GUI-5: Total Provisional Ballots Cast"
  },
  E1d: {
    type: "Number", // Provisional Ballots Rejected
    description: "GUI-25: Provisional Ballots Rejected (for quality chart)"
  },
  E2a: {
    type: "Number", // Provisional Ballots Cast Voter Not on List
    description: "GUI-3: Provisional Ballots Cast Voter Not on List"
  },
  E2b: {
    type: "Number", // Provisional Ballots Cast Voter Lacked ID
    description: "GUI-3: Provisional Ballots Cast Voter Lacked ID"
  },
  E2c: {
    type: "Number", // Provisional Ballots Cast Election Official Challenged Eligibility
    description: "GUI-3: Provisional Ballots Cast Election Official Challenged Eligibility"
  },
  E2d: {
    type: "Number", // Provisional Ballots Cast Another Person Challenged Eligibility
    description: "GUI-3: Provisional Ballots Cast Another Person Challenged Eligibility"
  },
  E2e: {
    type: "Number", // Provisional Ballots Cast Voter Not Resident
    description: "GUI-3: Provisional Ballots Cast Voter Not Resident"
  },
  E2f: {
    type: "Number", // Provisional Ballots Cast Voter Registration Not Updated
    description: "GUI-3: Provisional Ballots Cast Voter Registration Not Updated"
  },
  E2g: {
    type: "Number", // Provisional Ballots Cast Voter Did Not Surrender Mail Ballot
    description: "GUI-3: Provisional Ballots Cast Voter Did Not Surrender Mail Ballot"
  },
  E2h: {
    type: "Number", // Provisional Ballots Cast Judge Extended Voting Hours
    description: "GUI-3: Provisional Ballots Cast Judge Extended Voting Hours"
  },
  E2i: {
    type: "Number", // Provisional Ballots Cast Voter Used SDR
    description: "GUI-3: Provisional Ballots Cast Voter Used SDR"
  },
  E3b: {
    type: "Number", // Provisional Rejected Not Registered
    description: "GUI-3: Provisional Rejected Not Registered"
  },
  E3c: {
    type: "Number", // Provisional Rejected Wrong Jurisdiction
    description: "GUI-3: Provisional Rejected Wrong Jurisdiction"
  },
  E3d: {
    type: "Number", // Provisional Rejected Wrong Precinct
    description: "GUI-3: Provisional Rejected Wrong Precinct"
  },
  E3e: {
    type: "Number", // Provisional Rejected No ID
    description: "GUI-3: Provisional Rejected No ID"
  },
  E3f: {
    type: "Number", // Provisional Rejected Incomplete
    description: "GUI-3: Provisional Rejected Incomplete"
  },
  E3g: {
    type: "Number", // Provisional Rejected Ballot Missing
    description: "GUI-3: Provisional Rejected Ballot Missing"
  },
  E3h: {
    type: "Number", // Provisional Rejected No Signature
    description: "GUI-3: Provisional Rejected No Signature"
  },
  E3i: {
    type: "Number", // Provisional Rejected Non-matching Signature
    description: "GUI-3: Provisional Rejected Non-matching Signature"
  },
  E3j: {
    type: "Number", // Provisional Rejected Already Voted
    description: "GUI-3: Provisional Rejected Already Voted"
  },
  
  // Mail Ballot Rejections Data (GUI-9)
  C9a: {
    type: "Number", // Total Mail Ballots Rejected
    description: "GUI-9, GUI-25: Total Mail Ballots Rejected"
  },
  C9b: {
    type: "Number", // Mail Ballots Rejected Because Late
    description: "GUI-9: Mail Ballots Rejected Because Late"
  },
  C9c: {
    type: "Number", // Mail Ballots Rejected Because Missing Voter Signature
    description: "GUI-9: Mail Ballots Rejected Because Missing Voter Signature"
  },
  C9d: {
    type: "Number", // Mail Ballots Rejected Because Missing Witness Signature
    description: "GUI-9: Mail Ballots Rejected Because Missing Witness Signature"
  },
  C9e: {
    type: "Number", // Mail Ballots Rejected Because Non-Matching Voter Signature
    description: "GUI-9: Mail Ballots Rejected Because Non-Matching Voter Signature"
  },
  C9f: {
    type: "Number", // Mail Ballots Rejected Because Unofficial Envelope
    description: "GUI-9: Mail Ballots Rejected Because Unofficial Envelope"
  },
  C9g: {
    type: "Number", // Mail Ballots Rejected Because Ballot Missing from Envelope
    description: "GUI-9: Mail Ballots Rejected Because Ballot Missing from Envelope"
  },
  C9h: {
    type: "Number", // Mail Ballots Rejected Because No Secrecy Envelope
    description: "GUI-9: Mail Ballots Rejected Because No Secrecy Envelope"
  },
  C9i: {
    type: "Number", // Mail Ballots Rejected Because Multiple Ballots in One Envelope
    description: "GUI-9: Mail Ballots Rejected Because Multiple Ballots in One Envelope"
  },
  C9j: {
    type: "Number", // Mail Ballots Rejected Because Envelope Not Sealed
    description: "GUI-9: Mail Ballots Rejected Because Envelope Not Sealed"
  },
  C9k: {
    type: "Number", // Mail Ballots Rejected Because No Postmark
    description: "GUI-9: Mail Ballots Rejected Because No Postmark"
  },
  C9l: {
    type: "Number", // Mail Ballots Rejected Because No Resident Address on Envelope
    description: "GUI-9: Mail Ballots Rejected Because No Resident Address on Envelope"
  },
  C9m: {
    type: "Number", // Mail Ballots Rejected Because Voter Deceased
    description: "GUI-9: Mail Ballots Rejected Because Voter Deceased"
  },
  C9n: {
    type: "Number", // Mail Ballots Rejected Because Voter Already Voted
    description: "GUI-9: Mail Ballots Rejected Because Voter Already Voted"
  },
  C9o: {
    type: "Number", // Mail Ballots Rejected Because Missing Documentation
    description: "GUI-9: Mail Ballots Rejected Because Missing Documentation"
  },
  C9p: {
    type: "Number", // Mail Ballots Rejected Because Voter Not Eligible
    description: "GUI-9: Mail Ballots Rejected Because Voter Not Eligible"
  },
  C9q: {
    type: "Number", // Mail Ballots Rejected Because No Ballot Application
    description: "GUI-9: Mail Ballots Rejected Because No Ballot Application"
  },
  
  // Pollbook Deletions Data (GUI-8)
  A12b: {
    type: "Number", // Removed Moved
    description: "GUI-8: Removed Moved"
  },
  A12c: {
    type: "Number", // Removed Death
    description: "GUI-8: Removed Death"
  },
  A12d: {
    type: "Number", // Removed Felony
    description: "GUI-8: Removed Felony"
  },
  A12e: {
    type: "Number", // Removed Fail Response
    description: "GUI-8: Removed Fail Response"
  },
  A12f: {
    type: "Number", // Removed Incompetent to Vote
    description: "GUI-8: Removed Incompetent to Vote"
  },
  A12g: {
    type: "Number", // Removed Voter Request
    description: "GUI-8: Removed Voter Request"
  },
  A12h: {
    type: "Number", // Removed Duplicate Records
    description: "GUI-8: Removed Duplicate Records"
  },
  
  // Voting Equipment Data (GUI-6, GUI-10, GUI-11, GUI-12, GUI-13, GUI-14)
  F3a: {
    type: "Number", // DRE no VVPAT (binary)
    description: "GUI-6, GUI-10, GUI-12: DRE no VVPAT present (1) or not (0)"
  },
  F4a: {
    type: "Number", // DRE with VVPAT (binary)
    description: "GUI-6, GUI-10, GUI-12: DRE with VVPAT present (1) or not (0)"
  },
  F5a: {
    type: "Number", // Ballot Marking Device (binary)
    description: "GUI-6, GUI-10, GUI-12: Ballot Marking Device present (1) or not (0)"
  },
  F6a: {
    type: "Number", // Scanner (binary)
    description: "GUI-6, GUI-10, GUI-12: Scanner present (1) or not (0)"
  },
  
  // Drop Box Voting Data (GUI-24)
  C3a: {
    type: "Number", // Drop Boxes Total
    description: "GUI-24: Drop Boxes Total"
  },
  
  // Voting Participation Data (needed for GUI-25 calculations)
  F1a: {
    type: "Number", // Total Voters
    description: "GUI-25: Total Voters (for rejected ballot percentage calculation)"
  },
  F1b: {
    type: "Number", // Physical Polling Place
    description: "GUI-23: Physical Polling Place votes"
  },
  F1c: {
    type: "Number", // Absentee UOCAVA
    description: "Participation data for calculations"
  },
  F1d: {
    type: "Number", // Mail Votes
    description: "GUI-23: Mail Votes (for early voting comparison)"
  },
  F1e: {
    type: "Number", // Provisional Ballot
    description: "Participation data for calculations"
  },
  F1f: {
    type: "Number", // In Person Early Voting
    description: "GUI-23: In Person Early Voting (for early voting comparison)"
  },
  
  // UOCAVA Data (Military/Overseas - needed for GUI-25)
  B24a: {
    type: "Number", // UOCAVA Rejected Total
    description: "GUI-25: UOCAVA Rejected Total (for quality chart)"
  },
  
  // Timestamps
  createdAt: {
    type: "Date",
    default: "Date.now"
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  }
};

// Voting Equipment Data Schema (specifically for GUI-6, GUI-13 that's not in EAVS)
const votingEquipmentDataSchema = {
  _id: "ObjectId",
  state: {
    type: "String",
    required: true,
    description: "Full state name"
  },
  year: {
    type: "Number",
    required: true,
    description: "Election year (2016, 2020, 2024)"
  },
  
  // Equipment counts by state (for GUI-12)
  equipmentSummary: {
      dreNoVVPAT: {
        type: "Number",
        description: "Total count of DRE no VVPAT equipment in state"
      },
      dreWithVVPAT: {
        type: "Number",
        description: "Total count of DRE with VVPAT equipment in state"
      },
      ballotMarkingDevice: {
        type: "Number",
        description: "Total count of Ballot Marking Device equipment in state"
      },
      scanner: {
        type: "Number",
        description: "Total count of Scanner equipment in state"
      }
    },
    // Detailed equipment list (for GUI-6)
    equipmentDetails: {
      type: "Array",
      items: {
        makeAndModel: {
          type: "String",
          description: "Manufacturer and model name of voting equipment"
        },
        equipmentType: {
          type: "String",
          enum: ["DRE no VVPAT", "DRE with VVPAT", "Ballot Marking Device", "Scanner"],
          description: "Category of the equipment"
        },
        quantity: {
          type: "Number",
          description: "Number of units of this equipment in the state"
        },
        equipmentAge: {
          type: "Number", // in years
          description: "Age of the equipment in years"
        },
        OS: {
          type: "String",
          description: "Operating system running on the equipment"
        },
        certification: {
          type: "String",
          enum: ["VVSG 2.0 certified", "VVSG 2.0 applied", "VVSG 1.1 certified", "VVSG 1.0 certified", "not certified"],
          description: "Certification status of the equipment"
        },
        scanRate: {
          type: "Number", // ballots per minute
          description: "Scanning speed of the equipment in ballots per minute"
        },
        errorRate: {
          type: "Number", // percentage
          description: "Error rate percentage of the equipment"
        },
        reliability: {
          type: "Number", // percentage or score
          description: "Reliability score/rating of the equipment"
        }
      }
  },
  
  // Equipment history for GUI-14 (voting equipment changes over time)
  equipmentHistory: {
    type: "Array",
    items: {
      type: "Object",
      properties: {
        year: "Number", // Election year
        equipmentType: {
          type: "String",
          enum: ["DRE no VVPAT", "DRE with VVPAT", "Ballot Marking Device", "Scanner"]
        },
        count: "Number" // Number of equipment units of this type in this year
      }
    }
  },
  createdAt: {
    type: "Date",
    default: "Date.now"
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  }
};

// Boundary Data Schema (GeoJSON for GUI-1, GUI-2, GUI-20, Prepro-1, Prepro-4)
const boundaryDataSchema = {
  _id: "ObjectId",
  fipsCode: {
    type: "String",
    required: true,
    unique: true,
    description: "FIPS code for the jurisdiction (state/county/town)"
  },
  jurisdiction: {
    type: "String",
    description: "Name of the jurisdiction"
  },
  state: {
    type: "String",
    required: true,
    description: "Full state name"
  },
  boundaryType: {
    type: "String", 
    enum: ["state", "county", "town"],
    required: true,
    description: "Type of boundary (state, county, town)"
  },
  boundaryData: {
    type: "Object", // GeoJSON
    required: true,
    description: "GeoJSON geometry object containing boundary coordinates"
  },
  centerPoint: {
    type: {
      x: "Number",
      y: "Number"
    },
    description: "Geographical center point of the boundary"
  },
  appropriateZoomLevel: {
    type: "Number",
    description: "Zoom level that fits the boundary within the GUI component"
  },
  createdAt: {
    type: "Date",
    default: "Date.now"
  },
  updatedAt: {
    type: "Date", 
    default: "Date.now"
  }
};

// Demographic Data Schema (Prepro-12: CVAP data)
const demographicDataSchema = {
  _id: "ObjectId",
  fipsCode: {
    type: "String",
    required: true,
    description: "FIPS code for the jurisdiction (state/county/town)"
  },
  jurisdiction: {
    type: "String",
    required: true,
    description: "Name of the jurisdiction"
  },
  state: {
    type: "String",
    required: true,
    description: "Full state name"
  },
  citizenVotingAgePopulation: {
    total: {
      type: "Number",
      description: "Total CVAP for the jurisdiction"
    },
    byDemographic: {
      white: "Number",
      hispanic: "Number", 
      africanAmerican: "Number",
      asian: "Number",
      nativeAmerican: "Number",
      pacificIslander: "Number",
      other: "Number",
      twoOrMoreRaces: "Number"
    }
  },
  // Political party registration data (required for GUI-17, GUI-19)
  politicalPartyData: {
    type: {
      totalRegistered: "Number",
      republican: "Number",
      democratic: "Number",
      unaffiliated: "Number",
      other: "Number"
    }
  },
  createdAt: {
    type: "Date",
    default: "Date.now"
  },
  updatedAt: {
    type: "Date",
    default: "Date.now"
  }
};

// Felony Voting Data Schema (Prepro-13)
const felonyVotingDataSchema = {
  _id: "ObjectId",
  state: {
    type: "String",
    required: true,
    description: "Full state name"
  },
  felonyVotingPolicy: {
    type: "String",
    enum: [
      "no denial of voting",
      "automatic restoration upon release from prison",
      "restoration after completing parole and probation",
      "additional action required for restoration"
    ],
    description: "State policy for felony voting rights"
  },
};

const detailedStateDataSchema = {}

module.exports = {
  eavsDataSchema,
  eavsFlattenedSchema,
  detailedStateDataSchema,
  votingEquipmentDataSchema,
  boundaryDataSchema,
  demographicDataSchema,
  felonyVotingDataSchema,
  indexes
};