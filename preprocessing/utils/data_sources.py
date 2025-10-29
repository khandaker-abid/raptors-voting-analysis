"""
Common data source URLs and configurations
"""

# EAVS Data Sources
EAVS_SOURCES = {
    2024: {
        'url': 'https://www.eac.gov/sites/default/files/2025-06/2024_EAVS_for_Public_Release_V1_xlsx.xlsx',
        'note': '2024 EAVS Public Release V1 (Updated June 2025)'
    },
    2020: {
        'url': 'https://www.eac.gov/sites/default/files/2023-12/2020_EAVS_for_Public_Release_V1.2.xlsx',
        'note': '2020 EAVS Public Release V1.2 (Updated December 2023)'
    },
    2016: {
        'url': 'https://www.eac.gov/sites/default/files/2023-12/EAVS_2016_for_Public_Release_V1.1_0.xlsx',
        'note': '2016 EAVS Public Release V1.1 (Updated December 2023)'
    }
}

# Census Bureau Boundary Data
CENSUS_BOUNDARIES = {
    'states_2020': 'https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_state_20m.zip',
    'counties_2020': 'https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_county_20m.zip',
    'states_2024': 'https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_state_20m.zip',
    'counties_2024': 'https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_20m.zip',
}

# Voter Registration Data Sources by State
VOTER_REGISTRATION_SOURCES = {
    'NC': {
        'name': 'North Carolina',
        'url': 'https://s3.amazonaws.com/dl.ncsbe.gov/data/ncvoter_Statewide.zip',
        'format': 'ZIP (tab-delimited)',
        'fields': ['voter_reg_num', 'name', 'address', 'party_cd', 'county_desc'],
        'notes': 'Freely available, updated weekly'
    },
    'FL': {
        'name': 'Florida',
        'url': 'https://dos.fl.gov/elections/data-statistics/voter-registration-statistics/',
        'format': 'Various by county',
        'notes': 'Must request from Division of Elections'
    },
    'OH': {
        'name': 'Ohio',
        'url': 'https://www6.ohiosos.gov/ords/f?p=VOTERFTP:STWD:::#home',
        'format': 'ZIP (CSV)',
        'notes': 'Freely available'
    },
    'PA': {
        'name': 'Pennsylvania',
        'url': 'https://www.dos.pa.gov/VotingElections/OtherServicesEvents/Pages/Voter-Registration-Statistics.aspx',
        'format': 'Excel/CSV by county',
        'notes': 'Public data'
    },
    'TX': {
        'name': 'Texas',
        'url': 'https://www.sos.state.tx.us/elections/voter/index.shtml',
        'format': 'Various',
        'notes': 'Requires formal request'
    },
    'CA': {
        'name': 'California',
        'url': 'https://www.sos.ca.gov/elections/voter-registration',
        'format': 'Various by county',
        'notes': 'Available from county registrars'
    },
    'GA': {
        'name': 'Georgia',
        'url': 'https://sos.ga.gov/page/voter-list',
        'format': 'ZIP (CSV)',
        'notes': 'Requires purchase or formal request'
    },
}

# Election Results Sources
ELECTION_RESULTS_SOURCES = {
    'mit_election_lab': {
        'name': 'MIT Election Data and Science Lab',
        'url': 'https://electionlab.mit.edu/data',
        'note': 'Historical precinct-level data'
    },
    'atlas_of_redistricting': {
        'name': 'Atlas of Redistricting',
        'url': 'https://redistrictingdatahub.org/',
        'note': 'Precinct-level shapefiles with election results'
    },
}

# State-specific sources for 2024 Presidential Election Results
STATE_ELECTION_RESULTS_2024 = {
    'TX': 'https://results.texas-election.com/',
    'CA': 'https://electionresults.sos.ca.gov/',
    'NC': 'https://www.ncsbe.gov/results-data',
    'GA': 'https://results.enr.clarityelections.com/GA/',
    'FL': 'https://results.elections.myflorida.com/',
    # Add more as needed
}

# Voting Equipment Data Sources
VOTING_EQUIPMENT_SOURCES = {
    'verifier': {
        'name': 'Verified Voting',
        'url': 'https://verifiedvoting.org/verifier/',
        'note': 'Equipment database by jurisdiction'
    },
    'eac_certification': {
        'name': 'EAC Voting System Certifications',
        'url': 'https://www.eac.gov/voting-equipment/certified-voting-systems',
        'note': 'Federal certification status'
    },
}

# Felony Voting Rights Sources
FELONY_VOTING_SOURCES = {
    'ncsl': {
        'name': 'National Conference of State Legislatures',
        'url': 'https://www.ncsl.org/elections-and-campaigns/felon-voting-rights',
        'note': 'State-by-state policies'
    },
    'sentencing_project': {
        'name': 'The Sentencing Project',
        'url': 'https://www.sentencingproject.org/felony-disenfranchisement-laws-in-the-united-states/',
        'note': 'Detailed state policies'
    },
}

