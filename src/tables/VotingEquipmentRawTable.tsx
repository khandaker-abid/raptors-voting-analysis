import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Stack,
    TablePagination,
    Chip,
} from "@mui/material";
import { fetchEquipmentRaw, type EquipmentRawResponse } from "../data/api";

const DEFAULT_YEAR = 2024;

const VotingEquipmentRawTable: React.FC = () => {
    const [stateAbbr, setStateAbbr] = useState<string>("");
    const [equipmentType, setEquipmentType] = useState<string>("");
    const [year, setYear] = useState<number>(DEFAULT_YEAR);

    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(200);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [resp, setResp] = useState<EquipmentRawResponse | null>(null);

    const filtersKey = useMemo(() => {
        return JSON.stringify({ stateAbbr, equipmentType, year });
    }, [stateAbbr, equipmentType, year]);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const r = await fetchEquipmentRaw({
                    stateAbbr: stateAbbr || undefined,
                    year,
                    equipmentType: equipmentType || undefined,
                    page,
                    pageSize: rowsPerPage,
                });
                if (alive) setResp(r);
            } catch (e: any) {
                if (alive) setError(e?.message || "Failed to load raw equipment data");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [page, rowsPerPage, filtersKey]);

    const items = resp?.items ?? [];
    const total = resp?.total ?? 0;

    return (
        <Paper sx={{ p: 3, width: "min(1400px, 98vw)" }}>
            <Box mb={2}>
                <Typography variant="h4" align="center" fontWeight={600}>
                    VerifiedVoting Raw Equipment Rows
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                    This is a debug/validation view that shows the raw jurisdiction-level rows imported from the VerifiedVoting CSVs
                    (Prepro-6b) in MongoDB collection <code>votingEquipmentData</code>.
                </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                    label="State Abbr (optional)"
                    value={stateAbbr}
                    onChange={(e) => {
                        setStateAbbr(e.target.value.toUpperCase());
                        setPage(0);
                    }}
                    helperText="Example: AR, MD, RI"
                    size="small"
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="equipment-type-label">Equipment Type</InputLabel>
                    <Select
                        labelId="equipment-type-label"
                        label="Equipment Type"
                        value={equipmentType}
                        onChange={(e) => {
                            setEquipmentType(String(e.target.value));
                            setPage(0);
                        }}
                    >
                        <MenuItem value="">(any)</MenuItem>
                        <MenuItem value="standard">standard</MenuItem>
                        <MenuItem value="accessible">accessible</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => {
                        setYear(Number(e.target.value || DEFAULT_YEAR));
                        setPage(0);
                    }}
                    size="small"
                    sx={{ width: 120 }}
                />

                <Button
                    variant="outlined"
                    onClick={() => {
                        setStateAbbr("");
                        setEquipmentType("");
                        setYear(DEFAULT_YEAR);
                        setPage(0);
                    }}
                >
                    Reset
                </Button>

                <Box sx={{ flex: 1 }} />
                <Chip
                    label={loading ? "Loading…" : `Rows: ${items.length} / Total: ${total}`}
                    color={loading ? "default" : "primary"}
                    variant="outlined"
                />
            </Stack>

            {error ? (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            ) : null}

            <TableContainer sx={{ maxHeight: 650 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>State</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Year</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Jurisdiction</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Marking Method</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Tabulation Method</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Source</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((row: any, idx: number) => (
                            <TableRow key={row?._id?.toString?.() ?? `${page}-${idx}`}>
                                <TableCell>{row.stateAbbr ?? ""}</TableCell>
                                <TableCell>{row.year ?? ""}</TableCell>
                                <TableCell>{row.equipmentType ?? ""}</TableCell>
                                <TableCell sx={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {row.jurisdiction ?? ""}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {row.markingMethod ?? ""}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {row.tabulationMethod ?? ""}
                                </TableCell>
                                <TableCell>{row.dataSource ?? ""}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[50, 100, 200, 500, 1000, 2000]}
            />
        </Paper>
    );
};

export default VotingEquipmentRawTable;
