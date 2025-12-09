package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for preclearance state analysis.
 * 
 * Provides endpoints for Voting Rights Act analysis:
 * - Gingles precondition charts for racially polarized voting
 * - Ecological inference for equipment quality by demographic
 * - Ecological inference for ballot rejection by demographic
 * 
 * Supports GUI use cases: GUI-10, GUI-11
 * Focus: Maryland (preclearance state) VRA analysis
 */
@RestController
@RequestMapping("/api/preclearance")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class PreclearanceController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Get Gingles chart data for racially polarized voting analysis.
     * Returns precinct-level demographic and voting data.
     * 
     * @param state       State name (case-sensitive)
     * @param demographic Demographic group to analyze (default: white)
     * @return Map with precinct data and regression coefficients
     */
    @GetMapping("/gingles/{state}")
    public Map<String, Object> getGinglesData(
            @PathVariable String state,
            @RequestParam(required = false, defaultValue = "white") String demographic) {

        // Fetch precinct-level voting and demographic data
        Query query = new Query();

        query.addCriteria(Criteria.where("state").is(state));

        List<Map<String, Object>> precincts = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "precinct_demographics");

        // Transform data for frontend
        List<Map<String, Object>> data = precincts.stream().map(precinct -> {
            Map<String, Object> row = new HashMap<>();
            row.put("precinct", precinct.get("precinct"));
            row.put("democraticPct", precinct.getOrDefault("democraticPct", 0.0));
            row.put("republicanPct", precinct.getOrDefault("republicanPct", 0.0));
            row.put("whitePct", precinct.getOrDefault("whitePct", 0.0));
            row.put("hispanicPct", precinct.getOrDefault("hispanicPct", 0.0));
            row.put("africanAmericanPct", precinct.getOrDefault("africanAmericanPct", 0.0));
            row.put("asianPct", precinct.getOrDefault("asianPct", 0.0));
            return row;
        }).toList();

        // Fetch regression coefficients from database
        Query regressionQuery = new Query();
        regressionQuery.addCriteria(Criteria.where("state").is(state));
        Map<String, Object> regressionDoc = mongoTemplate.findOne(
                regressionQuery, Map.class, "gingles_regressions");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("data", data);
        result.put("totalPrecincts", data.size());

        // Add regression coefficients for the selected demographic
        if (regressionDoc != null && regressionDoc.containsKey("regressions")) {
            Map<String, Object> regressions = (Map<String, Object>) regressionDoc.get("regressions");

            // Map demographic parameter to DB key
            String demographicKey = switch (demographic.toLowerCase()) {
                case "hispanic" -> "hispanic";
                case "africanamerican", "african_american" -> "africanAmerican";
                case "asian" -> "asian";
                default -> "white";
            };

            if (regressions.containsKey(demographicKey)) {
                Map<String, Object> demoRegressions = (Map<String, Object>) regressions.get(demographicKey);
                result.put("democraticRegression", demoRegressions.get("democratic"));
                result.put("republicanRegression", demoRegressions.get("republican"));
            }
        }

        return result;
    }

    /**
     * Get Ecological Inference data for equipment quality analysis.
     * Returns probability curves for equipment quality by demographic.
     * 
     * @param state       State name (case-sensitive)
     * @param demographic Demographic group filter (optional)
     * @return Map with probability curves and statistics
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

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "ei_equipment_analysis");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("demographic", demographic);

        // Probability curves: quality score (0-100) -> probability density
        List<Map<String, Object>> curves = new ArrayList<>();

        for (Map<String, Object> doc : results) {
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
     * Get Ecological Inference data for rejected ballot analysis.
     * Returns probability curves for ballot rejection by demographic.
     * 
     * @param state       State name (case-sensitive)
     * @param demographic Demographic group filter (optional)
     * @return Map with probability curves and statistics
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

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "ei_rejection_analysis");

        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("demographic", demographic);

        // Probability curves: rejection probability -> probability density
        List<Map<String, Object>> curves = new ArrayList<>();

        for (Map<String, Object> doc : results) {
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

        List<Map<String, Object>> sample = (List<Map<String, Object>>) (List<?>) mongoTemplate
                .find(new Query().limit(1), Map.class, "ei_equipment_analysis");

        return Map.of(
                "totalDocuments", count,
                "marylandDocuments", marylandCount,
                "fullQueryDocuments", fullQueryCount,
                "sampleDocument", sample.isEmpty() ? "none" : sample.get(0));
    }
}
