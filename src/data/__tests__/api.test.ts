import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchActiveVoters,
    fetchProvisionalBallots,
    fetchPollbookDeletions,
    fetchMailRejections,
    fetchEquipmentHistory,
    fetchRegistrationTrends,
    fetchBlockBubbles,
    fetchPartyComparison,
    fetchEquipmentAllStates,
    fetchEquipmentSummary,
    fetchEquipmentVsRejected,
    fetchStateEquipmentDetails,
    fetchStateRegisteredVoters,
    fetchOptInOutComparison,
    fetchEarlyVotingComparison,
    fetchDropboxBubbles,
    fetchRegisteredVoters,
    fetchEquipmentTypes,
    fetchGinglesData,
    fetchEIEquipmentData,
    fetchEIRejectedData,
    fetchEquipmentAgeAllStates,
    fetchEquipmentVsRejectedWithRegression,
} from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Module', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchApi helper behavior', () => {
        it('should include correct headers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await fetchActiveVoters('Arkansas');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: { Accept: 'application/json' },
                })
            );
        });

        it('should throw error on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: () => Promise.resolve('Resource not found'),
            });

            await expect(fetchActiveVoters('Arkansas')).rejects.toThrow('HTTP 404 Not Found');
        });

        it('should handle text() failure gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: () => Promise.reject(new Error('Cannot read body')),
            });

            await expect(fetchActiveVoters('Arkansas')).rejects.toThrow('HTTP 500 Internal Server Error');
        });
    });

    describe('EAVS Data Endpoints', () => {
        describe('fetchActiveVoters', () => {
            it('should fetch active voters with correct URL', async () => {
                const mockData = [
                    { geographicUnit: 'County A', activeVoters: 1000, totalVoters: 1200 },
                ];
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData),
                });

                const result = await fetchActiveVoters('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/ARKANSAS/active-voters?year=2024',
                    expect.any(Object)
                );
                expect(result).toEqual(mockData);
            });

            it('should handle state name with spaces', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchActiveVoters('Rhode Island');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/RHODE%20ISLAND/active-voters?year=2024',
                    expect.any(Object)
                );
            });

            it('should uppercase state names', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchActiveVoters('maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/MARYLAND/active-voters?year=2024',
                    expect.any(Object)
                );
            });
        });

        describe('fetchProvisionalBallots', () => {
            it('should fetch provisional ballots with correct URL', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchProvisionalBallots('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/MARYLAND/provisional-ballots?year=2024',
                    expect.any(Object)
                );
            });
        });

        describe('fetchPollbookDeletions', () => {
            it('should fetch pollbook deletions with correct URL', async () => {
                const mockData = [
                    { geographicUnit: 'County A', A12b_Death: 10, total: 50 },
                ];
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData),
                });

                const result = await fetchPollbookDeletions('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/ARKANSAS/pollbook-deletions?year=2024',
                    expect.any(Object)
                );
                expect(result).toEqual(mockData);
            });
        });

        describe('fetchMailRejections', () => {
            it('should fetch mail rejections with correct URL', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchMailRejections('Rhode Island');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/RHODE%20ISLAND/mail-rejections?year=2024',
                    expect.any(Object)
                );
            });
        });

        describe('fetchDropboxBubbles', () => {
            it('should use 2020 for Arkansas by default', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchDropboxBubbles('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/dropbox-bubbles/Arkansas?year=2020',
                    expect.any(Object)
                );
            });

            it('should use 2024 for Maryland by default', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchDropboxBubbles('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/dropbox-bubbles/Maryland?year=2024',
                    expect.any(Object)
                );
            });

            it('should use provided year when specified', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchDropboxBubbles('Arkansas', 2024);

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/eavs/dropbox-bubbles/Arkansas?year=2024',
                    expect.any(Object)
                );
            });
        });
    });

    describe('Equipment Endpoints', () => {
        describe('fetchEquipmentHistory', () => {
            it('should fetch equipment history with correct URL', async () => {
                const mockData = [
                    { category: 'Scanner', byYear: { 2020: 50, 2024: 60 } },
                ];
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData),
                });

                const result = await fetchEquipmentHistory('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/history/Arkansas',
                    expect.any(Object)
                );
                expect(result).toEqual(mockData);
            });
        });

        describe('fetchEquipmentAllStates', () => {
            it('should fetch equipment for all states', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEquipmentAllStates();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/all-states',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEquipmentSummary', () => {
            it('should fetch equipment summary', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEquipmentSummary();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/summary',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEquipmentVsRejected', () => {
            it('should fetch equipment vs rejected data', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEquipmentVsRejected('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/vs-rejected/Maryland',
                    expect.any(Object)
                );
            });
        });

        describe('fetchStateEquipmentDetails', () => {
            it('should fetch state equipment details', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchStateEquipmentDetails('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/state/Arkansas/details',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEquipmentTypes', () => {
            it('should fetch equipment types for state', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEquipmentTypes('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/Maryland/types',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEquipmentAgeAllStates', () => {
            it('should fetch equipment age for all states', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEquipmentAgeAllStates();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/age/all-states',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEquipmentVsRejectedWithRegression', () => {
            it('should fetch equipment vs rejected with regression data', async () => {
                const mockData = {
                    dataPoints: [],
                    regressionLines: [
                        { party: 'R', coefficients: { a: 1, b: 2 }, r2: 0.95, type: 'power' },
                    ],
                };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData),
                });

                const result = await fetchEquipmentVsRejectedWithRegression('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/equipment/vs-rejected-with-regression/Arkansas',
                    expect.any(Object)
                );
                expect(result).toEqual(mockData);
            });
        });
    });

    describe('Registration Endpoints', () => {
        describe('fetchRegistrationTrends', () => {
            it('should fetch registration trends with years param', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ state: 'Arkansas', byYear: {} }),
                });

                await fetchRegistrationTrends('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/trends/Arkansas?years=2016,2020,2024',
                    expect.any(Object)
                );
            });
        });

        describe('fetchBlockBubbles', () => {
            it('should fetch block bubbles', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchBlockBubbles('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/blocks/Maryland',
                    expect.any(Object)
                );
            });
        });

        describe('fetchStateRegisteredVoters', () => {
            it('should fetch state registered voters', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchStateRegisteredVoters('Rhode Island');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/state/Rhode%20Island',
                    expect.any(Object)
                );
            });
        });

        describe('fetchOptInOutComparison', () => {
            it('should fetch opt in/out comparison', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchOptInOutComparison();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/opt-in-out-comparison',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEarlyVotingComparison', () => {
            it('should fetch early voting comparison', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve([]),
                });

                await fetchEarlyVotingComparison();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/early-voting/comparison',
                    expect.any(Object)
                );
            });
        });

        describe('fetchRegisteredVoters', () => {
            it('should fetch voters with pagination', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ content: [], totalElements: 0 }),
                });

                await fetchRegisteredVoters('Arkansas', 'Pulaski', undefined, 0, 100);

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/voters/Arkansas/Pulaski?page=0&size=100',
                    expect.any(Object)
                );
            });

            it('should include party filter when not "all"', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ content: [], totalElements: 0 }),
                });

                await fetchRegisteredVoters('Maryland', 'Baltimore', 'D', 0, 50);

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/voters/Maryland/Baltimore?page=0&size=50&party=D',
                    expect.any(Object)
                );
            });

            it('should not include party filter when "all"', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ content: [], totalElements: 0 }),
                });

                await fetchRegisteredVoters('Arkansas', 'Pulaski', 'all');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/voters/Arkansas/Pulaski?page=0&size=1000',
                    expect.any(Object)
                );
            });

            it('should use default pagination values', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchRegisteredVoters('Arkansas', 'Pulaski');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/registration/voters/Arkansas/Pulaski?page=0&size=1000',
                    expect.any(Object)
                );
            });
        });
    });

    describe('Comparison Endpoints', () => {
        describe('fetchPartyComparison', () => {
            it('should fetch party comparison data', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchPartyComparison();

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/comparison/party-states',
                    expect.any(Object)
                );
            });
        });
    });

    describe('Preclearance / Analysis Endpoints', () => {
        describe('fetchGinglesData', () => {
            it('should fetch Gingles data with default demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchGinglesData('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/gingles/Maryland?demographic=white',
                    expect.any(Object)
                );
            });

            it('should fetch Gingles data with specified demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchGinglesData('Maryland', 'black');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/gingles/Maryland?demographic=black',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEIEquipmentData', () => {
            it('should fetch EI equipment data without demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchEIEquipmentData('Maryland');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/ei-equipment/Maryland',
                    expect.any(Object)
                );
            });

            it('should fetch EI equipment data with demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchEIEquipmentData('Maryland', 'hispanic');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/ei-equipment/Maryland?demographic=hispanic',
                    expect.any(Object)
                );
            });
        });

        describe('fetchEIRejectedData', () => {
            it('should fetch EI rejected data without demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchEIRejectedData('Arkansas');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/ei-rejected/Arkansas',
                    expect.any(Object)
                );
            });

            it('should fetch EI rejected data with demographic', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({}),
                });

                await fetchEIRejectedData('Arkansas', 'asian');

                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/preclearance/ei-rejected/Arkansas?demographic=asian',
                    expect.any(Object)
                );
            });
        });
    });

    describe('URL Encoding', () => {
        it('should properly encode special characters in state names', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await fetchStateRegisteredVoters('New York');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/registration/state/New%20York',
                expect.any(Object)
            );
        });

        it('should properly encode county names with special characters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await fetchRegisteredVoters('Maryland', "Prince George's");

            expect(mockFetch).toHaveBeenCalledWith(
                "/api/registration/voters/Maryland/Prince%20George's?page=0&size=1000",
                expect.any(Object)
            );
        });
    });
});
