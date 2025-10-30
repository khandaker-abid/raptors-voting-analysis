#!/usr/bin/env python3
"""
Script to integrate the new components into StateDetailPage.tsx
This avoids issues with the replace_string_in_file tool on complex JSX.
"""

import re

def integrate_components():
    filepath = "src/pages/StateDetailPage.tsx"
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Add component imports after ResetButton import
    import_marker = '// New imports for GUI-25 to GUI-27\nimport EquipmentRejectedBubbleChart from "../charts/EquipmentRejectedBubbleChart";\nimport ResetButton from "../components/ResetButton";'
    new_imports = '''// New imports for GUI-25 to GUI-27
import EquipmentRejectedBubbleChart from "../charts/EquipmentRejectedBubbleChart";
import ResetButton from "../components/ResetButton";

// New component imports for integration (GUI-10, GUI-19, GUI-27, GUI-28, GUI-29)
import RegisteredVotersList from "../components/RegisteredVotersList";
import VotingEquipmentTypeChoropleth from "../components/VotingEquipmentTypeChoropleth";
import GinglesChart from "../charts/GinglesChart";
import EIEquipmentChart from "../charts/EIEquipmentChart";
import EIRejectedBallotsChart from "../charts/EIRejectedBallotsChart";'''
    
    if import_marker in content:
        content = content.replace(import_marker, new_imports)
        print("✅ Added component imports")
    else:
        print("⚠️  Could not find import marker")
    
    # 2. Add isPreclearance check after isDetail
    detail_check = '\tconst isDetail = isDetailState(decodedStateName);'
    preclearance_check = '''\tconst isDetail = isDetailState(decodedStateName);
\tconst isPreclearance = decodedStateName === "Maryland"; // Preclearance state for VRA analysis'''
    
    if detail_check in content and 'isPreclearance' not in content:
        content = content.replace(detail_check, preclearance_check)
        print("✅ Added isPreclearance check")
    else:
        print("⚠️  isPreclearance already added or couldn't find marker")
    
    # 3. Add selectedRegion state
    bubbles_state = '\tconst [showBubbles, setShowBubbles] = React.useState(false);'
    region_state = '''\tconst [showBubbles, setShowBubbles] = React.useState(false);

\t// State for RegisteredVotersList dialog (GUI-19)
\tconst [selectedRegion, setSelectedRegion] = React.useState<string | null>(null);'''
    
    if bubbles_state in content and 'selectedRegion' not in content:
        content = content.replace(bubbles_state, region_state)
        print("✅ Added selectedRegion state")
    else:
        print("⚠️  selectedRegion already added or couldn't find marker")
    
    # 4. Update tab indices
    old_indices = '''\tlet idx = 0;
\tconst IDX_OVERVIEW = idx++;
\tconst IDX_PROVISIONAL = isDetail ? idx++ : -1;
\tconst IDX_ACTIVE = isDetail ? idx++ : -1;
\tconst IDX_POLLBOOK = isDetail ? idx++ : -1; // new
\tconst IDX_MAIL = isDetail ? idx++ : -1;     // new
\tconst IDX_EQUIPMENT = idx++;
\tconst IDX_REG = isDetail ? idx++ : -1;'''
    
    new_indices = '''\tlet idx = 0;
\tconst IDX_OVERVIEW = idx++;
\tconst IDX_PROVISIONAL = isDetail ? idx++ : -1;
\tconst IDX_ACTIVE = isDetail ? idx++ : -1;
\tconst IDX_POLLBOOK = isDetail ? idx++ : -1;
\tconst IDX_MAIL = isDetail ? idx++ : -1;
\tconst IDX_EQUIPMENT = idx++;
\tconst IDX_EQUIPMENT_TYPES = isDetail ? idx++ : -1; // NEW - GUI-10
\tconst IDX_REG = isDetail ? idx++ : -1;
\tconst IDX_GINGLES = isPreclearance ? idx++ : -1; // NEW - GUI-27
\tconst IDX_EI_EQUIPMENT = isPreclearance ? idx++ : -1; // NEW - GUI-28
\tconst IDX_EI_REJECTED = isPreclearance ? idx++ : -1; // NEW - GUI-29'''
    
    if old_indices in content:
        content = content.replace(old_indices, new_indices)
        print("✅ Updated tab indices")
    else:
        print("⚠️  Could not find tab indices section")
    
    # 5. Add tab labels
    old_tabs = '''\t\t\t\t\t<Tab label="State Map" />
\t\t\t\t\t{isDetail && <Tab label="Provisional Ballot" />}
\t\t\t\t\t{isDetail && <Tab label="Active Voters" />}
\t\t\t\t\t{isDetail && <Tab label="Pollbook Deletions" />}
\t\t\t\t\t{isDetail && <Tab label="Mail Rejections" />}
\t\t\t\t\t<Tab label="Voting Equipment" />
\t\t\t\t\t{isDetail && <Tab label="Voter Registration" />}
\t\t\t\t</Tabs>'''
    
    new_tabs = '''\t\t\t\t\t<Tab label="State Map" />
\t\t\t\t\t{isDetail && <Tab label="Provisional Ballot" />}
\t\t\t\t\t{isDetail && <Tab label="Active Voters" />}
\t\t\t\t\t{isDetail && <Tab label="Pollbook Deletions" />}
\t\t\t\t\t{isDetail && <Tab label="Mail Rejections" />}
\t\t\t\t\t<Tab label="Voting Equipment" />
\t\t\t\t\t{isDetail && <Tab label="Equipment Types" />}
\t\t\t\t\t{isDetail && <Tab label="Voter Registration" />}
\t\t\t\t\t{isPreclearance && <Tab label="Gingles Analysis" />}
\t\t\t\t\t{isPreclearance && <Tab label="EI Equipment" />}
\t\t\t\t\t{isPreclearance && <Tab label="EI Rejected" />}
\t\t\t\t</Tabs>'''
    
    if old_tabs in content:
        content = content.replace(old_tabs, new_tabs)
        print("✅ Added tab labels")
    else:
        print("⚠️  Could not find tabs section")
    
    # Write the updated content
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("\n✅ Component integration complete!")
    print("Next steps:")
    print("1. Add TabPanels for Equipment Types, Gingles, EI Equipment, EI Rejected")
    print("2. Add RegisteredVotersList dialog at the end")
    print("3. Add 'View Registered Voters' button in Registration tab")

if __name__ == "__main__":
    integrate_components()
