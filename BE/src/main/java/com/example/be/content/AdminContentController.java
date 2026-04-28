package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminContentController {
    private final ContentService contentService;

    public AdminContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/site")
    public SiteContentDto getSite() {
        return contentService.getSite();
    }

    @PutMapping("/site")
    public SiteContentDto upsertSite(@RequestBody SiteContentDto dto) {
        return contentService.upsertSite(dto);
    }

    @GetMapping("/jobs")
    public List<JobPostingDto> listJobs() {
        return contentService.listAllJobs();
    }

    @PostMapping("/jobs")
    public JobPostingDto createJob(@RequestBody JobPostingDto dto) {
        return contentService.createJob(dto);
    }

    @PutMapping("/jobs/{id}")
    public JobPostingDto updateJob(@PathVariable long id, @RequestBody JobPostingDto dto) {
        return contentService.updateJob(id, dto);
    }

    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable long id) {
        contentService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleNotFound(IllegalArgumentException ex) {
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")) {
            return ResponseEntity.status(404).body(java.util.Map.of("message", ex.getMessage()));
        }
        return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
    }
}

