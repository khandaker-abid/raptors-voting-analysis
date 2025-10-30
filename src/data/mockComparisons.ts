// src/data/mockComparisons.ts

// GUI-21: Opt-in vs Opt-out
export const getOptInOutComparisonData = () => [
  {
    state: "Rhode Island",
    registrationType: "Opt-out",
    sameDayRegistration: false,
    registeredVoters: 800000,
    registrationRate: 85,
    votesCast: 600000,
    turnoutRate: 75,
    registrationAbsolute: 800000,
    turnoutAbsolute: 600000,
  },
  {
    state: "Maryland",
    registrationType: "Opt-out",
    sameDayRegistration: true,
    registeredVoters: 4200000,
    registrationRate: 88,
    votesCast: 3100000,
    turnoutRate: 74,
    registrationAbsolute: 4200000,
    turnoutAbsolute: 3100000,
  },
  {
    state: "Arkansas",
    registrationType: "Opt-in",
    sameDayRegistration: false,
    registeredVoters: 1800000,
    registrationRate: 76,
    votesCast: 1100000,
    turnoutRate: 61,
    registrationAbsolute: 1800000,
    turnoutAbsolute: 1100000,
  },
];

// GUI-22: Party Comparison
export const getPartyComparisonData = () => [
  {
    state: "Rhode Island (Democratic)",
    registrationRate: 85,
    turnoutRate: 75,
    registrationAbsolute: 800000,
    turnoutAbsolute: 600000,
  },
  {
    state: "Arkansas (Republican)",
    registrationRate: 62,
    turnoutRate: 55,
    registrationAbsolute: 1000000,
    turnoutAbsolute: 550000,
  },
];

// GUI-23: Early Voting Comparison
export const getEarlyVotingComparisonData = () => [
  {
    state: "Rhode Island (Democratic)",
    total: 350000,
    totalPct: 58,
    mail: 200000,
    mailPct: 33,
    inPerson: 150000,
    inPersonPct: 25,
    // Early voting categories from EAVS
    absenteeByMail: 180000,
    earlyInPerson: 150000,
    dropBox: 20000,
  },
  {
    state: "Arkansas (Republican)",
    total: 480000,
    totalPct: 44,
    mail: 150000,
    mailPct: 14,
    inPerson: 330000,
    inPersonPct: 30,
    // Early voting categories from EAVS
    absenteeByMail: 130000,
    earlyInPerson: 330000,
    dropBox: 20000,
  },
];

// GUI-24: Drop Box Voting Bubble Chart
export const getDropBoxVotingData = () => [
  { county: "Providence", republicanPct: 35, dropBoxPct: 25, party: "D" as const },
  { county: "Kent", republicanPct: 45, dropBoxPct: 20, party: "D" as const },
  { county: "Pulaski", republicanPct: 55, dropBoxPct: 15, party: "R" as const },
  { county: "Benton", republicanPct: 65, dropBoxPct: 10, party: "R" as const },
];

// GUI-25/26: Equipment Quality vs Rejected Ballots
export const getEquipmentRejectedData = () => [
  { county: "Providence", equipmentQuality: 90, rejectedPct: 1.2, party: "D" as const },
  { county: "Kent", equipmentQuality: 80, rejectedPct: 1.8, party: "D" as const },
  { county: "Pulaski", equipmentQuality: 75, rejectedPct: 2.5, party: "R" as const },
  { county: "Benton", equipmentQuality: 70, rejectedPct: 3.0, party: "R" as const },
];

// GUI-26: Regression lines
export const getRegressionLines = () => [
  { party: "D" as const, coefficients: { a: 0.6, b: 1.1 } },
  { party: "R" as const, coefficients: { a: 0.8, b: 0.9 } },
];
