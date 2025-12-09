package com.example.raptorsbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main Spring Boot application class for the Raptors Voting Analysis Backend.
 * 
 * Provides REST API endpoints for:
 * - EAVS data (voter registration, provisional ballots, mail rejections)
 * - Voting equipment analysis
 * - Party comparison statistics
 * - Preclearance state VRA analysis
 * 
 * Uses MongoDB for data persistence and Spring caching for performance.
 */
@SpringBootApplication(exclude = {
        org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class
})
@EnableCaching
public class RaptorsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RaptorsBackendApplication.class, args);
    }
}
