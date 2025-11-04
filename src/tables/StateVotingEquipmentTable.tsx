import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Chip,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import type { EveryStateAllModelsData } from "../data/everyStateAllModelsData.ts";
import { fetchStateEquipmentDetails } from "../data/api";

interface StateVotingEquipmentTableProps {
	stateName: string;
}

const StateVotingEquipmentTable: React.FC<StateVotingEquipmentTableProps> = ({
	stateName
}) => {
	const [data, setData] = useState<EveryStateAllModelsData[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetchStateEquipmentDetails(stateName);
				console.log(`Equipment data for ${stateName}:`, response);
				setData(response || []);
			} catch (err) {
				console.error(`Failed to fetch equipment data for ${stateName}:`, err);
				setData([]);
			}
		};

		if (stateName) {
			fetchData();
		}
	}, [stateName]);

	// Helper function to get certification grayscale intensity
	// Darker = better certification
	const getCertificationColor = (cert: string) => {
		if (cert.includes("2.0 certified")) return "#212121"; // Darkest - best
		if (cert.includes("2.0 applied")) return "#424242"; // Dark
		if (cert.includes("1.1 certified")) return "#616161"; // Medium
		if (cert.includes("1.0 certified")) return "#757575"; // Light
		return "#9e9e9e"; // Lightest - not certified
	};

	const sortedData = useMemo(() => {
		if (!data) return [];
		return [...data].sort((a, b) => a.make.localeCompare(b.make));
	}, [data]);

	if (!data || data.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center" }}>
				<Typography variant="body1" color="text.secondary">
					No voting equipment data available for this state.
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
					Run preprocessing scripts to populate equipment data from EAVS datasets.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box mb={3}>
				<Typography variant="h6" gutterBottom fontWeight={600}>
					Voting Equipment Information
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Detailed information about voting equipment deployed in this state, including
					make, model, certification status, and performance metrics.
				</Typography>
			</Box>

			<TableContainer sx={{ maxHeight: 600, position: "relative" }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									position: "sticky",
									left: 0,
									zIndex: 3,
									minWidth: 220,
								}}>
								Make / Model
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 90,
								}}>
								Quantity
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 160,
								}}>
								Equipment Type
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 250,
								}}>
								Description
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 100,
								}}>
								Age (years)
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 180,
								}}>
								Operating System
							</TableCell>
							<TableCell
								align="left"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 160,
								}}>
								Certification
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 100,
								}}>
								Scan Rate
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 100,
								}}>
								Error Rate
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontWeight: "bold",
									backgroundColor: "#616161",
									color: "white",
									minWidth: 100,
								}}>
								Reliability
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData.map((row, index) => {
							const isUnavailable = row.isAvailable === false;
							// Use grayscale striping
							const rowBg = index % 2 === 0 ? "white" : "#fafafa";

							return (
								<TableRow
									key={row.id}
									hover
									sx={{
										"&:nth-of-type(even)": { backgroundColor: "#fafafa" },
									}}>
									<TableCell
										component="th"
										scope="row"
										sx={{
											fontWeight: 500,
											position: "sticky",
											left: 0,
											backgroundColor: rowBg,
											zIndex: 1,
										}}>
										<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 600,
													textDecoration: isUnavailable ? "line-through" : "none",
													color: isUnavailable ? "#757575" : "text.primary",
												}}
											>
												{row.make}
											</Typography>
											<Typography
												variant="body2"
												sx={{
													textDecoration: isUnavailable ? "line-through" : "none",
													color: isUnavailable ? "#9e9e9e" : "text.secondary",
													fontSize: "0.875rem",
												}}
											>
												{row.model}
											</Typography>
											{isUnavailable && (
												<Chip
													label="No longer available"
													size="small"
													sx={{
														height: 20,
														fontSize: "0.7rem",
														backgroundColor: "#f5f5f5",
														color: "#616161",
														fontWeight: 600,
														width: "fit-content",
														border: "1px solid #e0e0e0",
													}}
												/>
											)}
										</Box>
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: 500,
										}}>
										{row.quantity.toLocaleString()}
									</TableCell>

									<TableCell align="left">
										<Typography variant="body2">
											{row.equipmentType}
										</Typography>
									</TableCell>

									<TableCell align="left">
										<Typography variant="body2" color="text.secondary">
											{row.description}
										</Typography>
									</TableCell>

									<TableCell align="right">
										<Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 500,
													// Darker text for older equipment
													color: row.age > 10 ? "#212121" : row.age > 7 ? "#424242" : "text.secondary"
												}}
											>
												{row.age}
											</Typography>
											{row.age > 10 && (
												<Chip
													label="Old"
													size="small"
													sx={{
														height: 20,
														fontSize: "0.65rem",
														backgroundColor: "#e0e0e0",
														color: "#212121",
														fontWeight: 600,
													}}
												/>
											)}
										</Box>
									</TableCell>

									<TableCell align="left">
										<Typography variant="body2">
											{row.os}
										</Typography>
									</TableCell>

									<TableCell align="left">
										<Chip
											label={row.certification}
											size="small"
											sx={{
												backgroundColor: getCertificationColor(row.certification) + "20",
												color: getCertificationColor(row.certification),
												fontWeight: 600,
												borderLeft: `3px solid ${getCertificationColor(row.certification)}`,
											}}
										/>
									</TableCell>

									<TableCell align="right">
										{row.scanRate.toLocaleString()}
									</TableCell>

									<TableCell align="right">
										{row.errorRate}
									</TableCell>

									<TableCell align="right">
										<Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
											<Typography variant="body2" sx={{ fontWeight: 500, minWidth: 40 }}>
												{row.reliability}
											</Typography>
											<Box
												sx={{
													width: 60,
													height: 6,
													backgroundColor: "#e0e0e0",
													borderRadius: 3,
													overflow: "hidden",
												}}
											>
												<Box
													sx={{
														width: row.reliability,
														height: "100%",
														// Grayscale: darker = higher reliability
														backgroundColor:
															parseInt(row.reliability) >= 90 ? "#212121" :
																parseInt(row.reliability) >= 80 ? "#424242" :
																	parseInt(row.reliability) >= 70 ? "#616161" : "#757575",
														transition: "width 0.3s ease",
													}}
												/>
											</Box>
										</Box>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
}

export default StateVotingEquipmentTable;