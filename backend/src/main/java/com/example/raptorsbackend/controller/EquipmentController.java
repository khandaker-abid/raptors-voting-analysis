package com.example.raptorsbackend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
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

    /**
     * Raw VerifiedVoting equipment rows (jurisdiction-level) as imported by
     * Prepro-6b.
     *
     * This is intentionally "raw" so we can debug and demonstrate that all CSV rows
     * were imported, even when a state does not include make/model detail sections.
     *
     * Supports minimal filtering + pagination to avoid returning huge payloads.
     */
    @GetMapping("/raw")
    public Map<String, Object> getEquipmentRaw(
            @RequestParam(name = "stateAbbr", required = false) String stateAbbr,
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "equipmentType", required = false) String equipmentType,
            @RequestParam(name = "dataSource", defaultValue = "VerifiedVoting.org") String dataSource,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "pageSize", defaultValue = "200") Integer pageSize) {

        int safePage = page == null ? 0 : Math.max(0, page);
        int safePageSize = pageSize == null ? 200 : Math.min(2000, Math.max(1, pageSize));

        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (dataSource != null && !dataSource.isBlank()) {
            criteria.add(Criteria.where("dataSource").is(dataSource));
        }
        if (year != null) {
            criteria.add(Criteria.where("year").is(year));
        }
        if (equipmentType != null && !equipmentType.isBlank()) {
            criteria.add(Criteria.where("equipmentType").is(equipmentType));
        }
        if (stateAbbr != null && !stateAbbr.isBlank()) {
            criteria.add(Criteria.where("stateAbbr").is(stateAbbr.trim().toUpperCase()));
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, "votingEquipmentData");

        Query pageQuery = query
                .skip((long) safePage * (long) safePageSize)
                .limit(safePageSize);

        // Stable ordering for paging (where available)
        // Many docs include stateAbbr/year/jurisdiction; if not, Mongo falls back.
        // Note: Sorting requires import of Sort; keep it simple to avoid extra deps.
        List<Map<String, Object>> items = (List<Map<String, Object>>) (List<?>) mongoTemplate
                .find(pageQuery, Map.class, "votingEquipmentData");

        Map<String, Object> resp = new HashMap<>();
        resp.put("page", safePage);
        resp.put("pageSize", safePageSize);
        resp.put("total", total);
        resp.put("items", items);
        return resp;
    }

    @GetMapping("/{state}/types")
    @Cacheable(value = "equipmentTypes", key = "#state")
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
    @Cacheable(value = "equipmentDetails", key = "#state")
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
    @Cacheable("equipmentAgeAllStates")
    public List<Map<String, Object>> getAllStatesEquipmentAge() {
        // GUI-11: Equipment age choropleth for ALL 48 mainland states.
        // Use actual data where available, estimate for others based on national
        // averages.

        Map<String, List<Integer>> stateAges = new HashMap<>();

        // (1) States with detailed equipment records (votingEquipmentDetails)
        Query detailQuery = new Query();
        detailQuery.addCriteria(Criteria.where("recordType").is("equipment_detail"));
        List<Map> detailedEquipment = mongoTemplate.find(detailQuery, Map.class, "votingEquipmentDetails");

        Set<String> statesWithData = new HashSet<>();
        for (Map doc : detailedEquipment) {
            String stateAbbr = (String) doc.get("stateAbbr");
            if (stateAbbr == null)
                continue;

            String stateName = getStateName(stateAbbr);
            statesWithData.add(stateAbbr.toUpperCase());

            Object ageObj = doc.get("age");
            if (ageObj != null) {
                int age = ((Number) ageObj).intValue();
                stateAges.computeIfAbsent(stateName, k -> new ArrayList<>()).add(age);
            }
        }

        // (2) States with votingEquipmentData
        Query rawQuery = new Query();
        rawQuery.addCriteria(Criteria.where("year").is(2024)
                .and("dataSource").is("VerifiedVoting.org")
                .and("equipmentType").is("standard"));
        List<Map> rawEquipment = mongoTemplate.find(rawQuery, Map.class, "votingEquipmentData");

        for (Map doc : rawEquipment) {
            String stateAbbr = (String) doc.get("stateAbbr");
            if (stateAbbr == null)
                continue;

            if (statesWithData.contains(stateAbbr.toUpperCase()))
                continue;

            String stateName = getStateName(stateAbbr);
            statesWithData.add(stateAbbr.toUpperCase());

            String markingMethod = (String) doc.get("markingMethod");
            int estimatedAge = estimateAgeFromMethod(markingMethod);
            stateAges.computeIfAbsent(stateName, k -> new ArrayList<>()).add(estimatedAge);
        }

        // (3) Fill in ALL 48 mainland states with estimated ages based on national
        // average
        String[] allStates = {
                "AL", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
                "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
                "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
                "WV", "WI", "WY"
        };

        // Calculate national average from states we have data for
        double nationalAvg = stateAges.values().stream()
                .flatMap(List::stream)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(7.0);

        for (String abbr : allStates) {
            String stateName = getStateName(abbr);
            if (!statesWithData.contains(abbr)) {
                // Estimate age with some variation based on state characteristics
                int estimatedAge = estimateStateEquipmentAge(abbr, nationalAvg);
                stateAges.computeIfAbsent(stateName, k -> new ArrayList<>()).add(estimatedAge);
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
        })
                .sorted((a, b) -> ((String) a.get("state")).compareTo((String) b.get("state")))
                .toList();
    }

    private int estimateStateEquipmentAge(String stateAbbr, double nationalAvg) {
        // States known for newer equipment (recent upgrades post-2020)
        Set<String> newerEquipmentStates = Set.of("GA", "PA", "MI", "WI", "AZ", "NV", "CO", "VA");
        // States known for older equipment
        Set<String> olderEquipmentStates = Set.of("LA", "MS", "NJ", "SC", "IN", "KY", "TN");

        if (newerEquipmentStates.contains(stateAbbr)) {
            return (int) Math.max(3, nationalAvg - 2);
        } else if (olderEquipmentStates.contains(stateAbbr)) {
            return (int) Math.min(12, nationalAvg + 3);
        }
        return (int) Math.round(nationalAvg);
    }

    private int estimateAgeFromMethod(String markingMethod) {
        if (markingMethod == null)
            return 7;
        String m = markingMethod.toLowerCase();
        if (m.contains("dre")) {
            return 12; // DREs tend to be older systems
        } else if (m.contains("bmd") || m.contains("ballot marking")) {
            return 5; // BMDs are newer
        } else if (m.contains("hand marked")) {
            return 8; // Scanners for hand-marked ballots
        }
        return 7; // Default
    }

    @GetMapping("/history/{state}")
    @Cacheable(value = "equipmentHistory", key = "#state")
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
    @Cacheable("equipmentAllStates")
    public List<Map<String, Object>> getAllStatesEquipment() {
        Query query = new Query();
        query.addCriteria(Criteria.where("recordType").is("equipment_detail"));
        List<Map> allEquipment = mongoTemplate.find(query, Map.class, "votingEquipmentDetails");

        // Fallback for local/dev when Mongo is not seeded.
        if (allEquipment.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                List<Map<String, Object>> sample = mapper.readValue(
                        new ClassPathResource("data/every-state-all-models-data.json").getInputStream(),
                        new TypeReference<List<Map<String, Object>>>() {
                        });
                allEquipment = (List<Map>) (List<?>) sample;
            } catch (Exception e) {
                return List.of();
            }
        }

        Map<String, Map<String, Integer>> stateEquipmentCounts = new HashMap<>();

        for (Map doc : allEquipment) {
            String stateAbbr = (String) doc.get("stateAbbr");
            if (stateAbbr == null) {
                String stateNameDirect = (String) doc.get("stateName");
                if (stateNameDirect == null)
                    continue;
                stateEquipmentCounts.putIfAbsent(stateNameDirect, new HashMap<>());
                Map<String, Integer> counts = stateEquipmentCounts.get(stateNameDirect);
                String equipmentType = (String) doc.get("equipmentType");
                if (equipmentType != null) {
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
                continue;
            }

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
    @Cacheable("equipmentSummary")
    public List<Map<String, Object>> getEquipmentSummary() {
        // GUI-13: Nationwide 2024 summary of ALL voting equipment models from master
        // specs.
        // Show every active equipment model with its specifications.
        // For quantity, we use actual usage data where available, otherwise show as "In
        // Use" indicator.

        // Load all equipment from master spreadsheet
        Query specsQuery = new Query();
        specsQuery.addCriteria(Criteria.where("dataSource").is("master_spreadsheet"));
        List<Map> allSpecs = mongoTemplate.find(specsQuery, Map.class, "equipmentSpecifications");

        // Build usage counts from actual equipment data (votingEquipmentDetails +
        // votingEquipmentData)
        Map<String, Integer> usageCounts = new HashMap<>();

        // Count from detailed equipment records
        Query detailQuery = new Query();
        detailQuery.addCriteria(Criteria.where("recordType").is("equipment_detail").and("year").is(2024));
        List<Map> equipmentDetails = mongoTemplate.find(detailQuery, Map.class, "votingEquipmentDetails");
        for (Map doc : equipmentDetails) {
            String mfr = safeTrim((String) doc.get("manufacturer"));
            String model = safeTrim((String) doc.get("model"));
            if (mfr != null && model != null) {
                String key = buildKey(mfr, model);
                usageCounts.put(key, usageCounts.getOrDefault(key, 0) + 1);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int id = 1;

        for (Map spec : allSpecs) {
            String manufacturer = safeTrim((String) spec.get("manufacturer"));
            String model = safeTrim((String) spec.get("model"));
            String equipmentType = safeTrim((String) spec.get("equipmentType"));
            Object discontinuedObj = spec.get("discontinued");

            if (manufacturer == null || model == null)
                continue;

            // Skip electronic poll books, internet voting, remote ballot marking for
            // equipment summary
            if (equipmentType != null && (equipmentType.contains("Poll Book") ||
                    equipmentType.contains("Internet") ||
                    equipmentType.contains("Remote Ballot"))) {
                continue;
            }

            String key = buildKey(manufacturer, model);
            int quantity = usageCounts.getOrDefault(key, 0);

            // Calculate age from firstManufactured
            Double ageYears = null;
            Object firstMfr = spec.get("firstManufactured");
            if (firstMfr != null) {
                Integer firstYear = parseYear(firstMfr);
                if (firstYear != null && firstYear > 1900 && firstYear <= 2025) {
                    ageYears = (double) (2025 - firstYear);
                }
            }
            if (ageYears == null) {
                ageYears = 7.0; // Default
            }

            String os = safeTrim((String) spec.get("os"));
            if (os == null || os.isEmpty()) {
                os = getOperatingSystem(model, equipmentType);
            }

            String certification = safeTrim((String) spec.get("certificationLevel"));
            if (certification == null || certification.isEmpty()) {
                certification = getCertificationForEquipment(model, ageYears);
            }

            Double scanRate = parseScanRate(spec.get("scanningRate"));
            if (scanRate == null) {
                scanRate = getScanRate(equipmentType);
            }

            double reliability = estimateReliabilityForEquipment(equipmentType, ageYears);
            double qualityScore = calculateQualityScore(ageYears, reliability, certification);

            // Handle discontinued as Boolean or String
            boolean isDiscontinued = false;
            if (discontinuedObj instanceof Boolean) {
                isDiscontinued = (Boolean) discontinuedObj;
            } else if (discontinuedObj instanceof String) {
                isDiscontinued = "TRUE".equalsIgnoreCase((String) discontinuedObj);
            }

            // Skip discontinued equipment
            if (isDiscontinued)
                continue;

            Map<String, Object> row = new HashMap<>();
            row.put("id", id++);
            row.put("provider", manufacturer);
            row.put("model", model);
            row.put("equipmentType", equipmentType != null ? equipmentType : "Unknown");
            row.put("quantity", quantity);
            row.put("age", Math.round(ageYears));
            row.put("os", os);
            row.put("certification", certification);
            row.put("scanRate", scanRate);
            row.put("errorRate", getErrorRate(equipmentType, ageYears));
            row.put("reliability", reliability);
            row.put("qualityScore", Math.round(qualityScore * 100) / 100.0);
            row.put("isAvailable", !isDiscontinued);

            results.add(row);
        }

        // Sort by provider, then model
        results.sort((a, b) -> {
            int providerComp = ((String) a.get("provider")).compareTo((String) b.get("provider"));
            if (providerComp != 0)
                return providerComp;
            return ((String) a.get("model")).compareTo((String) b.get("model"));
        });

        // Reassign IDs after sorting
        for (int i = 0; i < results.size(); i++) {
            results.get(i).put("id", i + 1);
        }

        return results;
    }

    private Integer parseYear(Object value) {
        if (value == null)
            return null;
        String s = value.toString().trim();
        // Handle formats like "2014", "3/20/2014", "6/30/2015"
        if (s.contains("/")) {
            String[] parts = s.split("/");
            if (parts.length == 3) {
                try {
                    return Integer.parseInt(parts[2]);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String safeTrim(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static Integer safeInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Integer i) {
            return i;
        }
        if (value instanceof Long l) {
            return l.intValue();
        }
        if (value instanceof Double d) {
            return d.intValue();
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static String buildKey(String provider, String model) {
        return (provider == null ? "" : provider.trim().toLowerCase()) + ":"
                + (model == null ? "" : model.trim().toLowerCase());
    }

    private static class SummaryAccumulator {
        String provider;
        String model;
        String equipmentType;
        int quantity;
        int totalAge;
        int ageCount;

        static SummaryAccumulator create(String provider, String model, String equipmentType) {
            SummaryAccumulator acc = new SummaryAccumulator();
            acc.provider = provider;
            acc.model = model;
            acc.equipmentType = equipmentType != null ? equipmentType : "Unknown";
            acc.quantity = 0;
            acc.totalAge = 0;
            acc.ageCount = 0;
            return acc;
        }
    }

    private static class ProviderModel {
        String provider;
        String model;
        String equipmentType;
    }

    private ProviderModel inferProviderModelFromMethods(String markingMethod, String tabulationMethod) {
        ProviderModel pm = new ProviderModel();

        pm.equipmentType = normalizeEquipmentType(determineEquipmentTypeFromMethods(
                markingMethod == null ? "" : markingMethod,
                tabulationMethod == null ? "" : tabulationMethod));

        if (markingMethod == null) {
            markingMethod = "";
        }
        if (tabulationMethod == null) {
            tabulationMethod = "";
        }

        String m = markingMethod.toLowerCase();
        String t = tabulationMethod.toLowerCase();

        // Expanded mapping of marking/tabulation patterns to common equipment.
        // Each distinct profile gets its own row so the summary is representative.
        if (m.contains("hand marked") && m.contains("bmd")) {
            // Mixed: hand-marked + BMD option
            pm.provider = "Mixed";
            pm.model = "Hand Marked + BMD";
        } else if (m.contains("hand marked")) {
            // Pure hand-marked paper
            if (t.contains("central count") || t.contains("batch")) {
                pm.provider = "ES&S";
                pm.model = "DS850";
            } else {
                pm.provider = "ES&S";
                pm.model = "DS200";
            }
        } else if (m.contains("ballot marking") || m.contains("bmd")) {
            // BMD for all voters
            if (m.contains("expressvote")) {
                pm.provider = "ES&S";
                pm.model = "ExpressVote";
            } else if (m.contains("imagecast")) {
                pm.provider = "Dominion";
                pm.model = "ImageCast X";
            } else if (m.contains("verity")) {
                pm.provider = "Hart InterCivic";
                pm.model = "Verity Touch";
            } else {
                pm.provider = "Various";
                pm.model = "BMD (All Voters)";
            }
        } else if (m.contains("dre")) {
            if (m.contains("vvpat") || m.contains("paper")) {
                pm.provider = "Various";
                pm.model = "DRE with VVPAT";
            } else {
                pm.provider = "Various";
                pm.model = "DRE (No Paper Trail)";
            }
        } else {
            // Fallback: create a synthetic profile from the methods themselves.
            String markingLabel = markingMethod.trim();
            String tabulationLabel = tabulationMethod.trim();
            if (!markingLabel.isEmpty() || !tabulationLabel.isEmpty()) {
                pm.provider = "Various";
                pm.model = (markingLabel.isEmpty() ? "Unknown" : markingLabel)
                        + " / " + (tabulationLabel.isEmpty() ? "Unknown" : tabulationLabel);
            } else {
                pm.provider = "Unknown";
                pm.model = "Unknown";
            }
        }

        return pm;
    }

    private Map<String, Map<String, Object>> loadEquipmentSpecsByKey() {
        Query q = new Query();
        q.addCriteria(Criteria.where("dataSource").is("master_spreadsheet"));
        List<Map> specs = mongoTemplate.find(q, Map.class, "equipmentSpecifications");

        Map<String, Map<String, Object>> map = new HashMap<>();
        for (Map spec : specs) {
            String manufacturer = safeTrim((String) spec.get("manufacturer"));
            String model = safeTrim((String) spec.get("model"));
            if (manufacturer == null || model == null) {
                continue;
            }
            map.put(buildKey(manufacturer, model), (Map<String, Object>) spec);
        }
        return map;
    }

    private Double parseScanRate(Object scanningRate) {
        if (scanningRate == null) {
            return null;
        }
        if (scanningRate instanceof Number n) {
            return n.doubleValue();
        }
        String s = scanningRate.toString().trim().toLowerCase();
        if (s.isEmpty() || s.equals("n/a") || s.equals("na") || s.equals("0")) {
            return null;
        }

        // Common pattern: "300 ballots/min" or "50-60 ballots/min".
        try {
            if (s.contains("ballots") && s.contains("/min")) {
                // Take the last numeric component if it's a range.
                String[] parts = s.split("ballots")[0].trim().split("-");
                String last = parts[parts.length - 1].trim();
                return Double.parseDouble(last);
            }
        } catch (Exception e) {
            // fall through
        }
        return null;
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
    @Cacheable(value = "equipmentVsRejected", key = "#state")
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
    @Cacheable(value = "equipmentVsRejectedRegression", key = "#state")
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

        Map<String, Object> response = new HashMap<>();
        response.put("dataPoints", dataPoints);

        // Prefer quadratic regression when available; otherwise fall back to
        // exponential, power, then linear
        Map<String, Object> repReg = calculateQuadraticRegression(republicanPoints, "R");
        if (repReg == null)
            repReg = calculateExponentialRegression(republicanPoints, "R");
        if (repReg == null)
            repReg = calculatePowerRegression(republicanPoints, "R");
        if (repReg == null)
            repReg = calculateLinearRegression(republicanPoints, "R");

        Map<String, Object> demReg = calculateQuadraticRegression(democraticPoints, "D");
        if (demReg == null)
            demReg = calculateExponentialRegression(democraticPoints, "D");
        if (demReg == null)
            demReg = calculatePowerRegression(democraticPoints, "D");
        if (demReg == null)
            demReg = calculateLinearRegression(democraticPoints, "D");

        List<Map<String, Object>> regressionLines = new ArrayList<>();
        if (repReg != null)
            regressionLines.add(repReg);
        if (demReg != null)
            regressionLines.add(demReg);
        response.put("regressionLines", regressionLines);

        return response;
    }

    // Quadratic regression: fits y = a*x^2 + b*x + c
    private Map<String, Object> calculateQuadraticRegression(List<double[]> points, String party) {
        if (points.size() < 3) {
            return null; // Not enough points for regression
        }

        int n = points.size();
        double sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        double sumY = 0, sumXY = 0, sumX2Y = 0;
        for (double[] p : points) {
            double x = p[0];
            double y = p[1];
            sumX += x;
            sumX2 += x * x;
            sumX3 += x * x * x;
            sumX4 += x * x * x * x;
            sumY += y;
            sumXY += x * y;
            sumX2Y += x * x * y;
        }

        // Solve the normal equations for quadratic regression
        // | n sumX sumX2 | | c | | sumY |
        // | sumX sumX2 sumX3 | * | b | = | sumXY |
        // | sumX2 sumX3 sumX4 | | a | | sumX2Y |

        double[][] A = {
                { n, sumX, sumX2 },
                { sumX, sumX2, sumX3 },
                { sumX2, sumX3, sumX4 }
        };
        double[] B = { sumY, sumXY, sumX2Y };

        double[] coeffs = solve3x3(A, B);
        if (coeffs == null)
            return null;
        double c = coeffs[0], b = coeffs[1], a = coeffs[2];

        // Calculate R^2
        double meanY = sumY / n;
        double ssTot = 0, ssRes = 0;
        for (double[] p : points) {
            double x = p[0];
            double y = p[1];
            double yPred = a * x * x + b * x + c;
            ssTot += (y - meanY) * (y - meanY);
            ssRes += (y - yPred) * (y - yPred);
        }
        double r2 = (ssTot > 0) ? 1 - (ssRes / ssTot) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("party", party);
        result.put("type", "quadratic");
        Map<String, String> coefficients = new HashMap<>();
        // Round coefficients to 4 decimal places for display
        coefficients.put("a", String.format("%.4f", a));
        coefficients.put("b", String.format("%.4f", b));
        coefficients.put("c", String.format("%.4f", c));
        result.put("coefficients", coefficients);
        result.put("r2", Math.round(r2 * 1000) / 1000.0);
        return result;
    }

    // Helper to solve 3x3 linear system (Ax = B)
    private double[] solve3x3(double[][] A, double[] B) {
        double a00 = A[0][0], a01 = A[0][1], a02 = A[0][2];
        double a10 = A[1][0], a11 = A[1][1], a12 = A[1][2];
        double a20 = A[2][0], a21 = A[2][1], a22 = A[2][2];
        double b0 = B[0], b1 = B[1], b2 = B[2];

        double det = a00 * (a11 * a22 - a12 * a21)
                - a01 * (a10 * a22 - a12 * a20)
                + a02 * (a10 * a21 - a11 * a20);
        if (Math.abs(det) < 1e-12)
            return null;

        double det0 = b0 * (a11 * a22 - a12 * a21)
                - a01 * (b1 * a22 - a12 * b2)
                + a02 * (b1 * a21 - a11 * b2);
        double det1 = a00 * (b1 * a22 - a12 * b2)
                - b0 * (a10 * a22 - a12 * a20)
                + a02 * (a10 * b2 - b1 * a20);
        double det2 = a00 * (a11 * b2 - b1 * a21)
                - a01 * (a10 * b2 - b1 * a20)
                + b0 * (a10 * a21 - a11 * a20);

        return new double[] { det0 / det, det1 / det, det2 / det };
    }

    // Exponential regression: fits y = a * exp(bx)
    private Map<String, Object> calculateExponentialRegression(List<double[]> points, String party) {
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
        double sumX = 0, sumLogY = 0, sumX2 = 0, sumXLogY = 0;
        for (double[] p : validPoints) {
            double x = p[0];
            double logY = Math.log(p[1]);
            sumX += x;
            sumLogY += logY;
            sumX2 += x * x;
            sumXLogY += x * logY;
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.0001) {
            return null; // Avoid division by zero
        }

        double b = (n * sumXLogY - sumX * sumLogY) / denominator;
        double logA = (sumLogY - b * sumX) / n;
        double a = Math.exp(logA);

        // Calculate R^2
        double meanLogY = sumLogY / n;
        double ssTot = 0, ssRes = 0;
        for (double[] p : validPoints) {
            double x = p[0];
            double logY = Math.log(p[1]);
            double predictedLogY = logA + b * x;
            ssTot += (logY - meanLogY) * (logY - meanLogY);
            ssRes += (logY - predictedLogY) * (logY - predictedLogY);
        }
        double r2 = (ssTot > 0) ? 1 - (ssRes / ssTot) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("party", party);
        result.put("type", "exponential");

        Map<String, String> coefficients = new HashMap<>();
        coefficients.put("a", String.format("%.8g", a));
        coefficients.put("b", String.format("%.8g", b));
        result.put("coefficients", coefficients);

        result.put("r2", Math.round(r2 * 1000) / 1000.0);

        return result;
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

        Map<String, String> coefficients = new HashMap<>();
        coefficients.put("a", String.format("%.8g", a));
        coefficients.put("b", String.format("%.8g", b));
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
