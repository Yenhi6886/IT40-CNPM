package com.example.be.cv;

import com.example.be.content.ContentService;
import com.example.be.content.dto.JobPostingDto;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CvApplicationSubmitService {
    private static final long MAX_CV_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    private final CvApplicationRepository cvRepo;
    private final ContentService contentService;
    private final Path uploadDir = Path.of("uploads", "cv");

    public CvApplicationSubmitService(CvApplicationRepository cvRepo, ContentService contentService) {
        this.cvRepo = cvRepo;
        this.contentService = contentService;
    }

    public ResponseEntity<?> submit(
        long jobId,
        String fullName,
        String email,
        String phone,
        String source,
        String customJobTitle,
        MultipartFile cv
    ) throws IOException {
        if (cv == null || cv.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing CV file"));
        }
        if (cv.getSize() > MAX_CV_SIZE_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("message", "CV file is too large (max 10MB)"));
        }
        String cleanName = StringUtils.cleanPath(cv.getOriginalFilename() == null ? "" : cv.getOriginalFilename());
        String ext = getExt(cleanName);
        if (!isAllowedCvExt(ext)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only pdf/doc/docx are allowed"));
        }
        String ct = String.valueOf(cv.getContentType() == null ? "" : cv.getContentType()).toLowerCase(Locale.ROOT);
        if (!isAllowedCvContentType(ct)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid CV content type"));
        }

        if (jobId < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "jobId không hợp lệ"));
        }

        final long persistedJobId;
        final String resolvedTitle;
        final String resolvedWork;
        if (jobId == 0) {
            String custom = customJobTitle == null ? "" : customJobTitle.trim();
            if (custom.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập vị trí mong muốn"));
            }
            persistedJobId = 0L;
            resolvedTitle = custom;
            resolvedWork = null;
        } else {
            JobPostingDto job = contentService.getPublicJob(jobId);
            persistedJobId = job.id();
            resolvedTitle = job.title();
            resolvedWork = normalizeWorkSnapshot(job.workArrangement());
        }

        Files.createDirectories(uploadDir);
        String stored = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        Path target = uploadDir.resolve(stored).normalize();
        if (!target.startsWith(uploadDir)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
        }
        try (var in = cv.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        CvApplication app = new CvApplication();
        app.setJobId(persistedJobId);
        app.setJobTitle(resolvedTitle);
        app.setWorkArrangement(resolvedWork);
        app.setFullName(String.valueOf(fullName == null ? "" : fullName).trim());
        app.setEmail(String.valueOf(email == null ? "" : email).trim());
        app.setPhone(String.valueOf(phone == null ? "" : phone).trim());
        app.setSource(source == null ? null : source.trim());
        app.setCvOriginalName(cleanName.isBlank() ? "cv" : cleanName);
        app.setCvStoredPath(target.toString());
        app.setStatus("XEM_XET");
        cvRepo.save(app);

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    private static String getExt(String name) {
        String n = name == null ? "" : name;
        int dot = n.lastIndexOf('.');
        if (dot >= 0 && dot < n.length() - 1) return n.substring(dot + 1).toLowerCase(Locale.ROOT);
        return "";
    }

    private static boolean isAllowedCvExt(String ext) {
        return ext != null && (ext.equals("pdf") || ext.equals("doc") || ext.equals("docx"));
    }

    private static boolean isAllowedCvContentType(String contentType) {
        return contentType.equals("application/pdf")
            || contentType.equals("application/msword")
            || contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            || contentType.equals("application/octet-stream");
    }

    private static String normalizeWorkSnapshot(String raw) {
        if (raw == null) return null;
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if (v.isEmpty() || v.equals("ALL")) return null;
        return v;
    }
}
