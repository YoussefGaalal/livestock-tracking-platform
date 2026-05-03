-- Animal Tracking System - Manual SQL Migration
-- Run this script in MySQL when PHP MySQL extensions are fixed
-- Database: oasis_staging

-- =====================
-- Languages Table
-- =====================
CREATE TABLE IF NOT EXISTS languages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    direction VARCHAR(10) DEFAULT 'ltr',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Translations Table
-- =====================
CREATE TABLE IF NOT EXISTS translations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `group` VARCHAR(100) NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    language_code VARCHAR(3) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
    UNIQUE KEY translations_unique (`group`, `key`, language_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Seed Languages
-- =====================
INSERT IGNORE INTO languages (code, name, native_name, direction, is_active, is_default, sort_order, created_at, updated_at) VALUES
('en', 'English', 'English', 'ltr', TRUE, TRUE, 1, NOW(), NOW()),
('ar', 'Arabic', 'العربية', 'rtl', TRUE, FALSE, 2, NOW(), NOW()),
('ur', 'Urdu', 'اردو', 'rtl', TRUE, FALSE, 3, NOW(), NOW()),
('eu', 'Basque', 'Euskara', 'ltr', TRUE, FALSE, 4, NOW(), NOW());

-- =====================
-- Seed Sample Translations
-- =====================
INSERT IGNORE INTO translations (language_code, `group`, `key`, value) VALUES
-- English (common)
('en', 'common', 'code', 'Code'),
('en', 'common', 'name', 'Name'),
('en', 'common', 'nativeName', 'Native Name'),
('en', 'common', 'direction', 'Direction'),
('en', 'common', 'status', 'Status'),
('en', 'common', 'add', 'Add'),
('en', 'common', 'edit', 'Edit'),
('en', 'common', 'delete', 'Delete'),
('en', 'common', 'save', 'Save'),
('en', 'common', 'cancel', 'Cancel'),
-- Arabic (common)
('ar', 'common', 'code', 'الرمز'),
('ar', 'common', 'name', 'الاسم'),
('ar', 'common', 'nativeName', 'الاسم الأصلي'),
('ar', 'common', 'direction', 'الاتجاه'),
('ar', 'common', 'status', 'الحالة'),
('ar', 'common', 'add', 'إضافة'),
('ar', 'common', 'edit', 'تعديل'),
('ar', 'common', 'delete', 'حذف'),
('ar', 'common', 'save', 'حفظ'),
('ar', 'common', 'cancel', 'إلغاء'),
-- Urdu (common)
('ur', 'common', 'code', 'کوڈ'),
('ur', 'common', 'name', 'نام'),
('ur', 'common', 'nativeName', '本 地 نام'),
('ur', 'common', 'direction', 'سمت'),
('ur', 'common', 'status', 'حالت'),
('ur', 'common', 'add', 'شامل کریں'),
('ur', 'common', 'edit', 'ترمیم'),
('ur', 'common', 'delete', 'حذف کریں'),
('ur', 'common', 'save', 'محفوظ کریں'),
('ur', 'common', 'cancel', 'منسوخ'),
-- Basque (common)
('eu', 'common', 'code', 'Kodea'),
('eu', 'common', 'name', 'Izena'),
('eu', 'common', 'nativeName', 'Jatorrizko izena'),
('eu', 'common', 'direction', 'Norabidea'),
('eu', 'common', 'status', 'Egoera'),
('eu', 'common', 'add', 'Gehitu'),
('eu', 'common', 'edit', 'Editatu'),
('eu', 'common', 'delete', 'Ezabatu'),
('eu', 'common', 'save', 'Gorde'),
('eu', 'common', 'cancel', 'Ezeztatu'),
-- Settings translations
('en', 'settings', 'languageSettings', 'Language Settings'),
('en', 'settings', 'languageDescription', 'Manage system languages and translations'),
('en', 'settings', 'roles', 'Roles'),
('en', 'settings', 'roleSettings', 'Role Settings'),
('en', 'settings', 'roleDescription', 'Manage roles and permissions'),
('en', 'settings', 'smtp', 'Email (SMTP)'),
('en', 'settings', 'stripe', 'Payments (Stripe)'),
('en', 'settings', 'gemini', 'AI (Gemini)'),
('en', 'settings', 'whatsapp', 'WhatsApp'),
('en', 'settings', 'twilio', 'SMS (Twilio)'),
-- Arabic settings
('ar', 'settings', 'languageSettings', 'إعدادات اللغة'),
('ar', 'settings', 'languageDescription', 'إدارة لغات النظام والترجمات'),
('ar', 'settings', 'roles', 'الأدوار'),
('ar', 'settings', 'roleSettings', 'إعدادات الأدوار'),
('ar', 'settings', 'roleDescription', 'إدارة الأدوار والصلاحيات'),
('ar', 'settings', 'smtp', 'البريد (SMTP)'),
('ar', 'settings', 'stripe', 'المدفوعات (Stripe)'),
('ar', 'settings', 'gemini', 'الذكاء الاصطناعي (Gemini)'),
('ar', 'settings', 'whatsapp', 'واتساب'),
('ar', 'settings', 'twilio', 'الرسائل (Twilio)'),
-- Urdu settings
('ur', 'settings', 'languageSettings', 'زبان کی سیٹنگز'),
('ur', 'settings', 'languageDescription', 'سسٹم کی زبانیں اور ترجمے کا انتظام کریں'),
('ur', 'settings', 'roles', 'کردار'),
('ur', 'settings', 'roleSettings', 'کردار کی سیٹنگز'),
('ur', 'settings', 'roleDescription', 'کردار اور اجازتیں کا انتظام کریں'),
('ur', 'settings', 'smtp', 'ای میل (SMTP)'),
('ur', 'settings', 'stripe', 'ادائیگی (Stripe)'),
('ur', 'settings', 'gemini', 'AI (Gemini)'),
('ur', 'settings', 'whatsapp', 'واٹس ایپ'),
('ur', 'settings', 'twilio', 'ایس ایم ایس (Twilio)'),
-- Basque settings
('eu', 'settings', 'languageSettings', 'Hizkuntza ezarpenak'),
('eu', 'settings', 'languageDescription', 'Sistemaren hizkuntzak eta itzulpenak kudeatu'),
('eu', 'settings', 'roles', 'Rolak'),
('eu', 'settings', 'roleSettings', 'Rol ezarpenak'),
('eu', 'settings', 'roleDescription', 'Rolak eta baimenak kudeatu'),
('eu', 'settings', 'smtp', ' posta (SMTP)'),
('eu', 'settings', 'stripe', 'Ordainketak (Stripe)'),
('eu', 'settings', 'gemini', 'AI (Gemini)'),
('eu', 'settings', 'whatsapp', 'WhatsApp'),
('eu', 'settings', 'twilio', 'SMS (Twilio)');

-- =====================
-- Verify Data
-- =====================
SELECT * FROM languages;
SELECT COUNT(*) AS translation_count FROM translations;