package com.example.raptorsbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {
    org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class
})
public class RaptorsBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(RaptorsBackendApplication.class, args);
    }
}
