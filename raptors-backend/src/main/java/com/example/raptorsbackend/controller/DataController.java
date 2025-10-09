package com.example.raptorsbackend.controller;

import com.example.raptorsbackend.service.JsonFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DataController {

    @Autowired
    private JsonFileService jsonFileService;

    @GetMapping("/per-state-equipment/{state}")
    public List<Map<String, Object>> getEveryStateAllModelsData(@PathVariable String state) {
        try {
            List<Map<String, Object>> stateEquipment = jsonFileService.readJsonArray("every-state-all-models-data.json");
            return stateEquipment.stream()
                .filter(model -> state.equalsIgnoreCase((String) model.get("stateName")))
                .toList();
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }

    @GetMapping("/every-state-equipment")
    public List<Map<String, Object>> getEveryStateEquipmentData() {
        try {
            return jsonFileService.readJsonArray("every-state-equipment-data.json");
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }

    @GetMapping("/party-comparison")
    public List<Map<String, Object>> getPartyComparisonData() {
        try {
            return jsonFileService.readJsonArray("party-comparison-data.json");
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }

    @GetMapping("/state-registered-voters/{state}")
    public List<Map<String, Object>> getVoterRegistrationData(@PathVariable String state) {
        try {
            List<Map<String, Object>> allVoters = jsonFileService.readJsonArray("state-voter-registration-data.json");
            return allVoters.stream()
                .filter(voter -> state.equalsIgnoreCase((String) voter.get("stateName")))
                .toList();
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }

    @GetMapping("/region-registered-voters/{region}")
    public List<Map<String, Object>> getRegionRegisteredVotersData(@PathVariable String region) {
        try {
            List<Map<String, Object>> allVoters = jsonFileService.readJsonArray("region-registered-voters-data.json");
            return allVoters.stream()
                .filter(voter -> region.equalsIgnoreCase((String) voter.get("regionName")))
                .toList();
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }

    @GetMapping("/voting-equipment-summary")
    public List<Map<String, Object>> getVotingEquipmentSummaryData() {
        try {
            return jsonFileService.readJsonArray("voting-equipment-summary-data.json");
        } catch (RuntimeException e) {
            return List.of(Map.of("error", "Failed to load data: " + e.getMessage()));
        }
    }
}