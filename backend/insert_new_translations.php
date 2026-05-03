<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$groups = [
    'nav' => [
        'dashboard' => ['en' => 'Dashboard', 'ar' => 'لوحة التحكم', 'ur' => 'ڈیش بورڈ', 'eu' => 'Azpiegitura'],
        'users' => ['en' => 'Users', 'ar' => 'المستخدمون', 'ur' => 'صارفین', 'eu' => 'Erabiltzaileak'],
        'animals' => ['en' => 'Animals', 'ar' => 'الحيوانات', 'ur' => 'جانور', 'eu' => 'Animaliak'],
        'geofences' => ['en' => 'Geofences', 'ar' => 'الأسوار', 'ur' => 'جغرافیائی حدود', 'eu' => 'Geofenceak'],
        'medicalRecords' => ['en' => 'Medical Records', 'ar' => 'السجلات الطبية', 'ur' => 'میڈیکل ریکارڈز', 'eu' => 'Eraso medikuak'],
        'devices' => ['en' => 'Devices', 'ar' => 'الأجهزة', 'ur' => 'آلات', 'eu' => 'Gailuak'],
        'mapView' => ['en' => 'Map View', 'ar' => 'عرض الخريطة', 'ur' => 'نقشہ', 'eu' => 'Mapa ikuspegia'],
        'auctions' => ['en' => 'Auctions', 'ar' => 'المزادات', 'ur' => 'مزاد', 'eu' => 'Molkak'],
        'alerts' => ['en' => 'Alerts', 'ar' => 'التنبيهات', 'ur' => 'الرسلے', 'eu' => 'Alertsak'],
        'tasks' => ['en' => 'Tasks', 'ar' => 'المهام', 'ur' => 'کام', 'eu' => 'Zereginak'],
        'reports' => ['en' => 'Reports', 'ar' => 'التقارير', 'ur' => 'رپورٹس', 'eu' => 'Txostenak'],
        'addNewEntry' => ['en' => 'Add New', 'ar' => 'إضافة جديد', 'ur' => 'نیا انٹری', 'eu' => 'Gehitu berria'],
    ],
    'users' => [
        'title' => ['en' => 'Users', 'ar' => 'المستخدمون', 'ur' => 'صارفین', 'eu' => 'Erabiltzaileak'],
        'addUser' => ['en' => 'Add User', 'ar' => 'إضافة مستخدم', 'ur' => 'صارف شامل کریں', 'eu' => 'Erabiltzailea gehitu'],
        'name' => ['en' => 'Name', 'ar' => 'الاسم', 'ur' => 'نام', 'eu' => 'Izena'],
        'role' => ['en' => 'Role', 'ar' => 'الدور', 'ur' => 'کردار', 'eu' => 'Funtzioa'],
        'subscription' => ['en' => 'Subscription', 'ar' => 'الاشتراك', 'ur' => 'سبسکرپشن', 'eu' => 'Harpidetza'],
        'phone' => ['en' => 'Phone', 'ar' => 'الهاتف', 'ur' => 'فون', 'eu' => 'Telefonoa'],
        'owner' => ['en' => 'Owner', 'ar' => 'المالك', 'ur' => 'مالک', 'eu' => 'Jabea'],
        'createdAt' => ['en' => 'Created', 'ar' => 'تم الإنشاء', 'ur' => 'بنایا گیا', 'eu' => 'Sortuta'],
    ],
    'errors' => [
        'unauthorized' => ['en' => 'Unauthorized', 'ar' => 'غير مصرح', 'ur' => 'غیر مجاز', 'eu' => 'Baimendu gabe'],
        'serverError' => ['en' => 'Server Error', 'ar' => 'خطأ في الخادم', 'ur' => 'سرور کی خرابی', 'eu' => 'Zerbitzarierrorea'],
        'networkError' => ['en' => 'Network Error', 'ar' => 'خطأ في الشبكة', 'ur' => 'نیٹ ورک کی خرابی', 'eu' => 'Sare errorea'],
    ],
    'team' => [
        'title' => ['en' => 'Team', 'ar' => 'الفريق', 'ur' => 'ٹیم', 'eu' => 'Taldea'],
        'teamMembers' => ['en' => 'Team Members', 'ar' => 'أعضاء الفريق', 'ur' => 'ٹیم ممبران', 'eu' => 'Taldekideak'],
    ],
    'alerts' => [
        'title' => ['en' => 'Alerts', 'ar' => 'التنبيهات', 'ur' => 'الرسلے', 'eu' => 'Alertsak'],
        'geofenceEntry' => ['en' => 'Geofence Entry', 'ar' => 'دخول المنطقة', 'ur' => 'جیو فینس انٹری', 'eu' => 'Geofence sarrera'],
        'geofenceExit' => ['en' => 'Geofence Exit', 'ar' => 'خروج المنطقة', 'ur' => 'جیو فینس ایکسٹ', 'eu' => 'Geofence irteera'],
        'temperature' => ['en' => 'Temperature', 'ar' => 'درجة الحرارة', 'ur' => 'درجہ حرارت', 'eu' => 'Tenperatura'],
        'deviceOffline' => ['en' => 'Device Offline', 'ar' => 'الجهاز غير متصل', 'ur' => 'آلہ آف لائن', 'eu' => 'Gailua konektatu gabe'],
        'critical' => ['en' => 'Critical', 'ar' => 'حرج', 'ur' => 'فوقیہ', 'eu' => 'Kritikoa'],
    ],
    'subscription' => [
        'title' => ['en' => 'Subscription', 'ar' => 'الاشتراك', 'ur' => 'سبسکرپشن', 'eu' => 'Harpidetza'],
        'active' => ['en' => 'Active', 'ar' => 'نشط', 'ur' => 'فعال', 'eu' => 'Aktiboa'],
        'selectPlan' => ['en' => 'Select Plan', 'ar' => 'اختر الخطة', 'ur' => 'پلان انتخاب کریں', 'eu' => 'Plan bat aukeratu'],
    ],
];

$now = now();
$inserted = 0;

foreach ($groups as $group => $keys) {
    foreach ($keys as $key => $langValues) {
        foreach ($langValues as $code => $value) {
            DB::table('translations')->updateOrInsert(
                ['language_code' => $code, 'group' => $group, 'key' => $key],
                ['value' => $value, 'updated_at' => $now]
            );
            $inserted++;
        }
    }
}

echo "Inserted $inserted translation entries\n";