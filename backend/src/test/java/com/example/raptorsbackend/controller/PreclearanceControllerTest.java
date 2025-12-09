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
 * Integration tests for Preclearance Controller endpoints.
 * Tests Gingles analysis, EI equipment, and EI rejected endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PreclearanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // =====================================================================
    // Gingles Analysis Tests
    // =====================================================================

    /**
     * Test Gingles endpoint returns JSON with expected structure.
     */
    @Test
    void getGinglesData_Maryland_ShouldReturnJsonWithState() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Maryland"));
    }

    /**
     * Test Gingles endpoint with default demographic (white).
     */
    @Test
    void getGinglesData_DefaultDemographic_ShouldUseWhite() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test Gingles endpoint with specified demographic.
     */
    @Test
    void getGinglesData_WithDemographic_ShouldReturnFilteredData() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .param("demographic", "hispanic")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test Gingles endpoint for Arkansas.
     */
    @Test
    void getGinglesData_Arkansas_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Arkansas"));
    }

    /**
     * Test Gingles with African American demographic.
     */
    @Test
    void getGinglesData_AfricanAmericanDemographic_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .param("demographic", "africanamerican")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test Gingles with Asian demographic.
     */
    @Test
    void getGinglesData_AsianDemographic_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .param("demographic", "asian")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // EI Equipment Analysis Tests
    // =====================================================================

    /**
     * Test EI Equipment endpoint returns JSON.
     */
    @Test
    void getEIEquipmentData_Maryland_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-equipment/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Maryland"));
    }

    /**
     * Test EI Equipment endpoint with demographic filter.
     */
    @Test
    void getEIEquipmentData_WithDemographic_ShouldFilter() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-equipment/Maryland")
                .param("demographic", "white")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test EI Equipment for Arkansas.
     */
    @Test
    void getEIEquipmentData_Arkansas_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-equipment/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // EI Rejected Ballots Analysis Tests
    // =====================================================================

    /**
     * Test EI Rejected endpoint returns JSON.
     */
    @Test
    void getEIRejectedData_Maryland_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-rejected/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Maryland"));
    }

    /**
     * Test EI Rejected endpoint with demographic filter.
     */
    @Test
    void getEIRejectedData_WithDemographic_ShouldFilter() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-rejected/Arkansas")
                .param("demographic", "hispanic")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test EI Rejected for Rhode Island.
     */
    @Test
    void getEIRejectedData_RhodeIsland_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/preclearance/ei-rejected/Rhode Island")
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
    void getGinglesData_UrlEncodedState_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Rhode%20Island")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test case insensitivity for demographic parameter.
     */
    @Test
    void getGinglesData_MixedCaseDemographic_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .param("demographic", "HISPANIC")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test alternative demographic key format.
     */
    @Test
    void getGinglesData_AlternativeDemographicKey_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/preclearance/gingles/Maryland")
                .param("demographic", "african_american")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
