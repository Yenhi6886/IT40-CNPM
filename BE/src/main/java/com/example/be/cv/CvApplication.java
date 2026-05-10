package com.example.be.cv;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@Entity
@Table(name = "cv_applications")
public class CvApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    @Column(nullable = false, length = 200)
    private String jobTitle;

    /** Snapshot từ job lúc ứng viên nộp (FULL_TIME, …); null/ALL = chưa gán cụ thể. */
    @Column(length = 30)
    private String workArrangement;

    @Column(nullable = false, length = 200)
    private String fullName;

    @Column(nullable = false, length = 200)
    private String email;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(length = 300)
    private String source;

    @Column(nullable = false, length = 300)
    private String cvOriginalName;

    @Column(nullable = false, length = 500)
    private String cvStoredPath;

    @Column(length = 30)
    private String status;

    @CreationTimestamp
    private Instant createdAt;
}

