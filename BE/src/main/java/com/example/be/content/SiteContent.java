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

    @Column(length = 200)
    private String aboutTitle;

    @Lob
    private String aboutContent;

    @Column(length = 200)
    private String benefitsTitle;

    @Lob
    private String benefitsJson;

    @Column(length = 200)
    private String rightsTitle;

    @Lob
    private String rightsJson;
}