# Felony Voting Categories by State (as of 2024)
FELONY_VOTING_POLICIES = {
    # No denial of voting
    'ME': 'no denial of voting',
    'VT': 'no denial of voting',
    'DC': 'no denial of voting',
    
    # Automatic restoration upon release
    'CA': 'automatic restoration upon release from prison',
    'CO': 'automatic restoration upon release from prison',
    'CT': 'automatic restoration upon release from prison',
    'IL': 'automatic restoration upon release from prison',
    'IN': 'automatic restoration upon release from prison',
    'MA': 'automatic restoration upon release from prison',
    'MI': 'automatic restoration upon release from prison',
    'MT': 'automatic restoration upon release from prison',
    'NH': 'automatic restoration upon release from prison',
    'ND': 'automatic restoration upon release from prison',
    'NJ': 'automatic restoration upon release from prison',
    'NY': 'automatic restoration upon release from prison',
    'OH': 'automatic restoration upon release from prison',
    'OR': 'automatic restoration upon release from prison',
    'PA': 'automatic restoration upon release from prison',
    'RI': 'automatic restoration upon release from prison',
    'UT': 'automatic restoration upon release from prison',
    
    # Restoration after parole and probation
    'AK': 'restoration after completing parole and probation',
    'AR': 'restoration after completing parole and probation',
    'GA': 'restoration after completing parole and probation',
    'ID': 'restoration after completing parole and probation',
    'KS': 'restoration after completing parole and probation',
    'LA': 'restoration after completing parole and probation',
    'MD': 'restoration after completing parole and probation',
    'MN': 'restoration after completing parole and probation',
    'MO': 'restoration after completing parole and probation',
    'NE': 'restoration after completing parole and probation',
    'NM': 'restoration after completing parole and probation',
    'NC': 'restoration after completing parole and probation',
    'OK': 'restoration after completing parole and probation',
    'SC': 'restoration after completing parole and probation',
    'SD': 'restoration after completing parole and probation',
    'TX': 'restoration after completing parole and probation',
    'WA': 'restoration after completing parole and probation',
    'WV': 'restoration after completing parole and probation',
    'WI': 'restoration after completing parole and probation',
    
    # Additional action required
    'AL': 'additional action required for restoration',
    'AZ': 'additional action required for restoration',
    'DE': 'additional action required for restoration',
    'FL': 'additional action required for restoration',
    'IA': 'additional action required for restoration',
    'KY': 'additional action required for restoration',
    'MS': 'additional action required for restoration',
    'NV': 'additional action required for restoration',
    'TN': 'additional action required for restoration',
    'VA': 'additional action required for restoration',
    'WY': 'additional action required for restoration',
}

# Census API Endpoints
CENSUS_API_ENDPOINTS = {
    'acs5_2023': 'https://api.census.gov/data/2023/acs/acs5',
    'acs1_2023': 'https://api.census.gov/data/2023/acs/acs1',
    'dec_2020': 'https://api.census.gov/data/2020/dec/pl',
    'geocoder': 'https://geocoding.geo.census.gov/geocoder',
}

# CVAP Special Tabulation
CVAP_DATA_SOURCE = {
    'url': 'https://www.census.gov/programs-surveys/decennial-census/about/voting-rights/cvap.html',
    'note': 'Citizen Voting Age Population Special Tabulation',
    'table': 'CVAP',
    'years': [2019, 2020, 2021, 2022, 2023]
}

# State Categorizations - Examples (update these based on your selections)
STATE_CATEGORIES = {
    'opt_in': ['OR', 'CA', 'AK', 'CO', 'DC', 'HI', 'ID', 'IL', 'IA', 'ME', 
               'MD', 'MI', 'MN', 'MT', 'NV', 'NM', 'RI', 'UT', 'VT', 'VA', 
               'WA', 'WI', 'WY'],
    'opt_out_same_day_reg': ['WI', 'MN', 'ID', 'IA', 'MT', 'NH', 'WY'],
    'opt_out_no_same_day_reg': ['TX', 'FL', 'PA', 'OH', 'NC', 'GA'],
}

# EAVS Field Mappings (Field codes to human-readable names)
EAVS_FIELD_NAMES = {
    # Registration
    'A1a': 'Total Registered Voters',
    'A1b': 'Active Registered Voters',
    'A1c': 'Inactive Registered Voters',
    
    # Provisional Ballots
    'E1a': 'Total Provisional Ballots Cast',
    'E1d': 'Provisional Ballots Rejected',
    'E2a': 'Provisional - Voter Not on List',
    'E2b': 'Provisional - Voter Lacked ID',
    'E2c': 'Provisional - Official Challenged Eligibility',
    'E2d': 'Provisional - Person Challenged Eligibility',
    'E2e': 'Provisional - Voter Not Resident',
    'E2f': 'Provisional - Registration Not Updated',
    'E2g': 'Provisional - Did Not Surrender Mail Ballot',
    'E2h': 'Provisional - Judge Extended Hours',
    'E2i': 'Provisional - Voter Used SDR',
    
    # Mail Ballots
    'C9a': 'Total Mail Ballots Rejected',
    'C9b': 'Mail Ballots Rejected - Late',
    'C9c': 'Mail Ballots Rejected - Missing Voter Signature',
    'C9d': 'Mail Ballots Rejected - Missing Witness Signature',
    'C9e': 'Mail Ballots Rejected - Non-Matching Signature',
    
    # Equipment
    'F3a': 'DRE no VVPAT',
    'F4a': 'DRE with VVPAT',
    'F5a': 'Ballot Marking Device',
    'F6a': 'Scanner',
    
    # Pollbook Deletions
    'A12b': 'Removed - Moved',
    'A12c': 'Removed - Death',
    'A12d': 'Removed - Felony',
    'A12e': 'Removed - Fail Response',
    'A12f': 'Removed - Incompetent to Vote',
    'A12g': 'Removed - Voter Request',
    'A12h': 'Removed - Duplicate Records',
}
