#!/usr/bin/env python3
"""
Add the tab labels to StateDetailPage.tsx
Uses line-by-line editing to avoid corruption issues
"""

def add_tab_labels():
    filepath = "src/pages/StateDetailPage.tsx"
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Find the line with "Voting Equipment" tab and add new tabs after the Registration tab
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # After the "Voter Registration" tab line, add the new tabs
        if '{isDetail && <Tab label="Voter Registration" />}' in line:
            # Insert Equipment Types tab right after Voting Equipment
            # We need to go back and insert it
            # Let's use a different approach - mark where to insert
            pass
        
        i += 1
    
    # Different approach: find specific line numbers
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    output_lines = []
    for i, line in enumerate(lines):
        output_lines.append(line)
        
        # After line containing '<Tab label="Voting Equipment" />', add Equipment Types
        if '<Tab label="Voting Equipment" />' in line and 'Equipment Types' not in lines[i+1] if i+1 < len(lines) else True:
            # Get the indentation from current line
            indent = line[:len(line) - len(line.lstrip())]
            output_lines.append(f'{indent}{{isDetail && <Tab label="Equipment Types" />}}\n')
        
        # After line containing 'Voter Registration', add the preclearance tabs
        elif '{isDetail && <Tab label="Voter Registration" />}' in line:
            # Get the indentation
            indent = line[:len(line) - len(line.lstrip())]
            # Check if next lines already have our tabs
            next_line = lines[i+1] if i+1 < len(lines) else ""
            if 'Gingles Analysis' not in next_line:
                output_lines.append(f'{indent}{{isPreclearance && <Tab label="Gingles Analysis" />}}\n')
                output_lines.append(f'{indent}{{isPreclearance && <Tab label="EI Equipment" />}}\n')
                output_lines.append(f'{indent}{{isPreclearance && <Tab label="EI Rejected" />}}\n')
    
    # Write back
    with open(filepath, 'w') as f:
        f.writelines(output_lines)
    
    print("✅ Added tab labels successfully!")

if __name__ == "__main__":
    add_tab_labels()
