package com.example.be.cv;

import com.example.be.content.ContentService;
import com.example.be.content.dto.JobPostingDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping("/api/public")
public class PublicCvController {
    private static final long MAX_CV_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    private final CvApplicationRepository cvRepo;
    private final ContentService contentService;
    private final Path uploadDir = Path.of("uploads", "cv");

    public PublicCvController(CvApplicationRepository cvRepo, ContentService contentService) {
        this.cvRepo = cvRepo;
        this.contentService = contentService;
    }

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> apply(
        @Positive(message = "jobId must be > 0") @RequestParam("jobId") long jobId,
        @NotBlank(message = "fullName is required")
        @Size(max = 200, message = "fullName is too long")
        @RequestParam("fullName") String fullName,
        @NotBlank(message = "email is required")
        @Email(message = "Invalid email")
        @Size(max = 200, message = "email is too long")
        @RequestParam("email") String email,
        @NotBlank(message = "phone is required")
        @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$", message = "Invalid phone number")
        @RequestParam("phone") String phone,
        @Size(max = 300, message = "source is too long")
        @RequestParam(value = "source", required = false) String source,
        @RequestParam("cv") MultipartFile cv
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

        JobPostingDto job = contentService.getPublicJob(jobId);

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
        app.setJobId(job.id());
        app.setJobTitle(job.title());
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
}

