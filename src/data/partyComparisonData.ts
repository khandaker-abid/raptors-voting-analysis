export interface PartyComparisonData {
    id: number;
    metric: string;
    republicanData: string;
    democraticData: string;
}

const data: PartyComparisonData[] =  [
    {
        "id": 0,
        "metric": "Felony Voting Rights",
        "republicanData": "70%",
        "democraticData": "48%"
    },
    {
        "id": 1,
        "metric": "Percentage of Mail Ballots",
        "republicanData": "7%",
        "democraticData": "71%"
    },
    {
        "id": 2,
        "metric": "Percentage of Drop Box Ballots",
        "republicanData": "31%",
        "democraticData": "14%"
    },
    {
        "id": 3,
        "metric": "Turnout Rate",
        "republicanData": "56%",
        "democraticData": "80%"
    }
]

export function getPartyComparisonData() {
    try {
        return data;
    } catch (error) {
        console.log(error);
    }
}