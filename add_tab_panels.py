#!/usr/bin/env python3
"""
Add the new TabPanels to StateDetailPage.tsx
"""

def add_tab_panels():
    filepath = "src/pages/StateDetailPage.tsx"
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find the closing </TabPanel> for IDX_REG, then add our new panels before </Paper>
    marker = '''				</TabPanel>
			)}
		</Paper>'''
    
    new_panels = '''				</TabPanel>
			)}

			{/* Equipment Types Tab (GUI-10) - Detail states only */}
			{isDetail && IDX_EQUIPMENT_TYPES !== -1 && (
				<TabPanel value={tabValue} index={IDX_EQUIPMENT_TYPES}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h6" gutterBottom>
							Voting Equipment Types by Region
						</Typography>
						<Alert severity="info" sx={{ mb: 2 }}>
							This map shows the distribution of voting equipment types across different regions.
							Colors represent different equipment types (DRE, Optical Scan, BMD, etc.).
						</Alert>
						
						<VotingEquipmentTypeChoropleth
							stateName={decodedStateName}
							data={[]}
							geographicUnit="county"
						/>
						
						{/* Equipment Type Legend */}
						<Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", border: "1px solid #ddd" }}>
							<Typography variant="subtitle2" gutterBottom>
								Equipment Type Legend:
							</Typography>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Box sx={{ width: 20, height: 20, bgcolor: "#4CAF50" }} />
									<Typography variant="body2">Optical Scan</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Box sx={{ width: 20, height: 20, bgcolor: "#2196F3" }} />
									<Typography variant="body2">DRE (Direct Recording)</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Box sx={{ width: 20, height: 20, bgcolor: "#FF9800" }} />
									<Typography variant="body2">BMD (Ballot Marking)</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Box sx={{ width: 20, height: 20, bgcolor: "#9C27B0" }} />
									<Typography variant="body2">Mixed/Hybrid</Typography>
								</Box>
							</Box>
						</Box>
					</Box>
				</TabPanel>
			)}

			{/* Voter Registration Tab - Add "View Registered Voters" button */}
			{isDetail && IDX_REG !== -1 && (
				<Box sx={{ position: "relative" }}>
					{/* Button overlay */}
					<Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
						<Button
							variant="contained"
							color="primary"
							onClick={() => setSelectedRegion(decodedStateName)}
						>
							View Registered Voters
						</Button>
					</Box>
				</Box>
			)}

			{/* Gingles Analysis Tab (GUI-27) - Preclearance state only */}
			{isPreclearance && IDX_GINGLES !== -1 && (
				<TabPanel value={tabValue} index={IDX_GINGLES}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h6" gutterBottom>
							Gingles Test Analysis
						</Typography>
						<Alert severity="info" sx={{ mb: 2 }}>
							The Gingles Test analyzes three prongs for Voting Rights Act compliance:
							1) Geographic compactness of minority population
							2) Political cohesiveness of minority voters
							3) Voting patterns that defeat minority-preferred candidates
						</Alert>
						
						<GinglesChart
							data={[]}
							state={decodedStateName}
						/>
					</Box>
				</TabPanel>
			)}

			{/* EI Equipment Tab (GUI-28) - Preclearance state only */}
			{isPreclearance && IDX_EI_EQUIPMENT !== -1 && (
				<TabPanel value={tabValue} index={IDX_EI_EQUIPMENT}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h6" gutterBottom>
							Ecological Inference: Equipment Quality Access
						</Typography>
						<Alert severity="info" sx={{ mb: 2 }}>
							This analysis uses Ecological Inference to estimate equipment quality access
							by demographic group. Higher equipment quality scores indicate newer, more
							reliable voting equipment.
						</Alert>
						
						<EIEquipmentChart state={decodedStateName} />
					</Box>
				</TabPanel>
			)}

			{/* EI Rejected Ballots Tab (GUI-29) - Preclearance state only */}
			{isPreclearance && IDX_EI_REJECTED !== -1 && (
				<TabPanel value={tabValue} index={IDX_EI_REJECTED}>
					<Box sx={{ p: 2 }}>
						<Typography variant="h6" gutterBottom>
							Ecological Inference: Ballot Rejection Rates
						</Typography>
						<Alert severity="warning" sx={{ mb: 2 }}>
							This analysis uses Ecological Inference to estimate ballot rejection rates
							by demographic group. Disparities in rejection rates may indicate systemic
							voting access issues requiring preclearance review.
						</Alert>
						
						<EIRejectedBallotsChart state={decodedStateName} />
					</Box>
				</TabPanel>
			)}
		</Paper>'''
    
    if marker in content:
        content = content.replace(marker, new_panels)
        print("✅ Added all TabPanels successfully!")
    else:
        print("⚠️  Could not find marker to insert TabPanels")
        return
    
    # Now add the RegisteredVotersList dialog at the very end, before the final closing brace
    # Find the last </Box> which closes the component
    last_box = '''		</Box>
	);
};

export default StateDetailPage;'''
    
    with_dialog = '''		</Box>

		{/* RegisteredVotersList Dialog (GUI-19) */}
		<RegisteredVotersList
			open={selectedRegion !== null}
			onClose={() => setSelectedRegion(null)}
			state={decodedStateName}
			region={selectedRegion || ""}
		/>
	);
};

export default StateDetailPage;'''
    
    if last_box in content:
        content = content.replace(last_box, with_dialog)
        print("✅ Added RegisteredVotersList dialog!")
    else:
        print("⚠️  Could not find location for RegisteredVotersList dialog")
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("\n✅ All components fully integrated!")
    print("\nNext steps:")
    print("1. Test compilation: npm run build")
    print("2. Start backend: cd backend && ./mvnw spring-boot:run")
    print("3. Start frontend: npm run dev")
    print("4. Navigate to Maryland to see preclearance tabs")

if __name__ == "__main__":
    add_tab_panels()
