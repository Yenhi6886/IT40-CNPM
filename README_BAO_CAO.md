## 2.1.1. Tên đề tài
**Phát triển phần mềm website tuyển dụng & quản trị nội dung (S) cho Công ty Kaopiz (O) theo Công nghệ Phần mềm.**

- **(S) Tên phần mềm**: Website tuyển dụng & CMS quản trị nội dung (Trang chủ / Cơ hội nghề nghiệp / Quyền lợi) kèm module nộp CV và quản lý CV.
- **(O) Đơn vị áp dụng**: **Công ty Kaopiz** (doanh nghiệp CNTT).

## 2.1.2. Thông tin về Đơn vị thực tế (tên, địa chỉ)
- **Tên đơn vị**: Công ty Kaopiz
- **Địa chỉ**: Hà Nội, Việt Nam

## 2.1.3. Đánh giá các hệ thống/đề tài liên quan, sẵn có
Trong bài toán tuyển dụng và quản trị tin tuyển dụng, một số hệ thống/giải pháp phổ biến hiện có:

- **Nền tảng đăng tin tuyển dụng** (VietnamWorks, TopCV, LinkedIn Jobs…)
  - **Ưu điểm**: lượng ứng viên lớn, triển khai nhanh, có sẵn bộ lọc/đề xuất.
  - **Hạn chế**: khó tùy biến giao diện theo nhận diện thương hiệu; dữ liệu ứng tuyển phân tán; phụ thuộc nền tảng và chi phí đăng tin.

- **Hệ thống ATS (Applicant Tracking System)** (Workable, Greenhouse…)
  - **Ưu điểm**: quy trình tuyển dụng chuẩn hóa, pipeline ứng viên, phân quyền, báo cáo.
  - **Hạn chế**: chi phí cao; tích hợp/tuỳ biến theo nhu cầu nội dung trang web có thể hạn chế; cần cấu hình vận hành.

- **Trang tuyển dụng tự phát triển (career site)** của doanh nghiệp
  - **Ưu điểm**: chủ động 100% về UI/UX và nội dung; đồng bộ dữ liệu (job, CV) về một nơi; dễ mở rộng theo yêu cầu nội bộ.
  - **Hạn chế**: cần thời gian phát triển/bảo trì; phải đảm bảo bảo mật, phân quyền, lưu trữ file CV ổn định.

**Dự án đang làm** lựa chọn hướng “career site + admin CMS” nhằm:
- Tùy biến UI/UX theo thiết kế mong muốn.
- Toàn bộ nội dung hiển thị (Hero, CTA, khối nội dung…) do admin quản trị.
- Ứng viên nộp CV trực tiếp, admin quản lý và tải CV trong hệ thống.

## 2.1.4. Phân công nhiệm vụ
Dự án thực hiện bởi **01 thành viên**, nên đảm nhiệm **cả 2 nhóm nhiệm vụ RAI và DT**:

- **RAI (Khảo sát, xác định yêu cầu; Phân tích hệ thống; Lập trình)**:
  - Khảo sát yêu cầu giao diện trang chủ/careers/benefits và luồng nộp CV.
  - Phân tích chức năng: quản trị nội dung, CRUD job, publish/unpublish, nộp CV, quản lý CV.
  - Lập trình: Frontend (React/Vite), Backend (Spring Boot), API, DB (MySQL), upload/download file.

- **DT (Thiết kế hệ thống; Kiểm thử)**:
  - Thiết kế kiến trúc tổng thể FE/BE, routing admin theo URL, phân quyền JWT.
  - Thiết kế dữ liệu: bảng job postings, bảng cv applications, lưu nội dung site.
  - Kiểm thử: kiểm thử các luồng chính (CRUD job, publish, nộp CV, tải CV, cập nhật nội dung), xử lý lỗi và thông báo UI.

