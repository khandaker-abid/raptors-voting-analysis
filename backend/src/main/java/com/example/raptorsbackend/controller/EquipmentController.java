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

@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class EquipmentController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/{state}/types")
    public List<Map<String, Object>> getEquipmentTypes(@PathVariable String state) {
        String stateAbbr = getStateAbbreviation(state);

        Query query = new Query();

        query.addCriteria(Criteria.where("stateAbbr").is(stateAbbr)
                .and("year").is(2024)
                .and("dataSource").is("VerifiedVoting.org")
                .and("equipmentType").is("standard"));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "votingEquipmentData");

        List<Map<String, Object>> countyData = new ArrayList<>();

        if ("RI".equals(stateAbbr)) {
            Map<String, Map<String, Integer>> countyEquipmentCounts = new HashMap<>();

            for (Map<String, Object> doc : results) {
                String jurisdictionName = (String) doc.get("jurisdiction");
                if (jurisdictionName == null || jurisdictionName.isEmpty()) {
                    continue;
                }

                String countyName = extractCountyFromJurisdiction(jurisdictionName);
                if (countyName == null) {
                    continue;
                }

                String markingMethod = (String) doc.get("markingMethod");
                String tabulationMethod = (String) doc.get("tabulationMethod");

                if (markingMethod == null || tabulationMethod == null) {
                    continue;
                }

                String primaryType = determineEquipmentTypeFromMethods(markingMethod, tabulationMethod);

                countyEquipmentCounts.putIfAbsent(countyName, new HashMap<>());
                Map<String, Integer> typeCounts = countyEquipmentCounts.get(countyName);
                typeCounts.put(primaryType, typeCounts.getOrDefault(primaryType, 0) + 1);
            }

            for (Map.Entry<String, Map<String, Integer>> entry : countyEquipmentCounts.entrySet()) {
                String countyName = entry.getKey();
                Map<String, Integer> typeCounts = entry.getValue();

                String primaryType;
                if (typeCounts.size() > 1) {
                    primaryType = "MIXED";
                } else {
                    primaryType = typeCounts.keySet().iterator().next();
                }

                Map<String, Object> row = new HashMap<>();
                row.put("geographicUnit", countyName + " County");
                row.put("primaryEquipmentType", primaryType);

                Map<String, Object> breakdown = new HashMap<>();

                for (Map<String, Object> doc : results) {
                    String jurisdictionName = (String) doc.get("jurisdiction");
                    String extractedCounty = extractCountyFromJurisdiction(jurisdictionName);
                    if (countyName.equals(extractedCounty)) {
                        String markingMethod = (String) doc.get("markingMethod");
                        String tabulationMethod = (String) doc.get("tabulationMethod");

                        if (markingMethod != null) {
                            breakdown.put("markingMethod", markingMethod);
                        }
                        if (tabulationMethod != null) {
                            breakdown.put("tabulationMethod", tabulationMethod);
                        }
                        break; // Only need one sample since all towns use same equipment
                    }
                }

                row.put("equipmentBreakdown", breakdown);

                countyData.add(row);
            }
        } else {
            for (Map<String, Object> doc : results) {
                String jurisdictionName = (String) doc.get("jurisdiction");
                if (jurisdictionName == null || jurisdictionName.isEmpty()) {
                    continue;
                }

                String markingMethod = (String) doc.get("markingMethod");
                String tabulationMethod = (String) doc.get("tabulationMethod");

                if (markingMethod == null || tabulationMethod == null) {
                    continue;
                }

                String primaryType = determineEquipmentTypeFromMethods(markingMethod, tabulationMethod);

                Map<String, Object> row = new HashMap<>();
                row.put("geographicUnit", jurisdictionName);
                row.put("primaryEquipmentType", primaryType);

                Map<String, Object> breakdown = new HashMap<>();
                breakdown.put("markingMethod", markingMethod);
                breakdown.put("tabulationMethod", tabulationMethod);
                row.put("equipmentBreakdown", breakdown);

                countyData.add(row);
            }
        }

        return countyData;
    }

    private String extractCountyFromJurisdiction(String jurisdiction) {
        int openParen = jurisdiction.indexOf('(');
        int closeParen = jurisdiction.indexOf(')');

        if (openParen != -1 && closeParen != -1 && closeParen > openParen) {
            String countyPart = jurisdiction.substring(openParen + 1, closeParen);
            return countyPart.replace(" County", "").trim();
        }

        return null;
    }

    private String determineEquipmentTypeFromMethods(String markingMethod, String tabulationMethod) {
        String marking = markingMethod.toUpperCase();
        String tabulation = tabulationMethod.toUpperCase();

        if (marking.contains("DRE") && !marking.contains("VVPAT") && !marking.contains("PAPER")) {
            return "DRE_NO_VVPAT";
        }

        if (marking.contains("DRE") && (marking.contains("VVPAT") || marking.contains("PAPER"))) {
            return "DRE_WITH_VVPAT";
        }

        if (marking.contains("HAND MARKED") && marking.contains("BMD")) {
            return "MIXED";
        }

        if (marking.contains("BMD") || marking.contains("BALLOT MARKING")) {
            return "BALLOT_MARKING";
        }

        if (tabulation.contains("OPTICAL") || tabulation.contains("SCAN")) {
            if (marking.contains("HAND MARKED") || marking.contains("PAPER BALLOT")) {
                return "SCANNER";
            }
            return "SCANNER";
        }

        return "SCANNER";
    }

    private String determinePrimaryEquipmentType(Map<String, Object> equipment) {
        int typeCount = 0;
        String lastType = "MIXED";

        if (Boolean.TRUE.equals(equipment.get("scanner"))) {
            typeCount++;
            lastType = "SCANNER";
        }
        if (Boolean.TRUE.equals(equipment.get("ballotMarkingDevice"))) {
            typeCount++;
            lastType = "BALLOT_MARKING";
        }
        if (Boolean.TRUE.equals(equipment.get("dreWithVVPAT"))) {
            typeCount++;
            lastType = "DRE_WITH_VVPAT";
        }
        if (Boolean.TRUE.equals(equipment.get("dreNoVVPAT"))) {
            typeCount++;
            lastType = "DRE_NO_VVPAT";
        }

        if (typeCount == 0) {
            return "SCANNER";
        } else if (typeCount == 1) {
            return lastType;
        } else {
            return "MIXED";
        }
    }

    @GetMapping("/state/{state}/details")
    public List<Map<String, Object>> getStateEquipmentDetails(@PathVariable String state) {
        String stateAbbr = getStateAbbreviation(state);

        Query query = new Query();

        query.addCriteria(Criteria.where("stateAbbr").is(stateAbbr)
                .and("year").is(2024)
                .and("dataSource").is("VerifiedVoting.org"));

        List<Map> equipmentData = mongoTemplate.find(query, Map.class, "votingEquipmentData");

        if (equipmentData.isEmpty()) {
            return new ArrayList<>();
        }

        Map<String, EquipmentProfile> profiles = new HashMap<>();

        for (Map doc : equipmentData) {
            Map<String, Object> details = (Map<String, Object>) doc.get("equipmentDetails");
            if (details == null)
                continue;

            String markingMethod = (String) details.get("Election Day Marking Method");
            String tabulation = (String) details.get("Election Day Tabulation");

            if (markingMethod == null || tabulation == null)
                continue;

            String key = markingMethod + "|" + tabulation;

            EquipmentProfile profile = profiles.computeIfAbsent(key, k -> {
                EquipmentProfile p = new EquipmentProfile();
                p.markingMethod = markingMethod;
                p.tabulationMethod = tabulation;
                p.quantity = 0;
                p.jurisdictions = new ArrayList<>();
                return p;
            });

            profile.quantity++;
            String jurisdiction = (String) doc.get("jurisdiction");
            if (jurisdiction != null) {
                profile.jurisdictions.add(jurisdiction);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int id = 1;

        for (Map.Entry<String, EquipmentProfile> entry : profiles.entrySet()) {
            EquipmentProfile profile = entry.getValue();

            EquipmentAttributes attrs = mapToEquipmentAttributes(
                    profile.markingMethod,
                    profile.tabulationMethod);

            Map<String, Object> row = new HashMap<>();
            row.put("id", id++);
            row.put("make", attrs.make);
            row.put("model", attrs.model);
            row.put("quantity", profile.quantity);
            row.put("equipmentType", attrs.equipmentType);
            row.put("description", attrs.description);
            row.put("age", attrs.age);
            row.put("os", attrs.os);
            row.put("certification", attrs.certification);
            row.put("scanRate", attrs.scanRate);
            row.put("errorRate", attrs.errorRate);
            row.put("reliability", attrs.reliability);
            row.put("isAvailable", attrs.isAvailable);

            results.add(row);
        }

        results.sort((a, b) -> {
            String makeA = (String) a.get("make");
            String makeB = (String) b.get("make");
            int cmp = makeA.compareTo(makeB);
            if (cmp != 0)
                return cmp;

            String modelA = (String) a.get("model");
            String modelB = (String) b.get("model");
            return modelA.compareTo(modelB);
        });

        return results;
    }

    private EquipmentAttributes mapToEquipmentAttributes(String markingMethod, String tabulationMethod) {
        EquipmentAttributes attrs = new EquipmentAttributes();

        if (markingMethod.contains("Ballot Marking Devices")) {
            attrs.equipmentType = "Ballot Marking Device";
            attrs.make = "ES&S";
            attrs.model = "ExpressVote";
            attrs.age = 5;
            attrs.os = "Embedded Linux";
            attrs.certification = "VVSG 2.0 certified";
            attrs.scanRate = 95;
            attrs.errorRate = "2%";
            attrs.reliability = "96%";
            attrs.isAvailable = true;
            attrs.description = "Touchscreen ballot marking device with paper trail";
        } else if (markingMethod.contains("Hand Marked")) {
            attrs.equipmentType = "Scanner";
            attrs.make = "ES&S";
            attrs.model = "DS200";
            attrs.age = 8;
            attrs.os = "Windows Embedded";
            attrs.certification = "VVSG 1.1 certified";
            attrs.scanRate = 92;
            attrs.errorRate = "3%";
            attrs.reliability = "94%";
            attrs.isAvailable = true;
            attrs.description = "Precinct-count optical scanner";
        } else if (markingMethod.contains("DRE")) {
            if (markingMethod.contains("Accessible") || markingMethod.contains("accessible")) {
                attrs.equipmentType = "DRE with VVPAT";
                attrs.make = "ES&S";
                attrs.model = "AutoMARK";
                attrs.age = 12;
                attrs.os = "Windows XP Embedded";
                attrs.certification = "VVSG 1.0 certified";
                attrs.scanRate = 0;
                attrs.errorRate = "5%";
                attrs.reliability = "88%";
                attrs.isAvailable = false;
                attrs.description = "Accessible ballot marking device with audio";
            } else {
                attrs.equipmentType = "DRE no VVPAT";
                attrs.make = "Diebold";
                attrs.model = "AccuVote-TSX";
                attrs.age = 15;
                attrs.os = "Windows CE";
                attrs.certification = "not certified";
                attrs.scanRate = 0;
                attrs.errorRate = "8%";
                attrs.reliability = "75%";
                attrs.isAvailable = false;
                attrs.description = "Legacy touchscreen voting system";
            }
        } else {
            attrs.equipmentType = "Scanner";
            attrs.make = "Dominion";
            attrs.model = "ImageCast";
            attrs.age = 7;
            attrs.os = "Embedded Linux";
            attrs.certification = "VVSG 2.0 certified";
            attrs.scanRate = 94;
            attrs.errorRate = "2%";
            attrs.reliability = "95%";
            attrs.isAvailable = true;
            attrs.description = "Digital optical scanner";
        }

        if (tabulationMethod.contains("Central Count")) {
            attrs.model += " Central";
            attrs.description += " (central count)";
            attrs.scanRate = attrs.scanRate > 0 ? attrs.scanRate + 3 : 0;
        }

        return attrs;
    }

    private String getStateAbbreviation(String state) {
        Map<String, String> stateMap = new HashMap<>();
        stateMap.put("arkansas", "AR");
        stateMap.put("maryland", "MD");
        stateMap.put("rhode island", "RI");
        stateMap.put("AR", "AR");
        stateMap.put("MD", "MD");
        stateMap.put("RI", "RI");

        String normalized = state.toLowerCase().trim();
        return stateMap.getOrDefault(normalized, state.toUpperCase());
    }

    private static class EquipmentProfile {
        String markingMethod;
        String tabulationMethod;
        int quantity;
        List<String> jurisdictions;
    }

    private static class EquipmentAttributes {
        String make;
        String model;
        String equipmentType;
        String description;
        int age;
        String os;
        String certification;
        int scanRate;
        String errorRate;
        String reliability;
        boolean isAvailable;
    }

    @GetMapping("/age/all-states")
    public List<Map<String, Object>> getAllStatesEquipmentAge() {
        Query query = new Query();
        query.addCriteria(Criteria.where("recordType").is("equipment_detail")
                .and("age").exists(true));
        List<Map> allEquipment = mongoTemplate.find(query, Map.class, "votingEquipmentDetails");

        Map<String, List<Integer>> stateAges = new HashMap<>();

        for (Map doc : allEquipment) {
            String stateAbbr = (String) doc.get("stateAbbr");
            if (stateAbbr == null)
                continue;

            String stateName = getStateName(stateAbbr);

            Object ageObj = doc.get("age");
            if (ageObj != null) {
                int age = ((Number) ageObj).intValue();
                stateAges.computeIfAbsent(stateName, k -> new ArrayList<>()).add(age);
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

    @GetMapping("/history/{state}")
    public List<Map<String, Object>> getEquipmentHistory(@PathVariable String state) {

        List<Map<String, Object>> series = new ArrayList<>();

        String[] categories = { "DRE no VVPAT", "DRE with VVPAT", "Ballot Marking Device", "Scanner" };

        for (String category : categories) {
            Map<String, Object> row = new HashMap<>();
            row.put("category", category);

            Map<String, Integer> byYear = new HashMap<>();
            for (int year = 2016; year <= 2024; year += 2) { // Federal election years
                Query query = new Query();
                query.addCriteria(Criteria.where("state").is(state)
                        .and("year").is(year)
                        .and("equipmentType").is(category));

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

    @GetMapping("/all-states")
    public List<Map<String, Object>> getAllStatesEquipment() {
        Query query = new Query();
        query.addCriteria(Criteria.where("recordType").is("equipment_detail"));
        List<Map> allEquipment = mongoTemplate.find(query, Map.class, "votingEquipmentDetails");

        Map<String, Map<String, Integer>> stateEquipmentCounts = new HashMap<>();

        for (Map doc : allEquipment) {
            String stateAbbr = (String) doc.get("stateAbbr");
            if (stateAbbr == null)
                continue;

            String stateFull = getStateName(stateAbbr);

            stateEquipmentCounts.putIfAbsent(stateFull, new HashMap<>());
            Map<String, Integer> counts = stateEquipmentCounts.get(stateFull);

            String equipmentType = (String) doc.get("equipmentType");
            if (equipmentType == null)
                equipmentType = "";

            String type = equipmentType.toUpperCase();

            if (type.contains("DRE") && !type.contains("VVPAT") && !type.contains("PAPER")) {
                counts.put("dreNoVVPAT", counts.getOrDefault("dreNoVVPAT", 0) + 1);
            } else if (type.contains("DRE") && (type.contains("VVPAT") || type.contains("PAPER"))) {
                counts.put("dreWithVVPAT", counts.getOrDefault("dreWithVVPAT", 0) + 1);
            } else if (type.contains("BALLOT MARKING") || type.contains("BMD")) {
                counts.put("ballotMarkingDevice", counts.getOrDefault("ballotMarkingDevice", 0) + 1);
            } else if (type.contains("SCANNER") || type.contains("OPTICAL")) {
                counts.put("scanner", counts.getOrDefault("scanner", 0) + 1);
            }
        }

        return stateEquipmentCounts.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("state", entry.getKey());
                    Map<String, Integer> counts = entry.getValue();
                    row.put("dre_no_vvpat", counts.getOrDefault("dreNoVVPAT", 0));
                    row.put("dre_with_vvpat", counts.getOrDefault("dreWithVVPAT", 0));
                    row.put("ballot_marking", counts.getOrDefault("ballotMarkingDevice", 0));
                    row.put("scanner", counts.getOrDefault("scanner", 0));
                    return row;
                })
                .filter(row -> row.get("state") != null)
                .sorted((a, b) -> ((String) a.get("state")).compareTo((String) b.get("state")))
                .toList();
    }

    @GetMapping("/summary")
    public List<Map<String, Object>> getEquipmentSummary() {
        Query query = new Query();
        query.addCriteria(Criteria.where("recordType").is("equipment_detail")
                .and("year").is(2024)
                .and("manufacturer").ne("Not Applicable"));

        List<Map> equipmentDetails = mongoTemplate.find(query, Map.class, "votingEquipmentDetails");

        Map<String, Map<String, Object>> aggregated = new HashMap<>();

        for (Map doc : equipmentDetails) {
            String manufacturer = (String) doc.get("manufacturer");
            String model = (String) doc.get("model");
            String equipmentType = (String) doc.get("equipmentType");

            if (manufacturer == null || model == null) {
                continue;
            }

            String key = manufacturer + ":" + model;

            if (!aggregated.containsKey(key)) {
                Map<String, Object> summary = new HashMap<>();
                summary.put("manufacturer", manufacturer);
                summary.put("model", model);
                summary.put("equipmentType", equipmentType);
                summary.put("count", 0);
                summary.put("totalAge", 0);
                summary.put("ageCount", 0);
                aggregated.put(key, summary);
            }

            Map<String, Object> summary = aggregated.get(key);
            summary.put("count", (Integer) summary.get("count") + 1);

            if (doc.get("age") != null) {
                try {
                    int age = (Integer) doc.get("age");
                    summary.put("totalAge", (Integer) summary.get("totalAge") + age);
                    summary.put("ageCount", (Integer) summary.get("ageCount") + 1);
                } catch (Exception e) {
                }
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int id = 1;

        for (Map.Entry<String, Map<String, Object>> entry : aggregated.entrySet()) {
            Map<String, Object> summary = entry.getValue();

            String manufacturer = (String) summary.get("manufacturer");
            String model = (String) summary.get("model");
            String equipmentType = (String) summary.get("equipmentType");
            int count = (Integer) summary.get("count");

            double averageAge = 7.0; // default
            int ageCount = (Integer) summary.get("ageCount");
            if (ageCount > 0) {
                averageAge = (double) (Integer) summary.get("totalAge") / ageCount;
            }

            String os = getOperatingSystem(model, equipmentType);
            String certification = getCertificationForEquipment(model, averageAge);
            double reliability = estimateReliabilityForEquipment(equipmentType, averageAge);

            Map<String, Object> row = new HashMap<>();
            row.put("id", id++);
            row.put("provider", manufacturer);
            row.put("model", model);
            row.put("quantity", count);
            row.put("age", Math.round(averageAge));
            row.put("os", os);
            row.put("certification", certification);
            row.put("scanRate", getScanRate(equipmentType));
            row.put("errorRate", getErrorRate(equipmentType, averageAge));
            row.put("reliability", reliability);
            row.put("qualityScore", calculateQualityScore(averageAge, reliability, certification));

            results.add(row);
        }

        results.sort((a, b) -> {
            int providerComp = ((String) a.get("provider")).compareTo((String) b.get("provider"));
            if (providerComp != 0)
                return providerComp;
            return ((String) a.get("model")).compareTo((String) b.get("model"));
        });

        return results;
    }

    private String getOperatingSystem(String model, String equipmentType) {
        if (equipmentType == null)
            return "Various";

        if (equipmentType.contains("Scanner") || equipmentType.contains("Ballot Marking")) {
            return "Embedded Linux";
        } else if (equipmentType.contains("DRE")) {
            return "Windows CE";
        }
        return "Various";
    }

    private String getCertificationForEquipment(String model, double age) {
        if (age < 5) {
            return "VVSG 2.0 certified";
        } else if (age < 10) {
            return "VVSG 1.1 certified";
        } else {
            return "VVSG 1.0 certified";
        }
    }

    private double estimateReliabilityForEquipment(String equipmentType, double age) {
        if (equipmentType == null)
            return 75.0;

        double baseReliability = 95.0;

        if (equipmentType.contains("Optical Scanner")) {
            baseReliability = 95.0; // High reliability
        } else if (equipmentType.contains("Ballot Marking")) {
            baseReliability = 96.0; // Very high reliability
        } else if (equipmentType.contains("DRE")) {
            baseReliability = 85.0; // Lower reliability
        }

        if (age > 5) {
            baseReliability -= (age - 5);
        }

        return Math.max(baseReliability, 70.0); // Minimum 70%
    }

    private double getScanRate(String equipmentType) {
        if (equipmentType == null)
            return 0.0;

        if (equipmentType.contains("Batch-Fed")) {
            return 300.0; // ballots per minute
        } else if (equipmentType.contains("Hand-Fed") || equipmentType.contains("Optical Scanner")) {
            return 94.0; // ballots per minute
        } else if (equipmentType.contains("Ballot Marking")) {
            return 95.0; // ballots per hour (slower)
        }
        return 0.0;
    }

    private double getErrorRate(String equipmentType, double age) {
        if (equipmentType == null)
            return 1.0;

        double baseError = 0.5;

        if (equipmentType.contains("Scanner")) {
            baseError = 2.0; // 2% error rate
        } else if (equipmentType.contains("Ballot Marking")) {
            baseError = 2.0; // 2% error rate
        } else if (equipmentType.contains("DRE")) {
            baseError = 3.0; // Higher error rate
        }

        if (age > 5) {
            baseError += (age - 5) * 0.1;
        }

        return Math.min(baseError, 5.0); // Maximum 5%
    }

    private double estimateAge(String tabulationMethod) {
        if (tabulationMethod == null)
            return 10.0;

        if (tabulationMethod.contains("Optical Scan")) {
            return 7.0; // Optical scan equipment
        } else if (tabulationMethod.contains("DRE")) {
            return 12.0; // DRE equipment is generally older
        }
        return 10.0; // Default
    }

    private double estimateReliability(String tabulationMethod) {
        if (tabulationMethod == null)
            return 50.0;

        if (tabulationMethod.contains("Optical Scan")) {
            return 90.0; // High reliability - paper trail
        } else if (tabulationMethod.contains("DRE") && tabulationMethod.contains("VVPAT")) {
            return 70.0; // Medium-high reliability
        } else if (tabulationMethod.contains("DRE")) {
            return 40.0; // Lower reliability - no paper trail
        }
        return 60.0; // Default
    }

    private String getCertificationForType(String equipmentType) {
        switch (equipmentType) {
            case "Scanner":
            case "Ballot Marking Device":
                return "VVSG 2.0 certified";
            case "DRE with VVPAT":
                return "VVSG 1.1 certified";
            case "DRE no VVPAT":
                return "VVSG 1.0 certified";
            default:
                return "not certified";
        }
    }

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

    private String estimateCertification(String tabulationMethod) {
        if (tabulationMethod == null)
            return "not certified";

        if (tabulationMethod.contains("Optical Scan")) {
            return "VVSG 2.0 certified"; // Modern optical scan systems
        } else if (tabulationMethod.contains("DRE") && tabulationMethod.contains("VVPAT")) {
            return "VVSG 1.1 certified"; // DRE with paper trail
        } else if (tabulationMethod.contains("DRE")) {
            return "VVSG 1.0 certified"; // Legacy DRE
        }
        return "not certified";
    }

    private double calculateQualityScore(double age, double reliability, String certification) {
        double ageScore = Math.max(0, 1.0 - (age / 15.0));

        double reliabilityScore = reliability / 100.0;

        double certificationScore;
        if (certification.contains("2.0 certified")) {
            certificationScore = 1.0; // Best - VVSG 2.0 certified
        } else if (certification.contains("2.0 applied")) {
            certificationScore = 0.9; // Near best - VVSG 2.0 applied
        } else if (certification.contains("1.1 certified")) {
            certificationScore = 0.7; // Good - VVSG 1.1 certified
        } else if (certification.contains("1.0 certified")) {
            certificationScore = 0.5; // Acceptable - VVSG 1.0 certified
        } else {
            certificationScore = 0.0; // not certified
        }

        double qualityScore = (reliabilityScore * 0.40) +
                (certificationScore * 0.35) +
                (ageScore * 0.25);

        return Math.round(qualityScore * 100.0) / 100.0;
    }

    private double average(List<Double> list) {
        if (list.isEmpty())
            return 0.0;
        double sum = list.stream().mapToDouble(Double::doubleValue).sum();
        return Math.round((sum / list.size()) * 100) / 100.0;
    }

    private double estimateAge(double ageScore) {
        return Math.round((1.0 - ageScore) * 15.0 * 10) / 10.0;
    }

    private String getCertificationStatus(double certScore) {
        if (certScore >= 0.9)
            return "VVSG 2.0 certified";
        if (certScore >= 0.7)
            return "VVSG 1.0/1.1 certified";
        if (certScore >= 0.5)
            return "State certified";
        return "Not certified";
    }

    @GetMapping("/vs-rejected/{state}")
    public List<Map<String, Object>> getEquipmentVsRejected(@PathVariable String state) {
        String stateAbbr = getStateAbbreviation(state);

        Query equipQuery = new Query();
        equipQuery.addCriteria(Criteria.where("stateAbbr").is(stateAbbr)
                .and("year").is(2024)
                .and("dataSource").is("VerifiedVoting.org"));

        List<Map> equipmentRecords = mongoTemplate.find(equipQuery, Map.class, "votingEquipmentData");

        Map<String, Double> equipQualityByJurisdiction = new HashMap<>();

        for (Map record : equipmentRecords) {
            String jurisdictionName = (String) record.get("jurisdiction");
            if (jurisdictionName == null)
                continue;

            String markingMethod = (String) record.get("markingMethod");
            String tabulationMethod = (String) record.get("tabulationMethod");

            if (markingMethod == null || tabulationMethod == null)
                continue;

            double qualityScore = calculateEquipmentQualityScore(markingMethod, tabulationMethod);

            String normalizedName = normalizeJurisdictionName(jurisdictionName);
            equipQualityByJurisdiction.put(normalizedName, qualityScore);
        }

        Query electionQuery = new Query();
        electionQuery.addCriteria(Criteria.where("stateAbbr").is(stateAbbr)
                .and("electionYear").is(2024)
                .and("electionType").is("Presidential"));
        List<Document> electionResults = mongoTemplate.find(electionQuery, Document.class, "electionResults");

        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("stateFull").is(state.toUpperCase()));
        List<Map> eavsData = mongoTemplate.find(eavsQuery, Map.class, "eavsData");

        List<Map<String, Object>> results = new ArrayList<>();

        for (Map eavs : eavsData) {
            String jurisdiction = (String) eavs.get("jurisdictionName");
            if (jurisdiction == null)
                continue;

            String normalizedJurisdiction = normalizeJurisdictionName(jurisdiction);

            Double equipQuality = equipQualityByJurisdiction.get(normalizedJurisdiction);

            if (equipQuality == null) {
                equipQuality = equipQualityByJurisdiction.get(jurisdiction.toUpperCase());
            }

            if (equipQuality == null) {
                equipQuality = 50.0; // Default medium quality
            }

            long totalRejected = safeLong(eavs.get("C9a"));

            if (totalRejected == 0)
                continue;

            long totalParticipated = safeLong(eavs.get("F1a")) + safeLong(eavs.get("F1b")) +
                    safeLong(eavs.get("F1d")) + safeLong(eavs.get("F1f"));

            if (totalParticipated == 0)
                continue;

            double rejectedPct = (totalRejected * 100.0) / totalParticipated;

            String countyNameForMatching = jurisdiction.toUpperCase().trim();
            if (countyNameForMatching.endsWith(" COUNTY")) {
                countyNameForMatching = countyNameForMatching.replace(" COUNTY", "").trim();
            } else if (countyNameForMatching.endsWith(" TOWN")) {
                countyNameForMatching = countyNameForMatching.replace(" TOWN", "").trim();
            } else if (countyNameForMatching.endsWith(" CITY")) {
                countyNameForMatching = countyNameForMatching.replace(" CITY", "").trim();
            }

            String party = null;
            for (Document electionDoc : electionResults) {
                String electionCounty = electionDoc.getString("county");
                if (electionCounty != null && electionCounty.equalsIgnoreCase(countyNameForMatching)) {
                    String dominantParty = electionDoc.getString("dominantParty");
                    if (dominantParty != null) {
                        party = dominantParty.toUpperCase().startsWith("R") ? "R" : "D";
                        break;
                    }
                }
            }

            if (party == null) {
                party = determineCountyPartyLean(state, jurisdiction);
            }

            double adjustedEquipQuality = adjustEquipmentQualityByCountyMetrics(
                    equipQuality,
                    eavs,
                    totalParticipated);

            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("county", jurisdiction);
            dataPoint.put("equipmentQuality", Math.round(adjustedEquipQuality * 10) / 10.0);
            dataPoint.put("rejectedPct", Math.round(rejectedPct * 1000) / 1000.0); // 3 decimal places
            dataPoint.put("party", party);
            dataPoint.put("totalRejected", totalRejected);
            dataPoint.put("totalBallots", totalParticipated);

            results.add(dataPoint);
        }

        return results;
    }

    private double adjustEquipmentQualityByCountyMetrics(double baseQuality, Map eavs, long totalVotes) {
        double adjustedQuality = baseQuality;

        long provisionalCast = safeLong(eavs.get("E1a"));
        if (totalVotes > 0 && provisionalCast > 0) {
            double provisionalRate = (provisionalCast * 100.0) / totalVotes;
            if (provisionalRate > 5.0) {
                adjustedQuality -= Math.min(5.0, (provisionalRate - 5.0) * 0.5);
            } else if (provisionalRate < 1.0) {
                adjustedQuality += 2.0;
            }
        }

        int fieldsWithData = 0;
        int fieldsChecked = 0;
        String[] fieldsToCheck = { "A1a", "C9a", "E1a", "F1a", "F1b", "F1d", "F1f" };
        for (String field : fieldsToCheck) {
            fieldsChecked++;
            if (safeLong(eavs.get(field)) > 0) {
                fieldsWithData++;
            }
        }
        double completeness = (double) fieldsWithData / fieldsChecked;
        if (completeness >= 0.9) {
            adjustedQuality += 3.0; // Well-managed counties report better
        } else if (completeness < 0.5) {
            adjustedQuality -= 4.0; // Poor reporting suggests issues
        }

        if (totalVotes > 200000) {
            adjustedQuality += 2.0; // Large counties often have more resources
        } else if (totalVotes < 10000) {
            adjustedQuality -= 2.0; // Small counties may have older equipment
        }

        long mailRejected = safeLong(eavs.get("C9a"));
        long mailCounted = safeLong(eavs.get("C7a"));
        if (mailCounted > 100) { // Only if meaningful sample size
            double mailRejectionRate = (mailRejected * 100.0) / mailCounted;
            if (mailRejectionRate > 2.0) {
                adjustedQuality -= Math.min(4.0, mailRejectionRate);
            }
        }

        adjustedQuality = Math.max(10.0, Math.min(100.0, adjustedQuality));

        return adjustedQuality;
    }

    private double calculateEquipmentQualityScore(String markingMethod, String tabulationMethod) {
        if (markingMethod == null || tabulationMethod == null)
            return 50.0;

        String marking = markingMethod.toUpperCase();
        String tabulation = tabulationMethod.toUpperCase();

        if (marking.contains("HAND MARKED") && tabulation.contains("OPTICAL")) {
            return 92.0;
        }

        if (marking.contains("BALLOT MARKING DEVICE") || marking.contains("BMD")) {
            return 82.0;
        }

        if (marking.contains("HAND MARKED") && marking.contains("BMD")) {
            return 78.0;
        }

        if (marking.contains("DRE") && (marking.contains("VVPAT") || marking.contains("PAPER"))) {
            return 60.0;
        }

        if (marking.contains("DRE") && !marking.contains("VVPAT") && !marking.contains("PAPER")) {
            return 20.0;
        }

        if (marking.contains("ACCESSIBLE")) {
            return 45.0;
        }

        return 50.0;
    }

    private String normalizeJurisdictionName(String name) {
        if (name == null)
            return "";

        String normalized = name.toUpperCase().trim();

        if (normalized.contains("TOWN OF ") && normalized.contains("(")) {
            int startIdx = normalized.indexOf("TOWN OF ") + 8;
            int endIdx = normalized.indexOf("(");
            if (endIdx > startIdx) {
                normalized = normalized.substring(startIdx, endIdx).trim();
            }
        } else if (normalized.contains("CITY OF ") && normalized.contains("(")) {
            int startIdx = normalized.indexOf("CITY OF ") + 8;
            int endIdx = normalized.indexOf("(");
            if (endIdx > startIdx) {
                normalized = normalized.substring(startIdx, endIdx).trim();
            }
        }

        normalized = normalized.replace(" COUNTY", "");
        normalized = normalized.replace(" PARISH", "");
        normalized = normalized.replace(" BOROUGH", "");
        normalized = normalized.replace(" MUNICIPALITY", "");
        normalized = normalized.replace(" CITY", "");
        normalized = normalized.replace(" TOWN", "");

        normalized = normalized.replaceAll("\\s+", " ").trim();

        return normalized;
    }

    private String determineCountyPartyLean(String state, String county) {

        String countyLower = county.toLowerCase();

        if (countyLower.contains("city") || countyLower.contains("baltimore") ||
                countyLower.contains("montgomery") || countyLower.contains("providence")) {
            return "D";
        }

        String[] democraticStates = { "Maryland", "Rhode Island", "California", "New York" };
        for (String demState : democraticStates) {
            if (state.equalsIgnoreCase(demState)) {
                return "D";
            }
        }

        return "R"; // Default Republican for other states
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

    @GetMapping("/vs-rejected-with-regression/{state}")
    public Map<String, Object> getEquipmentVsRejectedWithRegression(@PathVariable String state) {
        List<Map<String, Object>> dataPoints = getEquipmentVsRejected(state);

        List<double[]> republicanPoints = new ArrayList<>();
        List<double[]> democraticPoints = new ArrayList<>();

        for (Map<String, Object> point : dataPoints) {
            double x = ((Number) point.get("equipmentQuality")).doubleValue();
            double y = ((Number) point.get("rejectedPct")).doubleValue();
            String party = (String) point.get("party");

            if ("R".equals(party)) {
                republicanPoints.add(new double[] { x, y });
            } else {
                democraticPoints.add(new double[] { x, y });
            }
        }

        Map<String, Object> republicanRegression = calculatePowerRegression(republicanPoints, "R");
        Map<String, Object> democraticRegression = calculatePowerRegression(democraticPoints, "D");

        Map<String, Object> response = new HashMap<>();
        response.put("dataPoints", dataPoints);

        List<Map<String, Object>> regressionLines = new ArrayList<>();
        if (republicanRegression != null) {
            regressionLines.add(republicanRegression);
        }
        if (democraticRegression != null) {
            regressionLines.add(democraticRegression);
        }
        response.put("regressionLines", regressionLines);

        return response;
    }

    private Map<String, Object> calculatePowerRegression(List<double[]> points, String party) {
        if (points.size() < 3) {
            return null; // Not enough points for regression
        }

        List<double[]> validPoints = new ArrayList<>();
        for (double[] p : points) {
            if (p[0] > 0 && p[1] > 0) {
                validPoints.add(p);
            }
        }

        if (validPoints.size() < 3) {
            return calculateLinearRegression(points, party);
        }

        int n = validPoints.size();
        double sumLogX = 0, sumLogY = 0, sumLogXY = 0, sumLogX2 = 0;

        for (double[] p : validPoints) {
            double logX = Math.log(p[0]);
            double logY = Math.log(p[1]);
            sumLogX += logX;
            sumLogY += logY;
            sumLogXY += logX * logY;
            sumLogX2 += logX * logX;
        }

        double b = (n * sumLogXY - sumLogX * sumLogY) / (n * sumLogX2 - sumLogX * sumLogX);
        double logA = (sumLogY - b * sumLogX) / n;
        double a = Math.exp(logA);

        double meanLogY = sumLogY / n;
        double ssTot = 0, ssRes = 0;

        for (double[] p : validPoints) {
            double logX = Math.log(p[0]);
            double logY = Math.log(p[1]);
            double predictedLogY = logA + b * logX;
            ssTot += (logY - meanLogY) * (logY - meanLogY);
            ssRes += (logY - predictedLogY) * (logY - predictedLogY);
        }

        double r2 = (ssTot > 0) ? 1 - (ssRes / ssTot) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("party", party);
        result.put("type", "power");

        Map<String, Double> coefficients = new HashMap<>();
        coefficients.put("a", Math.round(a * 10000) / 10000.0);
        coefficients.put("b", Math.round(b * 10000) / 10000.0);
        result.put("coefficients", coefficients);

        result.put("r2", Math.round(r2 * 1000) / 1000.0);

        return result;
    }

    private Map<String, Object> calculateLinearRegression(List<double[]> points, String party) {
        if (points.size() < 2) {
            return null;
        }

        int n = points.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (double[] p : points) {
            sumX += p[0];
            sumY += p[1];
            sumXY += p[0] * p[1];
            sumX2 += p[0] * p[0];
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.0001) {
            return null; // Avoid division by zero
        }

        double m = (n * sumXY - sumX * sumY) / denominator;
        double c = (sumY - m * sumX) / n;

        double meanY = sumY / n;
        double ssTot = 0, ssRes = 0;

        for (double[] p : points) {
            double predictedY = m * p[0] + c;
            ssTot += (p[1] - meanY) * (p[1] - meanY);
            ssRes += (p[1] - predictedY) * (p[1] - predictedY);
        }

        double r2 = (ssTot > 0) ? 1 - (ssRes / ssTot) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("party", party);
        result.put("type", "linear");

        Map<String, Double> coefficients = new HashMap<>();
        coefficients.put("a", Math.round(c * 10000) / 10000.0); // intercept
        coefficients.put("b", Math.round(m * 10000) / 10000.0); // slope
        result.put("coefficients", coefficients);

        result.put("r2", Math.round(Math.max(0, r2) * 1000) / 1000.0);

        return result;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "equipment-controller");
    }

    private String getStateName(String abbr) {
        if (abbr == null)
            return null;
        Map<String, String> abbrToName = new HashMap<>();
        abbrToName.put("AL", "Alabama");
        abbrToName.put("AK", "Alaska");
        abbrToName.put("AZ", "Arizona");
        abbrToName.put("AR", "Arkansas");
        abbrToName.put("CA", "California");
        abbrToName.put("CO", "Colorado");
        abbrToName.put("CT", "Connecticut");
        abbrToName.put("DE", "Delaware");
        abbrToName.put("FL", "Florida");
        abbrToName.put("GA", "Georgia");
        abbrToName.put("HI", "Hawaii");
        abbrToName.put("ID", "Idaho");
        abbrToName.put("IL", "Illinois");
        abbrToName.put("IN", "Indiana");
        abbrToName.put("IA", "Iowa");
        abbrToName.put("KS", "Kansas");
        abbrToName.put("KY", "Kentucky");
        abbrToName.put("LA", "Louisiana");
        abbrToName.put("ME", "Maine");
        abbrToName.put("MD", "Maryland");
        abbrToName.put("MA", "Massachusetts");
        abbrToName.put("MI", "Michigan");
        abbrToName.put("MN", "Minnesota");
        abbrToName.put("MS", "Mississippi");
        abbrToName.put("MO", "Missouri");
        abbrToName.put("MT", "Montana");
        abbrToName.put("NE", "Nebraska");
        abbrToName.put("NV", "Nevada");
        abbrToName.put("NH", "New Hampshire");
        abbrToName.put("NJ", "New Jersey");
        abbrToName.put("NM", "New Mexico");
        abbrToName.put("NY", "New York");
        abbrToName.put("NC", "North Carolina");
        abbrToName.put("ND", "North Dakota");
        abbrToName.put("OH", "Ohio");
        abbrToName.put("OK", "Oklahoma");
        abbrToName.put("OR", "Oregon");
        abbrToName.put("PA", "Pennsylvania");
        abbrToName.put("RI", "Rhode Island");
        abbrToName.put("SC", "South Carolina");
        abbrToName.put("SD", "South Dakota");
        abbrToName.put("TN", "Tennessee");
        abbrToName.put("TX", "Texas");
        abbrToName.put("UT", "Utah");
        abbrToName.put("VT", "Vermont");
        abbrToName.put("VA", "Virginia");
        abbrToName.put("WA", "Washington");
        abbrToName.put("WV", "West Virginia");
        abbrToName.put("WI", "Wisconsin");
        abbrToName.put("WY", "Wyoming");
        abbrToName.put("DC", "District of Columbia");
        return abbrToName.getOrDefault(abbr.toUpperCase(), abbr);
    }
}
