package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.*;

@RestController
@RequestMapping("/api/eavs")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class EAVSController {

    @Autowired
    private MongoTemplate mongoTemplate;

    private static final Map<String, String> STATE_ABBR_MAP;
    private static final Map<String, String> RI_TOWN_TO_COUNTY_MAP;
    private static final List<Integer> DROPBOX_YEAR_PRIORITY;

    static {
        Map<String, String> map = new HashMap<>();
        map.put("ALABAMA", "AL");
        map.put("ALASKA", "AK");
        map.put("ARIZONA", "AZ");
        map.put("ARKANSAS", "AR");
        map.put("CALIFORNIA", "CA");
        map.put("COLORADO", "CO");
        map.put("CONNECTICUT", "CT");
        map.put("DELAWARE", "DE");
        map.put("DISTRICT OF COLUMBIA", "DC");
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
        STATE_ABBR_MAP = Collections.unmodifiableMap(map);

        Map<String, String> riMap = new HashMap<>();
        riMap.put("BARRINGTON TOWN", "BRISTOL COUNTY");
        riMap.put("BRISTOL TOWN", "BRISTOL COUNTY");
        riMap.put("WARREN TOWN", "BRISTOL COUNTY");
        riMap.put("COVENTRY TOWN", "KENT COUNTY");
        riMap.put("EAST GREENWICH TOWN", "KENT COUNTY");
        riMap.put("WARWICK CITY", "KENT COUNTY");
        riMap.put("WEST GREENWICH TOWN", "KENT COUNTY");
        riMap.put("WEST WARWICK TOWN", "KENT COUNTY");
        riMap.put("JAMESTOWN TOWN", "NEWPORT COUNTY");
        riMap.put("LITTLE COMPTON TOWN", "NEWPORT COUNTY");
        riMap.put("MIDDLETOWN TOWN", "NEWPORT COUNTY");
        riMap.put("NEWPORT CITY", "NEWPORT COUNTY");
        riMap.put("PORTSMOUTH TOWN", "NEWPORT COUNTY");
        riMap.put("TIVERTON TOWN", "NEWPORT COUNTY");
        riMap.put("BURRILLVILLE TOWN", "PROVIDENCE COUNTY");
        riMap.put("CENTRAL FALLS CITY", "PROVIDENCE COUNTY");
        riMap.put("CRANSTON CITY", "PROVIDENCE COUNTY");
        riMap.put("CUMBERLAND TOWN", "PROVIDENCE COUNTY");
        riMap.put("EAST PROVIDENCE CITY", "PROVIDENCE COUNTY");
        riMap.put("FOSTER TOWN", "PROVIDENCE COUNTY");
        riMap.put("GLOCESTER TOWN", "PROVIDENCE COUNTY");
        riMap.put("JOHNSTON TOWN", "PROVIDENCE COUNTY");
        riMap.put("LINCOLN TOWN", "PROVIDENCE COUNTY");
        riMap.put("NORTH PROVIDENCE TOWN", "PROVIDENCE COUNTY");
        riMap.put("NORTH SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        riMap.put("PAWTUCKET CITY", "PROVIDENCE COUNTY");
        riMap.put("PROVIDENCE CITY", "PROVIDENCE COUNTY");
        riMap.put("SCITUATE TOWN", "PROVIDENCE COUNTY");
        riMap.put("SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        riMap.put("WOONSOCKET CITY", "PROVIDENCE COUNTY");
        riMap.put("CHARLESTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("EXETER TOWN", "WASHINGTON COUNTY");
        riMap.put("HOPKINTON TOWN", "WASHINGTON COUNTY");
        riMap.put("NARRAGANSETT TOWN", "WASHINGTON COUNTY");
        riMap.put("NEW SHOREHAM TOWN", "WASHINGTON COUNTY");
        riMap.put("NORTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("RICHMOND TOWN", "WASHINGTON COUNTY");
        riMap.put("SOUTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        riMap.put("WESTERLY TOWN", "WASHINGTON COUNTY");
        RI_TOWN_TO_COUNTY_MAP = Collections.unmodifiableMap(riMap);

        DROPBOX_YEAR_PRIORITY = List.of(2024, 2020);
    }

    @GetMapping("/{state}/active-voters")
    @Cacheable(value = "activeVoters", key = "#state + '-' + #year")
    public List<Map<String, Object>> getActiveVoters(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        Query query = new Query();

        query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        List<Map<String, Object>> processedResults = results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("activeVoters", doc.get("A1b"));
            row.put("inactiveVoters", doc.get("A1c"));
            row.put("totalVoters", doc.get("A1a"));

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

        if (state.equalsIgnoreCase("RHODE ISLAND")) {
            return aggregateRhodeIslandActiveVotersToCounties(processedResults, year);
        }

        return processedResults;
    }

    @GetMapping("/{state}/provisional-ballots")
    @Cacheable(value = "provisionalBallots", key = "#state + '-' + #year")
    public List<Map<String, Object>> getProvisionalBallots(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        Query query = new Query();

        query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));

        List<Map<String, Object>> results = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class,
                "eavsData");

        return results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("county", doc.get("jurisdictionName"));
            row.put("geographicUnit", doc.get("jurisdictionName"));

            row.put("E1a", doc.getOrDefault("E1a", 0));
            row.put("totalProvisionalBallots", doc.getOrDefault("E1a", 0));

            row.put("E2a", doc.getOrDefault("E2a", 0));
            row.put("E2b", doc.getOrDefault("E2b", 0));
            row.put("E2c", doc.getOrDefault("E2c", 0));
            row.put("E2d", doc.getOrDefault("E2d", 0));
            row.put("E2e", doc.getOrDefault("E2e", 0));
            row.put("E2f", doc.getOrDefault("E2f", 0));
            row.put("E2g", doc.getOrDefault("E2g", 0));
            row.put("E2h", doc.getOrDefault("E2h", 0));
            row.put("E2i", doc.getOrDefault("E2i", 0));

            return row;
        }).toList();
    }

    @GetMapping("/{state}/pollbook-deletions")
    @Cacheable(value = "pollbookDeletions", key = "#state + '-' + #year")
    public List<Map<String, Object>> getPollbookDeletions(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        List<Map<String, Object>> results = null;
        int actualYear = year;

        for (int tryYear : Arrays.asList(year, 2020, 2016)) {
            Query query = new Query();
            query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(tryYear));

            List<Map<String, Object>> tempResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query,
                    Map.class, "eavsData");

            if (!tempResults.isEmpty()) {
                results = tempResults;
                actualYear = tryYear;
                break;
            }
        }

        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        final int finalYear = actualYear;
        List<Map<String, Object>> processedResults = results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("dataYear", finalYear);

            row.put("A12b_Death", doc.getOrDefault("A12b", 0));
            row.put("A12c_Moved", doc.getOrDefault("A12c", 0));
            row.put("A12d_Felon", doc.getOrDefault("A12d", 0));
            row.put("A12e_MentalIncap", doc.getOrDefault("A12e", 0));
            row.put("A12f_Requested", doc.getOrDefault("A12f", 0));
            row.put("A12g_FailedToVote", doc.getOrDefault("A12g", 0));
            row.put("A12h_Other", doc.getOrDefault("A12h", 0));

            int total = 0;
            for (String field : Arrays.asList("A12b", "A12c", "A12d", "A12e", "A12f", "A12g", "A12h")) {
                Object val = doc.get(field);
                if (val != null) {
                    total += ((Number) val).intValue();
                }
            }
            row.put("total", total);

            Object totalRegistered = doc.get("A1a");
            row.put("_totalRegistered", totalRegistered != null ? ((Number) totalRegistered).doubleValue() : 0.0);

            double deletionPercentage = 0.0;
            if (totalRegistered != null && total > 0) {
                double registered = ((Number) totalRegistered).doubleValue();
                if (registered > 0) {
                    deletionPercentage = Math.round((total / registered) * 100 * 10) / 10.0;
                }
            }
            row.put("deletionPercentage", deletionPercentage);

            return row;
        }).toList();

        if (state.equalsIgnoreCase("RHODE ISLAND")) {
            return aggregateRhodeIslandPollbookToCounties(processedResults, finalYear);
        }

        return processedResults;
    }

    @GetMapping("/{state}/mail-rejections")
    @Cacheable(value = "mailRejections", key = "#state + '-' + #year")
    public List<Map<String, Object>> getMailRejections(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        List<Map<String, Object>> results = null;
        int actualYear = year;

        for (int tryYear : Arrays.asList(year, 2020, 2016)) {
            Query query = new Query();

            query.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(tryYear));

            List<Map<String, Object>> tempResults = (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query,
                    Map.class, "eavsData");

            if (!tempResults.isEmpty()) {
                results = tempResults;
                actualYear = tryYear;
                break;
            }
        }

        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        final int finalYear = actualYear;
        List<Map<String, Object>> processedResults = results.stream().map(doc -> {
            Map<String, Object> row = new HashMap<>();
            row.put("geographicUnit", doc.get("jurisdictionName"));
            row.put("dataYear", finalYear);

            java.util.function.Function<String, Integer> getIntOrZero = field -> {
                Object val = doc.get(field);
                return (val != null) ? ((Number) val).intValue() : 0;
            };

            row.put("C9b_NoSignature", getIntOrZero.apply("C9b"));
            row.put("C9c_SigMismatch", getIntOrZero.apply("C9c"));
            row.put("C9d_ReceivedLate", getIntOrZero.apply("C9d"));
            row.put("C9e_MissingInfo", getIntOrZero.apply("C9e"));
            row.put("C9f_NotRegistered", getIntOrZero.apply("C9f"));
            row.put("C9g_WrongEnvelope", getIntOrZero.apply("C9g"));
            row.put("C9h_Other", getIntOrZero.apply("C9h"));

            int total = getIntOrZero.apply("C9a");
            if (total == 0) {
                for (String field : Arrays.asList("C9b", "C9c", "C9d", "C9e", "C9f", "C9g", "C9h")) {
                    total += getIntOrZero.apply(field);
                }
            }
            row.put("total", total);

            Object castBallots = doc.get("C3a");
            row.put("_castBallots", castBallots != null ? ((Number) castBallots).doubleValue() : 0.0);

            double rejectionPercentage = 0.0;
            Object transmittedBallots = doc.get("C1a");
            double denominator = 0.0;

            if (castBallots != null) {
                denominator = ((Number) castBallots).doubleValue() + total;
            } else if (transmittedBallots != null) {
                denominator = ((Number) transmittedBallots).doubleValue();
            }

            if (denominator > 0 && total > 0) {
                rejectionPercentage = Math.round((total / denominator) * 100 * 10) / 10.0;
            }

            row.put("rejectionPercentage", rejectionPercentage);
            return row;
        }).toList();

        if (state.equalsIgnoreCase("RHODE ISLAND")) {
            return aggregateRhodeIslandToCounties(processedResults, finalYear);
        }

        return processedResults;
    }

    private List<Map<String, Object>> aggregateRhodeIslandToCounties(List<Map<String, Object>> townData, int year) {
        Map<String, String> townToCounty = getRhodeIslandTownToCountyMapping();

        Map<String, Map<String, Object>> countyAggregates = new HashMap<>();

        for (Map<String, Object> town : townData) {
            String townName = (String) town.get("geographicUnit");
            String county = townToCounty.get(townName);

            if (county == null) {
                continue;
            }

            Map<String, Object> countyData = countyAggregates.computeIfAbsent(county, k -> {
                Map<String, Object> newCounty = new HashMap<>();
                newCounty.put("geographicUnit", k);
                newCounty.put("dataYear", year);
                newCounty.put("C9b_NoSignature", 0);
                newCounty.put("C9c_SigMismatch", 0);
                newCounty.put("C9d_ReceivedLate", 0);
                newCounty.put("C9e_MissingInfo", 0);
                newCounty.put("C9f_NotRegistered", 0);
                newCounty.put("C9g_WrongEnvelope", 0);
                newCounty.put("C9h_Other", 0);
                newCounty.put("total", 0);
                newCounty.put("_castBallots", 0.0);
                return newCounty;
            });

            for (String field : Arrays.asList("C9b_NoSignature", "C9c_SigMismatch", "C9d_ReceivedLate",
                    "C9e_MissingInfo", "C9f_NotRegistered", "C9g_WrongEnvelope", "C9h_Other", "total")) {
                int currentValue = (int) countyData.get(field);
                int townValue = (int) town.get(field);
                countyData.put(field, currentValue + townValue);
            }

            double currentCast = (double) countyData.get("_castBallots");
            double townCast = (double) town.get("_castBallots");
            countyData.put("_castBallots", currentCast + townCast);
        }

        List<Map<String, Object>> countyResults = new ArrayList<>();
        for (Map<String, Object> county : countyAggregates.values()) {
            int totalRejections = (int) county.get("total");
            double castBallots = (double) county.get("_castBallots");

            double rejectionPercentage = 0.0;
            if (castBallots > 0 && totalRejections > 0) {
                double denominator = castBallots + totalRejections;
                rejectionPercentage = Math.round((totalRejections / denominator) * 100 * 10) / 10.0;
            }

            county.put("rejectionPercentage", rejectionPercentage);
            county.remove("_castBallots");
            countyResults.add(county);
        }

        return countyResults;
    }

    private List<Map<String, Object>> aggregateRhodeIslandActiveVotersToCounties(List<Map<String, Object>> townData,
            int year) {
        Map<String, String> townToCounty = getRhodeIslandTownToCountyMapping();

        Map<String, Map<String, Object>> countyAggregates = new HashMap<>();

        for (Map<String, Object> town : townData) {
            String townName = (String) town.get("geographicUnit");
            String county = townToCounty.get(townName);

            if (county == null) {
                continue;
            }

            Map<String, Object> countyData = countyAggregates.computeIfAbsent(county, k -> {
                Map<String, Object> newCounty = new HashMap<>();
                newCounty.put("geographicUnit", k);
                newCounty.put("activeVoters", 0);
                newCounty.put("inactiveVoters", 0);
                newCounty.put("totalVoters", 0);
                return newCounty;
            });

            int currentActive = (int) countyData.get("activeVoters");
            int townActive = town.get("activeVoters") != null ? ((Number) town.get("activeVoters")).intValue() : 0;
            countyData.put("activeVoters", currentActive + townActive);

            int currentInactive = (int) countyData.get("inactiveVoters");
            int townInactive = town.get("inactiveVoters") != null ? ((Number) town.get("inactiveVoters")).intValue()
                    : 0;
            countyData.put("inactiveVoters", currentInactive + townInactive);

            int currentTotal = (int) countyData.get("totalVoters");
            int townTotal = town.get("totalVoters") != null ? ((Number) town.get("totalVoters")).intValue() : 0;
            countyData.put("totalVoters", currentTotal + townTotal);
        }

        List<Map<String, Object>> countyResults = new ArrayList<>();
        for (Map<String, Object> county : countyAggregates.values()) {
            int activeVoters = (int) county.get("activeVoters");
            int totalVoters = (int) county.get("totalVoters");

            double activePercentage = 0.0;
            if (totalVoters > 0) {
                activePercentage = Math.round((activeVoters / (double) totalVoters) * 100 * 10) / 10.0;
            }

            county.put("activePercentage", activePercentage);
            countyResults.add(county);
        }

        return countyResults;
    }

    private List<Map<String, Object>> aggregateRhodeIslandPollbookToCounties(List<Map<String, Object>> townData,
            int year) {
        Map<String, String> townToCounty = getRhodeIslandTownToCountyMapping();

        Map<String, Map<String, Object>> countyAggregates = new HashMap<>();

        for (Map<String, Object> town : townData) {
            String townName = (String) town.get("geographicUnit");
            String county = townToCounty.get(townName);

            if (county == null) {
                continue;
            }

            Map<String, Object> countyData = countyAggregates.computeIfAbsent(county, k -> {
                Map<String, Object> newCounty = new HashMap<>();
                newCounty.put("geographicUnit", k);
                newCounty.put("dataYear", year);
                newCounty.put("A12b_Death", 0);
                newCounty.put("A12c_Moved", 0);
                newCounty.put("A12d_Felon", 0);
                newCounty.put("A12e_MentalIncap", 0);
                newCounty.put("A12f_Requested", 0);
                newCounty.put("A12g_FailedToVote", 0);
                newCounty.put("A12h_Other", 0);
                newCounty.put("total", 0);
                newCounty.put("_totalRegistered", 0.0);
                return newCounty;
            });

            for (String field : Arrays.asList("A12b_Death", "A12c_Moved", "A12d_Felon", "A12e_MentalIncap",
                    "A12f_Requested", "A12g_FailedToVote", "A12h_Other", "total")) {
                int currentValue = (int) countyData.get(field);
                int townValue = (int) town.get(field);
                countyData.put(field, currentValue + townValue);
            }

            double currentRegistered = (double) countyData.get("_totalRegistered");
            double townRegistered = (double) town.get("_totalRegistered");
            countyData.put("_totalRegistered", currentRegistered + townRegistered);
        }

        List<Map<String, Object>> countyResults = new ArrayList<>();
        for (Map<String, Object> county : countyAggregates.values()) {
            int totalDeletions = (int) county.get("total");
            double totalRegistered = (double) county.get("_totalRegistered");

            double deletionPercentage = 0.0;
            if (totalRegistered > 0 && totalDeletions > 0) {
                deletionPercentage = Math.round((totalDeletions / totalRegistered) * 100 * 10) / 10.0;
            }

            county.put("deletionPercentage", deletionPercentage);
            county.remove("_totalRegistered");
            countyResults.add(county);
        }

        return countyResults;
    }

    private Map<String, String> getRhodeIslandTownToCountyMapping() {
        Map<String, String> townToCounty = new HashMap<>();

        townToCounty.put("BARRINGTON TOWN", "BRISTOL COUNTY");
        townToCounty.put("BRISTOL TOWN", "BRISTOL COUNTY");
        townToCounty.put("WARREN TOWN", "BRISTOL COUNTY");

        townToCounty.put("BURRILLVILLE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("CENTRAL FALLS CITY", "PROVIDENCE COUNTY");
        townToCounty.put("CRANSTON CITY", "PROVIDENCE COUNTY");
        townToCounty.put("CUMBERLAND TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("EAST PROVIDENCE CITY", "PROVIDENCE COUNTY");
        townToCounty.put("FOSTER TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("GLOCESTER TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("JOHNSTON TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("LINCOLN TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("NORTH PROVIDENCE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("NORTH SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("PAWTUCKET CITY", "PROVIDENCE COUNTY");
        townToCounty.put("PROVIDENCE CITY", "PROVIDENCE COUNTY");
        townToCounty.put("SCITUATE TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("SMITHFIELD TOWN", "PROVIDENCE COUNTY");
        townToCounty.put("WOONSOCKET CITY", "PROVIDENCE COUNTY");

        townToCounty.put("COVENTRY TOWN", "KENT COUNTY");
        townToCounty.put("EAST GREENWICH TOWN", "KENT COUNTY");
        townToCounty.put("WARWICK CITY", "KENT COUNTY");
        townToCounty.put("WEST GREENWICH TOWN", "KENT COUNTY");
        townToCounty.put("WEST WARWICK TOWN", "KENT COUNTY");

        townToCounty.put("JAMESTOWN TOWN", "NEWPORT COUNTY");
        townToCounty.put("LITTLE COMPTON TOWN", "NEWPORT COUNTY");
        townToCounty.put("MIDDLETOWN TOWN", "NEWPORT COUNTY");
        townToCounty.put("NEWPORT CITY", "NEWPORT COUNTY");
        townToCounty.put("PORTSMOUTH TOWN", "NEWPORT COUNTY");
        townToCounty.put("TIVERTON TOWN", "NEWPORT COUNTY");

        townToCounty.put("CHARLESTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("EXETER TOWN", "WASHINGTON COUNTY");
        townToCounty.put("HOPKINTON TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NARRAGANSETT TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NEW SHOREHAM TOWN", "WASHINGTON COUNTY");
        townToCounty.put("NORTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("RICHMOND TOWN", "WASHINGTON COUNTY");
        townToCounty.put("SOUTH KINGSTOWN TOWN", "WASHINGTON COUNTY");
        townToCounty.put("WESTERLY TOWN", "WASHINGTON COUNTY");

        return townToCounty;
    }

    private List<Map<String, Object>> fetchDropboxEavsResults(String state, int year) {
        Query eavsQuery = new Query();
        eavsQuery.addCriteria(Criteria.where("stateFull").regex("^" + state + "$", "i").and("year").is(year));
        return (List<Map<String, Object>>) (List<?>) mongoTemplate.find(eavsQuery, Map.class, "eavsData");
    }

    private boolean hasDropboxBallots(List<Map<String, Object>> eavsResults) {
        if (eavsResults == null || eavsResults.isEmpty()) {
            return false;
        }
        return eavsResults.stream().anyMatch(doc -> safeLong(doc.get("C3a")) > 0);
    }

    private boolean hasMeaningfulDropboxUsage(List<Map<String, Object>> eavsResults) {
        if (eavsResults == null || eavsResults.isEmpty()) {
            return false;
        }

        int countWithData = 0;
        double totalPercentage = 0.0;

        for (Map<String, Object> doc : eavsResults) {
            long dropBoxVotes = safeLong(doc.get("C3a"));

            long totalVotes = safeLong(doc.get("F1a")) + safeLong(doc.get("F1b"))
                    + safeLong(doc.get("F1d")) + safeLong(doc.get("F1f"));

            if (totalVotes == 0) {
                totalVotes = safeLong(doc.get("B1"));
            }

            if (totalVotes > 0 && dropBoxVotes > 0) {
                double percentage = (dropBoxVotes * 100.0) / totalVotes;
                totalPercentage += percentage;
                countWithData++;
            }
        }

        if (countWithData == 0) {
            return false;
        }

        double avgPercentage = totalPercentage / countWithData;
        return avgPercentage > 0.1;
    }

    @GetMapping("/dropbox-bubbles/{state}")
    @Cacheable(value = "dropboxBubbles", key = "#state + '-' + #year")
    public List<Map<String, Object>> getDropboxBubbles(
            @PathVariable String state,
            @RequestParam(defaultValue = "2024") int year) {

        int actualYear = year;
        List<Map<String, Object>> eavsResults = fetchDropboxEavsResults(state, actualYear);

        if (!hasDropboxBallots(eavsResults) || !hasMeaningfulDropboxUsage(eavsResults)) {
            for (int fallbackYear : DROPBOX_YEAR_PRIORITY) {
                if (fallbackYear == actualYear) {
                    continue;
                }
                List<Map<String, Object>> candidate = fetchDropboxEavsResults(state, fallbackYear);
                if (hasDropboxBallots(candidate) && hasMeaningfulDropboxUsage(candidate)) {
                    eavsResults = candidate;
                    actualYear = fallbackYear;
                    break;
                }
            }
        }

        if (eavsResults == null || eavsResults.isEmpty()) {
            return Collections.emptyList();
        }

        String stateAbbr = getStateAbbreviation(state.toUpperCase());
        Query electionQuery = new Query();
        electionQuery.addCriteria(Criteria.where("stateAbbr").is(stateAbbr).and("electionYear").is(actualYear));
        List<Map<String, Object>> electionResults = (List<Map<String, Object>>) (List<?>) mongoTemplate
                .find(electionQuery, Map.class, "electionResults");

        if ((electionResults == null || electionResults.isEmpty()) && actualYear != 2024) {
            Query fallbackQuery = new Query();
            fallbackQuery.addCriteria(Criteria.where("stateAbbr").is(stateAbbr).and("electionYear").is(2024));
            electionResults = (List<Map<String, Object>>) (List<?>) mongoTemplate
                    .find(fallbackQuery, Map.class, "electionResults");
        }

        Map<String, Map<String, Object>> electionByCounty = new HashMap<>();
        for (Map<String, Object> result : electionResults) {
            String county = (String) result.get("county");
            if (county != null) {
                String normalizedCounty = normalizeGeographicKey(county);
                if (!normalizedCounty.isEmpty()) {
                    electionByCounty.put(normalizedCounty, result);
                }

                String countyUpper = county.toUpperCase(Locale.US);
                electionByCounty.putIfAbsent(countyUpper, result);
                electionByCounty.putIfAbsent(countyUpper + " COUNTY", result);
            }
        }

        Map<String, String> riTownToCounty = "RHODE ISLAND".equals(state.toUpperCase(Locale.US))
                ? RI_TOWN_TO_COUNTY_MAP
                : null;

        final int yearUsed = actualYear;

        return eavsResults.stream().map(doc -> {
            Map<String, Object> bubble = new HashMap<>();
            String jurisdiction = (String) doc.get("jurisdictionName");
            bubble.put("geographicUnit", jurisdiction);

            Object c3aObj = doc.get("C3a");
            Object f1aObj = doc.get("F1a");
            Object f1bObj = doc.get("F1b");
            Object f1dObj = doc.get("F1d");
            Object f1fObj = doc.get("F1f");

            long dropBoxVotes = safeLong(c3aObj);
            long totalVotes = safeLong(f1aObj) + safeLong(f1bObj) + safeLong(f1dObj) + safeLong(f1fObj);

            if (totalVotes == 0) {
                Object b1Obj = doc.get("B1");
                totalVotes = safeLong(b1Obj);
            }

            double dropBoxPct = totalVotes > 0 ? (dropBoxVotes * 100.0 / totalVotes) : 0;
            dropBoxPct = Math.min(dropBoxPct, 100.0);
            bubble.put("dropBoxPercentage", dropBoxPct);
            bubble.put("dropBoxPct", dropBoxPct);
            bubble.put("dropBoxVotes", dropBoxVotes);
            bubble.put("totalVotes", totalVotes);
            Object docYear = doc.get("year");
            int dataYear = docYear instanceof Number ? ((Number) docYear).intValue() : yearUsed;
            bubble.put("dataYear", dataYear);
            bubble.put("analysisYear", yearUsed);

            Map<String, Object> electionData = null;
            String normalizedJurisdiction = normalizeGeographicKey(jurisdiction);
            if (!normalizedJurisdiction.isEmpty()) {
                electionData = electionByCounty.get(normalizedJurisdiction);
            }

            if (electionData == null && jurisdiction != null) {
                String jurisdictionUpper = jurisdiction.toUpperCase(Locale.US);
                electionData = electionByCounty.get(jurisdictionUpper);
                if (electionData == null) {
                    electionData = electionByCounty.get(jurisdictionUpper + " COUNTY");
                }
            }

            if (electionData == null && riTownToCounty != null && jurisdiction != null) {
                String county = riTownToCounty.get(jurisdiction.toUpperCase(Locale.US));
                if (county != null) {
                    String normalizedCounty = normalizeGeographicKey(county);
                    electionData = electionByCounty.get(normalizedCounty);

                    if (electionData == null) {
                        electionData = electionByCounty.get(county.toUpperCase(Locale.US));
                    }
                }
            }
            if (electionData != null) {
                Map<String, Object> results = (Map<String, Object>) electionData.get("results");

                long repVotes = 0;
                long demVotes = 0;

                if (results != null) {
                    Map<String, Object> repData = (Map<String, Object>) results.get("Republican");
                    Map<String, Object> demData = (Map<String, Object>) results.get("Democratic");

                    if (repData != null) {
                        repVotes = safeLong(repData.get("votes"));
                    }
                    if (demData != null) {
                        demVotes = safeLong(demData.get("votes"));
                    }
                }

                long totalPartyVotes = repVotes + demVotes;

                if (totalPartyVotes > 0) {
                    double repPct = (repVotes * 100.0 / totalPartyVotes);
                    bubble.put("republicanPercentage", Math.round(repPct * 100) / 100.0);

                    bubble.put("majorityParty", repVotes > demVotes ? "Republican" : "Democratic");
                    bubble.put("color", repVotes > demVotes ? "red" : "blue");
                } else {
                    bubble.put("republicanPercentage", 0.0);
                    bubble.put("majorityParty", "Unknown");
                    bubble.put("color", "gray");
                }

                bubble.put("republicanVotes", repVotes);
                bubble.put("democraticVotes", demVotes);
            } else {
                bubble.put("republicanPercentage", 0.0);
                bubble.put("majorityParty", "Unknown");
                bubble.put("color", "gray");
                bubble.put("republicanVotes", 0);
                bubble.put("democraticVotes", 0);
            }

            return bubble;
        }).filter(bubble -> {
            return (Long) bubble.get("totalVotes") > 0;
        }).toList();
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

    private String normalizeGeographicKey(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.US)
                .replace("SAINT ", "ST ")
                .replace("SAINTE ", "STE ")
                .replace("ST. ", "ST ")
                .replace("STE. ", "STE ")
                .replace("&", " AND ")
                .replace("'", "")
                .replace("\"", "")
                .replace(".", "");

        String[] suffixes = new String[] {
                " COUNTY", " PARISH", " CITY", " TOWN", " TOWNSHIP", " BOROUGH",
                " MUNICIPIO", " MUNICIPALITY", " DISTRICT", " PRECINCT", " VILLAGE"
        };

        for (String suffix : suffixes) {
            if (normalized.endsWith(suffix)) {
                normalized = normalized.substring(0, normalized.length() - suffix.length());
                break;
            }
        }

        normalized = normalized.replaceAll("\\s+", "").trim();
        return normalized;
    }

    private String getStateAbbreviation(String stateName) {
        if (stateName == null) {
            return "";
        }

        String normalized = stateName.trim().toUpperCase(Locale.US);
        if (normalized.length() == 2 && STATE_ABBR_MAP.containsValue(normalized)) {
            return normalized;
        }

        return STATE_ABBR_MAP.getOrDefault(normalized, normalized.length() >= 2
                ? normalized.substring(0, 2)
                : normalized);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "eavs-controller");
    }
}
