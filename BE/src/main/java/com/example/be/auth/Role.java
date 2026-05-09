package com.example.be.auth;

/**
 * ADMIN: tài khoản cũ, khi đăng nhập được cấp quyền giống DESIGN (xem JwtAuthFilter).
 * DESIGN: quản lý nội dung / giao diện trang.
 * HR: tuyển dụng — job & CV.
 */
public enum Role {
    ADMIN,
    DESIGN,
    HR,
    USER
}

