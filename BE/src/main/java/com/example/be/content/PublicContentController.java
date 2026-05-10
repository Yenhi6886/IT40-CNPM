package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import com.example.be.cv.CvApplicationSubmitService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/public")
@Validated
public class PublicContentController {
    private final ContentService contentService;
    private final CvApplicationSubmitService cvSubmitService;

    public PublicContentController(ContentService contentService, CvApplicationSubmitService cvSubmitService) {
        this.contentService = contentService;
        this.cvSubmitService = cvSubmitService;
    }

    @GetMapping("/site")
    public SiteContentDto site() {
        return contentService.getSite();
    }

    @GetMapping("/jobs")
    public List<JobPostingDto> jobs() {
        return contentService.listPublicJobs();
    }

    /** Chỉ các tin đang mở nhận hồ sơ (theo ngày & trạng thái xuất bản). */
    @GetMapping("/jobs/open")
    public List<JobPostingDto> jobsOpenForApplication() {
        return contentService.listPublicJobsOpenForApplication();
    }

    @GetMapping("/jobs/{id}")
    public JobPostingDto job(@PathVariable long id) {
        return contentService.getPublicJob(id);
    }

    /**
     * RESTful: POST /api/public/jobs/{jobId}/apply (multipart form: fullName, email, phone, cv; optional source, customJobTitle).
     * Đặt cùng controller với GET /jobs/{id} để mapping luôn khớp sau khi rebuild/restart.
     */
    @PostMapping("/jobs/{jobId}/apply")
    public ResponseEntity<?> applyForJob(
        @PathVariable long jobId,
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
        return cvSubmitService.submit(jobId, fullName, email, phone, source, customJobTitle, cv);
    }
}
