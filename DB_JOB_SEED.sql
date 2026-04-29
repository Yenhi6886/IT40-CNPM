-- Seed 20 sample jobs (10 IT + 10 Non-IT) into MySQL schema `it40`
-- Table: job_postings
--
-- How to run (mysql CLI):
--   mysql -u root -p it40 < DB_JOB_SEED.sql
--
-- Notes:
-- - This script DOES NOT delete existing jobs.
-- - `apply_start_date` / `apply_end_date` are stored as strings (yyyy-mm-dd) in this project.

USE it40;

INSERT INTO job_postings
  (title, apply_start_date, apply_end_date, address, job_type, salary, image_url, description, published, sort_order, location, employment_type)
VALUES
  -- =========================
  -- IT (10)
  -- =========================
  (
    'Java Developer (Spring Boot)',
    '2026-04-27','2026-11-29',
    'Tầng 10, Tòa nhà ABC, 123 Đường XYZ, Hà Nội',
    'IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Phát triển API bằng Spring Boot</li><li>Tối ưu hiệu năng, logging, monitoring</li><li>Phối hợp FE/QA</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm Java</li><li>JPA/Hibernate, MySQL</li></ul><h3>QUYỀN LỢI</h3><ul><li>Review lương 2 lần/năm</li><li>Lương tháng 13</li></ul>',
    1, 10, NULL, NULL
  ),
  (
    'Frontend Developer (React)',
    '2026-05-01','2026-10-30',
    'Tầng 8, Tòa nhà DEF, 45 Nguyễn Trãi, Hà Nội',
    'IT',
    'Up to 45M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Xây dựng UI React + Tailwind</li><li>Tối ưu performance, accessibility</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm React</li><li>Hiểu REST, state management</li></ul>',
    1, 20, NULL, NULL
  ),
  (
    'QA Engineer (Manual + Automation)',
    '2026-04-20','2026-09-20',
    'Tầng 6, Tòa nhà GHI, 200 Cầu Giấy, Hà Nội',
    'IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Viết test case, test plan</li><li>Automation cơ bản (Playwright/Selenium)</li></ul><h3>YÊU CẦU</h3><ul><li>1+ năm QA</li><li>Biết SQL là lợi thế</li></ul>',
    1, 30, NULL, NULL
  ),
  (
    'DevOps Engineer (AWS)',
    '2026-05-05','2026-12-15',
    'Tầng 12, Tòa nhà JKL, 18 Phạm Hùng, Hà Nội',
    'IT',
    'Up to 60M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>CI/CD, Docker, Kubernetes</li><li>AWS (EC2, S3, RDS), IaC</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm DevOps</li><li>Linux, networking</li></ul>',
    1, 40, NULL, NULL
  ),
  (
    'Data Engineer (ETL)',
    '2026-05-10','2026-11-10',
    'Tầng 9, Tòa nhà MNO, 88 Trần Duy Hưng, Hà Nội',
    'IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Xây dựng pipeline ETL</li><li>SQL/DBT/Airflow (nếu có)</li></ul><h3>YÊU CẦU</h3><ul><li>Python/SQL</li><li>Data modeling</li></ul>',
    1, 50, NULL, NULL
  ),
  (
    'Mobile Developer (Flutter)',
    '2026-04-25','2026-10-25',
    'Tầng 5, Tòa nhà PQR, 77 Lê Duẩn, Đà Nẵng',
    'IT',
    'Up to 40M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Phát triển app Flutter</li><li>Tích hợp API, push notification</li></ul><h3>YÊU CẦU</h3><ul><li>1+ năm Flutter</li><li>Hiểu state management</li></ul>',
    1, 60, NULL, NULL
  ),
  (
    'Backend Developer (Node.js)',
    '2026-05-02','2026-09-30',
    'Tầng 3, Tòa nhà STU, 12 Võ Văn Kiệt, TP HCM',
    'IT',
    'Up to 50M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Xây dựng API Node.js (NestJS/Express)</li><li>Cache/queue cơ bản</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm Node.js</li><li>PostgreSQL/MySQL</li></ul>',
    1, 70, NULL, NULL
  ),
  (
    'UI/UX Designer',
    '2026-04-18','2026-08-31',
    'Tầng 7, Tòa nhà VWX, 59 Điện Biên Phủ, TP HCM',
    'IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Thiết kế wireframe, UI kit</li><li>Prototype Figma</li></ul><h3>YÊU CẦU</h3><ul><li>Portfolio</li><li>Hiểu design system</li></ul>',
    1, 80, NULL, NULL
  ),
  (
    'Security Engineer (AppSec)',
    '2026-05-01','2026-12-01',
    'Tầng 11, Tòa nhà YZA, 1 Láng Hạ, Hà Nội',
    'IT',
    'Up to 70M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Review code security, threat modeling</li><li>Triển khai SAST/DAST</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm AppSec</li><li>OWASP Top 10</li></ul>',
    1, 90, NULL, NULL
  ),
  (
    'Product Engineer (Fullstack)',
    '2026-05-03','2026-10-03',
    'Tầng 4, Tòa nhà BCD, 102 Nguyễn Huệ, TP HCM',
    'IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Phát triển tính năng end-to-end</li><li>React + Spring/Node</li></ul><h3>YÊU CẦU</h3><ul><li>Fullstack mindset</li><li>Giao tiếp tốt</li></ul>',
    1, 100, NULL, NULL
  ),

  -- =========================
  -- Non-IT (10)
  -- =========================
  (
    'HR Generalist',
    '2026-04-15','2026-07-31',
    'Tầng 10, Tòa nhà ABC, 123 Đường XYZ, Hà Nội',
    'NON_IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Tuyển dụng, onboarding</li><li>Hỗ trợ C&B, văn hóa nội bộ</li></ul><h3>YÊU CẦU</h3><ul><li>1+ năm HR</li><li>Kỹ năng giao tiếp tốt</li></ul>',
    1, 110, NULL, NULL
  ),
  (
    'Recruitment Specialist',
    '2026-04-20','2026-08-20',
    'Tầng 6, Tòa nhà GHI, 200 Cầu Giấy, Hà Nội',
    'NON_IT',
    'Up to 20M + thưởng',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Phụ trách tuyển dụng end-to-end</li><li>Đăng tin, sàng lọc CV, phỏng vấn</li></ul>',
    1, 120, NULL, NULL
  ),
  (
    'Kế toán tổng hợp',
    '2026-05-01','2026-09-01',
    'Tầng 2, Tòa nhà STU, 12 Võ Văn Kiệt, TP HCM',
    'NON_IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Hạch toán, báo cáo nội bộ</li><li>Hỗ trợ quyết toán thuế</li></ul><h3>YÊU CẦU</h3><ul><li>2+ năm kinh nghiệm</li><li>Thành thạo Excel</li></ul>',
    1, 130, NULL, NULL
  ),
  (
    'Chuyên viên Marketing nội dung',
    '2026-04-28','2026-10-28',
    'Tầng 7, Tòa nhà VWX, 59 Điện Biên Phủ, TP HCM',
    'NON_IT',
    'Up to 25M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Viết bài PR, social content</li><li>Phối hợp thiết kế/ads</li></ul><h3>YÊU CẦU</h3><ul><li>Kỹ năng viết tốt</li><li>Hiểu basic SEO</li></ul>',
    1, 140, NULL, NULL
  ),
  (
    'Sales Executive (B2B)',
    '2026-05-05','2026-12-31',
    'Tầng 4, Tòa nhà BCD, 102 Nguyễn Huệ, TP HCM',
    'NON_IT',
    'Lương cứng + commission',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Tìm kiếm khách hàng doanh nghiệp</li><li>Chăm sóc và phát triển pipeline</li></ul><h3>YÊU CẦU</h3><ul><li>1+ năm sales</li><li>Chủ động, chịu KPI</li></ul>',
    1, 150, NULL, NULL
  ),
  (
    'IT Sales (Global)',
    '2026-05-01','2026-10-01',
    'Tầng 10, Tòa nhà ABC, 123 Đường XYZ, Hà Nội',
    'NON_IT',
    'Up to 35M + thưởng',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Chào bán dịch vụ phần mềm cho thị trường quốc tế</li><li>Làm việc với team kỹ thuật để proposal</li></ul>',
    1, 160, NULL, NULL
  ),
  (
    'Chăm sóc khách hàng (Customer Success)',
    '2026-04-20','2026-08-20',
    'Tầng 5, Tòa nhà PQR, 77 Lê Duẩn, Đà Nẵng',
    'NON_IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Hỗ trợ khách hàng qua email/chat</li><li>Theo dõi mức độ hài lòng</li></ul><h3>YÊU CẦU</h3><ul><li>Giao tiếp tốt</li><li>Cẩn thận, trách nhiệm</li></ul>',
    1, 170, NULL, NULL
  ),
  (
    'Office Admin',
    '2026-05-01','2026-07-31',
    'Tầng 8, Tòa nhà DEF, 45 Nguyễn Trãi, Hà Nội',
    'NON_IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Hành chính văn phòng</li><li>Quản lý văn phòng phẩm, hỗ trợ sự kiện nội bộ</li></ul>',
    1, 180, NULL, NULL
  ),
  (
    'Biên phiên dịch (Tiếng Nhật N2)',
    '2026-04-25','2026-12-25',
    'Tầng 9, Tòa nhà MNO, 88 Trần Duy Hưng, Hà Nội',
    'NON_IT',
    'Up to 30M',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Phiên dịch họp, tài liệu dự án</li><li>Hỗ trợ giao tiếp khách hàng Nhật</li></ul><h3>YÊU CẦU</h3><ul><li>JLPT N2+</li><li>Ưu tiên có kinh nghiệm IT</li></ul>',
    1, 190, NULL, NULL
  ),
  (
    'Project Coordinator',
    '2026-05-01','2026-09-30',
    'Tầng 3, Tòa nhà STU, 12 Võ Văn Kiệt, TP HCM',
    'NON_IT',
    'Thỏa thuận',
    NULL,
    '<h3>MÔ TẢ CÔNG VIỆC</h3><ul><li>Hỗ trợ PM quản lý timeline</li><li>Theo dõi task, tổng hợp báo cáo</li></ul><h3>YÊU CẦU</h3><ul><li>Giao tiếp tốt</li><li>Biết Jira/Trello là lợi thế</li></ul>',
    1, 200, NULL, NULL
  );

