package com.example.be.content;

import com.example.be.content.dto.JobPostingDto;
import com.example.be.content.dto.SiteContentDto;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {
    private static final SiteContentDto DEFAULT_SITE = new SiteContentDto(
        null,
        "Savytech",
        null,
        null,
        "",
        null,
        null,
        "",
        null,
        null,
        "Về chúng tôi",
        "",
        null,
        null,
        null,
        null,
        "Quyền lợi",
        "[]",
        "[]",
        null,
        "",
        null,
        null,
        "Quyền lợi",
        "[]",
        null,
        null
    );

    private final SiteContentRepository siteRepo;
    private final JobPostingRepository jobRepo;

    public ContentService(SiteContentRepository siteRepo, JobPostingRepository jobRepo) {
        this.siteRepo = siteRepo;
        this.jobRepo = jobRepo;
    }

    @Transactional(readOnly = true)
    public SiteContentDto getSite() {
        return siteRepo.findAll().stream().findFirst().map(this::toDto).orElse(DEFAULT_SITE);
    }

    @Transactional
    public SiteContentDto upsertSite(SiteContentDto dto) {
        SiteContent site = ensureSiteExists();
        site.setCompanyName(nz(dto.companyName(), "Savytech"));
        site.setLogoUrl(blankToNull(dto.logoUrl()));
        site.setHeroTitle(blankToNull(dto.heroTitle()));
        site.setHeroSubtitle(nz(dto.heroSubtitle(), ""));
        site.setHeroBackgroundUrl(blankToNull(dto.heroBackgroundUrl()));
        site.setCareersHeroTitle(blankToNull(dto.careersHeroTitle()));
        site.setCareersHeroSubtitle(nz(dto.careersHeroSubtitle(), ""));
        site.setCareersHeroBackgroundUrl(blankToNull(dto.careersHeroBackgroundUrl()));
        site.setNavJson(nz(dto.navJson(), "[]"));
        site.setAboutTitle(nz(dto.aboutTitle(), "Về chúng tôi"));
        site.setAboutContent(nz(dto.aboutContent(), ""));
        site.setJoinKaopizerJson(nz(dto.joinKaopizerJson(), "[]"));
        site.setTestimonialsJson(nz(dto.testimonialsJson(), "[]"));
        site.setCultureEventsJson(nz(dto.cultureEventsJson(), "[]"));
        site.setCtaBackgroundUrl(blankToNull(dto.ctaBackgroundUrl()));
        site.setBenefitsTitle(nz(dto.benefitsTitle(), "Quyền lợi"));
        site.setBenefitsJson(nz(dto.benefitsJson(), "[]"));
        site.setBenefitsPageJson(nz(dto.benefitsPageJson(), "[]"));
        site.setBenefitsHeroTitle(blankToNull(dto.benefitsHeroTitle()));
        site.setBenefitsHeroSubtitle(nz(dto.benefitsHeroSubtitle(), ""));
        site.setBenefitsHeroBackgroundUrl(blankToNull(dto.benefitsHeroBackgroundUrl()));
        site.setBenefitsCtaBackgroundUrl(blankToNull(dto.benefitsCtaBackgroundUrl()));
        site.setRightsTitle(nz(dto.rightsTitle(), "Quyền lợi"));
        site.setRightsJson(nz(dto.rightsJson(), "[]"));
        site.setFooterJson(nz(dto.footerJson(), "[]"));
        site.setSectionsJson(nz(dto.sectionsJson(), "{}"));
        SiteContent saved = siteRepo.save(site);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> listPublicJobs() {
        return jobRepo.findAllByPublishedTrueOrderBySortOrderAscIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public JobPostingDto getPublicJob(long id) {
        JobPosting job = jobRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (!job.isPublished()) throw new IllegalArgumentException("Job not found");
        return toDto(job);
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> listAllJobs() {
        return jobRepo.findAllByOrderBySortOrderAscIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public JobPostingDto getAdminJob(long id) {
        JobPosting job = jobRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
        return toDto(job);
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
        job.setApplyStartDate(blankToNull(dto.applyStartDate()));
        job.setApplyEndDate(blankToNull(dto.applyEndDate()));
        job.setAddress(blankToNull(dto.address()));
        job.setJobType(blankToNull(dto.jobType()));
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
            s.getHeroBackgroundUrl(),
            s.getCareersHeroTitle(),
            s.getCareersHeroSubtitle(),
            s.getCareersHeroBackgroundUrl(),
            s.getNavJson(),
            s.getAboutTitle(),
            s.getAboutContent(),
            s.getJoinKaopizerJson(),
            s.getTestimonialsJson(),
            s.getCultureEventsJson(),
            s.getCtaBackgroundUrl(),
            s.getBenefitsTitle(),
            s.getBenefitsJson(),
            s.getBenefitsPageJson(),
            s.getBenefitsHeroTitle(),
            s.getBenefitsHeroSubtitle(),
            s.getBenefitsHeroBackgroundUrl(),
            s.getBenefitsCtaBackgroundUrl(),
            s.getRightsTitle(),
            s.getRightsJson(),
            s.getFooterJson(),
            s.getSectionsJson()
        );
    }

    private SiteContent ensureSiteExists() {
        return siteRepo.findAll().stream().findFirst().orElseGet(() -> {
            SiteContent sc = new SiteContent();
            sc.setCompanyName("Savytech");
            sc.setLogoUrl(null);
            sc.setHeroTitle(null);
            sc.setHeroSubtitle("");
            sc.setHeroBackgroundUrl(null);
            sc.setCareersHeroTitle(null);
            sc.setCareersHeroSubtitle("");
            sc.setCareersHeroBackgroundUrl(null);
            sc.setNavJson("[]");
            sc.setAboutTitle("Về chúng tôi");
            sc.setAboutContent("");
            sc.setJoinKaopizerJson("[]");
            sc.setTestimonialsJson("[]");
            sc.setCultureEventsJson("[]");
            sc.setCtaBackgroundUrl(null);
            sc.setBenefitsTitle("Quyền lợi");
            sc.setBenefitsJson("[]");
            sc.setBenefitsPageJson("[]");
            sc.setBenefitsHeroTitle(null);
            sc.setBenefitsHeroSubtitle("");
            sc.setBenefitsHeroBackgroundUrl(null);
            sc.setBenefitsCtaBackgroundUrl(null);
            sc.setRightsTitle("Quyền lợi");
            sc.setRightsJson("[]");
            sc.setFooterJson("[]");
            sc.setSectionsJson("{}");
            return siteRepo.save(sc);
        });
    }

    private JobPostingDto toDto(JobPosting j) {
        return new JobPostingDto(
            j.getId(),
            j.getTitle(),
            j.getApplyStartDate(),
            j.getApplyEndDate(),
            j.getAddress(),
            j.getJobType(),
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

