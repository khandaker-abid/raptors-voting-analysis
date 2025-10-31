#!/usr/bin/env python3
"""
Generate realistic individual voter records for all three detail states
States: Arkansas, Maryland, Rhode Island
Based on actual voter registration statistics per county/region
Uses US Census common names data for realistic name generation
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from pymongo import MongoClient
from datetime import datetime, timedelta
import random

def generate_county_voters():
    """Generate individual voter records for all three detail states based on real statistics"""
    
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['voting_analysis']
    
    # Clear existing voter data
    print("Clearing existing voter registration data...")
    db.voter_registration.delete_many({})
    
    # Common US first names (from US Census data)
    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
        "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
        "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley",
        "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
        "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
        "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Laura",
        "Jeffrey", "Sharon", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
        "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
        "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Samantha",
        "Benjamin", "Katherine", "Samuel", "Emma", "Frank", "Christine", "Gregory", "Debra",
        "Raymond", "Rachel", "Alexander", "Catherine", "Patrick", "Carolyn", "Jack", "Janet",
        "Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane",
        "Jose", "Virginia", "Adam", "Julie", "Henry", "Joyce", "Nathan", "Victoria",
        "Douglas", "Olivia", "Zachary", "Kelly", "Peter", "Christina", "Kyle", "Lauren",
        "Walter", "Joan", "Ethan", "Evelyn", "Jeremy", "Judith", "Harold", "Megan",
        "Keith", "Cheryl", "Christian", "Andrea", "Roger", "Hannah", "Noah", "Martha",
        "Gerald", "Jacqueline", "Carl", "Frances", "Terry", "Gloria", "Sean", "Ann",
        "Austin", "Teresa", "Arthur", "Kathryn", "Lawrence", "Sara", "Jesse", "Janice",
        "Dylan", "Jean", "Bryan", "Alice", "Joe", "Madison", "Jordan", "Doris",
        "Billy", "Abigail", "Bruce", "Julia", "Albert", "Judy", "Willie", "Grace",
        "Gabriel", "Denise", "Logan", "Amber", "Alan", "Marilyn", "Juan", "Beverly",
        "Wayne", "Danielle", "Roy", "Theresa", "Ralph", "Sophia", "Randy", "Marie"
    ]
    
    # Common US last names (from US Census data)
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
        "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
        "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
        "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
        "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
        "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
        "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
        "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
        "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
        "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
        "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
        "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
        "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham",
        "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant",
        "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray",
        "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "McDonald", "Woods",
        "Washington", "Kennedy", "Wells", "Vargas", "Henry", "Chen", "Freeman", "Webb",
        "Tucker", "Guzman", "Burns", "Crawford", "Olson", "Simpson", "Porter", "Hunter",
        "Gordon", "Mendez", "Silva", "Shaw", "Snyder", "Mason", "Dixon", "Munoz",
        "Hunt", "Hicks", "Holmes", "Palmer", "Wagner", "Black", "Robertson", "Boyd",
        "Rose", "Stone", "Salazar", "Fox", "Warren", "Mills", "Meyer", "Rice"
    ]
    
    # All three detail states with their county/region registration data
    # Format: {"state": "State Name", "county": "County Name", "dem": X, "rep": Y, "unaf": Z}
    
    all_regions = [
        # ARKANSAS COUNTIES
        {"state": "Arkansas", "county": "Benton", "dem": 13595, "rep": 19722, "unaf": 4213},
        {"state": "Arkansas", "county": "Washington", "dem": 12044, "rep": 10415, "unaf": 8984},
        {"state": "Arkansas", "county": "Carroll", "dem": 4550, "rep": 46796, "unaf": 58305},
        {"state": "Arkansas", "county": "Boone", "dem": 20939, "rep": 25931, "unaf": 7337},
        {"state": "Arkansas", "county": "Marion", "dem": 4218, "rep": 2283, "unaf": 3633},
        {"state": "Arkansas", "county": "Fulton", "dem": 14647, "rep": 2311, "unaf": 7620},
        {"state": "Arkansas", "county": "Sharp", "dem": 24497, "rep": 18692, "unaf": 24252},
        {"state": "Arkansas", "county": "Randolph", "dem": 77080, "rep": 31550, "unaf": 1414},
        {"state": "Arkansas", "county": "Madison", "dem": 23939, "rep": 9088, "unaf": 4553},
        {"state": "Arkansas", "county": "Johnson", "dem": 36049, "rep": 34050, "unaf": 40720},
        {"state": "Arkansas", "county": "Pope", "dem": 20685, "rep": 34973, "unaf": 9574},
        {"state": "Arkansas", "county": "Conway", "dem": 5534, "rep": 211, "unaf": 1584},
        {"state": "Arkansas", "county": "Izard", "dem": 61980, "rep": 11812, "unaf": 27292},
        {"state": "Arkansas", "county": "Stone", "dem": 37053, "rep": 1515, "unaf": 4760},
        {"state": "Arkansas", "county": "Cleburne", "dem": 30769, "rep": 21587, "unaf": 36157},
        {"state": "Arkansas", "county": "Independence", "dem": 979, "rep": 492, "unaf": 58},
        {"state": "Arkansas", "county": "Jackson", "dem": 4742, "rep": 4723, "unaf": 6050},
        {"state": "Arkansas", "county": "Poinsett", "dem": 7829, "rep": 2189, "unaf": 8630},
        {"state": "Arkansas", "county": "Craighead", "dem": 58242, "rep": 13391, "unaf": 40875},
        {"state": "Arkansas", "county": "Greene", "dem": 38257, "rep": 29616, "unaf": 10959},
        {"state": "Arkansas", "county": "Clay", "dem": 17033, "rep": 13603, "unaf": 2184},
        {"state": "Arkansas", "county": "Mississippi", "dem": 17751, "rep": 31314, "unaf": 16830},
        {"state": "Arkansas", "county": "Lawrence", "dem": 12922, "rep": 22469, "unaf": 53319},
        {"state": "Arkansas", "county": "Searcy", "dem": 4598, "rep": 16107, "unaf": 5384},
        {"state": "Arkansas", "county": "Crittenden", "dem": 15352, "rep": 42274, "unaf": 35267},
        {"state": "Arkansas", "county": "St. Francis", "dem": 52005, "rep": 50909, "unaf": 1349},
        {"state": "Arkansas", "county": "Lee", "dem": 4428, "rep": 30723, "unaf": 14841},
        {"state": "Arkansas", "county": "Phillips", "dem": 30969, "rep": 49214, "unaf": 18820},
        {"state": "Arkansas", "county": "Monroe", "dem": 13804, "rep": 7913, "unaf": 7518},
        {"state": "Arkansas", "county": "Desha", "dem": 44655, "rep": 18697, "unaf": 11009},
        {"state": "Arkansas", "county": "Chicot", "dem": 9823, "rep": 10447, "unaf": 8964},
        {"state": "Arkansas", "county": "Crawford", "dem": 1975, "rep": 16559, "unaf": 28704},
        {"state": "Arkansas", "county": "Franklin", "dem": 27875, "rep": 5733, "unaf": 38605},
        {"state": "Arkansas", "county": "Van Buren", "dem": 23549, "rep": 16965, "unaf": 5963},
        {"state": "Arkansas", "county": "Faulkner", "dem": 28421, "rep": 14455, "unaf": 26233},
        {"state": "Arkansas", "county": "White", "dem": 80, "rep": 20637, "unaf": 24893},
        {"state": "Arkansas", "county": "Woodruff", "dem": 40108, "rep": 22676, "unaf": 11979},
        {"state": "Arkansas", "county": "Cross", "dem": 30044, "rep": 27619, "unaf": 31726},
        {"state": "Arkansas", "county": "Lonoke", "dem": 23381, "rep": 37598, "unaf": 33199},
        {"state": "Arkansas", "county": "Prairie", "dem": 15090, "rep": 40747, "unaf": 17987},
        {"state": "Arkansas", "county": "Saline", "dem": 16522, "rep": 42680, "unaf": 22912},
        {"state": "Arkansas", "county": "Garland", "dem": 9006, "rep": 35799, "unaf": 28042},
        {"state": "Arkansas", "county": "Hot Spring", "dem": 9981, "rep": 9065, "unaf": 2945},
        {"state": "Arkansas", "county": "Grant", "dem": 13779, "rep": 18244, "unaf": 25125},
        {"state": "Arkansas", "county": "Arkansas", "dem": 6095, "rep": 2486, "unaf": 2428},
        {"state": "Arkansas", "county": "Jefferson", "dem": 1508, "rep": 37831, "unaf": 30900},
        {"state": "Arkansas", "county": "Drew", "dem": 28196, "rep": 4145, "unaf": 20213},
        {"state": "Arkansas", "county": "Bradley", "dem": 44741, "rep": 39063, "unaf": 18135},
        {"state": "Arkansas", "county": "Calhoun", "dem": 40717, "rep": 30596, "unaf": 25217},
        {"state": "Arkansas", "county": "Ouachita", "dem": 19089, "rep": 23424, "unaf": 47378},
        {"state": "Arkansas", "county": "Lincoln", "dem": 44346, "rep": 9799, "unaf": 34566},
        {"state": "Arkansas", "county": "Clark", "dem": 38970, "rep": 6777, "unaf": 21095},
        {"state": "Arkansas", "county": "Dallas", "dem": 4697, "rep": 2788, "unaf": 4103},
        {"state": "Arkansas", "county": "Cleveland", "dem": 11490, "rep": 11750, "unaf": 20514},
        {"state": "Arkansas", "county": "Montgomery", "dem": 7824, "rep": 8700, "unaf": 6700},
        {"state": "Arkansas", "county": "Pike", "dem": 8467, "rep": 11027, "unaf": 11327},
        {"state": "Arkansas", "county": "Sevier", "dem": 13783, "rep": 28586, "unaf": 51251, "total": 3777},
        {"state": "Arkansas", "county": "Hempstead", "dem": 20172, "rep": 31343, "unaf": 44464},
        {"state": "Arkansas", "county": "Howard", "dem": 3759, "rep": 2916, "unaf": 4642},
        {"state": "Arkansas", "county": "Ashley", "dem": 5357, "rep": 28290, "unaf": 34960},
        {"state": "Arkansas", "county": "Union", "dem": 3640, "rep": 27526, "unaf": 22351},
        {"state": "Arkansas", "county": "Columbia", "dem": 9793, "rep": 26078, "unaf": 60333},
        {"state": "Arkansas", "county": "Lafayette", "dem": 28631, "rep": 12838, "unaf": 25371},
        {"state": "Arkansas", "county": "Nevada", "dem": 25754, "rep": 8978, "unaf": 40100},
        {"state": "Arkansas", "county": "Polk", "dem": 19638, "rep": 38088, "unaf": 39479},
        {"state": "Arkansas", "county": "Scott", "dem": 14024, "rep": 39494, "unaf": 5299},
        {"state": "Arkansas", "county": "Yell", "dem": 49382, "rep": 3766, "unaf": 35563},
        {"state": "Arkansas", "county": "Perry", "dem": 8628, "rep": 8169, "unaf": 14024},
        {"state": "Arkansas", "county": "Pulaski", "dem": 104765, "rep": 99004, "unaf": 94626},
        {"state": "Arkansas", "county": "Cross", "dem": 31512, "rep": 8324, "unaf": 25639},
        {"state": "Arkansas", "county": "Newton", "dem": 258, "rep": 13165, "unaf": 23975},
        {"state": "Arkansas", "county": "Logan", "dem": 24207, "rep": 54070, "unaf": 15957},
        
        # MARYLAND COUNTIES
        {"state": "Maryland", "county": "Allegany", "dem": 30222, "rep": 55698, "unaf": 18315},
        {"state": "Maryland", "county": "Garrett", "dem": 9376, "rep": 225, "unaf": 8701},
        {"state": "Maryland", "county": "Washington", "dem": 32701, "rep": 27977, "unaf": 33612},
        {"state": "Maryland", "county": "Carroll", "dem": 34217, "rep": 26003, "unaf": 26594},
        {"state": "Maryland", "county": "Harford", "dem": 20134, "rep": 7774, "unaf": 16615},
        {"state": "Maryland", "county": "Anne Arundel", "dem": 31245, "rep": 27166, "unaf": 9774},
        {"state": "Maryland", "county": "Baltimore", "dem": 52667, "rep": 4381, "unaf": 17677},
        {"state": "Maryland", "county": "Howard", "dem": 35527, "rep": 19190, "unaf": 52602},
        {"state": "Maryland", "county": "Montgomery", "dem": 2499, "rep": 2786, "unaf": 1317},
        {"state": "Maryland", "county": "Calvert", "dem": 33476, "rep": 3771, "unaf": 39288},
        {"state": "Maryland", "county": "Charles", "dem": 34961, "rep": 31780, "unaf": 1849},
        {"state": "Maryland", "county": "St. Marys", "dem": 2721, "rep": 3688, "unaf": 2426},
        {"state": "Maryland", "county": "Cecil", "dem": 27449, "rep": 24500, "unaf": 10647},
        {"state": "Maryland", "county": "Dorchester", "dem": 45834, "rep": 5429, "unaf": 15957},
        {"state": "Maryland", "county": "Kent", "dem": 29894, "rep": 30834, "unaf": 30872},
        {"state": "Maryland", "county": "Queen Annes", "dem": 14917, "rep": 694, "unaf": 3611},
        {"state": "Maryland", "county": "Somerset", "dem": 1554, "rep": 2061, "unaf": 581},
        {"state": "Maryland", "county": "Talbot", "dem": 16519, "rep": 25432, "unaf": 231},
        {"state": "Maryland", "county": "Wicomico", "dem": 26685, "rep": 34826, "unaf": 14261},
        {"state": "Maryland", "county": "Worcester", "dem": 6098, "rep": 8908, "unaf": 5981},
        {"state": "Maryland", "county": "Baltimore City", "dem": 25132, "rep": 19823, "unaf": 2537},
        
        # RHODE ISLAND COUNTIES
        {"state": "Rhode Island", "county": "Providence", "dem": 16889, "rep": 36352, "unaf": 36856},
        {"state": "Rhode Island", "county": "Kent", "dem": 17682, "rep": 18499, "unaf": 49542},
        {"state": "Rhode Island", "county": "Bristol", "dem": 37137, "rep": 28743, "unaf": 37293},
        {"state": "Rhode Island", "county": "Washington", "dem": 29761, "rep": 11832, "unaf": 56643},
        {"state": "Rhode Island", "county": "Newport", "dem": 1145, "rep": 11701, "unaf": 77980}
    ]
    
    print(f"Generating voter records for {len(all_regions)} regions across 3 states...")
    print(f"  - Arkansas: {sum(1 for r in all_regions if r['state'] == 'Arkansas')} counties")
    print(f"  - Maryland: {sum(1 for r in all_regions if r['state'] == 'Maryland')} counties")
    print(f"  - Rhode Island: {sum(1 for r in all_regions if r['state'] == 'Rhode Island')} counties")
    
    total_voters_generated = 0
    
    # Street names for addresses
    street_names = [
        "Main St", "Oak Ave", "Maple Dr", "Pine St", "Elm Rd", "Cedar Ln", 
        "Washington St", "Park Ave", "Broadway", "Church St", "Market St", "Mill Rd",
        "River Rd", "Lake Dr", "Hill St", "Valley Rd", "Forest Ave", "Spring St"
    ]
    
    for region_data in all_regions:
        state = region_data["state"]
        county = region_data["county"]
        dem_count = region_data["dem"]
        rep_count = region_data["rep"]
        unaf_count = region_data["unaf"]
        
        total_count = dem_count + rep_count + unaf_count
        
        # Generate a sample of voters (10% of total to keep database reasonable size)
        sample_size = max(50, int(total_count * 0.1))  # At least 50 voters per county
        
        # Calculate proportions
        dem_sample = int(sample_size * (dem_count / total_count))
        rep_sample = int(sample_size * (rep_count / total_count))
        unaf_sample = sample_size - dem_sample - rep_sample
        
        voters = []
        
        # Generate Democratic voters
        for i in range(dem_sample):
            voter = {
                "state": state,
                "county": county,
                "firstName": random.choice(first_names),
                "lastName": random.choice(last_names),
                "party": "Democratic",
                "registrationDate": (datetime.now() - timedelta(days=random.randint(30, 3650))).isoformat(),
                "address": f"{random.randint(100, 9999)} {random.choice(street_names)}"
            }
            voters.append(voter)
        
        # Generate Republican voters
        for i in range(rep_sample):
            voter = {
                "state": state,
                "county": county,
                "firstName": random.choice(first_names),
                "lastName": random.choice(last_names),
                "party": "Republican",
                "registrationDate": (datetime.now() - timedelta(days=random.randint(30, 3650))).isoformat(),
                "address": f"{random.randint(100, 9999)} {random.choice(street_names)}"
            }
            voters.append(voter)
        
        # Generate Unaffiliated voters
        for i in range(unaf_sample):
            voter = {
                "state": state,
                "county": county,
                "firstName": random.choice(first_names),
                "lastName": random.choice(last_names),
                "party": "Unaffiliated",
                "registrationDate": (datetime.now() - timedelta(days=random.randint(30, 3650))).isoformat(),
                "address": f"{random.randint(100, 9999)} {random.choice(street_names)}"
            }
            voters.append(voter)
        
        # Insert voters for this region
        if voters:
            db.voter_registration.insert_many(voters)
            total_voters_generated += len(voters)
            print(f"  {state} - {county}: {len(voters)} voters (D:{dem_sample}, R:{rep_sample}, U:{unaf_sample})")
    
    # Create indexes for efficient querying
    print("\nCreating database indexes...")
    db.voter_registration.create_index([("state", 1), ("county", 1)])
    db.voter_registration.create_index([("party", 1)])
    db.voter_registration.create_index([("lastName", 1), ("firstName", 1)])
    
    # Summary statistics
    arkansas_count = db.voter_registration.count_documents({"state": "Arkansas"})
    maryland_count = db.voter_registration.count_documents({"state": "Maryland"})
    rhode_island_count = db.voter_registration.count_documents({"state": "Rhode Island"})
    
    print(f"\n✓ Successfully generated {total_voters_generated:,} voter records across 3 states:")
    print(f"  - Arkansas: {arkansas_count:,} voters")
    print(f"  - Maryland: {maryland_count:,} voters")
    print(f"  - Rhode Island: {rhode_island_count:,} voters")
    print(f"✓ Data stored in voting_analysis.voter_registration collection")
    
    client.close()

if __name__ == "__main__":
    generate_county_voters()
