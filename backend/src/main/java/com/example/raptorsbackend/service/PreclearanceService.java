package com.example.raptorsbackend.service;

import com.example.raptorsbackend.repository.PreclearanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PreclearanceService {

    @Autowired
    private PreclearanceRepository preclearanceRepository;

    public Map<String, Object> getGinglesData(String state, String demographic) {
        List<Map<String, Object>> precincts = preclearanceRepository.findPrecinctDemographics(state);

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

        Map<String, Object> regressionDoc = preclearanceRepository.findGinglesRegressions(state);

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

    public Map<String, Object> getEIEquipmentData(String state, String demographic) {
        List<Map<String, Object>> results = preclearanceRepository.findEiEquipmentAnalysis(state, demographic);

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

    public Map<String, Object> getEIRejectedData(String state, String demographic) {
        List<Map<String, Object>> results = preclearanceRepository.findEiRejectionAnalysis(state, demographic);

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

    public Map<String, Object> debugEIEquipment() {
        long count = preclearanceRepository.countEiEquipmentAnalysis(new Query());

        Query query = new Query();
        query.addCriteria(Criteria.where("state").is("Maryland"));
        long marylandCount = preclearanceRepository.countEiEquipmentAnalysis(query);

        Query fullQuery = new Query();
        fullQuery.addCriteria(Criteria.where("state").is("Maryland")
                .and("analysis_type").is("equipment_quality"));
        long fullQueryCount = preclearanceRepository.countEiEquipmentAnalysis(fullQuery);

        List<Map<String, Object>> sample = preclearanceRepository
                .findEiEquipmentAnalysis(new Query().limit(1));

        return Map.of(
                "totalDocuments", count,
                "marylandDocuments", marylandCount,
                "fullQueryDocuments", fullQueryCount,
                "sampleDocument", sample.isEmpty() ? "none" : sample.get(0));
    }
}
