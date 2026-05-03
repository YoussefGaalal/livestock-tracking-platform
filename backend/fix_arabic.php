<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES 'utf8mb4'");
$pdo->exec("SET CHARACTER SET utf8mb4");

// Clear existing Arabic translations
$pdo->exec("DELETE FROM translations WHERE language_code='ar'");

$translations = [
    ['common', 'appName', 'الواحة'],
    ['common', 'quickActions', 'إجراءات سريعة'],
    ['common', 'success', 'نجاح'],
    ['common', 'error', 'خطأ'],
    ['dashboard', 'title', 'لوحة التحكم'],
    ['dashboard', 'totalAnimals', 'إجمالي الحيوانات'],
    ['dashboard', 'activeAlerts', 'التنبيهات النشطة'],
    ['dashboard', 'grazingZones', 'مراعي'],
    ['dashboard', 'pendingTasks', 'المهام المعلقة'],
    ['animals', 'title', 'الحيوانات'],
    ['animals', 'addAnimal', 'إضافة حيوان'],
    ['animals', 'editAnimal', 'تعديل الحيوان'],
    ['animals', 'name', 'الاسم'],
    ['animals', 'species', 'النوع'],
    ['animals', 'breed', 'السلالة'],
    ['animals', 'status', 'الحالة'],
    ['animals', 'age', 'العمر'],
    ['animals', 'weight', 'الوزن'],
    ['devices', 'title', 'الأجهزة'],
    ['devices', 'addDevice', 'إضافة جهاز'],
    ['devices', 'deviceId', 'معرف الجهاز'],
    ['devices', 'batteryLevel', 'مستوى البطارية'],
    ['devices', 'firmware', 'البرنامج الثابت'],
    ['auth', 'login', 'تسجيل الدخول'],
    ['auth', 'register', 'التسجيل'],
    ['auth', 'welcomeBack', 'مرحباً بعودتك'],
    ['auth', 'loginSubtitle', 'سجل للمتابعة مراقبة ماشيتك'],
    ['auth', 'email', 'البريد الإلكتروني'],
    ['auth', 'password', 'كلمة المرور'],
    ['auth', 'confirmPassword', 'تأكيد كلمة المرور'],
    ['auth', 'rememberMe', 'تذكرني'],
    ['auth', 'forgotPassword', 'هل نسيت كلمة المرور؟'],
    ['auth', 'noAccount', 'ليس لديك حساب؟'],
    ['settings', 'title', 'الإعدادات'],
    ['settings', 'account', 'الحساب'],
    ['settings', 'notifications', 'الإشعارات'],
    ['settings', 'appSettings', 'إعدادات التطبيق'],
    ['settings', 'about', 'حول'],
    ['settings', 'pushNotifications', 'إشعارات فورية'],
    ['settings', 'pushNotificationsSubtitle', 'تلقي التنبيهات على جهازك'],
    ['settings', 'emailNotifications', 'إشعارات البريد الإلكتروني'],
    ['settings', 'emailNotificationsSubtitle', 'تلقي التحديثات عبر البريد'],
    ['settings', 'darkMode', 'الوضع الداكن'],
    ['settings', 'darkModeSubtitle', 'استخدم السمة الداكنة'],
    ['settings', 'locationTracking', 'تتبع الموقع'],
    ['settings', 'locationTrackingSubtitle', 'تتبع مواقع الحيوانات'],
    ['settings', 'temperatureUnit', 'وحدة الحرارة'],
    ['settings', 'language', 'اللغة'],
    ['settings', 'appVersion', 'إصدار التطبيق'],
    ['settings', 'privacyPolicy', 'سياسة الخصوصية'],
    ['settings', 'termsOfService', 'شروط الخدمة'],
    ['settings', 'signOut', 'تسجيل الخروج'],
    ['nav', 'dashboard', 'لوحة التحكم'],
    ['nav', 'animals', 'الحيوانات'],
    ['nav', 'devices', 'الأجهزة'],
    ['nav', 'geofences', 'الأسوار'],
    ['nav', 'alerts', 'التنبيهات'],
    ['nav', 'tasks', 'المهام'],
    ['nav', 'settings', 'الإعدادات'],
];

$stmt = $pdo->prepare("INSERT INTO translations (language_code, `group`, `key`, value) VALUES ('ar', ?, ?, ?)");
foreach ($translations as $t) {
    $stmt->execute($t);
    echo "Inserted: {$t[0]}.{$t[1]} = {$t[2]}\n";
}

echo "\nDone! " . count($translations) . " Arabic translations inserted.\n";