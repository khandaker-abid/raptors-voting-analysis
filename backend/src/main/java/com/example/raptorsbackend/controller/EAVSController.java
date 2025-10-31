package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for EAVS (Election Administration and Voting Survey) data
 * Handles GUI use cases: GUI-7, GUI-8, GUI-9
 */
@RestController
@RequestMapping("/api/eavs")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class EAVSController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * GUI-7: Get active voters data by state
     * GET /api/eavs/{state}/active-voters?year=2024
     */
    @GetMapping("/{state}/active-voters")
    public List<Map<String, Object>> getActiveVoters(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        Query query = new Query();
        // Case-insensitive state matching
        query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("activeVoters", doc.get("A1b")); // Active voters
            row.put("inactiveVoters", doc.get("A1c")); // Inactive voters
            row.put("totalVoters", doc.get("A1a")); // Total registered

            // Calculate percentage
            Object total = doc.get("A1a");
            Object active = doc.get("A1b");
            if (total != null && active != null) {
                double totalVal = ((Number) total).doubleValue();
                double activeVal = ((Number) active).doubleValue();
                if (totalVal > 0) {
                    row.put("activePercentage", Math.round((activeVal / totalVal) * 100 * 10) / 10.0);
                }
            }

            return row;
        }).toList();
    }

    /**
     * GUI-3/4/5: Get provisional ballots by state
     * GET /api/eavs/{state}/provisional-ballots?year=2024
     */
    @GetMapping("/{state}/provisional-ballots")
    public List<Map<String, Object>> getProvisionalBallots(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        Query query = new Query();
        // Case-insensitive state matching
        query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("totalProvisionalBallots", doc.getOrDefault("E1a", 0));

            // Reasons for provisional ballots (E2a-E2i)
            row.put("E2a_NotOnList", doc.getOrDefault("E2a", 0));
            row.put("E2b_LackedID", doc.getOrDefault("E2b", 0));
            row.put("E2c_OfficialChallenged", doc.getOrDefault("E2c", 0));
            row.put("E2d_PersonChallenged", doc.getOrDefault("E2d", 0));
            row.put("E2e_NotResident", doc.getOrDefault("E2e", 0));
            row.put("E2f_RegNotUpdated", doc.getOrDefault("E2f", 0));
            row.put("E2g_NoMailBallot", doc.getOrDefault("E2g", 0));
            row.put("E2h_ExtendedHours", doc.getOrDefault("E2h", 0));
            row.put("E2i_UsedSDR", doc.getOrDefault("E2i", 0));

            return row;
        }).toList();
    }

    /**
     * GUI-8: Get pollbook deletions by state
     * GET /api/eavs/{state}/pollbook-deletions?year=2024
     */
    @GetMapping("/{state}/pollbook-deletions")
    public List<Map<String, Object>> getPollbookDeletions(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        // Try requested year first, then fall back to 2020, then 2016
        List<Map<String, Object>> results = null;
        int actualYear = year;

        for (int tryYear : Arrays.asList(year, 2020, 2016)) {
            Query query = new Query();
            // Case-insensitive state matching
            query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(tryYear));

            List<Map<String, Object>> tempResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query,
                    Map.class, "eavsData");

            if (!tempResults.isEmpty()) {
                results = tempResults;
                actualYear = tryYear;
                break;
            }
        }

        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        final int finalYear = actualYear;
        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("dataYear", finalYear); // Include the actual year of the data

            // Deletion categories A12b-A12h
            row.put("A12b_Death", doc.getOrDefault("A12b", 0));
            row.put("A12c_Moved", doc.getOrDefault("A12c", 0));
            row.put("A12d_Felon", doc.getOrDefault("A12d", 0));
            row.put("A12e_MentalIncap", doc.getOrDefault("A12e", 0));
            row.put("A12f_Requested", doc.getOrDefault("A12f", 0));
            row.put("A12g_FailedToVote", doc.getOrDefault("A12g", 0));
            row.put("A12h_Other", doc.getOrDefault("A12h", 0));

            // Calculate total deletions
            int total = 0;
            for (String field : Arrays.asList("A12b", "A12c", "A12d", "A12e", "A12f", "A12g", "A12h")) {
                Object val = doc.get(field);
                if (val != null) {
                    total += ((Number) val).intValue();
                }
            }
            row.put("total", total);

            // Calculate deletion percentage (total deletions / total registered)
            // Always include deletionPercentage field, even if 0
            double deletionPercentage = 0.0;
            Object totalRegistered = doc.get("A1a");
            if (totalRegistered != null && total > 0) {
                double registered = ((Number) totalRegistered).doubleValue();
                if (registered > 0) {
                    deletionPercentage = Math.round((total / registered) * 100 * 10) / 10.0;
                }
            }
            row.put("deletionPercentage", deletionPercentage);

            return row;
        }).toList();
    }

    /**
     * GUI-9: Get mail ballot rejections by state
     * GET /api/eavs/{state}/mail-rejections?year=2024
     */
    @GetMapping("/{state}/mail-rejections")
    public List<Map<String, Object>> getMailRejections(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        // Try requested year first, then fall back to 2020, then 2016
        List<Map<String, Object>> results = null;
        int actualYear = year;

        for (int tryYear : Arrays.asList(year, 2020, 2016)) {
            Query query = new Query();
            // Case-insensitive state matching
            query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(tryYear));

            List<Map<String, Object>> tempResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query,
                    Map.class, "eavsData");

            if (!tempResults.isEmpty()) {
                results = tempResults;
                actualYear = tryYear;
                break;
            }
        }

        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        final int finalYear = actualYear;
        List<Map<String, Object>> processedResults = results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("dataYear", finalYear);

            // Helper to get value or 0 if null/missing
            java.util.function.Function<String, Integer> getIntOrZero = field -> {
                Object val = doc.get(field);
                return (val != null) ? ((Number) val).intValue() : 0;
            };

            // Rejection categories
            row.put("C9b_NoSignature", getIntOrZero.apply("C9b"));
            row.put("C9c_SigMismatch", getIntOrZero.apply("C9c"));
            row.put("C9d_ReceivedLate", getIntOrZero.apply("C9d"));
            row.put("C9e_MissingInfo", getIntOrZero.apply("C9e"));
            row.put("C9f_NotRegistered", getIntOrZero.apply("C9f"));
            row.put("C9g_WrongEnvelope", getIntOrZero.apply("C9g"));
            row.put("C9h_Other", getIntOrZero.apply("C9h"));

            int total = getIntOrZero.apply("C9a");
            if (total == 0) {
                for (String field : Arrays.asList("C9b", "C9c", "C9d", "C9e", "C9f", "C9g", "C9h")) {
                    total += getIntOrZero.apply(field);
                }
            }
            row.put("total", total);

            // Store raw values for aggregation
            Object castBallots = doc.get("C3a");
            row.put("_castBallots", castBallots != null ? ((Number) castBallots).doubleValue() : 0.0);

            // Calculate rejection percentage
            double rejectionPercentage = 0.0;
            Object transmittedBallots = doc.get("C1a");
            double denominator = 0.0;

            if (castBallots != null) {
                denominator = ((Number) castBallots).doubleValue() + total;
            } else if (transmittedBallots != null) {
                denominator = ((Number) transmittedBallots).doubleValue();
            }

            if (denominator > 0 && total > 0) {
                rejectionPercentage = Math.round((total / denominator) * 100 * 10) / 10.0;
            }

            row.put("rejectionPercentage", rejectionPercentage);
            return row;
        }).toList();

        // Special handling for Rhode Island: aggregate towns to counties
        if (state.equalsIgnoreCase("RHODE ISLAND")) {
            return aggregateRhodeIslandToCounties(processedResults, finalYear);
        }

        return processedResults;
    }

    /**
     * Aggregate Rhode Island town-level data to county-level for choropleth display
     */
    private List<Map<String, Object>> aggregateRhodeIslandToCounties(List<Map<String, Object>> townData, int year) {
        // Rhode Island town-to-county mapping
        Map<String, String> townToCounty = new HashMap<>();
        // Bristol County
        townToCounty.put("BARRINGTON TOWN", "BRISTOL COUNTY");
        townToCounty.put("BRISTOL TOWN", "BRISTOL COUNTY");
        townToCounty.put("WARREN TOWN", "BRISTOL COUNTY");

        // Providence County
        townToCounty.put("BURRILLVILLE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("CENTRAL FALLS CITY", "PROVIDENCE COUNTY");
        townToCounty.put("CRANSTON CITY", "PROVIDENCE COUNTY");
        townToCounty.put("CUMBERLAND TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("EAST PROVIDENCE CITY", "PROVIDENCE COUNTY");
        townToCounty.put("FOSTER TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("GLOCESTER TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("JOHNSTON TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("LINCOLN TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("NORTH PROVIDENCE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("NORTH SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("PAWTUCKET CITY", "PROVIDENCE COUNTY");
        townToCounty.put("PROVIDENCE CITY", "PROVIDENCE COUNTY");
        townToCounty.put("SCITUATE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("WOONSOCKET CITY", "PROVIDENCE COUNTY");

        // Kent County
        townToCounty.put("COVENTRY TOWN", "KENT COUNTY");
        townToCounty.put("EAST GREENWICH TOWN", "KENT COUNTY");
        townToCounty.put("WARWICK CITY", "KENT COUNTY");
        townToCounty.put("WEST GREENWICH TOWN", "KENT COUNTY");
        townToCounty.put("WEST WARWICK TOWN", "KENT COUNTY");

        // Newport County
        townToCounty.put("JAMESTOWN TOWN", "NEWPORT COUNTY");
        townToCounty.put("LITTLE COMPTON TOWN", "NEWPORT COUNTY");
        townToCounty.put("MIDDLETOWN TOWN", "NEWPORT COUNTY");
        townToCounty.put("NEWPORT CITY", "NEWPORT COUNTY");
        townToCounty.put("PORTSMOUTH TOWN", "NEWPORT COUNTY");
        townToCounty.put("TIVERTON TOWN", "NEWPORT COUNTY");

        // Washington County
        townToCounty.put("CHARLESTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("EXETER TOWN", "WASHINGTON COUNTY");
        townToCounty.put("HOPKINTON TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NARRAGANSETT TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NEW SHOREHAM TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NORTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("RICHMOND TOWN", "WASHINGTON COUNTY");
        townToCounty.put("SOUTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("WESTERLY TOWN", "WASHINGTON COUNTY");

        // Aggregate by county
        Map<String, Map<String, Object>> countyAggregates = new HashMap<>();

        for (Map<String, Object> town : townData) {
            String townName = (String) town.get("geographicUnit");
            String county = townToCounty.get(townName);

            if (county == null) {
                continue; // Skip unknown towns
            }

            Map<String, Object> countyData = countyAggregates.computeIfAbsent(county, k -> {
                Map<String, Object> newCounty = new HashMap<>();
                newCounty.put("geographicUnit", k);
                newCounty.put("dataYear", year);
                newCounty.put("C9b_NoSignature", 0);
                newCounty.put("C9c_SigMismatch", 0);
                newCounty.put("C9d_ReceivedLate", 0);
                newCounty.put("C9e_MissingInfo", 0);
                newCounty.put("C9f_NotRegistered", 0);
                newCounty.put("C9g_WrongEnvelope", 0);
                newCounty.put("C9h_Other", 0);
                newCounty.put("total", 0);
                newCounty.put("_castBallots", 0.0);
                return newCounty;
            });

            // Sum all rejection categories
            for (String field : Arrays.asList("C9b_NoSignature", "C9c_SigMismatch", "C9d_ReceivedLate",
                    "C9e_MissingInfo", "C9f_NotRegistered", "C9g_WrongEnvelope", "C9h_Other", "total")) {
                int currentValue = (int) countyData.get(field);
                int townValue = (int) town.get(field);
                countyData.put(field, currentValue + townValue);
            }

            // Sum cast ballots
            double currentCast = (double) countyData.get("_castBallots");
            double townCast = (double) town.get("_castBallots");
            countyData.put("_castBallots", currentCast + townCast);
        }

        // Calculate county-level rejection percentages
        List<Map<String, Object>> countyResults = new ArrayList<>();
        for (Map<String, Object> county : countyAggregates.values()) {
            int totalRejections = (int) county.get("total");
            double castBallots = (double) county.get("_castBallots");

            double rejectionPercentage = 0.0;
            if (castBallots > 0 && totalRejections > 0) {
                double denominator = castBallots + totalRejections;
                rejectionPercentage = Math.round((totalRejections / denominator) * 100 * 10) / 10.0;
            }

            county.put("rejectionPercentage", rejectionPercentage);
            county.remove("_castBallots"); // Remove internal field
            countyResults.add(county);
        }

        return countyResults;
    }

    /**
     * GUI-24: Get drop box voting bubble chart data
     * GET /api/eavs/dropbox-bubbles/{state}?year=2024
     * 
     * Returns data for bubble chart showing drop box voting vs. Republican vote
     * percentage
     * Each bubble represents one EAVS geographic unit
     */
    @GetMapping("/dropbox-bubbles/{state}")
    public List<Map<String, Object>> getDropboxBubbles(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        // Get EAVS data with case-insensitive matching
        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));
        List<Map<String, Object>> eavsResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(eavsQuery,
                Map.class, "eavsData");

        // Get election results for Republican/Democratic vote split
        // Note: electionResults uses stateAbbr (e.g., "AR") not full state name
        String stateAbbr = getStateAbbreviation(state.toUpperCase());
        Query electionQuery = new Query();
        electionQuery.addCriteria(Criteria.where("stateAbbr").is(stateAbbr).and("electionYear").is(year));
        List<Map<String, Object>> electionResults = (List<Map<String, Object>>) (List<?>) mongoTemplate
                .find(electionQuery, Map.class, "electionResults");

        // Create map for quick lookup by county
        // electionResults has "county" without " COUNTY" suffix, EAVS has
        // "jurisdictionName" with " COUNTY"
        Map<String, Map<String, Object>> electionByCounty = new HashMap<>();
        for (Map<String, Object> result : electionResults) {
            String county = (String) result.get("county");
            if (county != null) {
                // Store both with and without "COUNTY" suffix for matching
                String countyUpper = county.toUpperCase();
                electionByCounty.put(countyUpper, result);
                electionByCounty.put(countyUpper + " COUNTY", result);
            }
        }

        return eavsResults.stream().map(doc -> {
            Map<String, Object> bubble = new HashMap<>();
            String jurisdiction = (String) doc.get("jurisdictionName");
            bubble.put("geographicUnit", jurisdiction);

            // Calculate drop box percentage (C3a / total votes)
            Object c3aObj = doc.get("C3a"); // Drop box ballots counted
            Object f1aObj = doc.get("F1a"); // Total participation
            Object f1bObj = doc.get("F1b");
            Object f1dObj = doc.get("F1d");
            Object f1fObj = doc.get("F1f");

            long dropBoxVotes = safeLong(c3aObj);
            long totalVotes = safeLong(f1aObj) + safeLong(f1bObj) + safeLong(f1dObj) + safeLong(f1fObj);

            // If total votes is 0, try alternative calculation
            if (totalVotes == 0) {
                Object b1Obj = doc.get("B1");
                totalVotes = safeLong(b1Obj);
            }

            double dropBoxPct = totalVotes > 0 ? (dropBoxVotes * 100.0 / totalVotes) : 0;
            bubble.put("dropBoxPercentage", Math.round(dropBoxPct * 100) / 100.0);
            bubble.put("dropBoxVotes", dropBoxVotes);
            bubble.put("totalVotes", totalVotes);

            // Get Republican vote percentage from election results
            Map<String, Object> electionData = electionByCounty.get(jurisdiction.toUpperCase());
            if (electionData != null) {
                // Election results are stored in nested "results" object
                Map<String, Object> results = (Map<String, Object>) electionData.get("results");

                long repVotes = 0;
                long demVotes = 0;

                if (results != null) {
                    Map<String, Object> repData = (Map<String, Object>) results.get("Republican");
                    Map<String, Object> demData = (Map<String, Object>) results.get("Democratic");

                    if (repData != null) {
                        repVotes = safeLong(repData.get("votes"));
                    }
                    if (demData != null) {
                        demVotes = safeLong(demData.get("votes"));
                    }
                }

                long totalPartyVotes = repVotes + demVotes;

                if (totalPartyVotes > 0) {
                    double repPct = (repVotes * 100.0 / totalPartyVotes);
                    bubble.put("republicanPercentage", Math.round(repPct * 100) / 100.0);

                    // Determine majority party for color
                    bubble.put("majorityParty", repVotes > demVotes ? "Republican" : "Democratic");
                    bubble.put("color", repVotes > demVotes ? "red" : "blue");
                } else {
                    bubble.put("republicanPercentage", 0.0);
                    bubble.put("majorityParty", "Unknown");
                    bubble.put("color", "gray");
                }

                bubble.put("republicanVotes", repVotes);
                bubble.put("democraticVotes", demVotes);
            } else {
                // No election data found - mark as unknown
                bubble.put("republicanPercentage", 0.0);
                bubble.put("majorityParty", "Unknown");
                bubble.put("color", "gray");
                bubble.put("republicanVotes", 0);
                bubble.put("democraticVotes", 0);
            }

            return bubble;
        }).filter(bubble -> {
            // Only include bubbles with valid data
            return (Long) bubble.get("totalVotes") > 0;
        }).toList();
    }

    /**
     * Helper method to safely convert Object to long
     */
    private long safeLong(Object obj) {
        if (obj == null)
            return 0;
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        try {
            return Long.parseLong(obj.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Helper method to get state abbreviation from full state name
     */
    private String getStateAbbreviation(String stateName) {
        Map<String, String> stateAbbreviations = Map.of(
                "ALABAMA", "AL",
                "ARKANSAS", "AR",
                "MARYLAND", "MD",
                "RHODE ISLAND", "RI",
                "CALIFORNIA", "CA",
                "TEXAS", "TX",
                "NEW YORK", "NY",
                "FLORIDA", "FL");
        return stateAbbreviations.getOrDefault(stateName.toUpperCase(), stateName);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "eavs-controller");
    }
}
