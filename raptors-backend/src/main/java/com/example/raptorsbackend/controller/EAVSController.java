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

        List<Map> results = mongoTemplate.find(query, Map.class, "eavsData");

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

        List<Map> results = mongoTemplate.find(query, Map.class, "eavsData");

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

        List<Map> results = mongoTemplate.find(query, Map.class, "eavsData");

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

        List<Map> results = mongoTemplate.find(query, Map.class, "eavsData");

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
     * Health check endpoint
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "eavs-controller");
    }
}
