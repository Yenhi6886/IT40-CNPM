package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import java.util.List;
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
}

