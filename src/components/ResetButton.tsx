import React from "react";
import { Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ResetButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1300, // stay on top
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={() => navigate("/")}
        sx={{ borderRadius: 3, px: 3, py: 1 }}
      >
        Reset Page
      </Button>
    </Box>
  );
};

export default ResetButton;
