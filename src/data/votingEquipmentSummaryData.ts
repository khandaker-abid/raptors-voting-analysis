// Type definition for Voting Equipment Summary data from backend API
export interface VotingEquipmentSummaryData {
    id: number;
    equipmentProvider: string;
    model: string;
    quantity: number;
    age: number;
    os: string;
    certification: string;
    scanRate: number;
    errorRate: number;
    reliability: number;
    qualityMeasure: number;
}
