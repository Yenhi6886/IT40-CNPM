package com.example.be.cv;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
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
    private final CvApplicationSubmitService submitService;

    public PublicCvController(CvApplicationSubmitService submitService) {
        this.submitService = submitService;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(
        @RequestParam("jobId") long jobId,
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
        @Size(max = 200, message = "customJobTitle is too long")
        @RequestParam(value = "customJobTitle", required = false) String customJobTitle,
        @RequestParam("cv") MultipartFile cv
    ) throws IOException {
        return submitService.submit(jobId, fullName, email, phone, source, customJobTitle, cv);
    }
}
