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
@Table(name = "job_postings")
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String location; // legacy (kept for backward compatibility)

    @Column(length = 120)
    private String employmentType; // legacy (kept for backward compatibility)

    @Column(length = 120)
    private String applyStartDate;

    @Column(length = 120)
    private String applyEndDate;

    @Column(length = 300)
    private String address;

    @Column(length = 20)
    private String jobType; // IT / NON_IT

    @Column(length = 200)
    private String salary;

    /** Số lượng cần tuyển (nullable = chưa khai báo). */
    @Column
    private Integer recruitmentHeadcount;

    /**
     * Loại hình: ALL, FULL_TIME, PART_TIME, INTERN, COLLABORATOR
     * (đồng bộ với workArrangement trong API).
     */
    @Column(length = 32)
    private String workArrangement;

    @Column(length = 500)
    private String imageUrl;

    @Lob
    private String description;

    @Column(nullable = false)
    private boolean published = false;

    @Column(nullable = false)
    private int sortOrder = 0;
}

