package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for voter registration data
 * Handles GUI use cases: GUI-16, GUI-18, GUI-19
 */
@RestController
@RequestMapping("/api/registration")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class RegistrationController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * GUI-16: Get registration trends for a state (2016, 2020, 2024)
     * GET /api/registration/trends/{state}?years=2016,2020,2024
     */
    @GetMapping("/trends/{state}")
    public Map<String, Object> getRegistrationTrends(
            @PathVariable String state,
            @RequestParam(defaultValue = "2016,2020,2024") String years) {

        String[] yearArray = years.split(",");
        Map<String, Object> result = new HashMap<>();
        result.put("state", state);

        // Get 2024 data first to establish geographic unit order
        Query query2024 = new Query();
        query2024.addCriteria(Criteria.where("stateFull").is(state).and("year").is(2024));
        List<Map> data2024 = mongoTemplate.find(query2024, Map.class, "eavsData");

        // Sort by registered voters (ascending)
        data2024.sort((a, b) -> {
            Object aVal = a.get("A1a");
            Object bVal = b.get("A1a");
            if (aVal == null)
                return -1;
            if (bVal == null)
                return 1;
            return Integer.compare(((Number) aVal).intValue(), ((Number) bVal).intValue());
        });

        List<String> geographicUnits = data2024.stream()
                .map(d -> (String) d.get("jurisdictionName"))
                .toList();

        result.put("geographicUnitOrder2024", geographicUnits);

        // Get data for each year
        Map<String, List<Integer>> byYear = new HashMap<>();
        for (String year : yearArray) {
            Query query = new Query();
            query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(Integer.parseInt(year.trim())));
            List<Map> yearData = mongoTemplate.find(query, Map.class, "eavsData");

            // Create lookup map
            Map<String, Integer> lookup = new HashMap<>();
            for (Map doc : yearData) {
                String unit = (String) doc.get("jurisdictionName");
                Object voters = doc.get("A1a");
                if (unit != null && voters != null) {
                    lookup.put(unit, ((Number) voters).intValue());
                }
            }

            // Build ordered list matching 2024 order
            List<Integer> orderedValues = new ArrayList<>();
            for (String unit : geographicUnits) {
                orderedValues.add(lookup.getOrDefault(unit, 0));
            }

            byYear.put(year.trim(), orderedValues);
        }

        result.put("byYear", byYear);
        return result;
    }

    /**
     * GUI-18: Get census block bubbles for party dominance
     * GET /api/registration/blocks/{state}
     */
    @GetMapping("/blocks/{state}")
    public Map<String, Object> getBlockBubbles(@PathVariable String state) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state));

        List<Map> blocks = mongoTemplate.find(query, Map.class, "census_block_voters");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);

        List<Map<String, Object>> points = blocks.stream().map(block -> {
            Map<String, Object> point = new HashMap<>();
            point.put("lat", block.get("centerLat"));
            point.put("lng", block.get("centerLng"));

            // Determine dominant party
            int repCount = ((Number) block.getOrDefault("republicanCount", 0)).intValue();
            int demCount = ((Number) block.getOrDefault("democraticCount", 0)).intValue();

            point.put("dominantParty", demCount > repCount ? "D" : "R");
            return point;
        }).toList();

        result.put("points", points);
        return result;
    }

    /**
     * GUI-19: Get registered voters by geographic unit
     * GET /api/registration/voters/{state}/{region}?party=Democratic&page=0&size=25
     */
    @GetMapping("/voters/{state}/{region}")
    public Map<String, Object> getRegisteredVoters(
            @PathVariable String state,
            @PathVariable String region,
            @RequestParam(required = false) String party,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state).and("county").is(region));

        if (party != null && !party.equals("All")) {
            query.addCriteria(Criteria.where("party").is(party));
        }

        // Get total count
        long total = mongoTemplate.count(query, "voter_registration");

        // Apply pagination
        query.with(PageRequest.of(page, size));

        List<Map> voters = mongoTemplate.find(query, Map.class, "voter_registration");

        List<Map<String, Object>> voterList = voters.stream().map(v -> {
            Map<String, Object> voter = new HashMap<>();
            voter.put("id", v.get("_id"));
            voter.put("firstName", v.get("firstName"));
            voter.put("lastName", v.get("lastName"));
            voter.put("party", v.get("party"));
            voter.put("registrationDate", v.get("registrationDate"));
            voter.put("address", v.get("address"));
            return voter;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("voters", voterList);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);

        return result;
    }

    /**
     * GUI-21: Get opt-in/opt-out registration comparison
     * GET /api/registration/opt-in-out-comparison
     */
    @GetMapping("/opt-in-out-comparison")
    public List<Map<String, Object>> getOptInOutComparison() {
        // Define detail states and their registration types
        String[] states = { "RHODE ISLAND", "MARYLAND", "ARKANSAS" };
        String[] stateDisplay = { "Rhode Island", "Maryland", "Arkansas" };
        String[] registrationTypes = { "Opt-out", "Opt-out", "Opt-in" };
        boolean[] sameDayReg = { true, true, false };

        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < states.length; i++) {
            String state = states[i];
            String regType = registrationTypes[i];

            // Query EAVS data for the state (2024) - aggregate all counties
            Query query = new Query();
            query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(2024));
            List<Map> eavsData = mongoTemplate.find(query, Map.class, "eavsData");

            // Calculate totals by aggregating all counties
            long totalRegistered = 0;
            long totalCVAP = 0;
            long totalVotesCast = 0;

            for (Map doc : eavsData) {
                totalRegistered += getLongValue(doc, "A1a"); // Total registered voters
                totalCVAP += getLongValue(doc, "A1b"); // Citizen Voting Age Population
                // Total votes cast = sum of all voting methods
                totalVotesCast += getLongValue(doc, "F1a"); // Election day
                totalVotesCast += getLongValue(doc, "F1b"); // Polling place
                totalVotesCast += getLongValue(doc, "F1d"); // Mail
                totalVotesCast += getLongValue(doc, "F1f"); // Early in-person
            }

            Map<String, Object> row = new HashMap<>();
            row.put("state", stateDisplay[i]);
            row.put("registrationType", regType);
            row.put("sameDayRegistration", sameDayReg[i]);
            row.put("registeredVoters", totalRegistered);
            row.put("votesCast", totalVotesCast);

            // Calculate registration rate (registered / CVAP * 100)
            double registrationRate = totalCVAP > 0
                    ? (double) totalRegistered / totalCVAP * 100
                    : 0.0;
            row.put("registrationRate", Math.round(registrationRate * 10) / 10.0);

            // Calculate turnout rate (votes cast / registered * 100)
            double turnoutRate = totalRegistered > 0
                    ? (double) totalVotesCast / totalRegistered * 100
                    : 0.0;
            row.put("turnoutRate", Math.round(turnoutRate * 10) / 10.0);

            result.add(row);
        }

        return result;
    }

    /**
     * GUI-23: Get early voting comparison
     * GET /api/registration/early-voting/comparison
     */
    @GetMapping("/early-voting/comparison")
    public List<Map<String, Object>> getEarlyVotingComparison() {
        String[] states = { "RHODE ISLAND", "MARYLAND", "ARKANSAS" };
        String[] stateDisplay = { "Rhode Island", "Maryland", "Arkansas" };
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < states.length; i++) {
            String state = states[i];
            // Query EAVS data for the state (2024) - aggregate all counties
            Query query = new Query();
            query.addCriteria(Criteria.where("stateFull").is(state).and("year").is(2024));
            List<Map> eavsData = mongoTemplate.find(query, Map.class, "eavsData");

            // Calculate totals by aggregating all counties
            long totalVotesCast = 0;
            long mailBallots = 0;
            long earlyInPerson = 0;
            long dropBox = 0;

            for (Map doc : eavsData) {
                // Total votes cast = sum of all voting methods (F1 fields)
                long f1a = getLongValue(doc, "F1a"); // Election day
                long f1b = getLongValue(doc, "F1b"); // Polling place
                long f1d = getLongValue(doc, "F1d"); // Mail
                long f1f = getLongValue(doc, "F1f"); // Early in-person
                totalVotesCast += f1a + f1b + f1d + f1f;

                // Early voting methods
                mailBallots += f1d; // Mail ballots (F1d is the actual count)
                earlyInPerson += f1f; // Early in-person (F1f is the actual count)
                dropBox += getLongValue(doc, "C3a"); // Drop box
            }

            long totalEarly = mailBallots + earlyInPerson + dropBox;

            Map<String, Object> row = new HashMap<>();
            row.put("state", stateDisplay[i]);
            row.put("total", totalEarly);
            row.put("totalPct",
                    Math.round((totalVotesCast > 0 ? (double) totalEarly / totalVotesCast * 100 : 0.0) * 10) / 10.0);
            row.put("mail", mailBallots);
            row.put("mailPct",
                    Math.round((totalVotesCast > 0 ? (double) mailBallots / totalVotesCast * 100 : 0.0) * 10) / 10.0);
            row.put("inPerson", earlyInPerson);
            row.put("inPersonPct",
                    Math.round((totalVotesCast > 0 ? (double) earlyInPerson / totalVotesCast * 100 : 0.0) * 10) / 10.0);
            row.put("dropBox", dropBox);

            result.add(row);
        }

        return result;
    }

    /**
     * Helper: Safely get integer value from document
     */
    private int getIntValue(Map doc, String key) {
        Object value = doc.get(key);
        if (value == null)
            return 0;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Helper: Safely get long value from document
     */
    private long getLongValue(Map doc, String key) {
        Object value = doc.get(key);
        if (value == null)
            return 0L;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "registration-controller");
    }
}
