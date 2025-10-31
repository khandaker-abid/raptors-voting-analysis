import React from "react";
import { Button, Box, Tooltip } from "@mui/material";
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
      placement="top"
    >
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 180,
          zIndex: 1300, // stay on top
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={handleReset}
          disabled={location.pathname === "/"}
          startIcon={<RestartAltIcon />}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            }
          }}
        >
          Reset
        </Button>
      </Box>
    </Tooltip>
  );
};

export default ResetButton;
