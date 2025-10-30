package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comparison")
@CrossOrigin(origins = "*")
@SuppressWarnings("unchecked")
public class PartyComparisonController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * GUI-15 & GUI-22: Compare states by party control
     * GET /api/comparison/party-states
     * 
     * Returns metrics comparing Republican-controlled vs Democratic-controlled
     * states:
     * - Registration rates
     * - Voter turnout
     * - Mail ballot usage
     * - Drop box usage
     * - Felony voting policies
     */
    @GetMapping("/party-states")
    public Map<String, Object> getPartyComparison() {

        // Define party control by state (2024 data - governor/legislature control)
        Map<String, String> statePartyControl = getStatePartyControl();

        // Get all EAVS data
        List<Map<String, Object>> eavsData = (List<Map<String, Object>>) (List<?>) mongoTemplate.findAll(Map.class, "eavsData");

        // Get felony voting policies
        List<Map<String, Object>> felonyData = (List<Map<String, Object>>) (List<?>) mongoTemplate.findAll(Map.class, "felonyVotingData");
        Map<String, Map<String, Object>> felonyByAbbr = felonyData.stream()
                .collect(Collectors.toMap(
                        f -> (String) f.get("stateAbbr"),
                        f -> f,
                        (a, b) -> a));

        // Create state name to abbreviation mapping
        Map<String, String> stateToAbbr = getStateAbbreviations();

        // Group states by party
        Map<String, List<Map<String, Object>>> statesByParty = new HashMap<>();
        statesByParty.put("Republican", new ArrayList<>());
        statesByParty.put("Democratic", new ArrayList<>());
        statesByParty.put("Split", new ArrayList<>());

        // Process each state
        for (Map<String, Object> eavs : eavsData) {
            String state = (String) eavs.get("stateFull");
            String party = statePartyControl.getOrDefault(state, "Split");

            Map<String, Object> stateData = new HashMap<>();
            stateData.put("state", state);
            stateData.put("party", party);

            // Calculate registration metrics
            Object f1aObj = eavs.get("F1a");
            Object f1bObj = eavs.get("F1b");
            Object f1dObj = eavs.get("F1d");
            Object f1fObj = eavs.get("F1f");
            Object a1bObj = eavs.get("A1b"); // CVAP

            long totalRegistered = safeLong(f1aObj) + safeLong(f1bObj) + safeLong(f1dObj) + safeLong(f1fObj);
            long cvap = safeLong(a1bObj);

            double registrationRate = cvap > 0 ? (totalRegistered * 100.0 / cvap) : 0;
            stateData.put("registrationRate", Math.round(registrationRate * 10) / 10.0);
            stateData.put("totalRegistered", totalRegistered);

            // Calculate turnout (B1 equivalent - total participated)
            Object b1Obj = eavs.get("B1");
            long totalParticipated = safeLong(b1Obj);

            // If B1 is 0 or null, calculate from F1 fields
            if (totalParticipated == 0) {
                totalParticipated = safeLong(f1aObj) + safeLong(f1bObj) + safeLong(f1dObj) + safeLong(f1fObj);
            }

            double turnout = totalRegistered > 0 ? (totalParticipated * 100.0 / totalRegistered) : 0;
            stateData.put("turnout", Math.round(turnout * 10) / 10.0);

            // Mail ballot usage (C1a-d)
            long mailBallots = safeLong(eavs.get("C1a")) + safeLong(eavs.get("C1b")) +
                    safeLong(eavs.get("C1c")) + safeLong(eavs.get("C1d"));
            double mailBallotRate = totalParticipated > 0 ? (mailBallots * 100.0 / totalParticipated) : 0;
            stateData.put("mailBallotRate", Math.round(mailBallotRate * 10) / 10.0);

            // Drop box usage (C11a)
            long dropBoxVotes = safeLong(eavs.get("C11a"));
            double dropBoxRate = totalParticipated > 0 ? (dropBoxVotes * 100.0 / totalParticipated) : 0;
            stateData.put("dropBoxRate", Math.round(dropBoxRate * 10) / 10.0);

            // Add felony policy
            String stateAbbr = stateToAbbr.get(state);
            Map<String, Object> felony = stateAbbr != null ? felonyByAbbr.get(stateAbbr) : null;
            if (felony != null) {
                String policy = (String) felony.get("felonyVotingPolicy");
                stateData.put("felonyPolicy", policy);
                stateData.put("felonyRestrictive", isRestrictive(policy));
            } else {
                stateData.put("felonyPolicy", "Unknown");
                stateData.put("felonyRestrictive", false);
            }

            statesByParty.get(party).add(stateData);
        }

        // Calculate aggregates by party
        Map<String, Object> result = new HashMap<>();
        result.put("republican", calculateAggregates(statesByParty.get("Republican")));
        result.put("democratic", calculateAggregates(statesByParty.get("Democratic")));
        result.put("split", calculateAggregates(statesByParty.get("Split")));
        result.put("stateDetails", statesByParty);

        return result;
    }

    /**
     * Calculate aggregate metrics for a group of states
     */
    private Map<String, Object> calculateAggregates(List<Map<String, Object>> states) {
        Map<String, Object> agg = new HashMap<>();

        if (states.isEmpty()) {
            agg.put("count", 0);
            agg.put("avgRegistrationRate", 0.0);
            agg.put("avgTurnout", 0.0);
            agg.put("avgMailBallotRate", 0.0);
            agg.put("avgDropBoxRate", 0.0);
            agg.put("felonyRestrictiveCount", 0);
            agg.put("felonyPermissiveCount", 0);
            return agg;
        }

        double sumRegistration = 0;
        double sumTurnout = 0;
        double sumMailBallot = 0;
        double sumDropBox = 0;
        int restrictiveCount = 0;
        int permissiveCount = 0;

        for (Map<String, Object> state : states) {
            sumRegistration += (Double) state.getOrDefault("registrationRate", 0.0);
            sumTurnout += (Double) state.getOrDefault("turnout", 0.0);
            sumMailBallot += (Double) state.getOrDefault("mailBallotRate", 0.0);
            sumDropBox += (Double) state.getOrDefault("dropBoxRate", 0.0);

            Boolean restrictive = (Boolean) state.get("felonyRestrictive");
            if (restrictive != null && restrictive) {
                restrictiveCount++;
            } else {
                permissiveCount++;
            }
        }

        int count = states.size();
        agg.put("count", count);
        agg.put("avgRegistrationRate", Math.round((sumRegistration / count) * 10) / 10.0);
        agg.put("avgTurnout", Math.round((sumTurnout / count) * 10) / 10.0);
        agg.put("avgMailBallotRate", Math.round((sumMailBallot / count) * 10) / 10.0);
        agg.put("avgDropBoxRate", Math.round((sumDropBox / count) * 10) / 10.0);
        agg.put("felonyRestrictiveCount", restrictiveCount);
        agg.put("felonyPermissiveCount", permissiveCount);

        return agg;
    }

    /**
     * Determine if felony policy is restrictive
     */
    private boolean isRestrictive(String category) {
        if (category == null)
            return false;
        String lower = category.toLowerCase();
        return lower.contains("permanent") || lower.contains("parole") ||
                lower.contains("probation") || lower.contains("incarceration");
    }

    /**
     * Define party control by state (2024 data)
     * Based on governor + legislature control
     */
    private Map<String, String> getStatePartyControl() {
        Map<String, String> control = new HashMap<>();

        // Republican-controlled states (2024)
        String[] republican = {
                "Alabama", "Alaska", "Arkansas", "Florida", "Georgia", "Idaho", "Indiana",
                "Iowa", "Mississippi", "Missouri", "Montana", "Nebraska", "New Hampshire",
                "North Dakota", "Ohio", "Oklahoma", "South Carolina", "South Dakota",
                "Tennessee", "Texas", "Utah", "West Virginia", "Wyoming"
        };

        // Democratic-controlled states (2024)
        String[] democratic = {
                "California", "Colorado", "Connecticut", "Delaware", "Hawaii", "Illinois",
                "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Nevada",
                "New Jersey", "New Mexico", "New York", "Oregon", "Rhode Island",
                "Vermont", "Washington"
        };

        // Split control (mixed governor/legislature or swing states)
        String[] split = {
                "Arizona", "Kansas", "Kentucky", "Louisiana", "North Carolina",
                "Pennsylvania", "Virginia", "Wisconsin"
        };

        for (String state : republican) {
            control.put(state.toUpperCase(), "Republican");
        }
        for (String state : democratic) {
            control.put(state.toUpperCase(), "Democratic");
        }
        for (String state : split) {
            control.put(state.toUpperCase(), "Split");
        }

        return control;
    }

    /**
     * Get state name to abbreviation mapping
     */
    private Map<String, String> getStateAbbreviations() {
        Map<String, String> map = new HashMap<>();
        map.put("ALABAMA", "AL");
        map.put("ALASKA", "AK");
        map.put("ARIZONA", "AZ");
        map.put("ARKANSAS", "AR");
        map.put("CALIFORNIA", "CA");
        map.put("COLORADO", "CO");
        map.put("CONNECTICUT", "CT");
        map.put("DELAWARE", "DE");
        map.put("FLORIDA", "FL");
        map.put("GEORGIA", "GA");
        map.put("HAWAII", "HI");
        map.put("IDAHO", "ID");
        map.put("ILLINOIS", "IL");
        map.put("INDIANA", "IN");
        map.put("IOWA", "IA");
        map.put("KANSAS", "KS");
        map.put("KENTUCKY", "KY");
        map.put("LOUISIANA", "LA");
        map.put("MAINE", "ME");
        map.put("MARYLAND", "MD");
        map.put("MASSACHUSETTS", "MA");
        map.put("MICHIGAN", "MI");
        map.put("MINNESOTA", "MN");
        map.put("MISSISSIPPI", "MS");
        map.put("MISSOURI", "MO");
        map.put("MONTANA", "MT");
        map.put("NEBRASKA", "NE");
        map.put("NEVADA", "NV");
        map.put("NEW HAMPSHIRE", "NH");
        map.put("NEW JERSEY", "NJ");
        map.put("NEW MEXICO", "NM");
        map.put("NEW YORK", "NY");
        map.put("NORTH CAROLINA", "NC");
        map.put("NORTH DAKOTA", "ND");
        map.put("OHIO", "OH");
        map.put("OKLAHOMA", "OK");
        map.put("OREGON", "OR");
        map.put("PENNSYLVANIA", "PA");
        map.put("RHODE ISLAND", "RI");
        map.put("SOUTH CAROLINA", "SC");
        map.put("SOUTH DAKOTA", "SD");
        map.put("TENNESSEE", "TN");
        map.put("TEXAS", "TX");
        map.put("UTAH", "UT");
        map.put("VERMONT", "VT");
        map.put("VIRGINIA", "VA");
        map.put("WASHINGTON", "WA");
        map.put("WEST VIRGINIA", "WV");
        map.put("WISCONSIN", "WI");
        map.put("WYOMING", "WY");
        return map;
    }

    /**
     * Safely convert Object to long
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
}
