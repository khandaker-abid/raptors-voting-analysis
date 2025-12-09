import { describe, it, expect } from 'vitest';
import type {
    Year,
    PartyCode,
    ChoroplethDatum,
    ActiveVotersRow,
    PollbookDeletionRow,
    MailRejectionRow,
    EquipmentCategory,
    EquipmentHistorySeries,
    RegistrationTrendPayload,
    BlockBubblePoint,
    BlockBubblePayload,
    GinglesDataPoint,
    RegressionCoefficients,
    EquipmentQualityBubble,
    EIProbabilityPoint,
    EIDemographicCurve,
    DropboxBubbleDatum,
} from '../types';

/**
 * Type validation tests - these ensure the types are correctly defined
 * and can be used as expected throughout the application.
 */
describe('Type Definitions', () => {
    describe('Year type', () => {
        it('should accept valid election years', () => {
            const year2016: Year = 2016;
            const year2020: Year = 2020;
            const year2024: Year = 2024;

            expect(year2016).toBe(2016);
            expect(year2020).toBe(2020);
            expect(year2024).toBe(2024);
        });
    });

    describe('PartyCode type', () => {
        it('should accept valid party codes', () => {
            const republican: PartyCode = 'R';
            const democratic: PartyCode = 'D';
            const unaffiliated: PartyCode = 'U';

            expect(republican).toBe('R');
            expect(democratic).toBe('D');
            expect(unaffiliated).toBe('U');
        });
    });

    describe('ChoroplethDatum', () => {
        it('should have required fields', () => {
            const datum: ChoroplethDatum = {
                geographicUnit: 'Pulaski County',
                value: 50000,
            };

            expect(datum.geographicUnit).toBe('Pulaski County');
            expect(datum.value).toBe(50000);
        });

        it('should allow optional percentOfTotal', () => {
            const datumWithPercent: ChoroplethDatum = {
                geographicUnit: 'Baltimore County',
                value: 100000,
                percentOfTotal: 15.5,
            };

            expect(datumWithPercent.percentOfTotal).toBe(15.5);
        });
    });

    describe('ActiveVotersRow', () => {
        it('should have all required fields', () => {
            const row: ActiveVotersRow = {
                geographicUnit: 'Anne Arundel County',
                activeVoters: 400000,
                totalVoters: 450000,
                inactiveVoters: 50000,
                activePercentage: 88.89,
            };

            expect(row.geographicUnit).toBeDefined();
            expect(row.activeVoters).toBeDefined();
            expect(row.totalVoters).toBeDefined();
            expect(row.inactiveVoters).toBeDefined();
            expect(row.activePercentage).toBeDefined();
        });

        it('should calculate activePercentage correctly', () => {
            const row: ActiveVotersRow = {
                geographicUnit: 'Test County',
                activeVoters: 80,
                totalVoters: 100,
                inactiveVoters: 20,
                activePercentage: 80,
            };

            expect(row.activePercentage).toBe(80);
            expect(row.activeVoters + row.inactiveVoters).toBe(row.totalVoters);
        });
    });

    describe('PollbookDeletionRow', () => {
        it('should have all deletion reason fields', () => {
            const row: PollbookDeletionRow = {
                geographicUnit: 'Providence County',
                A12b_Death: 100,
                A12c_Moved: 500,
                A12d_Felon: 50,
                A12e_MentalIncap: 10,
                A12f_Requested: 200,
                A12g_FailedToVote: 300,
                A12h_Other: 40,
                total: 1200,
                deletionPercentage: 2.5,
            };

            expect(row.A12b_Death).toBe(100);
            expect(row.A12c_Moved).toBe(500);
            expect(row.total).toBe(1200);
        });

        it('should allow optional dataYear', () => {
            const row: PollbookDeletionRow = {
                geographicUnit: 'Test',
                dataYear: 2024,
                A12b_Death: 0,
                A12c_Moved: 0,
                A12d_Felon: 0,
                A12e_MentalIncap: 0,
                A12f_Requested: 0,
                A12g_FailedToVote: 0,
                A12h_Other: 0,
                total: 0,
                deletionPercentage: 0,
            };

            expect(row.dataYear).toBe(2024);
        });
    });

    describe('MailRejectionRow', () => {
        it('should have all rejection reason fields', () => {
            const row: MailRejectionRow = {
                geographicUnit: 'Montgomery County',
                C9b_NoSignature: 100,
                C9c_SigMismatch: 200,
                C9d_ReceivedLate: 150,
                C9e_MissingInfo: 75,
                C9f_NotRegistered: 50,
                C9g_WrongEnvelope: 25,
                C9h_Other: 100,
                total: 700,
                rejectionPercentage: 1.5,
            };

            expect(row.C9b_NoSignature).toBe(100);
            expect(row.C9c_SigMismatch).toBe(200);
            expect(row.total).toBe(700);
        });
    });

    describe('EquipmentCategory', () => {
        it('should accept valid equipment categories', () => {
            const categories: EquipmentCategory[] = [
                'DRE no VVPAT',
                'DRE with VVPAT',
                'Ballot Marking Device',
                'Scanner',
            ];

            expect(categories).toHaveLength(4);
            expect(categories).toContain('Scanner');
            expect(categories).toContain('Ballot Marking Device');
        });
    });

    describe('EquipmentHistorySeries', () => {
        it('should track equipment counts by year', () => {
            const series: EquipmentHistorySeries = {
                category: 'Scanner',
                byYear: {
                    2016: 50,
                    2018: 55,
                    2020: 60,
                    2022: 65,
                    2024: 70,
                },
            };

            expect(series.category).toBe('Scanner');
            expect(series.byYear[2024]).toBe(70);
        });

        it('should allow partial year data', () => {
            const series: EquipmentHistorySeries = {
                category: 'Ballot Marking Device',
                byYear: {
                    2020: 30,
                    2024: 50,
                },
            };

            expect(series.byYear[2016]).toBeUndefined();
            expect(series.byYear[2020]).toBe(30);
        });
    });

    describe('RegistrationTrendPayload', () => {
        it('should contain state and trend data', () => {
            const payload: RegistrationTrendPayload = {
                state: 'Arkansas',
                geographicUnitOrder2024: ['Pulaski', 'Benton', 'Washington'],
                byYear: {
                    2016: [100000, 80000, 75000],
                    2020: [110000, 90000, 85000],
                    2024: [120000, 100000, 95000],
                },
            };

            expect(payload.state).toBe('Arkansas');
            expect(payload.geographicUnitOrder2024).toHaveLength(3);
            expect(payload.byYear[2024][0]).toBe(120000);
        });
    });

    describe('BlockBubblePoint', () => {
        it('should have coordinates and party', () => {
            const point: BlockBubblePoint = {
                lat: 34.7465,
                lng: -92.2896,
                dominantParty: 'R',
            };

            expect(point.lat).toBeCloseTo(34.7465);
            expect(point.lng).toBeCloseTo(-92.2896);
            expect(point.dominantParty).toBe('R');
        });
    });

    describe('BlockBubblePayload', () => {
        it('should contain state and points array', () => {
            const payload: BlockBubblePayload = {
                state: 'Maryland',
                points: [
                    { lat: 39.0458, lng: -76.6413, dominantParty: 'D' },
                    { lat: 39.2904, lng: -76.6122, dominantParty: 'D' },
                ],
            };

            expect(payload.state).toBe('Maryland');
            expect(payload.points).toHaveLength(2);
        });
    });

    describe('GinglesDataPoint', () => {
        it('should have precinct demographics', () => {
            const point: GinglesDataPoint = {
                precinct: 'Precinct 1',
                democraticPct: 55.5,
                republicanPct: 42.3,
                whitePct: 65.0,
                hispanicPct: 15.0,
                africanAmericanPct: 18.0,
            };

            expect(point.precinct).toBe('Precinct 1');
            expect(point.democraticPct + point.republicanPct).toBeLessThanOrEqual(100);
        });
    });

    describe('RegressionCoefficients', () => {
        it('should have a and b coefficients', () => {
            const coef: RegressionCoefficients = {
                a: 1.5,
                b: 0.8,
            };

            expect(coef.a).toBe(1.5);
            expect(coef.b).toBe(0.8);
        });
    });

    describe('EquipmentQualityBubble', () => {
        it('should have quality and rejection metrics', () => {
            const bubble: EquipmentQualityBubble = {
                county: 'Pulaski County',
                equipmentQuality: 85.5,
                rejectionRate: 1.2,
                party: 'R',
            };

            expect(bubble.county).toBe('Pulaski County');
            expect(bubble.equipmentQuality).toBeGreaterThan(0);
            expect(bubble.rejectionRate).toBeGreaterThanOrEqual(0);
        });
    });

    describe('EIProbabilityPoint', () => {
        it('should have x and probability', () => {
            const point: EIProbabilityPoint = {
                x: 0.5,
                probability: 0.25,
            };

            expect(point.x).toBe(0.5);
            expect(point.probability).toBe(0.25);
        });
    });

    describe('EIDemographicCurve', () => {
        it('should have demographic data array', () => {
            const curve: EIDemographicCurve = {
                demographic: 'white',
                data: [
                    { x: 0, probability: 0.1 },
                    { x: 0.5, probability: 0.3 },
                    { x: 1, probability: 0.1 },
                ],
            };

            expect(curve.demographic).toBe('white');
            expect(curve.data).toHaveLength(3);
        });

        it('should allow optional mean and stdDev', () => {
            const curve: EIDemographicCurve = {
                demographic: 'black',
                data: [],
                mean: 0.65,
                stdDev: 0.15,
            };

            expect(curve.mean).toBe(0.65);
            expect(curve.stdDev).toBe(0.15);
        });
    });

    describe('DropboxBubbleDatum', () => {
        it('should have dropbox data', () => {
            const datum: DropboxBubbleDatum = {
                county: 'Baltimore County',
                republicanPct: 35.5,
                dropBoxPct: 12.3,
                party: 'D',
            };

            expect(datum.county).toBe('Baltimore County');
            expect(datum.republicanPct).toBe(35.5);
            expect(datum.dropBoxPct).toBe(12.3);
        });

        it('should allow optional fields', () => {
            const datum: DropboxBubbleDatum = {
                county: 'Test',
                republicanPct: 50,
                dropBoxPct: 10,
                party: 'R',
                totalBallots: 50000,
                dataYear: 2024,
            };

            expect(datum.totalBallots).toBe(50000);
            expect(datum.dataYear).toBe(2024);
        });
    });
});

