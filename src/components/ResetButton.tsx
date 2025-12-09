import React from "react";
import { Button, Tooltip } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import RestartAltIcon from '@mui/icons-material/RestartAlt';

/**
 * Fixed position button to reset current page state.
 * On detail pages: Reloads page to reset filters and selections.
 * On home page: No action needed.
 */
const ResetButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    if (location.pathname === "/") {
      return;
    }

    if (location.pathname.startsWith("/state") ||
      location.pathname.startsWith("/voting-equipment") ||
      location.pathname.startsWith("/party-comparison") ||
      location.pathname.startsWith("/registration-comparison")) {
      window.location.reload();
    } else {
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
