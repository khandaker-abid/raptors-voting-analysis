package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comparison")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class PartyComparisonController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/party-states")
    @Cacheable("partyComparison")
    public Map<String, Object> getPartyComparison() {

        Map<String, String> statePartyControl = getStatePartyControl();

        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("year").is(2024));
        List<Map<String, Object>> eavsData = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(eavsQuery,
                Map.class, "eavsData");

        List<Map<String, Object>> felonyData = (List<Map<String, Object>>) (List<?>) mongoTemplate.findAll(Map.class,
                "felonyVotingData");
        Map<String, Map<String, Object>> felonyByAbbr = felonyData.stream()
                .collect(Collectors.toMap(
                        f -> (String) f.get("stateAbbr"),
                        f -> f,
                        (a, b) -> a));

        Map<String, String> stateToAbbr = getStateAbbreviations();

        Map<String, List<Map<String, Object>>> countiesByState = new HashMap<>();
        for (Map<String, Object> eavs : eavsData) {
            String state = (String) eavs.get("stateFull");
            if (state != null) {
                countiesByState.computeIfAbsent(state, k -> new ArrayList<>()).add(eavs);
            }
        }

        Map<String, List<Map<String, Object>>> statesByParty = new HashMap<>();
        statesByParty.put("Republican", new ArrayList<>());
        statesByParty.put("Democratic", new ArrayList<>());
        statesByParty.put("Split", new ArrayList<>());

        for (Map.Entry<String, List<Map<String, Object>>> entry : countiesByState.entrySet()) {
            String state = entry.getKey();
            List<Map<String, Object>> counties = entry.getValue();
            String party = statePartyControl.getOrDefault(state, "Split");

            long totalRegistered = 0;
            long totalActive = 0;
            long totalVotesCast = 0;
            long totalMailBallots = 0;
            long totalDropBoxVotes = 0;

            for (Map<String, Object> county : counties) {
                totalRegistered += safeLong(county.get("A1a")); // Total registered
                totalActive += safeLong(county.get("A1b")); // Active voters (not CVAP)
                // F1a is total votes cast - don't add F1b/F1d/F1f which are subcategories
                totalVotesCast += safeLong(county.get("F1a"));
                totalMailBallots += safeLong(county.get("F1d")); // Mail ballots
                totalDropBoxVotes += safeLong(county.get("F1f")); // Early in-person / drop box
            }

            Map<String, Object> stateData = new HashMap<>();
            stateData.put("state", toTitleCase(state));
            stateData.put("party", party);

            // Registration rate: Active / Total Registered (percentage of active voters)
            double registrationRate = totalRegistered > 0 ? (totalActive * 100.0 / totalRegistered) : 0;
            stateData.put("registrationRate", Math.round(registrationRate * 10) / 10.0);

            // Turnout: Votes cast / Registered voters
            double turnout = totalRegistered > 0 ? (totalVotesCast * 100.0 / totalRegistered) : 0;
            stateData.put("turnout", Math.round(turnout * 10) / 10.0);

            double mailBallotRate = totalVotesCast > 0 ? (totalMailBallots * 100.0 / totalVotesCast) : 0;
            stateData.put("mailBallotRate", Math.round(mailBallotRate * 10) / 10.0);

            double dropBoxRate = totalVotesCast > 0 ? (totalDropBoxVotes * 100.0 / totalVotesCast) : 0;
            stateData.put("dropBoxRate", Math.round(dropBoxRate * 10) / 10.0);

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

        Map<String, Object> result = new HashMap<>();
        result.put("republican", calculateAggregates(statesByParty.get("Republican")));
        result.put("democratic", calculateAggregates(statesByParty.get("Democratic")));
        result.put("split", calculateAggregates(statesByParty.get("Split")));
        result.put("stateDetails", statesByParty);

        return result;
    }

    private String toTitleCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        String[] words = str.split(" ");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.length() > 0) {
                result.append(Character.toUpperCase(word.charAt(0)));
                result.append(word.substring(1).toLowerCase());
                result.append(" ");
            }
        }
        return result.toString().trim();
    }

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

    private boolean isRestrictive(String category) {
        if (category == null)
            return false;
        String lower = category.toLowerCase();
        return lower.contains("permanent") || lower.contains("parole") ||
                lower.contains("probation") || lower.contains("incarceration");
    }

    private Map<String, String> getStatePartyControl() {
        Map<String, String> control = new HashMap<>();

        String[] republican = {
                "Alabama", "Alaska", "Arkansas", "Florida", "Georgia", "Idaho", "Indiana",
                "Iowa", "Mississippi", "Missouri", "Montana", "Nebraska", "New Hampshire",
                "North Dakota", "Ohio", "Oklahoma", "South Carolina", "South Dakota",
                "Tennessee", "Texas", "Utah", "West Virginia", "Wyoming"
        };

        String[] democratic = {
                "California", "Colorado", "Connecticut", "Delaware", "Hawaii", "Illinois",
                "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Nevada",
                "New Jersey", "New Mexico", "New York", "Oregon", "Rhode Island",
                "Vermont", "Washington"
        };

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