describe('Type Usage Patterns', () => {
    it('should allow creating arrays of types', () => {
        const voters: ActiveVotersRow[] = [
            {
                geographicUnit: 'County A',
                activeVoters: 100,
                totalVoters: 120,
                inactiveVoters: 20,
                activePercentage: 83.3,
            },
            {
                geographicUnit: 'County B',
                activeVoters: 200,
                totalVoters: 250,
                inactiveVoters: 50,
                activePercentage: 80,
            },
        ];

        expect(voters).toHaveLength(2);
        expect(voters[0].geographicUnit).toBe('County A');
    });

    it('should support type narrowing for PartyCode', () => {
        const getPartyColor = (party: PartyCode): string => {
            switch (party) {
                case 'R':
                    return 'red';
                case 'D':
                    return 'blue';
                case 'U':
                    return 'gray';
            }
        };

        expect(getPartyColor('R')).toBe('red');
        expect(getPartyColor('D')).toBe('blue');
        expect(getPartyColor('U')).toBe('gray');
    });

    it('should support filtering by type properties', () => {
        const bubbles: EquipmentQualityBubble[] = [
            { county: 'A', equipmentQuality: 90, rejectionRate: 1, party: 'R' },
            { county: 'B', equipmentQuality: 85, rejectionRate: 2, party: 'D' },
            { county: 'C', equipmentQuality: 95, rejectionRate: 0.5, party: 'R' },
        ];

        const republicanCounties = bubbles.filter(b => b.party === 'R');
        expect(republicanCounties).toHaveLength(2);

        const highQuality = bubbles.filter(b => b.equipmentQuality >= 90);
        expect(highQuality).toHaveLength(2);
    });
});
