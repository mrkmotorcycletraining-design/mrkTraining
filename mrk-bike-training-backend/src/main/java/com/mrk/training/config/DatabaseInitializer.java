package com.mrk.training.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.stream.Collectors;

/**
 * On application startup, checks if PostgreSQL is available and if the target database exists.
 * If PostgreSQL is present but the database doesn't exist, creates it using schema.sql.
 */
@Component
public class DatabaseInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        String dbName = extractDbName(datasourceUrl);
        String baseUrl = extractBaseUrl(datasourceUrl);

        try {
            // Connect to the default 'postgres' database to check if our target DB exists
            String postgresUrl = baseUrl + "/postgres";
            try (Connection conn = DriverManager.getConnection(postgresUrl, username, password)) {
                log.info("PostgreSQL server is available. Checking if database '{}' exists...", dbName);

                boolean dbExists;
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(
                             "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'")) {
                    dbExists = rs.next();
                }

                if (!dbExists) {
                    log.info("Database '{}' does not exist. Creating it now...", dbName);
                    try (Statement stmt = conn.createStatement()) {
                        stmt.executeUpdate("CREATE DATABASE " + dbName);
                    }
                    log.info("Database '{}' created successfully.", dbName);

                    // Now connect to the new DB and run schema.sql
                    String targetUrl = baseUrl + "/" + dbName;
                    try (Connection targetConn = DriverManager.getConnection(targetUrl, username, password)) {
                        String schemaSql = loadSchemaSQL();
                        try (Statement stmt = targetConn.createStatement()) {
                            stmt.execute(schemaSql);
                        }
                        log.info("Schema applied to database '{}' from schema.sql.", dbName);
                    }
                } else {
                    log.info("Database '{}' already exists. Skipping creation.", dbName);
                }
            }
        } catch (Exception e) {
            log.warn("Database initialization check failed (non-fatal): {}", e.getMessage());
            log.debug("Full stack trace:", e);
        }
    }

    private String loadSchemaSQL() {
        try {
            // First try classpath (works when schema.sql is bundled in resources)
            ClassPathResource resource = new ClassPathResource("db/postgres/schema.sql");
            if (!resource.exists()) {
                resource = new ClassPathResource("schema.sql");
            }
            if (resource.exists()) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                    return reader.lines().collect(Collectors.joining("\n"));
                }
            }

            // Fallback: try relative file path from project root
            java.nio.file.Path filePath = java.nio.file.Path.of("db/postgres/schema.sql");
            if (java.nio.file.Files.exists(filePath)) {
                return java.nio.file.Files.readString(filePath, StandardCharsets.UTF_8);
            }

            throw new RuntimeException("schema.sql not found in classpath or file system");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to load schema.sql", e);
            throw new RuntimeException("Cannot load schema.sql", e);
        }
    }

    private String extractDbName(String url) {
        String withoutPrefix = url.replace("jdbc:postgresql://", "");
        int slashIdx = withoutPrefix.indexOf('/');
        if (slashIdx >= 0) {
            String dbPart = withoutPrefix.substring(slashIdx + 1);
            int paramIdx = dbPart.indexOf('?');
            return paramIdx >= 0 ? dbPart.substring(0, paramIdx) : dbPart;
        }
        return "mrktraining";
    }

    private String extractBaseUrl(String url) {
        // jdbc:postgresql://localhost:5432/mrktraining -> jdbc:postgresql://localhost:5432
        String withoutPrefix = url.replace("jdbc:postgresql://", "");
        int slashIdx = withoutPrefix.indexOf('/');
        if (slashIdx >= 0) {
            return "jdbc:postgresql://" + withoutPrefix.substring(0, slashIdx);
        }
        return "jdbc:postgresql://" + withoutPrefix;
    }
}
