import React, { useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	AlertTitle,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Checkbox,
	FormGroup,
	FormControlLabel,
	Divider,
	Snackbar,
	Chip,
} from "@mui/material";
import {
	RestartAlt as ResetIcon,
	Clear as ClearIcon,
	Refresh as RefreshIcon,
	Storage as StorageIcon,
	FilterAlt as FilterIcon,
	Settings as SettingsIcon,
	Warning as WarningIcon,
} from "@mui/icons-material";

interface ResetOption {
	id: string;
	label: string;
	description: string;
	icon: React.ReactNode;
	category: "data" | "filters" | "settings";
}

const ResetPage: React.FC = () => {
	const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
	const [resetDialogOpen, setResetDialogOpen] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);
	const [isResetting, setIsResetting] = useState(false);

	const resetOptions: ResetOption[] = [
		{
			id: "cached-data",
			label: "Clear Cached Data",
			description:
				"Remove all locally cached voter registration and election data",
			icon: <StorageIcon color="primary" />,
			category: "data",
		},
		{
			id: "user-filters",
			label: "Reset All Filters",
			description:
				"Clear all applied filters across all comparison tools and charts",
			icon: <FilterIcon color="primary" />,
			category: "filters",
		},
		{
			id: "chart-settings",
			label: "Reset Chart Preferences",
			description: "Restore default chart colors, sizes, and display options",
			icon: <SettingsIcon color="primary" />,
			category: "settings",
		},
		{
			id: "view-preferences",
			label: "Clear View Preferences",
			description:
				"Reset layout, table sorting, and column visibility preferences",
			icon: <SettingsIcon color="primary" />,
			category: "settings",
		},
		{
			id: "session-data",
			label: "Clear Session Data",
			description: "Remove temporary session storage and navigation history",
			icon: <StorageIcon color="primary" />,
			category: "data",
		},
		{
			id: "comparison-history",
			label: "Clear Comparison History",
			description: "Remove saved comparison results and analysis cache",
			icon: <StorageIcon color="primary" />,
			category: "data",
		},
	];

	const handleOptionToggle = (optionId: string) => {
		setSelectedOptions((prev) =>
			prev.includes(optionId)
				? prev.filter((id) => id !== optionId)
				: [...prev, optionId],
		);
	};

	const handleSelectAll = () => {
		if (selectedOptions.length === resetOptions.length) {
			setSelectedOptions([]);
		} else {
			setSelectedOptions(resetOptions.map((option) => option.id));
		}
	};

	const handleSelectByCategory = (
		category: "data" | "filters" | "settings",
	) => {
		const categoryOptions = resetOptions.filter(
			(option) => option.category === category,
		);
		const allCategorySelected = categoryOptions.every((option) =>
			selectedOptions.includes(option.id),
		);

		if (allCategorySelected) {
			// Unselect all from this category
			setSelectedOptions((prev) =>
				prev.filter(
					(id) => !categoryOptions.some((option) => option.id === id),
				),
			);
		} else {
			// Select all from this category
			const categoryIds = categoryOptions.map((option) => option.id);
			setSelectedOptions((prev) => [
				...prev.filter((id) => !categoryIds.includes(id)),
				...categoryIds,
			]);
		}
	};

	const handleResetConfirm = async () => {
		setIsResetting(true);

		// Simulate reset process
		try {
			// Clear localStorage data
			if (selectedOptions.includes("cached-data")) {
				localStorage.removeItem("voterRegistrationCache");
				localStorage.removeItem("electionDataCache");
			}

			if (selectedOptions.includes("user-filters")) {
				localStorage.removeItem("userFilters");
				localStorage.removeItem("activeFilters");
			}

			if (selectedOptions.includes("chart-settings")) {
				localStorage.removeItem("chartPreferences");
				localStorage.removeItem("colorSettings");
			}

			if (selectedOptions.includes("view-preferences")) {
				localStorage.removeItem("viewPreferences");
				localStorage.removeItem("tableSettings");
			}

			if (selectedOptions.includes("session-data")) {
				sessionStorage.clear();
			}

			if (selectedOptions.includes("comparison-history")) {
				localStorage.removeItem("comparisonHistory");
				localStorage.removeItem("analysisCache");
			}

			// Simulate processing time
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setResetSuccess(true);
			setSelectedOptions([]);
			setResetDialogOpen(false);
		} catch (error) {
			console.error("Reset failed:", error);
		} finally {
			setIsResetting(false);
		}
	};

	const quickResetActions = [
		{
			label: "Reset All Filters",
			description: "Clear all active filters",
			icon: <FilterIcon />,
			action: () => {
				setSelectedOptions(["user-filters"]);
				setResetDialogOpen(true);
			},
		},
		{
			label: "Clear Cache",
			description: "Remove cached data",
			icon: <StorageIcon />,
			action: () => {
				setSelectedOptions(["cached-data", "session-data"]);
				setResetDialogOpen(true);
			},
		},
		{
			label: "Factory Reset",
			description: "Reset everything to defaults",
			icon: <ResetIcon />,
			action: () => {
				setSelectedOptions(resetOptions.map((option) => option.id));
				setResetDialogOpen(true);
			},
		},
	];

	const getCategoryOptions = (category: "data" | "filters" | "settings") => {
		return resetOptions.filter((option) => option.category === category);
	};

	const isCategoryFullySelected = (
		category: "data" | "filters" | "settings",
	) => {
		const categoryOptions = getCategoryOptions(category);
		return categoryOptions.every((option) =>
			selectedOptions.includes(option.id),
		);
	};

	const getCategoryColor = (category: "data" | "filters" | "settings") => {
		switch (category) {
			case "data":
				return "#e3f2fd";
			case "filters":
				return "#f3e5f5";
			case "settings":
				return "#e8f5e8";
			default:
				return "#f5f5f5";
		}
	};

	return (
		<Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
			{/* Header */}
			<Box sx={{ mb: 4 }}>
				<Typography
					variant="h4"
					component="h1"
					gutterBottom
					sx={{
						fontWeight: 700,
						background: "linear-gradient(45deg, #f44336, #ff9800)",
						backgroundClip: "text",
						WebkitBackgroundClip: "text",
						color: "transparent",
						mb: 1,
					}}>
					Reset Application Data
				</Typography>
				<Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
					Clear data, reset filters, and restore default settings
				</Typography>
			</Box>

			{/* Warning Alert */}
			<Alert severity="warning" sx={{ mb: 4 }}>
				<AlertTitle sx={{ fontWeight: 600 }}>
					<WarningIcon sx={{ mr: 1, verticalAlign: "middle" }} />
					Caution: Data Reset
				</AlertTitle>
				<Typography variant="body2">
					Resetting data will permanently remove cached information and
					preferences. This action cannot be undone. Please review your
					selections carefully.
				</Typography>
			</Alert>

			{/* Quick Actions */}
			<Card sx={{ mb: 4 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
						Quick Reset Actions
					</Typography>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
						{quickResetActions.map((action, index) => (
							<Card
								key={index}
								sx={{
									"flex": "1 1 250px",
									"minWidth": 250,
									"cursor": "pointer",
									"transition": "all 0.2s",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: 3,
									},
								}}
								onClick={action.action}>
								<CardContent sx={{ textAlign: "center", py: 3 }}>
									<Box sx={{ mb: 2, color: "primary.main" }}>
										{React.cloneElement(action.icon, { sx: { fontSize: 40 } })}
									</Box>
									<Typography
										variant="h6"
										gutterBottom
										sx={{ fontWeight: 600 }}>
										{action.label}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{action.description}
									</Typography>
								</CardContent>
							</Card>
						))}
					</Box>
				</CardContent>
			</Card>

			{/* Detailed Options */}
			<Card sx={{ mb: 4 }}>
				<CardContent>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 3,
						}}>
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							Custom Reset Options
						</Typography>
						<Button
							variant="outlined"
							onClick={handleSelectAll}
							startIcon={
								selectedOptions.length === resetOptions.length ? (
									<ClearIcon />
								) : (
									<RefreshIcon />
								)
							}>
							{selectedOptions.length === resetOptions.length
								? "Deselect All"
								: "Select All"}
						</Button>
					</Box>

					{/* Category Filters */}
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
						{(["data", "filters", "settings"] as const).map((category) => (
							<Chip
								key={category}
								label={`${
									category.charAt(0).toUpperCase() + category.slice(1)
								} (${getCategoryOptions(category).length})`}
								onClick={() => handleSelectByCategory(category)}
								variant={
									isCategoryFullySelected(category) ? "filled" : "outlined"
								}
								sx={{
									backgroundColor: isCategoryFullySelected(category)
										? getCategoryColor(category)
										: "transparent",
									textTransform: "capitalize",
								}}
							/>
						))}
					</Box>

					<FormGroup>
						{resetOptions.map((option) => (
							<Box key={option.id} sx={{ mb: 1 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={selectedOptions.includes(option.id)}
											onChange={() => handleOptionToggle(option.id)}
											color="primary"
										/>
									}
									label={
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 2,
												py: 1,
											}}>
											{option.icon}
											<Box>
												<Typography variant="body1" sx={{ fontWeight: 600 }}>
													{option.label}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{option.description}
												</Typography>
											</Box>
											<Chip
												label={option.category}
												size="small"
												sx={{
													backgroundColor: getCategoryColor(option.category),
													textTransform: "capitalize",
													ml: "auto",
												}}
											/>
										</Box>
									}
									sx={{
										"m": 0,
										"width": "100%",
										"& .MuiFormControlLabel-label": {
											width: "100%",
										},
									}}
								/>
								{option.id !== resetOptions[resetOptions.length - 1].id && (
									<Divider sx={{ my: 1 }} />
								)}
							</Box>
						))}
					</FormGroup>

					<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
						<Button
							variant="contained"
							color="warning"
							size="large"
							startIcon={<ResetIcon />}
							onClick={() => setResetDialogOpen(true)}
							disabled={selectedOptions.length === 0}
							sx={{
								px: 4,
								py: 1.5,
								fontWeight: 600,
							}}>
							Reset Selected Items ({selectedOptions.length})
						</Button>
					</Box>
				</CardContent>
			</Card>

			{/* Current Status */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
						Current Application Status
					</Typography>
					<List dense>
						<ListItem>
							<ListItemIcon>
								<StorageIcon color="primary" />
							</ListItemIcon>
							<ListItemText
								primary="Cache Size"
								secondary="Approximately 2.3 MB of cached data"
							/>
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<FilterIcon color="primary" />
							</ListItemIcon>
							<ListItemText
								primary="Active Filters"
								secondary="3 filters currently applied across different views"
							/>
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<SettingsIcon color="primary" />
							</ListItemIcon>
							<ListItemText
								primary="Custom Preferences"
								secondary="User preferences saved for 8 different components"
							/>
						</ListItem>
					</List>
				</CardContent>
			</Card>

			{/* Confirmation Dialog */}
			<Dialog
				open={resetDialogOpen}
				onClose={() => !isResetting && setResetDialogOpen(false)}
				maxWidth="sm"
				fullWidth>
				<DialogTitle sx={{ fontWeight: 600 }}>
					Confirm Reset Operation
				</DialogTitle>
				<DialogContent>
					<Alert severity="warning" sx={{ mb: 2 }}>
						You are about to reset the following items:
					</Alert>
					<List dense>
						{selectedOptions.map((optionId) => {
							const option = resetOptions.find((opt) => opt.id === optionId);
							return option ? (
								<ListItem key={optionId}>
									<ListItemIcon>{option.icon}</ListItemIcon>
									<ListItemText
										primary={option.label}
										secondary={option.description}
									/>
								</ListItem>
							) : null;
						})}
					</List>
					<Typography variant="body2" sx={{ mt: 2, fontStyle: "italic" }}>
						This action cannot be undone. Are you sure you want to proceed?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 3 }}>
					<Button
						onClick={() => setResetDialogOpen(false)}
						disabled={isResetting}>
						Cancel
					</Button>
					<Button
						onClick={handleResetConfirm}
						variant="contained"
						color="warning"
						disabled={isResetting}
						startIcon={isResetting ? <RefreshIcon /> : <ResetIcon />}>
						{isResetting ? "Resetting..." : "Confirm Reset"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Success Snackbar */}
			<Snackbar
				open={resetSuccess}
				autoHideDuration={4000}
				onClose={() => setResetSuccess(false)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
				<Alert
					onClose={() => setResetSuccess(false)}
					severity="success"
					sx={{ width: "100%" }}>
					Reset operation completed successfully!
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default ResetPage;
