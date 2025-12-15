package com.example.raptorsbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@RestController
@RequestMapping("/api/boundaries")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173" })
@SuppressWarnings("unchecked")
public class BoundaryController {

    private static final Logger logger = LoggerFactory.getLogger(BoundaryController.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/state/{state}/metadata")
    @Cacheable(value = "stateMetadataCache", key = "#state")
    public Map<String, Object> getStateMetadata(@PathVariable String state) {
        logger.info("Fetching metadata for state: {}", state);
        
        Query query = new Query();
        query.addCriteria(Criteria.where("state").is(state).and("boundaryType").is("state"));
        
        Map boundary = mongoTemplate.findOne(query, Map.class, "boundaryData");
        
        if (boundary == null) {
            logger.warn("No boundary found for state: {}", state);
            
            // Try to find any state boundaries to help debug
            Query debugQuery = new Query();
            debugQuery.addCriteria(Criteria.where("boundaryType").is("state"));
            debugQuery.limit(5);
            List<Map> samples = mongoTemplate.find(debugQuery, Map.class, "boundaryData");
            logger.info("Sample states in database: {}", samples.stream()
                .map(m -> m.get("state"))
                .toList());
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "State boundary not found for: " + state);
            return error;
        }
        
        logger.info("Found boundary for state: {}", state);
        
        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        
        // Extract center point
        Map<String, Object> centerPoint = (Map<String, Object>) boundary.get("centerPoint");
        if (centerPoint != null) {
            result.put("centerLng", centerPoint.get("x"));
            result.put("centerLat", centerPoint.get("y"));
            logger.info("Center point: lng={}, lat={}", centerPoint.get("x"), centerPoint.get("y"));
        }
        
        // Extract zoom level
        Object zoomLevel = boundary.get("appropriateZoomLevel");
        if (zoomLevel != null) {
            result.put("zoomLevel", zoomLevel);
            logger.info("Zoom level: {}", zoomLevel);
        }
        
        return result;
    }
}
