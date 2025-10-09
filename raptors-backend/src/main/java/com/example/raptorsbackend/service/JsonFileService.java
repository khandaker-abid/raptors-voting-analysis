package com.example.raptorsbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class JsonFileService {
    private final ObjectMapper mapper = new ObjectMapper();

    public List<Map<String, Object>> readJsonArray(String filename) {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("data/" + filename)) {
            if (is == null) {
                throw new RuntimeException("File not found: " + filename);
            }
            return mapper.readValue(is, new TypeReference<List<Map<String, Object>>>(){});
        } catch (Exception e) {
            throw new RuntimeException("Failed to read JSON file " + filename, e);
        }
    }
}
