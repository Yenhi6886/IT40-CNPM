package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {
    private final SiteContentRepository siteRepo;
    private final JobPostingRepository jobRepo;

    public ContentService(SiteContentRepository siteRepo, JobPostingRepository jobRepo) {
        this.siteRepo = siteRepo;
        this.jobRepo = jobRepo;
    }

    @Transactional(readOnly = true)
    public SiteContentDto getSite() {
        return toDto(ensureSiteExists());
    }

    @Transactional
    public SiteContentDto upsertSite(SiteContentDto dto) {
        SiteContent site = ensureSiteExists();
        site.setCompanyName(nz(dto.companyName(), "Savytech"));
        site.setLogoUrl(blankToNull(dto.logoUrl()));
        site.setHeroTitle(blankToNull(dto.heroTitle()));
        site.setHeroSubtitle(nz(dto.heroSubtitle(), ""));
        site.setAboutTitle(nz(dto.aboutTitle(), "Về chúng tôi"));
        site.setAboutContent(nz(dto.aboutContent(), ""));
        site.setBenefitsTitle(nz(dto.benefitsTitle(), "Quyền lợi"));
        site.setBenefitsJson(nz(dto.benefitsJson(), "[]"));
        site.setRightsTitle(nz(dto.rightsTitle(), "Quyền lợi"));
        site.setRightsJson(nz(dto.rightsJson(), "[]"));
        SiteContent saved = siteRepo.save(site);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> listPublicJobs() {
        return jobRepo.findAllByPublishedTrueOrderBySortOrderAscIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> listAllJobs() {
        return jobRepo.findAllByOrderBySortOrderAscIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public JobPostingDto createJob(JobPostingDto dto) {
        JobPosting job = new JobPosting();
        applyJob(job, dto);
        return toDto(jobRepo.save(job));
    }

    @Transactional
    public JobPostingDto updateJob(long id, JobPostingDto dto) {
        JobPosting job = jobRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
        applyJob(job, dto);
        return toDto(jobRepo.save(job));
    }

    @Transactional
    public void deleteJob(long id) {
        jobRepo.deleteById(id);
    }

    private void applyJob(JobPosting job, JobPostingDto dto) {
        job.setTitle(nz(dto.title(), ""));
        job.setLocation(blankToNull(dto.location()));
        job.setEmploymentType(blankToNull(dto.employmentType()));
        job.setSalary(blankToNull(dto.salary()));
        job.setImageUrl(blankToNull(dto.imageUrl()));
        job.setDescription(nz(dto.description(), ""));
        job.setPublished(dto.published());
        job.setSortOrder(dto.sortOrder());
    }

    private SiteContentDto toDto(SiteContent s) {
        return new SiteContentDto(
            s.getId(),
            s.getCompanyName(),
            s.getLogoUrl(),
            s.getHeroTitle(),
            s.getHeroSubtitle(),
            s.getAboutTitle(),
            s.getAboutContent(),
            s.getBenefitsTitle(),
            s.getBenefitsJson(),
            s.getRightsTitle(),
            s.getRightsJson()
        );
    }

    private SiteContent ensureSiteExists() {
        return siteRepo.findAll().stream().findFirst().orElseGet(() -> {
            SiteContent sc = new SiteContent();
            sc.setCompanyName("Savytech");
            sc.setLogoUrl(null);
            sc.setHeroTitle("Savytech");
            sc.setHeroSubtitle("");
            sc.setAboutTitle("Về chúng tôi");
            sc.setAboutContent("");
            sc.setBenefitsTitle("Quyền lợi");
            sc.setBenefitsJson("[]");
            sc.setRightsTitle("Quyền lợi");
            sc.setRightsJson("[]");
            return siteRepo.save(sc);
        });
    }

    private JobPostingDto toDto(JobPosting j) {
        return new JobPostingDto(
            j.getId(),
            j.getTitle(),
            j.getLocation(),
            j.getEmploymentType(),
            j.getSalary(),
            j.getImageUrl(),
            j.getDescription(),
            j.isPublished(),
            j.getSortOrder()
        );
    }

    private static String nz(String v, String fallback) {
        return v == null ? fallback : v;
    }

    private static String blankToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}

