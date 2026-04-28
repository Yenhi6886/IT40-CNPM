package com.example.be.content.dto;

public record SiteContentDto(
    Long id,
    String companyName,
    String logoUrl,
    String heroTitle,
    String heroSubtitle,
    String aboutTitle,
    String aboutContent,
    String benefitsTitle,
    String benefitsJson,
    String rightsTitle,
    String rightsJson
) {}

