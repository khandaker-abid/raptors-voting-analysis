// src/data/mockComparisons.ts

// GUI-21: Opt-in vs Opt-out
export const getOptInOutComparisonData = () => [
  {
    state: "Rhode Island (Opt-out + Same-Day)",
    registrationRate: 85,
    turnoutRate: 75,
    registrationAbsolute: 800000,
    turnoutAbsolute: 600000,
  },
  {
    state: "Arkansas (Opt-in)",
    registrationRate: 62,
    turnoutRate: 55,
    registrationAbsolute: 1000000,
    turnoutAbsolute: 550000,
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

// GUI-23: Early Voting
export const getEarlyVotingComparisonData = () => [
  {
    state: "Rhode Island (Democratic)",
    total: 350000,
    totalPct: 40,
    mail: 200000,
    inPerson: 150000,
  },
  {
    state: "Arkansas (Republican)",
    total: 300000,
    totalPct: 30,
    mail: 120000,
    inPerson: 180000,
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
