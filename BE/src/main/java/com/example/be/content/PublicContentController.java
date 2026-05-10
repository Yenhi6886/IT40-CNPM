package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicContentController {
    private final ContentService contentService;

    public PublicContentController(ContentService contentService) {
        this.contentService = contentService;
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
}

