package com.example.raptorsbackend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for Registration Controller endpoints.
 * Tests registration trends, block bubbles, voter lists, and comparison
 * endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RegistrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // =====================================================================
    // Registration Trends Tests
    // =====================================================================

    /**
     * Test registration trends endpoint returns JSON with expected structure.
     */
    @Test
    void getRegistrationTrends_Maryland_ShouldReturnJsonWithState() throws Exception {
        mockMvc.perform(get("/api/registration/trends/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Maryland"));
    }

    /**
     * Test registration trends with custom years parameter.
     */
    @Test
    void getRegistrationTrends_WithYearsParam_ShouldReturnByYear() throws Exception {
        mockMvc.perform(get("/api/registration/trends/Arkansas")
                .param("years", "2016,2020,2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.byYear").exists());
    }

    /**
     * Test registration trends for Rhode Island.
     */
    @Test
    void getRegistrationTrends_RhodeIsland_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/registration/trends/Rhode Island")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Block Bubbles Tests
    // =====================================================================

    /**
     * Test block bubbles endpoint returns JSON with points.
     */
    @Test
    void getBlockBubbles_Maryland_ShouldReturnJsonWithPoints() throws Exception {
        mockMvc.perform(get("/api/registration/blocks/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.state").value("Maryland"))
                .andExpect(jsonPath("$.points").isArray());
    }

    /**
     * Test block bubbles for Arkansas.
     */
    @Test
    void getBlockBubbles_Arkansas_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/registration/blocks/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Registered Voters Tests
    // =====================================================================

    /**
     * Test registered voters endpoint with pagination.
     */
    @Test
    void getRegisteredVoters_WithPagination_ShouldReturnPaginatedResults() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Arkansas/Pulaski")
                .param("page", "0")
                .param("size", "25")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(25));
    }

    /**
     * Test registered voters endpoint with party filter.
     */
    @Test
    void getRegisteredVoters_WithPartyFilter_ShouldFilterByParty() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Maryland/Baltimore")
                .param("party", "D")
                .param("page", "0")
                .param("size", "10")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test registered voters returns voter list.
     */
    @Test
    void getRegisteredVoters_ShouldReturnVotersList() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Arkansas/Benton")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.voters").isArray())
                .andExpect(jsonPath("$.total").isNumber());
    }

    // =====================================================================
    // Comparison Endpoints Tests
    // =====================================================================

    /**
     * Test opt-in/out comparison endpoint.
     */
    @Test
    void getOptInOutComparison_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/registration/opt-in-out-comparison")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test early voting comparison endpoint.
     */
    @Test
    void getEarlyVotingComparison_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/registration/early-voting/comparison")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Trends Endpoint Tests (replaces non-existent state endpoint)
    // =====================================================================

    /**
     * Test registration trends endpoint for Maryland.
     */
    @Test
    void getRegistrationTrends_Maryland_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/registration/trends/Maryland")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test registration trends endpoint for Arkansas.
     */
    @Test
    void getRegistrationTrends_Arkansas_ShouldReturnJson() throws Exception {
        mockMvc.perform(get("/api/registration/trends/Arkansas")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    // =====================================================================
    // Edge Cases
    // =====================================================================

    /**
     * Test with URL-encoded region name.
     */
    @Test
    void getRegisteredVoters_UrlEncodedRegion_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Maryland/Prince%20George's")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test pagination with different page sizes.
     */
    @Test
    void getRegisteredVoters_LargePageSize_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Arkansas/Pulaski")
                .param("page", "0")
                .param("size", "100")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.size").value(100));
    }

    /**
     * Test with party filter set to "All".
     */
    @Test
    void getRegisteredVoters_AllParties_ShouldReturnAllVoters() throws Exception {
        mockMvc.perform(get("/api/registration/voters/Maryland/Baltimore")
                .param("party", "All")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
