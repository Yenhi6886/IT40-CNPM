package com.example.be.content;

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

@RestController
@RequestMapping("/api/admin")
public class UploadController {
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private final Path uploadDir = Path.of("uploads");

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No file"));
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("message", "Image file is too large (max 5MB)"));
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            ext = original.substring(dot + 1).toLowerCase(Locale.ROOT);
        }

        if (!isAllowedImageExt(ext)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only image files are allowed"));
        }
        String contentType = String.valueOf(file.getContentType() == null ? "" : file.getContentType()).toLowerCase(Locale.ROOT);
        if (!isAllowedImageContentType(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid image content type"));
        }

        Files.createDirectories(uploadDir);
        String name = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        Path target = uploadDir.resolve(name).normalize();

        if (!target.startsWith(uploadDir)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
        }

        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return ResponseEntity.ok(Map.of("url", "/uploads/" + name));
    }

    private static boolean isAllowedImageExt(String ext) {
        return ext != null
            && (ext.equals("png")
                || ext.equals("jpg")
                || ext.equals("jpeg")
                || ext.equals("webp")
                || ext.equals("gif"));
    }

    private static boolean isAllowedImageContentType(String contentType) {
        return contentType.equals("image/png")
            || contentType.equals("image/jpeg")
            || contentType.equals("image/webp")
            || contentType.equals("image/gif")
            || contentType.equals("application/octet-stream");
    }
}

