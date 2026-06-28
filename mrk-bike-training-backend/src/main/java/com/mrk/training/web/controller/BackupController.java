package com.mrk.training.web.controller;

import com.mrk.training.service.BackupService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * Download backup after validating credentials and secret answer.
     * Returns a ZIP containing: SQL (insert-only) + CSV files per table.
     */
    @PostMapping("/download")
    public ResponseEntity<?> downloadBackup(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String secretAnswer = request.get("secretAnswer");

        // Validate credentials
        if (!backupService.validateCredentials(username, password)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        // Validate secret answer
        if (!backupService.validateSecretAnswer(secretAnswer)) {
            return ResponseEntity.status(403).body(Map.of("error", "Incorrect answer to security question"));
        }

        try {
            // Generate INSERT-only SQL
            byte[] sqlBytes = backupService.generateInsertOnlySql();

            // Generate CSV data
            Map<String, byte[]> csvFiles = backupService.generateCsvData();

            // Package into a ZIP
            String baseName = backupService.generateBackupFilename();
            ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(zipOut)) {
                // Add SQL file
                zos.putNextEntry(new ZipEntry(baseName + ".sql"));
                zos.write(sqlBytes);
                zos.closeEntry();

                // Add CSV files
                for (Map.Entry<String, byte[]> csv : csvFiles.entrySet()) {
                    zos.putNextEntry(new ZipEntry("csv/" + csv.getKey()));
                    zos.write(csv.getValue());
                    zos.closeEntry();
                }
            }

            byte[] zipBytes = zipOut.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseName + ".zip\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(zipBytes.length)
                    .body(zipBytes);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to generate backup: " + e.getMessage()));
        }
    }

    /**
     * Restore backup from uploaded SQL file (insert-only, validated against schema).
     */
    @PostMapping("/restore")
    public ResponseEntity<Map<String, Object>> restoreBackup(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        String originalName = file.getOriginalFilename();
        if (originalName != null && !originalName.endsWith(".sql")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only .sql files are accepted"));
        }

        try {
            String sqlContent = new String(file.getBytes(), StandardCharsets.UTF_8);

            // Validate SQL content
            List<String> validationErrors = backupService.validateRestoreSql(sqlContent);
            if (!validationErrors.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "SQL validation failed",
                        "details", validationErrors
                ));
            }

            // Execute restore
            backupService.executeRestoreSql(sqlContent);
            return ResponseEntity.ok(Map.of("message", "Database restored successfully"));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to read uploaded file: " + e.getMessage()));
        }
    }

    /**
     * Pre-validate an uploaded SQL file without executing it.
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateSql(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        try {
            String sqlContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            List<String> errors = backupService.validateRestoreSql(sqlContent);

            if (errors.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "message", "SQL file is valid — contains only INSERT statements for allowed tables"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "errors", errors
                ));
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to read file: " + e.getMessage()));
        }
    }
}
