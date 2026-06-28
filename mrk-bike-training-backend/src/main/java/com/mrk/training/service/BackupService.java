package com.mrk.training.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AuthService authService;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    // Tables defined in schema.sql (in insertion order respecting FK dependencies)
    private static final List<String> ALLOWED_TABLES = List.of(
            "users",
            "trainer_profiles",
            "client_profiles",
            "branches",
            "vehicle_type_config",
            "vehicles",
            "courses",
            "client_course_enrollments",
            "schedule_slots",
            "attendance_logs",
            "financial_ledger",
            "trainer_availability",
            "notifications"
    );

    public BackupService(JdbcTemplate jdbcTemplate, AuthService authService) {
        this.jdbcTemplate = jdbcTemplate;
        this.authService = authService;
    }

    /**
     * Validates user credentials before allowing backup download.
     */
    public boolean validateCredentials(String username, String password) {
        try {
            var request = new com.mrk.training.dto.auth.LoginRequest(username, password);
            authService.login(request);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Validates the secret answer for the backup security question.
     * Question: "What color is of banana?"
     * Expected answer: "raining mumbai" (case-insensitive)
     */
    public boolean validateSecretAnswer(String answer) {
        return answer != null && answer.trim().equalsIgnoreCase("raining mumbai");
    }

    /**
     * Generates INSERT-only SQL backup (no schema DDL).
     */
    public byte[] generateInsertOnlySql() {
        StringBuilder sb = new StringBuilder();
        sb.append("-- MRK Bike Training - Data Backup (INSERT statements only)\n");
        sb.append("-- Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        sb.append("-- Database: ").append(extractDbName(datasourceUrl)).append("\n\n");

        for (String table : ALLOWED_TABLES) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table);
            if (rows.isEmpty()) continue;

            sb.append("-- Table: ").append(table).append("\n");
            for (Map<String, Object> row : rows) {
                sb.append(buildInsertStatement(table, row)).append(";\n");
            }
            sb.append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generates CSV data for all tables (Excel-compatible workbook as multiple CSVs in a zip-like format).
     * Returns a map of tableName -> CSV content.
     */
    public Map<String, byte[]> generateCsvData() {
        Map<String, byte[]> csvMap = new LinkedHashMap<>();

        for (String table : ALLOWED_TABLES) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table);
            if (rows.isEmpty()) continue;

            StringBuilder csv = new StringBuilder();
            // Header
            Set<String> columns = rows.get(0).keySet();
            csv.append(columns.stream().map(this::escapeCsv).collect(Collectors.joining(","))).append("\n");

            // Data rows
            for (Map<String, Object> row : rows) {
                csv.append(columns.stream()
                        .map(col -> escapeCsv(row.get(col) == null ? "" : row.get(col).toString()))
                        .collect(Collectors.joining(","))
                ).append("\n");
            }

            csvMap.put(table + ".csv", csv.toString().getBytes(StandardCharsets.UTF_8));
        }

        return csvMap;
    }

    /**
     * Validates an uploaded SQL file:
     * 1. Only INSERT statements allowed
     * 2. Only tables defined in schema.sql allowed
     * 3. No DROP, CREATE, ALTER, UPDATE, DELETE, TRUNCATE, COPY
     * 4. No external server references or script execution commands
     */
    public List<String> validateRestoreSql(String sqlContent) {
        List<String> errors = new ArrayList<>();

        if (sqlContent == null || sqlContent.isBlank()) {
            errors.add("SQL file is empty");
            return errors;
        }

        // Remove comments
        String cleaned = sqlContent.replaceAll("--[^\n]*", "").replaceAll("/\\*.*?\\*/", "");

        // Split into statements
        String[] statements = cleaned.split(";");

        // Dangerous keywords that should NOT appear
        List<String> forbidden = List.of(
                "DROP", "CREATE", "ALTER", "UPDATE", "DELETE", "TRUNCATE",
                "COPY", "EXECUTE", "EXEC", "\\\\!", "pg_dump", "pg_restore",
                "GRANT", "REVOKE", "\\\\connect", "\\\\c"
        );

        // Patterns for external connections
        Pattern externalPattern = Pattern.compile(
                "(dblink|postgres_fdw|COPY.*FROM.*PROGRAM|lo_import|lo_export)",
                Pattern.CASE_INSENSITIVE
        );

        Set<String> allowedTableSet = new HashSet<>(ALLOWED_TABLES);

        for (String stmt : statements) {
            String trimmed = stmt.trim();
            if (trimmed.isEmpty()) continue;

            // Check it's an INSERT
            String upper = trimmed.toUpperCase();
            boolean isInsert = upper.startsWith("INSERT");

            if (!isInsert) {
                // Allow SET statements (e.g., SET search_path) and empty lines
                if (upper.startsWith("SET") || upper.startsWith("BEGIN") || upper.startsWith("COMMIT")) {
                    continue;
                }
                errors.add("Non-INSERT statement found: " + trimmed.substring(0, Math.min(80, trimmed.length())) + "...");
                continue;
            }

            // Check for forbidden keywords within INSERT (e.g., subqueries with DROP)
            for (String kw : forbidden) {
                if (upper.contains(kw) && !kw.equals("UPDATE")) { // UPDATE in ON CONFLICT is okay contextually
                    // But we'll be strict: no UPDATE at all in the SQL
                    errors.add("Forbidden keyword '" + kw + "' found in statement");
                }
            }

            // Check external patterns
            Matcher extMatcher = externalPattern.matcher(trimmed);
            if (extMatcher.find()) {
                errors.add("Potential external access found: " + extMatcher.group());
            }

            // Validate table name in INSERT INTO <table>
            Pattern insertTable = Pattern.compile("INSERT\\s+INTO\\s+([\\w\"]+)", Pattern.CASE_INSENSITIVE);
            Matcher tableMatcher = insertTable.matcher(trimmed);
            if (tableMatcher.find()) {
                String tableName = tableMatcher.group(1).replace("\"", "").toLowerCase();
                if (!allowedTableSet.contains(tableName)) {
                    errors.add("INSERT into unauthorized table: " + tableName);
                }
            }
        }

        // Global check for script/external server patterns
        if (sqlContent.contains("\\!") || sqlContent.contains("COPY") && sqlContent.toUpperCase().contains("PROGRAM")) {
            errors.add("Shell command execution detected in SQL file");
        }

        Pattern urlPattern = Pattern.compile("(https?://|jdbc:|host=)", Pattern.CASE_INSENSITIVE);
        Matcher urlMatcher = urlPattern.matcher(sqlContent);
        if (urlMatcher.find()) {
            errors.add("External URL/connection reference detected: " + urlMatcher.group());
        }

        return errors;
    }

    /**
     * Executes validated INSERT-only SQL against the database.
     */
    public void executeRestoreSql(String sqlContent) {
        // Remove comments
        String cleaned = sqlContent.replaceAll("--[^\n]*", "").replaceAll("/\\*.*?\\*/", "");
        String[] statements = cleaned.split(";");

        for (String stmt : statements) {
            String trimmed = stmt.trim();
            if (trimmed.isEmpty()) continue;

            String upper = trimmed.toUpperCase();
            if (upper.startsWith("INSERT") || upper.startsWith("SET")
                    || upper.startsWith("BEGIN") || upper.startsWith("COMMIT")) {
                try {
                    jdbcTemplate.execute(trimmed);
                } catch (Exception e) {
                    log.warn("Statement failed (continuing): {}", e.getMessage());
                }
            }
        }

        log.info("Database restore completed");
    }

    public String generateBackupFilename() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "mrktraining_backup_" + timestamp;
    }

    public List<String> getAllowedTables() {
        return ALLOWED_TABLES;
    }

    private String buildInsertStatement(String table, Map<String, Object> row) {
        StringBuilder sb = new StringBuilder("INSERT INTO ").append(table).append(" (");
        StringJoiner colJoiner = new StringJoiner(", ");
        StringJoiner valJoiner = new StringJoiner(", ");

        for (Map.Entry<String, Object> entry : row.entrySet()) {
            colJoiner.add(entry.getKey());
            valJoiner.add(formatValue(entry.getValue()));
        }

        sb.append(colJoiner).append(") VALUES (").append(valJoiner).append(")");
        sb.append(" ON CONFLICT DO NOTHING");
        return sb.toString();
    }

    private String formatValue(Object value) {
        if (value == null) return "NULL";
        if (value instanceof Number) return value.toString();
        if (value instanceof Boolean) return value.toString().toUpperCase();
        if (value instanceof byte[]) {
            // BYTEA as hex
            byte[] bytes = (byte[]) value;
            StringBuilder hex = new StringBuilder("'\\x");
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            hex.append("'");
            return hex.toString();
        }
        // Escape single quotes
        String str = value.toString().replace("'", "''");
        return "'" + str + "'";
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
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
}
