package com.example.raptorsbackend.controller;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for voting equipment data
 * Handles GUI use cases: GUI-10, GUI-11, GUI-14
 */
@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class EquipmentController {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * GUI-10: Get equipment types by geographic unit for a state
     * GET /api/equipment/{state}/types
     */
    @GetMapping("/{state}/types")
    public List<Map<String, Object>> getEquipmentTypes(@PathVariable String state) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state));

        List<Map<String, Object>> results = (List<Map<String, Object>>)(List<?>) mongoTemplate.find(query, Map.class, "votingEquipmentData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("county"));

            // Count equipment types
            List<Map<String, Object>> equipments = (List<Map<String, Object>>) doc.getOrDefault("equipments", new ArrayList<>());
            Map<String, Integer> typeCounts = new HashMap<>();

            for (Map<String, Object> equip : equipments) {
                String type = (String) equip.get("type");
                int quantity = ((Number) equip.getOrDefault("quantity", 1)).intValue();
                typeCounts.put(type, typeCounts.getOrDefault(type, 0) + quantity);
            }

            // Determine primary equipment type
            String primaryType = "MIXED";
            if (typeCounts.size() == 1) {
                primaryType = typeCounts.keySet().iterator().next().toUpperCase().replace(" ", "_");
            } else if (typeCounts.size() > 0) {
                // Find most common type
                String maxType = typeCounts.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("MIXED");

                // If one type is >70%, use it; otherwise MIXED
                int total = typeCounts.values().stream().mapToInt(Integer::intValue).sum();
                if (typeCounts.get(maxType) > total * 0.7) {
                    primaryType = maxType.toUpperCase().replace(" ", "_");
                }
            }

            row.put("primaryEquipmentType", primaryType);
            row.put("equipmentBreakdown", typeCounts);

            return row;
        }).toList();
    }

    /**
     * GUI-11: Get average equipment age for all states
     * GET /api/equipment/age/all-states
     */
    @GetMapping("/age/all-states")
    public List<Map<String, Object>> getAllStatesEquipmentAge() {
        List<Map<String, Object>> allEquipment = (List<Map<String, Object>>)(List<?>) mongoTemplate.findAll(Map.class, "votingEquipmentData");

        Map<String, List<Integer>> stateAges = new HashMap<>();

        for (Map<String, Object> doc : allEquipment) {
            String state = (String) doc.get("state");
            List<Map<String, Object>> equipments = (List<Map<String, Object>>) doc.getOrDefault("equipments", new ArrayList<>());

            for (Map<String, Object> equip : equipments) {
                Object ageObj = equip.get("age");
                if (ageObj != null) {
                    int age = ((Number) ageObj).intValue();
                    stateAges.computeIfAbsent(state, k -> new ArrayList<>()).add(age);
                }
            }
        }

        return stateAges.entrySet().stream().map(entry -> {
            Map<String, Object> row = new HashMap<>();
            row.put("state", entry.getKey());

            double avgAge = entry.getValue().stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(0.0);

            row.put("averageAge", Math.round(avgAge * 10) / 10.0);
            return row;
        }).toList();
    }

    /**
     * GUI-14: Get equipment history for a state (2016-2024)
     * GET /api/equipment/history/{state}
     */
    @GetMapping("/history/{state}")
    public List<Map<String, Object>> getEquipmentHistory(@PathVariable String state) {
        // This should query historical equipment data by year
        // For now, returning mock structure

        List<Map<String, Object>> series = new ArrayList<>();

        // Categories of equipment
        String[] categories = { "DRE no VVPAT", "DRE with VVPAT", "Ballot Marking Device", "Scanner" };

        for (String category : categories) {
            Map<String, Object> row = new HashMap<>();
            row.put("category", category);

            Map<String, Integer> byYear = new HashMap<>();
            // Query historical data for each year
            for (int year = 2016; year <= 2024; year += 2) { // Federal election years
                Query query = new Query();
                query.addCriteria(Criteria.where("state").is(state)
                        .and("year").is(year)
                        .and("equipmentType").is(category));

                // Find the document and get its count field
                Document result = mongoTemplate.findOne(query, Document.class, "equipment_history");
                int count = 0;
                if (result != null && result.containsKey("count")) {
                    Object countObj = result.get("count");
                    if (countObj instanceof Number) {
                        count = ((Number) countObj).intValue();
                    }
                }
                byYear.put(String.valueOf(year), count);
            }

            row.put("byYear", byYear);
            series.add(row);
        }

        return series;
    }

    /**
     * GUI-12: Get equipment for all states (table view)
     * GET /api/equipment/all-states
     */
    @GetMapping("/all-states")
    public List<Map<String, Object>> getAllStatesEquipment() {
        Query query = new Query();
        query.addCriteria(Criteria.where("year").is(2024));
        List<Map> allEquipment = mongoTemplate.find(query, Map.class, "votingEquipmentData");

        // Process each state
        return allEquipment.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            String state = (String) doc.get("state");
            row.put("state", state);

            // Get equipment summary
            Map equipmentSummary = (Map) doc.getOrDefault("equipmentSummary", new HashMap<>());
            row.put("dre_no_vvpat", equipmentSummary.getOrDefault("dreNoVVPAT", 0));
            row.put("dre_with_vvpat", equipmentSummary.getOrDefault("dreWithVVPAT", 0));
            row.put("ballot_marking", equipmentSummary.getOrDefault("ballotMarkingDevice", 0));
            row.put("scanner", equipmentSummary.getOrDefault("scanner", 0));

            return row;
        }).filter(row -> row.get("state") != null)
                .sorted((a, b) -> ((String) a.get("state")).compareTo((String) b.get("state")))
                .toList();
    }

    /**
     * GUI-13: Get equipment summary by equipment type (simplified for available
     * data)
     * GET /api/equipment/summary
     */
    @GetMapping("/summary")
    public List<Map<String, Object>> getEquipmentSummary() {
        Query query = new Query();
        query.addCriteria(Criteria.where("year").is(2024));
        List<Map> allEquipment = mongoTemplate.find(query, Map.class, "votingEquipmentData");

        // Group by equipment type
        Map<String, Map<String, Object>> equipmentTypeSum = new HashMap<>();

        for (Map doc : allEquipment) {
            List<Map> equipmentDetails = (List<Map>) doc.getOrDefault("equipmentDetails", new ArrayList<>());

            for (Map equip : equipmentDetails) {
                String equipmentType = (String) equip.get("equipmentType");
                if (equipmentType == null)
                    continue;

                String makeModel = (String) equip.getOrDefault("makeAndModel", "Unknown");
                int quantity = ((Number) equip.getOrDefault("quantity", 0)).intValue();

                // Get quality metrics
                double qualityScore = ((Number) equip.getOrDefault("qualityScore", 0.0)).doubleValue();
                Map componentScores = (Map) equip.getOrDefault("componentScores", new HashMap<>());

                String key = equipmentType + "|" + makeModel;

                Map<String, Object> summary = equipmentTypeSum.computeIfAbsent(key, k -> {
                    Map<String, Object> s = new HashMap<>();
                    s.put("provider", equipmentType); // Using type as provider for now
                    s.put("model", makeModel);
                    s.put("quantity", 0);
                    s.put("qualityScores", new ArrayList<Double>());
                    s.put("ageScores", new ArrayList<Double>());
                    s.put("certScores", new ArrayList<Double>());
                    return s;
                });

                summary.put("quantity", (Integer) summary.get("quantity") + quantity);
                ((List<Double>) summary.get("qualityScores")).add(qualityScore);

                if (componentScores.containsKey("age")) {
                    ((List<Double>) summary.get("ageScores")).add(((Number) componentScores.get("age")).doubleValue());
                }
                if (componentScores.containsKey("certification")) {
                    ((List<Double>) summary.get("certScores"))
                            .add(((Number) componentScores.get("certification")).doubleValue());
                }
            }
        }

        // Convert to final format
        return equipmentTypeSum.values().stream().map(summary -> {
            Map<String, Object> row = new HashMap<>();
            row.put("provider", summary.get("provider"));
            row.put("model", summary.get("model"));
            row.put("quantity", summary.get("quantity"));
            row.put("age", estimateAge(average((List<Double>) summary.get("ageScores"))));
            row.put("os", "Unknown"); // Not available in EAVS data
            row.put("certification", getCertificationStatus(average((List<Double>) summary.get("certScores"))));
            row.put("scanRate", 0.0); // Not available in EAVS data
            row.put("errorRate", 0.0); // Not available in EAVS data
            row.put("reliability", average((List<Double>) summary.get("qualityScores")));
            row.put("qualityScore", average((List<Double>) summary.get("qualityScores")));

            return row;
        }).filter(row -> row.get("provider") != null && row.get("model") != null)
                .sorted((a, b) -> {
                    int providerCompare = ((String) a.get("provider")).compareTo((String) b.get("provider"));
                    if (providerCompare != 0)
                        return providerCompare;
                    return ((String) a.get("model")).compareTo((String) b.get("model"));
                }).toList();
    }

    /**
     * Helper: Normalize equipment type names
     */
    private String normalizeEquipmentType(String type) {
        if (type == null)
            return "Unknown";
        String lower = type.toLowerCase();
        if (lower.contains("dre") && lower.contains("no") && lower.contains("vvpat")) {
            return "DRE no VVPAT";
        } else if (lower.contains("dre") && lower.contains("vvpat")) {
            return "DRE with VVPAT";
        } else if (lower.contains("ballot") && lower.contains("marking")) {
            return "Ballot Marking Device";
        } else if (lower.contains("scanner")) {
            return "Scanner";
        }
        return type;
    }

    /**
     * Helper: Get most common string from list
     */
    private String getMostCommon(List<String> list) {
        if (list.isEmpty())
            return "Unknown";
        Map<String, Long> frequency = new HashMap<>();
        for (String item : list) {
            frequency.put(item, frequency.getOrDefault(item, 0L) + 1);
        }
        return frequency.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(list.get(0));
    }

    /**
     * Helper: Calculate average of doubles
     */
    private double average(List<Double> list) {
        if (list.isEmpty())
            return 0.0;
        double sum = list.stream().mapToDouble(Double::doubleValue).sum();
        return Math.round((sum / list.size()) * 100) / 100.0;
    }

    /**
     * Helper: Estimate age from age score (0-1 scale, where 1 = newest, 0 = oldest)
     */
    private double estimateAge(double ageScore) {
        // Convert score back to estimated years (assuming 0 = 15+ years, 1 = 0 years)
        return Math.round((1.0 - ageScore) * 15.0 * 10) / 10.0;
    }

    /**
     * Helper: Get certification status from certification score (0-1 scale)
     */
    private String getCertificationStatus(double certScore) {
        if (certScore >= 0.9)
            return "VVSG 2.0 certified";
        if (certScore >= 0.7)
            return "VVSG 1.0/1.1 certified";
        if (certScore >= 0.5)
            return "State certified";
        return "Not certified";
    }

    /**
     * GUI-25: Get equipment quality vs rejected ballots comparison
     * GET /api/equipment/vs-rejected/{state}
     * Returns county-level data for bubble chart showing relationship between
     * equipment quality and rejected ballot percentages
     */
    @GetMapping("/vs-rejected/{state}")
    public List<Map<String, Object>> getEquipmentVsRejected(@PathVariable String state) {
        String stateUpper = state.toUpperCase();

        // Get voting equipment data for this state
        Query equipQuery = new Query();
        equipQuery.addCriteria(Criteria.where("state").is(stateUpper));
        Map stateEquipData = mongoTemplate.findOne(equipQuery, Map.class, "votingEquipmentData");

        // Create map of jurisdiction -> equipment quality
        Map<String, Double> equipQualityByJurisdiction = new HashMap<>();

        if (stateEquipData != null && stateEquipData.containsKey("jurisdictions")) {
            List<Map<String, Object>> jurisdictions = (List<Map<String, Object>>) stateEquipData.get("jurisdictions");

            for (Map<String, Object> jurisdiction : jurisdictions) {
                String jurisdictionName = (String) jurisdiction.get("name");
                if (jurisdictionName == null)
                    continue;

                // Calculate equipment quality score from equipment flags
                Map<String, Object> equipment = (Map<String, Object>) jurisdiction.get("equipment");
                double qualityScore = calculateEquipmentQualityScoreFromFlags(equipment);
                equipQualityByJurisdiction.put(jurisdictionName.toUpperCase(), qualityScore);
            }
        }

        // Get EAVS data for rejected ballots
        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("stateFull").is(stateUpper));
        List<Map> eavsData = mongoTemplate.find(eavsQuery, Map.class, "eavsData");

        // Combine equipment quality with rejected ballot data
        List<Map<String, Object>> results = new ArrayList<>();

        for (Map eavs : eavsData) {
            String jurisdiction = (String) eavs.get("jurisdictionName");
            if (jurisdiction == null)
                continue;

            String jurisdictionUpper = jurisdiction.toUpperCase();

            // Get equipment quality for this jurisdiction
            Double equipQuality = equipQualityByJurisdiction.get(jurisdictionUpper);
            if (equipQuality == null)
                continue; // Skip if no equipment data

            // Calculate total rejected ballots (C9a = total rejected)
            long totalRejected = safeLong(eavs.get("C9a"));

            // Skip if no rejection data
            if (totalRejected == 0)
                continue;

            // Calculate total participation (F1a-f = different voting methods)
            long totalParticipated = safeLong(eavs.get("F1a")) + safeLong(eavs.get("F1b")) +
                    safeLong(eavs.get("F1d")) + safeLong(eavs.get("F1f"));

            // Skip if no participation data
            if (totalParticipated == 0)
                continue;

            // Calculate rejected percentage
            double rejectedPct = (totalRejected * 100.0) / totalParticipated;

            // Determine party lean (simplified - use county name heuristics or default)
            String party = determineCountyPartyLean(state, jurisdiction);

            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("county", jurisdiction);
            dataPoint.put("equipmentQuality", Math.round(equipQuality * 10) / 10.0);
            dataPoint.put("rejectedPct", Math.round(rejectedPct * 1000) / 1000.0); // 3 decimal places
            dataPoint.put("party", party);
            dataPoint.put("totalRejected", totalRejected);
            dataPoint.put("totalBallots", totalParticipated);

            results.add(dataPoint);
        }

        return results;
    }

    /**
     * Calculate equipment quality score from equipment flags
     * Returns score from 0-100 based on equipment type
     */
    private double calculateEquipmentQualityScoreFromFlags(Map<String, Object> equipment) {
        if (equipment == null)
            return 50.0; // Default medium quality

        double score = 50.0; // Start at medium

        // Scanner (optical scan) is best - most secure and auditable
        Boolean hasScanner = (Boolean) equipment.get("scanner");
        if (hasScanner != null && hasScanner) {
            score = 90.0;
        }

        // Ballot marking device is good
        Boolean hasBMD = (Boolean) equipment.get("ballotMarkingDevice");
        if (hasBMD != null && hasBMD) {
            score = Math.max(score, 75.0);
        }

        // DRE with VVPAT is acceptable
        Boolean hasDREwithVVPAT = (Boolean) equipment.get("dreWithVVPAT");
        if (hasDREwithVVPAT != null && hasDREwithVVPAT) {
            score = Math.max(score, 60.0);
        }

        // DRE without VVPAT is worst - no paper trail
        Boolean hasDREnoVVPAT = (Boolean) equipment.get("dreNoVVPAT");
        if (hasDREnoVVPAT != null && hasDREnoVVPAT) {
            score = 20.0; // Very low quality
        }

        return score;
    }

    /**
     * Determine county party lean based on state and county name
     * Simplified implementation - in production would use election results
     */
    private String determineCountyPartyLean(String state, String county) {
        // Default patterns - this is simplified
        // In production, would query election results database

        String countyLower = county.toLowerCase();

        // Urban counties tend Democratic
        if (countyLower.contains("city") || countyLower.contains("baltimore") ||
                countyLower.contains("montgomery") || countyLower.contains("providence")) {
            return "D";
        }

        // Default to state lean
        String[] democraticStates = { "Maryland", "Rhode Island", "California", "New York" };
        for (String demState : democraticStates) {
            if (state.equalsIgnoreCase(demState)) {
                return "D";
            }
        }

        return "R"; // Default Republican for other states
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

    /**
     * Health check
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "equipment-controller");
    }
}
