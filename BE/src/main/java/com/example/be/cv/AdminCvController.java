package com.example.be.cv;

import com.example.be.cv.dto.CvApplicationDto;
import com.example.be.cv.dto.UpdateCvStatusRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cv")
public class AdminCvController {
    private final CvApplicationRepository cvRepo;

    public AdminCvController(CvApplicationRepository cvRepo) {
        this.cvRepo = cvRepo;
    }

    @GetMapping
    public List<CvApplicationDto> list() {
        return cvRepo.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public CvApplicationDto get(@PathVariable long id) {
        CvApplication app = cvRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("CV not found"));
        return toDto(app);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable long id) throws IOException {
        CvApplication app = cvRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("CV not found"));
        Path p = Path.of(app.getCvStoredPath()).toAbsolutePath().normalize();
        byte[] bytes = Files.readAllBytes(p);
        ByteArrayResource res = new ByteArrayResource(bytes);
        String filename = app.getCvOriginalName() == null ? "cv" : app.getCvOriginalName();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(bytes.length)
            .body(res);
    }

    @PutMapping("/{id}/status")
    public CvApplicationDto updateStatus(@PathVariable long id, @Valid @RequestBody UpdateCvStatusRequest body) {
        CvApplication app = cvRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("CV not found"));
        String next = normalizeStatus(body.status());
        app.setStatus(next);
        CvApplication saved = cvRepo.save(app);
        return toDto(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) throws IOException {
        CvApplication app = cvRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("CV not found"));
        Path uploadRoot = Path.of("uploads", "cv").toAbsolutePath().normalize();
        Path filePath = Path.of(app.getCvStoredPath()).toAbsolutePath().normalize();
        if (!filePath.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Invalid CV file path");
        }
        cvRepo.delete(app);
        Files.deleteIfExists(filePath);
        return ResponseEntity.noContent().build();
    }

    private CvApplicationDto toDto(CvApplication a) {
        return new CvApplicationDto(
            a.getId(),
            a.getJobId(),
            a.getJobTitle(),
            a.getWorkArrangement(),
            a.getFullName(),
            a.getEmail(),
            a.getPhone(),
            a.getSource(),
            a.getCvOriginalName(),
            a.getCvStoredPath(),
            normalizeStatus(a.getStatus()),
            a.getCreatedAt()
        );
    }

    private String normalizeStatus(String raw) {
        String v = String.valueOf(raw == null ? "" : raw).trim().toUpperCase();
        if (v.isBlank()) return "XEM_XET";
        if (!v.equals("PHONG_VAN") && !v.equals("LOAI") && !v.equals("XEM_XET")) {
            throw new IllegalArgumentException("Invalid CV status");
        }
        return v;
    }
}

