<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES 'utf8mb4'");
$pdo->exec("SET CHARACTER SET utf8mb4");

// Clear existing Urdu translations
$pdo->exec("DELETE FROM translations WHERE language_code='ur'");

$translations = [
    // common
    ['ur', 'common', 'appName', 'اویسس'],
    ['ur', 'common', 'quickActions', 'کوئیک ایکشن'],
    ['ur', 'common', 'success', 'کامیاب'],
    ['ur', 'common', 'error', 'خرابی'],
    
    // dashboard
    ['ur', 'dashboard', 'title', 'ڈیش بورڈ'],
    ['ur', 'dashboard', 'totalAnimals', 'کل جانور'],
    ['ur', 'dashboard', 'activeAlerts', 'فعال الرسلے'],
    ['ur', 'dashboard', 'grazingZones', 'چرنے والے علاقے'],
    ['ur', 'dashboard', 'pendingTasks', 'زیر کار کام'],
    
    // animals
    ['ur', 'animals', 'title', 'جانور'],
    ['ur', 'animals', 'addAnimal', 'جانور شامل کریں'],
    ['ur', 'animals', 'editAnimal', 'جانور ترمیم'],
    ['ur', 'animals', 'name', 'نام'],
    ['ur', 'animals', 'species', 'قسم'],
    ['ur', 'animals', 'breed', 'نسل'],
    ['ur', 'animals', 'status', 'حالت'],
    ['ur', 'animals', 'age', 'عمر'],
    ['ur', 'animals', 'weight', 'وزن'],
    
    // devices
    ['ur', 'devices', 'title', 'آلات'],
    ['ur', 'devices', 'addDevice', 'آلہ شامل کریں'],
    ['ur', 'devices', 'deviceId', 'آلہ کی شناخت'],
    ['ur', 'devices', 'batteryLevel', 'بیٹری کی سطح'],
    ['ur', 'devices', 'firmware', 'فرم ویئر'],
    
    // auth
    ['ur', 'auth', 'login', 'لاگ ان'],
    ['ur', 'auth', 'register', 'رجسٹر'],
    ['ur', 'auth', 'welcomeBack', 'واپس خوش آمدید'],
    ['ur', 'auth', 'loginSubtitle', 'اپنے مویشیوں کی نگرانی جاری رکھنے کے لیے لاگ ان کریں'],
    ['ur', 'auth', 'email', 'ای میل'],
    ['ur', 'auth', 'password', 'پاس ورڈ'],
    ['ur', 'auth', 'confirmPassword', 'پاس ورڈ کی تصدیق'],
    ['ur', 'auth', 'rememberMe', 'مجھے یاد رکھیں'],
    ['ur', 'auth', 'forgotPassword', 'پاس ورڈ بھول گئے؟'],
    ['ur', 'auth', 'noAccount', 'کیا آپ کا اکاؤنٹ نہیں ہے؟'],
    ['ur', 'auth', 'enterEmail', 'اپنا ایمیل درج کریں'],
    ['ur', 'auth', 'enterPassword', 'اپنا پاس ورڈ درج کریں'],
    ['ur', 'auth', 'emailRequired', 'ای میل ضروری ہے'],
    ['ur', 'auth', 'invalidEmail', 'درست ایمیل درج کریں'],
    ['ur', 'auth', 'passwordRequired', 'پاس ورڈ ضروری ہے'],
    ['ur', 'auth', 'passwordMinLength', 'پاس ورڈ میں کم از کم 4 حروف ہونے چاہییے'],
    
    // nav
    ['ur', 'nav', 'dashboard', 'ڈیش بورڈ'],
    ['ur', 'nav', 'animals', 'جانور'],
    ['ur', 'nav', 'devices', 'آلات'],
    ['ur', 'nav', 'geofences', 'جغرافیائی حدود'],
    ['ur', 'nav', 'alerts', 'الرسلے'],
    ['ur', 'nav', 'tasks', 'کام'],
    ['ur', 'nav', 'settings', 'سیٹنگز'],
    ['ur', 'nav', 'profile', 'پروفائل'],
    ['ur', 'nav', 'team', 'ٹیم'],
    ['ur', 'nav', 'users', 'صارفین'],
    ['ur', 'nav', 'mapView', 'نقشہ'],
    ['ur', 'nav', 'auctions', 'مزاد'],
    ['ur', 'nav', 'reports', 'رپورٹس'],
    ['ur', 'nav', 'medicalRecords', 'میڈیکل ریکارڈز'],
    ['ur', 'nav', 'vaccinations', 'ویکسینیشن'],
    
    // settings
    ['ur', 'settings', 'title', 'سیٹنگز'],
    ['ur', 'settings', 'account', 'اکاؤنٹ'],
    ['ur', 'settings', 'notifications', 'الرسلے'],
    ['ur', 'settings', 'appSettings', 'ای�� سیٹنگز'],
    ['ur', 'settings', 'about', 'کے بارے میں'],
    ['ur', 'settings', 'pushNotifications', 'پش نوٹیفیکیشن'],
    ['ur', 'settings', 'pushNotificationsSubtitle', 'اپنے آلہ پر الرسلے وصول کریں'],
    ['ur', 'settings', 'emailNotifications', 'ای میل نوٹیفیکیشن'],
    ['ur', 'settings', 'emailNotificationsSubtitle', 'ای میل کے ذریعے اپڈیٹس حاصل کریں'],
    ['ur', 'settings', 'darkMode', 'ڈارک موڈ'],
    ['ur', 'settings', 'darkModeSubtitle', 'ڈارک تھیم کا use کریں'],
    ['ur', 'settings', 'locationTracking', 'لوکیشن ٹریکنگ'],
    ['ur', 'settings', 'locationTrackingSubtitle', 'جانورں کے مقامات ٹریک کریں'],
    ['ur', 'settings', 'temperatureUnit', 'درجہ حرارت کی اکائی'],
    ['ur', 'settings', 'language', 'زبان'],
    ['ur', 'settings', 'appVersion', 'ایپ ورزن'],
    ['ur', 'settings', 'privacyPolicy', 'پرائیویسی پالیسی'],
    ['ur', 'settings', 'termsOfService', 'سروس کی شرائط'],
    ['ur', 'settings', 'signOut', 'لاگ آؤٹ'],
    
    // users
    ['ur', 'users', 'title', 'صارفین'],
    ['ur', 'users', 'addUser', 'صارف شامل کریں'],
    ['ur', 'users', 'name', 'نام'],
    ['ur', 'users', 'role', 'کردار'],
    ['ur', 'users', 'subscription', 'سبسکرپشن'],
    ['ur', 'users', 'phone', 'فون'],
    ['ur', 'users', 'owner', 'مالک'],
    ['ur', 'users', 'createdAt', 'بنایا گیا'],
    
    // team
    ['ur', 'team', 'title', 'ٹیم'],
    ['ur', 'team', 'teamMembers', 'ٹیم ممبران'],
    
    // alerts
    ['ur', 'alerts', 'title', 'الرسلے'],
    ['ur', 'alerts', 'geofenceEntry', 'جیو فینس انٹری'],
    ['ur', 'alerts', 'geofenceExit', 'جیو فینس ایکسٹ'],
    ['ur', 'alerts', 'temperature', 'درجہ حرارت'],
    ['ur', 'alerts', 'deviceOffline', 'آلہ آف لائن'],
    ['ur', 'alerts', 'critical', 'فوقیہ'],
    
    // errors
    ['ur', 'errors', 'unauthorized', 'غیر مجاز'],
    ['ur', 'errors', 'serverError', 'سرور کی خرابی'],
    ['ur', 'errors', 'networkError', 'نیٹ ورک کی خرابی'],
    
    // subscription
    ['ur', 'subscription', 'title', 'سبسکرپشن'],
    ['ur', 'subscription', 'active', 'فعال'],
    ['ur', 'subscription', 'selectPlan', 'پلان انتخاب کریں'],
];

$stmt = $pdo->prepare("INSERT INTO translations (language_code, `group`, `key`, value) VALUES (?, ?, ?, ?)");
foreach ($translations as $t) {
    $stmt->execute($t);
}

echo "Inserted " . count($translations) . " Urdu translations\n";