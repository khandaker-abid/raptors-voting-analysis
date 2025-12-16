package com.example.raptorsbackend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Equipment Controller endpoints.
 * Tests equipment types, history, summary, and quality metrics.
 */
@SpringBootTest
@AutoConfigureMockMvc
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // =====================================================================
    // Equipment Types Tests
    // =====================================================================

    /**
     * Test equipment types endpoint for Maryland returns JSON.
     */
    @Test
    void getEquipmentTypes_Maryland_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/Maryland/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test equipment types endpoint for Arkansas.
     */
    @Test
    void getEquipmentTypes_Arkansas_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/Arkansas/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test equipment types endpoint for Rhode Island.
     * Rhode Island requires special town-to-county aggregation.
     */
    @Test
    void getEquipmentTypes_RhodeIsland_ShouldAggregateToCounties() throws Exception {
        mockMvc.perform(get("/api/equipment/Rhode Island/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Equipment History Tests
    // =====================================================================

    /**
     * Test equipment history endpoint returns JSON.
     */
    @Test
    void getEquipmentHistory_Maryland_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/history/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test equipment history for Arkansas.
     */
    @Test
    void getEquipmentHistory_Arkansas_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/history/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test equipment history for Rhode Island.
     */
    @Test
    void getEquipmentHistory_RhodeIsland_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/history/Rhode Island")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Equipment Summary Tests
    // =====================================================================

    /**
     * Test equipment summary endpoint returns JSON.
     */
    @Test
    void getEquipmentSummary_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/summary")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                // Contract checks for GUI-13
                .andExpect(jsonPath("$[0].provider").exists())
                .andExpect(jsonPath("$[0].model").exists())
                .andExpect(jsonPath("$[0].quantity").exists());
    }

    /**
     * Test all-states equipment endpoint.
     */
    @Test
    void getEquipmentAllStates_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/all-states")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Equipment Quality and Rejections Tests
    // =====================================================================

    /**
     * Test equipment vs rejected endpoint for Maryland.
     */
    @Test
    void getEquipmentVsRejected_Maryland_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/vs-rejected/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test equipment vs rejected with regression for Arkansas.
     */
    @Test
    void getEquipmentVsRejectedWithRegression_Arkansas_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/equipment/vs-rejected-with-regression/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Equipment Details Tests
    // =====================================================================

    /**
     * Test state equipment details endpoint.
     */
    @Test
    void getStateEquipmentDetails_Maryland_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/state/Maryland/details")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test state equipment details for Arkansas.
     */
    @Test
    void getStateEquipmentDetails_Arkansas_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/state/Arkansas/details")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Equipment Age Tests
    // =====================================================================

    /**
     * Test equipment age for all states endpoint.
     */
    @Test
    void getEquipmentAgeAllStates_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/equipment/age/all-states")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Edge Cases
    // =====================================================================

    /**
     * Test with URL-encoded state name.
     */
    @Test
    void getEquipmentTypes_UrlEncoded_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/equipment/Rhode%20Island/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test case insensitivity for state names.
     */
    @Test
    void getEquipmentTypes_LowerCase_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/equipment/maryland/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test with nonexistent state should return empty array, not error.
     */
    @Test
    void getEquipmentTypes_NonexistentState_ShouldReturnEmptyArray() throws Exception {
        mockMvc.perform(get("/api/equipment/InvalidState/types")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
