package com.example.raptorsbackend.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class PreclearanceRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findPrecinctDemographics(String state) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state));
        return (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class, "precinct_demographics");
    }

    public Map<String, Object> findGinglesRegressions(String state) {
        Query regressionQuery = new Query();
        regressionQuery.addCriteria(Criteria.where("state").is(state));
        return mongoTemplate.findOne(regressionQuery, Map.class, "gingles_regressions");
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findEiEquipmentAnalysis(String state, String demographic) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state)
                .and("analysis_type").is("equipment_quality"));

        if (demographic != null) {
            query.addCriteria(Criteria.where("demographic").is(demographic));
        }

        return (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class, "ei_equipment_analysis");
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findEiRejectionAnalysis(String state, String demographic) {
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state)
                .and("analysis_type").is("ballot_rejection"));

        if (demographic != null) {
            query.addCriteria(Criteria.where("demographic").is(demographic));
        }

        return (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class, "ei_rejection_analysis");
    }

    // Debug methods
    public long countEiEquipmentAnalysis(Query query) {
        return mongoTemplate.count(query, "ei_equipment_analysis");
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findEiEquipmentAnalysis(Query query) {
        return (List<Map<String, Object>>) (List<?>) mongoTemplate.find(query, Map.class, "ei_equipment_analysis");
    }
}
