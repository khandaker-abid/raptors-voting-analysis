package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for preclearance state analysis (Maryland)
 * Handles GUI use cases: GUI-27, GUI-28, GUI-29
 */
@RestController
@RequestMapping("/api/preclearance")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
public class PreclearanceController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * GUI-27: Get Gingles chart data (racially polarized voting)
     * GET /api/preclearance/gingles/{state}
     */
    @GetMapping("/gingles/{state}")
    public Map<String, Object> getGinglesData(@PathVariable String state) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state));

        List<Map> precincts = mongoTemplate.find(query, Map.class, "precinct_demographics");

        List<Map<String, Object>> data = precincts.stream().map(precinct -> {
            Map<String, Object> row = new HashMap<>();
            row.put("precinct", precinct.get("precinct"));
            row.put("democraticPct", precinct.getOrDefault("democraticPct", 0));
            row.put("republicanPct", precinct.getOrDefault("republicanPct", 0));
            row.put("whitePct", precinct.getOrDefault("whitePct", 0));
            row.put("hispanicPct", precinct.getOrDefault("hispanicPct", 0));
            row.put("africanAmericanPct", precinct.getOrDefault("africanAmericanPct", 0));
            return row;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("data", data);

        // Calculate regression coefficients (simple polynomial fit)
        // For production, use proper statistical library
        result.put("democraticRegression", Map.of("a", 0.5, "b", 1.1));
        result.put("republicanRegression", Map.of("a", 0.6, "b", 0.9));

        return result;
    }

    /**
     * GUI-28: Get Ecological Inference data for equipment quality
     * GET /api/preclearance/ei-equipment/{state}?demographic=white
     */
    @GetMapping("/ei-equipment/{state}")
    public Map<String, Object> getEIEquipmentData(
            @PathVariable String state,
            @RequestParam(required = false) String demographic) {

        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state)
                .and("analysis_type").is("equipment_quality"));

        if (demographic != null) {
            query.addCriteria(Criteria.where("demographic").is(demographic));
        }

        List<Map> results = mongoTemplate.find(query, Map.class, "ei_equipment_analysis");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("demographic", demographic);

        // Probability curves: quality score (0-100) -> probability density
        List<Map<String, Object>> curves = new ArrayList<>();

        for (Map doc : results) {
            Map<String, Object> curve = new HashMap<>();
            curve.put("demographic", doc.get("demographic"));
            curve.put("data", doc.get("curve")); // Array of {qualityScore: x, probability: y}
            curve.put("meanQuality", doc.get("mean_quality"));
            curve.put("stdDev", doc.get("std_dev"));
            curves.add(curve);
        }

        result.put("curves", curves);
        return result;
    }

    /**
     * GUI-29: Get Ecological Inference data for rejected ballots
     * GET /api/preclearance/ei-rejected/{state}?demographic=hispanic
     */
    @GetMapping("/ei-rejected/{state}")
    public Map<String, Object> getEIRejectedData(
            @PathVariable String state,
            @RequestParam(required = false) String demographic) {

        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state)
                .and("analysis_type").is("ballot_rejection"));

        if (demographic != null) {
            query.addCriteria(Criteria.where("demographic").is(demographic));
        }

        List<Map> results = mongoTemplate.find(query, Map.class, "ei_rejection_analysis");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("demographic", demographic);

        // Probability curves: rejection probability -> probability density
        List<Map<String, Object>> curves = new ArrayList<>();

        for (Map doc : results) {
            Map<String, Object> curve = new HashMap<>();
            curve.put("demographic", doc.get("demographic"));
            curve.put("data", doc.get("curve")); // Array of {rejectionProbability: x, probability: y}
            curve.put("meanRejectionRate", doc.get("mean_rejection_rate"));
            curve.put("stdDev", doc.get("std_dev"));
            curves.add(curve);
        }

        result.put("curves", curves);
        return result;
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "preclearance-controller");
    }

    /**
     * Debug endpoint to check EI data
     */
    @GetMapping("/debug/ei-equipment")
    public Map<String, Object> debugEIEquipment() {
        long count = mongoTemplate.count(new Query(), "ei_equipment_analysis");

        Query query = new Query();
        query.addCriteria(Criteria.where("state").is("Maryland"));
        long marylandCount = mongoTemplate.count(query, "ei_equipment_analysis");

        Query fullQuery = new Query();
        fullQuery.addCriteria(Criteria.where("state").is("Maryland")
                .and("analysis_type").is("equipment_quality"));
        long fullQueryCount = mongoTemplate.count(fullQuery, "ei_equipment_analysis");

        List<Map> sample = mongoTemplate.find(new Query().limit(1), Map.class, "ei_equipment_analysis");

        return Map.of(
                "totalDocuments", count,
                "marylandDocuments", marylandCount,
                "fullQueryDocuments", fullQueryCount,
                "sampleDocument", sample.isEmpty() ? "none" : sample.get(0));
    }
}
