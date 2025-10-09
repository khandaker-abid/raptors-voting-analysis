package com.example.raptorsbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(exclude = {
    org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class
})
@EnableCaching
public class RaptorsBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(RaptorsBackendApplication.class, args);
    }
}
