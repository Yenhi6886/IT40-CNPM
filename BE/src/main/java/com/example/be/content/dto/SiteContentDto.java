package com.example.be.content.dto;

public record SiteContentDto(
    Long id,
    String companyName,
    String logoUrl,
    String heroTitle,
    String heroSubtitle,
    String heroBackgroundUrl,
    String careersHeroTitle,
    String careersHeroSubtitle,
    String careersHeroBackgroundUrl,
    String navJson,
    String aboutTitle,
    String aboutContent,
    String joinKaopizerJson,
    String testimonialsJson,
    String cultureEventsJson,
    String ctaBackgroundUrl,
    String benefitsTitle,
    String benefitsJson,
    String benefitsPageJson,
    String benefitsHeroTitle,
    String benefitsHeroSubtitle,
    String benefitsHeroBackgroundUrl,
    String benefitsCtaBackgroundUrl,
    String rightsTitle,
    String rightsJson,
    String footerJson,
    String sectionsJson
) {}

