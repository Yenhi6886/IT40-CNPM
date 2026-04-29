package com.example.be.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "site_content")
public class SiteContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String companyName;

    @Column(length = 500)
    private String logoUrl;

    @Column(length = 200)
    private String heroTitle;

    @Lob
    private String heroSubtitle;

    @Column(length = 800)
    private String heroBackgroundUrl;

    @Column(length = 200)
    private String careersHeroTitle;

    @Lob
    private String careersHeroSubtitle;

    @Column(length = 800)
    private String careersHeroBackgroundUrl;

    @Lob
    private String navJson;

    @Column(length = 200)
    private String aboutTitle;

    @Lob
    private String aboutContent;

    @Lob
    private String joinKaopizerJson;

    @Lob
    private String testimonialsJson;

    @Lob
    private String cultureEventsJson;

    @Column(length = 800)
    private String ctaBackgroundUrl;

    @Column(length = 200)
    private String benefitsTitle;

    @Lob
    private String benefitsJson;

    @Lob
    private String benefitsPageJson;

    @Column(length = 200)
    private String benefitsHeroTitle;

    @Lob
    private String benefitsHeroSubtitle;

    @Column(length = 800)
    private String benefitsHeroBackgroundUrl;

    @Column(length = 800)
    private String benefitsCtaBackgroundUrl;

    @Column(length = 200)
    private String rightsTitle;

    @Lob
    private String rightsJson;

    @Lob
    private String footerJson;

    @Lob
    private String sectionsJson;
}

