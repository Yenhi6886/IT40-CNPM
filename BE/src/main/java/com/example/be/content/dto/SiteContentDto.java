package com.example.be.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteContentDto(
    Long id,
    @NotBlank(message = "companyName is required")
    @Size(max = 120, message = "companyName is too long")
    String companyName,
    @Size(max = 500, message = "logoUrl is too long")
    String logoUrl,
    @Size(max = 200, message = "heroTitle is too long")
    String heroTitle,
    @Size(max = 500_000, message = "heroSubtitle is too long")
    String heroSubtitle,
    @Size(max = 800, message = "heroBackgroundUrl is too long")
    String heroBackgroundUrl,
    @Size(max = 200, message = "careersHeroTitle is too long")
    String careersHeroTitle,
    @Size(max = 500_000, message = "careersHeroSubtitle is too long")
    String careersHeroSubtitle,
    @Size(max = 800, message = "careersHeroBackgroundUrl is too long")
    String careersHeroBackgroundUrl,
    @Size(max = 1_000_000, message = "navJson is too long")
    String navJson,
    @Size(max = 200, message = "aboutTitle is too long")
    String aboutTitle,
    @Size(max = 2_000_000, message = "aboutContent is too long")
    String aboutContent,
    @Size(max = 1_000_000, message = "joinKaopizerJson is too long")
    String joinKaopizerJson,
    @Size(max = 1_000_000, message = "testimonialsJson is too long")
    String testimonialsJson,
    @Size(max = 1_000_000, message = "cultureEventsJson is too long")
    String cultureEventsJson,
    @Size(max = 800, message = "ctaBackgroundUrl is too long")
    String ctaBackgroundUrl,
    @Size(max = 200, message = "benefitsTitle is too long")
    String benefitsTitle,
    @Size(max = 1_000_000, message = "benefitsJson is too long")
    String benefitsJson,
    @Size(max = 2_000_000, message = "benefitsPageJson is too long")
    String benefitsPageJson,
    @Size(max = 200, message = "benefitsHeroTitle is too long")
    String benefitsHeroTitle,
    @Size(max = 500_000, message = "benefitsHeroSubtitle is too long")
    String benefitsHeroSubtitle,
    @Size(max = 800, message = "benefitsHeroBackgroundUrl is too long")
    String benefitsHeroBackgroundUrl,
    @Size(max = 800, message = "benefitsCtaBackgroundUrl is too long")
    String benefitsCtaBackgroundUrl,
    @Size(max = 200, message = "rightsTitle is too long")
    String rightsTitle,
    @Size(max = 1_000_000, message = "rightsJson is too long")
    String rightsJson,
    @Size(max = 1_000_000, message = "footerJson is too long")
    String footerJson,
    @Size(max = 500_000, message = "sectionsJson is too long")
    String sectionsJson
) {}
