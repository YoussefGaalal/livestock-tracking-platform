<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");

$missingArabic = [
    // nav missing
    ['ar', 'nav', 'auctions', 'المزادات'],
    ['ar', 'nav', 'reports', 'التقارير'],
    ['ar', 'nav', 'medicalRecords', 'السجلات الطبية'],
    ['ar', 'nav', 'vaccinations', 'التطعيمات'],
    
    // settings missing
    ['ar', 'settings', 'account', 'الحساب'],
    ['ar', 'settings', 'notifications', 'الإشعارات'],
    ['ar', 'settings', 'appSettings', 'إعدادات التطبيق'],
    ['ar', 'settings', 'about', 'حول'],
    ['ar', 'settings', 'pushNotifications', 'إشعارات فورية'],
    ['ar', 'settings', 'pushNotificationsSubtitle', 'استلم الإشعارات على جهازك'],
    ['ar', 'settings', 'emailNotifications', 'إشعارات البريد'],
    ['ar', 'settings', 'emailNotificationsSubtitle', 'استلم التحديثات عبر البريد'],
    ['ar', 'settings', 'darkMode', 'الوضع الداكن'],
    ['ar', 'settings', 'darkModeSubtitle', 'استخدم السمة الداكنة'],
    ['ar', 'settings', 'locationTracking', 'تتبع الموقع'],
    ['ar', 'settings', 'locationTrackingSubtitle', 'تتبع موقع الحيوانات'],
    ['ar', 'settings', 'temperatureUnit', 'وحدة الحرارة'],
    ['ar', 'settings', 'language', 'اللغة'],
    ['ar', 'settings', 'appVersion', 'الإصدار'],
    ['ar', 'settings', 'privacyPolicy', 'سياسة الخصوصية'],
    ['ar', 'settings', 'termsOfService', 'شروط الخدمة'],
    ['ar', 'settings', 'signOut', 'تسجيل الخروج'],
    
    // users missing
    ['ar', 'users', 'role', 'الدور'],
    ['ar', 'users', 'subscription', 'الاشتراك'],
    ['ar', 'users', 'phone', 'الهاتف'],
    ['ar', 'users', 'owner', 'المالك'],
    ['ar', 'users', 'createdAt', 'تاريخ الإنشاء'],
    
    // team missing
    ['ar', 'team', 'teamMembers', 'أعضاء الفريق'],
    
    // alerts missing
    ['ar', 'alerts', 'geofenceEntry', 'دخول المنطقة'],
    ['ar', 'alerts', 'geofenceExit', 'خروج المنطقة'],
    ['ar', 'alerts', 'temperature', 'درجة الحرارة'],
    ['ar', 'alerts', 'deviceOffline', 'الجهاز غير متصل'],
    ['ar', 'alerts', 'critical', 'حرج'],
    
    // errors missing
    ['ar', 'errors', 'unauthorized', 'غير مصرح'],
    ['ar', 'errors', 'serverError', 'خطأ في الخادم'],
    ['ar', 'errors', 'networkError', 'خطأ في الشبكة'],
    
    // subscription missing
    ['ar', 'subscription', 'active', 'نشط'],
    ['ar', 'subscription', 'selectPlan', 'اختر خطة'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO translations (language_code, `group`, `key`, value) VALUES (?, ?, ?, ?)");
foreach ($missingArabic as $t) {
    $stmt->execute($t);
}

echo "Inserted " . count($missingArabic) . " missing Arabic translations\n";

// Check counts again
echo "\nAfter update:\n";
$langs = ['en' => 'English', 'ar' => 'Arabic', 'ur' => 'Urdu', 'eu' => 'Basque'];
foreach ($langs as $code => $name) {
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM translations WHERE language_code='$code'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "$name ($code): {$row['cnt']} translations\n";
}