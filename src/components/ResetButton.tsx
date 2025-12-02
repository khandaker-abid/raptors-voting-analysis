import React from "react";
import { Button, Tooltip } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * GUI-30: Reset Button
 * 
 * Fixed position button to reset/clear current page state:
 * - On detail pages: Reloads current page (resets filters, tabs, selections)
 * - On home/landing pages: Navigates to main landing page
 * - Always visible in bottom-right corner
 */
const ResetButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    // If on home page, do nothing (already at starting state)
    if (location.pathname === "/") {
      return;
    }

    // If on a detail/data page, reload to reset state
    // This clears all filters, selections, and resets to default tab
    if (location.pathname.startsWith("/state") ||
      location.pathname.startsWith("/voting-equipment") ||
      location.pathname.startsWith("/party-comparison") ||
      location.pathname.startsWith("/registration-comparison")) {
      window.location.reload();
    } else {
      // For other pages, navigate to home
      navigate("/");
    }
  };

  return (
    <Tooltip
      title={location.pathname === "/" ? "Already at starting page" : "Reset page to default state"}
      placement="bottom"
    >
      <Button
        variant="contained"
        color="error"
        onClick={handleReset}
        disabled={location.pathname === "/"}
        startIcon={<RestartAltIcon />}
        sx={{
          borderRadius: 2,
          px: 3,
          fontWeight: 600,
          textTransform: "none",
        }}
      >
        Reset
      </Button>
    </Tooltip>
  );
};

export default ResetButton;
