package com.example.raptorsbackend.controller;

import com.example.raptorsbackend.service.JsonFileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class UserController {
    private final JsonFileService jsonFileService;

    public UserController(JsonFileService jsonFileService) {
        this.jsonFileService = jsonFileService;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {
        return jsonFileService.readJsonArray("users.json");
    }
}
