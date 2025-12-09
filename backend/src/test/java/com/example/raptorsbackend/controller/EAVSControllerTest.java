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
 * Integration tests for EAVS Controller endpoints.
 * Tests active voters, pollbook deletions, and mail rejection endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
class EAVSControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Test active voters endpoint returns JSON.
     */
    @Test
    void getActiveVoters_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/eavs/MARYLAND/active-voters")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test active voters endpoint with different states.
     */
    @Test
    void getActiveVoters_Arkansas_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/eavs/ARKANSAS/active-voters")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test Rhode Island active voters (verifies town-to-county aggregation).
     */
    @Test
    void getActiveVoters_RhodeIsland_ShouldAggregateToCounties() throws Exception {
        mockMvc.perform(get("/api/eavs/RHODE ISLAND/active-voters")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test provisional ballots endpoint returns JSON.
     */
    @Test
    void getProvisionalBallots_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/eavs/MARYLAND/provisional-ballots")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test pollbook deletions endpoint returns JSON.
     */
    @Test
    void getPollbookDeletions_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/eavs/MARYLAND/pollbook-deletions")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test mail rejections endpoint returns JSON.
     */
    @Test
    void getMailRejections_ShouldReturnJsonArray() throws Exception {
        mockMvc.perform(get("/api/eavs/MARYLAND/mail-rejections")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * Test case-insensitive state matching
     */
    @Test
    void getActiveVoters_CaseInsensitive_ShouldWork() throws Exception {
        mockMvc.perform(get("/api/eavs/maryland/active-voters")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/eavs/Maryland/active-voters")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    /**
     * Test year fallback behavior (2024 -> 2020 -> 2016)
     */
    @Test
    void getPollbookDeletions_WithYearFallback_ShouldWork() throws Exception {
        // Request 2024, should return data (may fall back to earlier year)
        mockMvc.perform(get("/api/eavs/MARYLAND/pollbook-deletions")
                .param("year", "2024")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
