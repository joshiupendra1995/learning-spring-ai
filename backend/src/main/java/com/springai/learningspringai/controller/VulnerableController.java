package com.example.vulnerable.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/vulnerable")
public class VulnerableController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. SQL Injection Vulnerability
    // Example attack: ?username=admin' OR '1'='1
    @GetMapping("/user")
    public String getUserByUsername(@RequestParam String username) {
        String query = "SELECT * FROM users WHERE username = '" + username + "'";
        try {
            return jdbcTemplate.queryForMap(query).toString();
        } catch (Exception e) {
            return "User not found or query error: " + e.getMessage();
        }
    }

    // 2. Path Traversal Vulnerability
    // Example attack: ?filename=../../../../etc/passwd
    @GetMapping("/download")
    public byte[] downloadFile(@RequestParam String filename) throws IOException {
        String uploadDir = "/var/app/uploads/";
        Path filePath = Paths.get(uploadDir + filename);
        return Files.readAllBytes(filePath);
    }

    // 3. Remote Code Execution (RCE) via ProcessBuilder
    // Example attack: ?cmd=calc.exe (or rm -rf / on linux)
    @GetMapping("/exec")
    public String executeCommand(@RequestParam String cmd) {
        try {
            Process process = Runtime.getRuntime().exec(cmd);
            return "Command executed successfully.";
        } catch (IOException e) {
            return "Execution failed: " + e.getMessage();
        }
    }

    // 4. Insecure File Upload without validation
    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return "Please select a file to upload.";
        }

        try {
            // Saves file directly with original filename into a public directory
            byte[] bytes = file.getBytes();
            Path path = Paths.get("/var/app/uploads/" + file.getOriginalFilename());
            Files.write(path, bytes);
            return "Successfully uploaded: " + file.getOriginalFilename();
        } catch (IOException e) {
            return "Upload failed: " + e.getMessage();
        }
    }
}
