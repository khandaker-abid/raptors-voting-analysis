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
        query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(year));

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
        query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(year));

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

        Query query = new Query();
        query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));

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
            Object totalRegistered = doc.get("A1a");
            if (totalRegistered != null && total > 0) {
                double registered = ((Number) totalRegistered).doubleValue();
                if (registered > 0) {
                    row.put("deletionPercentage", Math.round((total / registered) * 100 * 10) / 10.0);
                }
            }

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

        Query query = new Query();
        query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));

            // Rejection categories C9b-C9q
            row.put("C9b_NoSignature", doc.getOrDefault("C9b", 0));
            row.put("C9c_SigMismatch", doc.getOrDefault("C9c", 0));
            row.put("C9d_ReceivedLate", doc.getOrDefault("C9d", 0));
            row.put("C9e_MissingInfo", doc.getOrDefault("C9e", 0));
            row.put("C9f_NotRegistered", doc.getOrDefault("C9f", 0));
            row.put("C9g_WrongEnvelope", doc.getOrDefault("C9g", 0));
            row.put("C9h_Other", doc.getOrDefault("C9h", 0));

            // Calculate total rejections
            int total = 0;
            for (String field : Arrays.asList("C9b", "C9c", "C9d", "C9e", "C9f", "C9g", "C9h")) {
                Object val = doc.get(field);
                if (val != null) {
                    total += ((Number) val).intValue();
                }
            }
            row.put("total", total);

            // Calculate rejection percentage
            Object totalBallots = doc.get("C1a"); // Total mail ballots transmitted
            if (totalBallots != null && total > 0) {
                double ballots = ((Number) totalBallots).doubleValue();
                if (ballots > 0) {
                    row.put("rejectionPercentage", Math.round((total / ballots) * 100 * 10) / 10.0);
                }
            }

            return row;
        }).toList();
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

        // Get EAVS data
        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("stateFull").is(state).and("year").is(year));
        List<Map<String, Object>> eavsResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(eavsQuery,
                Map.class, "eavsData");

        // Get election results for Republican/Democratic vote split
        // Note: electionResults uses stateAbbr (e.g., "AR") not full state name
        String stateAbbr = getStateAbbreviation(state);
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
