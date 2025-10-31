import React from "react";
import { Box, Card, Typography, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface StateInfo {
    name: string;
    abbreviation: string;
    description: string;
}

const stateData: StateInfo[] = [
    {
        name: "Arkansas",
        abbreviation: "AR",
        description: "Republican-dominated, opt-in voter registration state",
    },
    {
        name: "Maryland",
        abbreviation: "MD",
        description: "Democratic-dominated, opt-out voter registration state",
    },
    {
        name: "Rhode Island",
        abbreviation: "RI",
        description: "Democratic-dominated, opt-out voter registration state",
    },
];

const QuickAccessWidget: React.FC = () => {
    const navigate = useNavigate();

    const handleStateClick = (stateName: string) => {
        navigate(`/state/${encodeURIComponent(stateName)}`);
    };

    return (
        <Box
            sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pointerEvents: "none",
            }}
        >
            {/* State Cards */}
            {stateData.map((state) => (
                <Tooltip
                    key={state.name}
                    title={
                        <Box sx={{ padding: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "#ffffff" }}>
                                {state.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#ffffff" }}>
                                {state.description}
                            </Typography>
                        </Box>
                    }
                    placement="left"
                    arrow
                    componentsProps={{
                        tooltip: {
                            sx: {
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                color: "#ffffff",
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                                borderRadius: "4px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            },
                        },
                        arrow: {
                            sx: {
                                color: "rgba(0, 0, 0, 0.8)",
                            },
                        },
                    }}
                >
                    <Card
                        onClick={() => handleStateClick(state.name)}
                        sx={{
                            cursor: "pointer",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            borderRadius: 2,
                            padding: 1.5,
                            border: "2px solid #000000",
                            transition: "all 0.3s ease",
                            pointerEvents: "auto",
                            "&:hover": {
                                transform: "translateX(-8px) scale(1.05)",
                                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.3)",
                                backgroundColor: "rgba(0, 0, 0, 0.05)",
                                borderColor: "#000000",
                            },
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                className="state-abbrev"
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: "#000000",
                                    lineHeight: 1,
                                    fontSize: "1.1rem",
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {state.abbreviation}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "rgba(0, 0, 0, 0.6)",
                                    fontSize: "0.7rem",
                                    lineHeight: 1.2,
                                }}
                            >
                                {state.name}
                            </Typography>
                        </Box>
                    </Card>
                </Tooltip>
            ))}
        </Box>
    );
};

export default QuickAccessWidget;
