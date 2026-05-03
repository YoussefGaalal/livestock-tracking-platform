<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportTranslations extends Command
{
    protected $signature = 'translations:import';
    protected $description = 'Import translations from LanguageSeeder to database';

    public function handle(): int
    {
        $translations = $this->getTranslations();
        
        $count = 0;
        foreach ($translations as $t) {
            DB::table('translations')->updateOrInsert(
                [
                    'language_code' => $t['language_code'],
                    'group' => $t['group'],
                    'key' => $t['key'],
                ],
                [
                    'value' => $t['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            $count++;
        }
        
        $this->info("Imported {$count} translations successfully.");
        return Command::SUCCESS;
    }
    
    private function getTranslations(): array
    {
        $translations = [];
        $groups = [
            'common' => [
                'appName' => ['en' => 'The Oasis', 'ar' => 'الواحة', 'ur' => 'اویسس', 'eu' => 'Oasia'],
                'quickActions' => ['en' => 'Quick Actions', 'ar' => 'إجراءات سريعة', 'ur' => 'کوئیک ایکشن', 'eu' => 'Ekintza azkarrak'],
                'success' => ['en' => 'Success', 'ar' => 'نجاح', 'ur' => 'کامیاب', 'eu' => 'Arrakasta'],
                'error' => ['en' => 'Error', 'ar' => 'خطأ', 'ur' => 'خرابی', 'eu' => 'Errorea'],
            ],
            'dashboard' => [
                'title' => ['en' => 'Dashboard', 'ar' => 'لوحة التحكم', 'ur' => 'ڈیش بورڈ', 'eu' => 'Azpiegitura'],
                'totalAnimals' => ['en' => 'Total Animals', 'ar' => 'إجمالي الحيوانات', 'ur' => 'کل جانور', 'eu' => 'Animalia kopurua'],
                'activeAlerts' => ['en' => 'Active Alerts', 'ar' => 'التنبيهات النشطة', 'ur' => 'فعال الرسلے', 'eu' => 'Alerta aktiboak'],
                'grazingZones' => ['en' => 'Grazing Zones', 'ar' => 'مراعي', 'ur' => 'چرنے والے علاقے', 'eu' => 'Larreetan'],
                'pendingTasks' => ['en' => 'Pending Tasks', 'ar' => 'المهام المعلقة', 'ur' => 'زیر کار کام', 'eu' => 'Zereginak'],
            ],
            'animals' => [
                'title' => ['en' => 'Animals', 'ar' => 'الحيوانات', 'ur' => 'جانور', 'eu' => 'Animaliak'],
                'addAnimal' => ['en' => 'Add Animal', 'ar' => 'إضافة حيوان', 'ur' => 'جانور شامل کریں', 'eu' => 'Animalia gehitu'],
                'editAnimal' => ['en' => 'Edit Animal', 'ar' => 'تعديل الحيوان', 'ur' => 'جانور ترمیم', 'eu' => 'Animalia editatu'],
                'name' => ['en' => 'Name', 'ar' => 'الاسم', 'ur' => 'نام', 'eu' => 'Izena'],
                'species' => ['en' => 'Species', 'ar' => 'النوع', 'ur' => 'قسم', 'eu' => 'Speziea'],
                'breed' => ['en' => 'Breed', 'ar' => 'السلالة', 'ur' => 'نسل', 'eu' => 'Arraza'],
                'status' => ['en' => 'Status', 'ar' => 'الحالة', 'ur' => 'حالت', 'eu' => 'Egoera'],
                'age' => ['en' => 'Age', 'ar' => 'العمر', 'ur' => 'عمر', 'eu' => 'Adina'],
                'weight' => ['en' => 'Weight', 'ar' => 'الوزن', 'ur' => 'وزن', 'eu' => 'Pisua'],
            ],
            'devices' => [
                'title' => ['en' => 'Devices', 'ar' => 'الأجهزة', 'ur' => 'آلات', 'eu' => 'Gailuak'],
                'addDevice' => ['en' => 'Add Device', 'ar' => 'إضاف�� جهاز', 'ur' => 'آلہ شامل کریں', 'eu' => 'Gailua gehitu'],
                'deviceId' => ['en' => 'Device ID', 'ar' => 'معرف الجهاز', 'ur' => 'آلہ کی شناخت', 'eu' => 'Gailuaren ID'],
                'batteryLevel' => ['en' => 'Battery Level', 'ar' => 'مستوى البطارية', 'ur' => 'بیٹری کی سطح', 'eu' => 'Bateria maila'],
                'firmware' => ['en' => 'Firmware', 'ar' => 'البرنامج الثابت', 'ur' => ' فرم ویئر', 'eu' => 'Firmwarea'],
            ],
            'auth' => [
                'login' => ['en' => 'Sign In', 'ar' => 'تسجيل الدخول', 'ur' => 'لاگ ان', 'eu' => 'Saioa hasi'],
                'register' => ['en' => 'Sign Up', 'ar' => 'التسجيل', 'ur' => 'رجسٹر', 'eu' => 'Erregistratu'],
                'welcomeBack' => ['en' => 'Welcome Back', 'ar' => 'مرحباً بعودتك', 'ur' => 'واپس خوش آمدید', 'eu' => 'Ongi itzuli'],
                'loginSubtitle' => ['en' => 'Sign in to continue monitoring your livestock', 'ar' => 'سجل للمتابعة مراقبة ماشيتك', 'ur' => 'اپنے مویشیوں کی نگرانی جاری رکھنے کے لیے لاگ ان کریں', 'eu' => 'Saioa hasi zure abereak ikusten jarraitzeko'],
                'email' => ['en' => 'Email', 'ar' => 'البريد الإلكتروني', 'ur' => 'ای میل', 'eu' => 'Posta elektronikoa'],
                'password' => ['en' => 'Password', 'ar' => 'كلمة المرور', 'ur' => 'پاس ورڈ', 'eu' => 'Pasahitza'],
                'confirmPassword' => ['en' => 'Confirm Password', 'ar' => 'تأكيد كلمة المرور', 'ur' => 'پاس ورڈ کی تصدیق', 'eu' => 'Pasahitza berretsi'],
                'rememberMe' => ['en' => 'Remember me', 'ar' => 'تذكرني', 'ur' => 'مجھے یاد رکھیں', 'eu' => 'Gogorau'],
                'forgotPassword' => ['en' => 'Forgot Password?', 'ar' => 'هل نسيت كلمة المرور؟', 'ur' => 'پاس ورڈ بھول گئے؟', 'eu' => 'Pasahitza ahaztu?'],
                'noAccount' => ['en' => "Don't have an account?", 'ar' => 'ليس لديك حساب؟', 'ur' => 'کیا آپ کا اکاؤنٹ نہیں ہے؟', 'eu' => 'Ez daukazu konturik?'],
                'haveAccount' => ['en' => 'Already have an account?', 'ar' => 'لديك حساب بالفعل؟', 'ur' => 'کیا آپ کا پہلے سے اکاؤنٹ ہے؟', 'eu' => 'Daukazu dagoeneko konturik?'],
                'logout' => ['en' => 'Logout', 'ar' => 'تسجيل الخروج', 'ur' => 'لاگ آؤٹ', 'eu' => 'Saioa amaitu'],
                'enterEmail' => ['en' => 'Enter your email', 'ar' => 'أدخل بريدك الإلكتروني', 'ur' => 'اپنا ایمیل درج کریں', 'eu' => 'Sartu zure posta elektronikoa'],
                'enterPassword' => ['en' => 'Enter your password', 'ar' => 'أدخل كلمة المرور', 'ur' => 'اپنا پاس ورڈ درج کریں', 'eu' => 'Sartu zure pasahitza'],
                'emailRequired' => ['en' => 'Email is required', 'ar' => 'البريد الإلكتروني مطلوب', 'ur' => 'ای میل ضروری ہے', 'eu' => 'Posta elektronikoa beharrezkoa da'],
                'invalidEmail' => ['en' => 'Enter a valid email', 'ar' => 'أدخل بريد إلكتروني صالح', 'ur' => 'درست ایمیل درج کریں', 'eu' => 'Sartu posta elektroniko bali bat'],
                'passwordRequired' => ['en' => 'Password is required', 'ar' => 'كلمة المرور مطلوبة', 'ur' => 'پاس ورڈ ضروری ہے', 'eu' => 'Pasahitza beharrezkoa da'],
                'passwordMinLength' => ['en' => 'Password must be at least 4 characters', 'ar' => 'يجب أن تكون كلمة المرور 4 أحرف على الأقل', 'ur' => 'پاس ورڈ میں کم از کم 4 حروف ہونے چاہییے', 'eu' => 'Pasahitzak 4 karaktere izan behar ditu gutxieneko'],
            ],
            'nav' => [
                'dashboard' => ['en' => 'Dashboard', 'ar' => '��وحة التحكم', 'ur' => 'ڈیش بورڈ', 'eu' => 'Azpiegitura'],
                'users' => ['en' => 'Users', 'ar' => 'المستخدمون', 'ur' => 'صارفین', 'eu' => 'Erabiltzaileak'],
                'animals' => ['en' => 'Animals', 'ar' => 'الحيوانات', 'ur' => 'جانور', 'eu' => 'Animaliak'],
                'geofences' => ['en' => 'Geofences', 'ar' => 'الأسوار', 'ur' => 'جغرافیائی حدود', 'eu' => 'Geofenceak'],
                'medicalRecords' => ['en' => 'Medical Records', 'ar' => 'السجلات الطبية', 'ur' => 'میڈیکل ریکارڈز', 'eu' => 'Eraso medikuak'],
                'vaccinations' => ['en' => 'Vaccinations', 'ar' => 'التلقيحات', 'ur' => 'ویکسینیشن', 'eu' => 'Txertaketak'],
                'devices' => ['en' => 'Devices', 'ar' => 'الأجهزة', 'ur' => 'آلات', 'eu' => 'Gailuak'],
                'mapView' => ['en' => 'Map View', 'ar' => 'عرض الخريطة', 'ur' => 'نقشہ', 'eu' => 'Mapa ikuspegia'],
                'auctions' => ['en' => 'Auctions', 'ar' => 'المزادات', 'ur' => 'مزاد', 'eu' => 'Molkak'],
                'alerts' => ['en' => 'Alerts', 'ar' => 'التنبيهات', 'ur' => 'الرسلے', 'eu' => 'Alertsak'],
                'tasks' => ['en' => 'Tasks', 'ar' => 'المهام', 'ur' => 'کام', 'eu' => 'Zereginak'],
                'reports' => ['en' => 'Reports', 'ar' => 'التقارير', 'ur' => 'رپورٹس', 'eu' => 'Txostenak'],
                'addNewEntry' => ['en' => 'Add New', 'ar' => 'إضافة جديد', 'ur' => 'نیا انٹری', 'eu' => 'Gehitu berria'],
                'settings' => ['en' => 'Settings', 'ar' => 'الإعدادات', 'ur' => 'سیٹنگز', 'eu' => 'Ezarpenak'],
                'profile' => ['en' => 'Profile', 'ar' => 'الملف الشخصي', 'ur' => 'پروفائل', 'eu' => 'Profila'],
                'team' => ['en' => 'Team', 'ar' => 'الفريق', 'ur' => 'ٹیم', 'eu' => 'Taldea'],
            ],
            'settings' => [
                'title' => ['en' => 'Settings', 'ar' => 'الإعدادات', 'ur' => 'سیٹنگز', 'eu' => 'Ezarpenak'],
                'account' => ['en' => 'Account', 'ar' => 'الحساب', 'ur' => 'اکاؤنٹ', 'eu' => 'Kontua'],
                'notifications' => ['en' => 'Notifications', 'ar' => 'الإشعارات', 'ur' => 'الرسلے', 'eu' => 'Jakinarazpenak'],
                'appSettings' => ['en' => 'App Settings', 'ar' => 'إعدادات التطبيق', 'ur' => 'ایپ سیٹنگز', 'eu' => 'Apparen ezarpenak'],
                'about' => ['en' => 'About', 'ar' => 'حول', 'ur' => 'کے بارے میں', 'eu' => 'Honi buruz'],
                'pushNotifications' => ['en' => 'Push Notifications', 'ar' => 'إشعارات فورية', 'ur' => 'پش نوٹیفیکیشن', 'eu' => 'Push jakinarazpenak'],
                'pushNotificationsSubtitle' => ['en' => 'Receive alerts on your device', 'ar' => 'تلقي التنبيهات على جهازك', 'ur' => 'اپنے آلہ پر الرسلے وصول کریں', 'eu' => 'Alertsak jaso zure gailuan'],
                'emailNotifications' => ['en' => 'Email Notifications', 'ar' => 'إشعارات البريد الإلكتروني', 'ur' => 'ای میل نوٹیفیکیشن', 'eu' => 'Posta jakinarazpenak'],
                'emailNotificationsSubtitle' => ['en' => 'Receive updates via email', 'ar' => 'تلقي التحديثات عبر البريد', 'ur' => 'ای میل کے ذریعے اپڈیٹس حاصل کریں', 'eu' => 'Eguneratzeak posta bidali'],
                'darkMode' => ['en' => 'Dark Mode', 'ar' => 'الوضع الداكن', 'ur' => 'ڈارک موڈ', 'eu' => 'Ilun modua'],
                'darkModeSubtitle' => ['en' => 'Use dark theme', 'ar' => 'استخدم السمة الداكنة', 'ur' => 'ڈارک تھیم کا use کریں', 'eu' => 'Ilun gaia erabili'],
                'locationTracking' => ['en' => 'Location Tracking', 'ar' => 'تتبع الموقع', 'ur' => 'لوکیشن ٹ��یک��گ', 'eu' => 'Kokapena jarraitzea'],
                'locationTrackingSubtitle' => ['en' => 'Track animal locations', 'ar' => 'تتبع مواقع الحيوانات', 'ur' => 'جانورں کے مقامات ٹریک کریں', 'eu' => 'Animalien kokapena jarraitu'],
                'temperatureUnit' => ['en' => 'Temperature Unit', 'ar' => 'وحدة الحرارة', 'ur' => 'درجہ حرارت کی اکائی', 'eu' => 'Tenperatura unitatea'],
                'language' => ['en' => 'Language', 'ar' => 'اللغة', 'ur' => 'زبان', 'eu' => 'Hizkuntza'],
                'languages' => ['en' => 'Languages', 'ar' => 'اللغات', 'ur' => 'زبانیں', 'eu' => 'Hizkuntzak'],
                'roles' => ['en' => 'Roles', 'ar' => 'الأدوار', 'ur' => 'کردار', 'eu' => 'Rolak'],
                'roleSettings' => ['en' => 'Role Settings', 'ar' => 'إعدادات الأدوار', 'ur' => 'کردار کی سیٹنگز', 'eu' => 'Rol ezarpenak'],
                'roleDescription' => ['en' => 'Manage roles and permissions', 'ar' => 'إدارة الأدوار والصلاحيات', 'ur' => 'کردار اور اجازتیں کا انتظام کریں', 'eu' => 'Rolak eta baimenak kudeatu'],
                'existingRoles' => ['en' => 'Existing Roles', 'ar' => 'الأدوار الموجودة', 'ur' => 'موجودہ کردار', 'eu' => 'Dagoeneko rolak'],
                'languageSettings' => ['en' => 'Language Settings', 'ar' => 'إعدادات اللغة', 'ur' => 'زبان کی سیٹنگز', 'eu' => 'Hizkuntza ezarpenak'],
                'languageDescription' => ['en' => 'Manage system languages and translations', 'ar' => 'إدارة لغات النظام والترجمات', 'ur' => 'سسٹم کی زبانیں اور ترجمے کا انتظام کریں', 'eu' => 'Sistemaren hizkuntzak eta itzulpenak kudeatu'],
                'manageTranslations' => ['en' => 'Manage Translations', 'ar' => 'إدارة الترجمات', 'ur' => 'ترجمے کا انتظام کریں', 'eu' => 'Itzulpenak kudeatu'],
                'general' => ['en' => 'General', 'ar' => 'عام', 'ur' => 'عام', 'eu' => 'Orokorra'],
                'smtp' => ['en' => 'Email (SMTP)', 'ar' => 'البريد (SMTP)', 'ur' => 'ای میل (SMTP)', 'eu' => ' posta (SMTP)'],
                'stripe' => ['en' => 'Payments (Stripe)', 'ar' => 'المدفوعات (Stripe)', 'ur' => 'ادائیگی (Stripe)', 'eu' => 'Ordainketak (Stripe)'],
                'gemini' => ['en' => 'AI (Gemini)', 'ar' => 'الذكاء الاصطناعي (Gemini)', 'ur' => 'AI (Gemini)', 'eu' => 'AI (Gemini)'],
                'whatsapp' => ['en' => 'WhatsApp', 'ar' => 'واتساب', 'ur' => 'واٹس ایپ', 'eu' => 'WhatsApp'],
                'twilio' => ['en' => 'SMS (Twilio)', 'ar' => 'الرسائل (Twilio)', 'ur' => 'ایس ایم ایس (Twilio)', 'eu' => 'SMS (Twilio)'],
                'generalSettings' => ['en' => 'General Settings', 'ar' => 'الإعدادات العامة', 'ur' => 'عام سیٹنگز', 'eu' => 'Ezarpen orokorrak'],
                'generalDescription' => ['en' => 'Configure basic platform settings', 'ar' => 'تكوين إعدادات المنصة الأساسية', 'ur' => 'بنیادی پلیٹ فارم سیٹنگز کو ترتیب دیں', 'eu' => 'Oinarrizko plataforma ezarpenak konfiguratu'],
                'platformName' => ['en' => 'Platform Name', 'ar' => 'اسم المنصة', 'ur' => 'پلیٹ فارم کا نام', 'eu' => 'Plataformaren izena'],
                'platformUrl' => ['en' => 'Platform URL', 'ar' => 'رابط المنصة', 'ur' => 'پلیٹ فارم کا یو آر ایل', 'eu' => 'Plataformaren URLa'],
                'adminEmail' => ['en' => 'Admin Email', 'ar' => 'بريد المسؤول', 'ur' => 'ایڈمن ای میل', 'eu' => 'Admin posta'],
                'timezone' => ['en' => 'Timezone', 'ar' => 'المنطقة الزمنية', 'ur' => 'ٹائم زون', 'eu' => 'Ordu-eremua'],
                'dateFormat' => ['en' => 'Date Format', 'ar' => 'تنسيق التاريخ', 'ur' => 'تاریخ کی شکل', 'eu' => 'Data formatua'],
                'defaultLanguage' => ['en' => 'Default Language', 'ar' => 'اللغة الافتراضية', 'ur' => 'ڈیفالٹ زبان', 'eu' => 'Hizkuntza lehenetsia'],
                'saved' => ['en' => 'Settings saved', 'ar' => 'تم الحفظ', 'ur' => 'سیٹنگز محفوظ ہو گئیں', 'eu' => 'Ezarpenak gordeak'],
                'smtpSettings' => ['en' => 'Email Settings (SMTP)', 'ar' => 'إعدادات البريد', 'ur' => 'ای میل سیٹنگز', 'eu' => 'Posta ezarpenak (SMTP)'],
                'smtpDescription' => ['en' => 'Configure email server for notifications', 'ar' => 'تكوين خادم البريد للإشعارات', 'ur' => 'نوٹیفیکیشن کے لیے ای میل سرور کو ترتیب دیں', 'eu' => 'Jakinarazpenetarako posta zerbitzaria konfiguratu'],
                'smtpHost' => ['en' => 'SMTP Host', 'ar' => 'مضيف SMTP', 'ur' => 'SMTP_host', 'eu' => 'SMTP ostalaria'],
                'port' => ['en' => 'Port', 'ar' => 'المنفذ', 'ur' => 'پورٹ', 'eu' => 'Ataka'],
                'username' => ['en' => 'Username', 'ar' => 'اسم المستخدم', 'ur' => 'یوزر نام', 'eu' => 'Erabiltzaile izena'],
                'encryption' => ['en' => 'Encryption', 'ar' => 'التشفير', 'ur' => 'اینکرپشن', 'eu' => 'Enkriptazioa'],
                'fromEmail' => ['en' => 'From Email', 'ar' => 'من البريد', 'ur' => 'سے ای میل', 'eu' => 'Postatik'],
                'fromName' => ['en' => 'From Name', 'ar' => 'من الاسم', 'ur' => 'سے نام', 'eu' => 'Izenetik'],
                'sendTest' => ['en' => 'Send Test', 'ar' => 'إرسال اختبار', 'ur' => 'ٹیسٹ بھیجیں', 'eu' => 'Proba bidali'],
                'stripeSettings' => ['en' => 'Payment Settings (Stripe)', 'ar' => 'إعدادات الدفع', 'ur' => 'ادائیگی کی سیٹنگز', 'eu' => 'Ordainketa ezarpenak (Stripe)'],
                'stripeDescription' => ['en' => 'Configure payment processing', 'ar' => 'تكوين معالجة الدفع', 'ur' => 'ادائیگی کی پروسیسنگ ��و ترتیب دیں', 'eu' => 'Ordainketa prozesamendua konfiguratu'],
                'enableStripe' => ['en' => 'Enable Payments', 'ar' => 'تفعيل الدفع', 'ur' => 'ادائیگی کو فعال کریں', 'eu' => 'Ordainketak gaitu'],
                'publicKey' => ['en' => 'Public Key', 'ar' => 'المفتاح العام', 'ur' => 'پبلک کی', 'eu' => 'Giltza publikoa'],
                'secretKey' => ['en' => 'Secret Key', 'ar' => 'المفتاح السري', 'ur' => 'سیکریٹ کی', 'eu' => 'Giltza sekretua'],
                'webhookSecret' => ['en' => 'Webhook Secret', 'ar' => 'سر webhook', 'ur' => 'ویب ہوک سیکریٹ', 'eu' => 'Webhook sekretua'],
                'geminiSettings' => ['en' => 'AI Settings (Gemini)', 'ar' => 'إعدادات الذكاء الاصطناعي', 'ur' => 'AI سیٹنگز', 'eu' => 'AI ezarpenak (Gemini)'],
                'geminiDescription' => ['en' => 'Configure AI assistance', 'ar' => 'تكوين مساعدة الذكاء الاصطناعي', 'ur' => 'AI معاونت کو ترتیب دیں', 'eu' => 'AI laguntza konfiguratu'],
                'enableGemini' => ['en' => 'Enable AI Assistant', 'ar' => 'تفعيل مساعد الذكاء', 'ur' => 'AI اسسٹنٹ کو فعال کریں', 'eu' => 'AI laguntzailea gaitu'],
                'geminiApiKey' => ['en' => 'API Key', 'ar' => 'مفتاح API', 'ur' => 'API کی', 'eu' => 'API giltza'],
                'geminiModel' => ['en' => 'Model', 'ar' => 'النموذج', 'ur' => 'ماڈل', 'eu' => 'Eredua'],
                'whatsappSettings' => ['en' => 'WhatsApp Settings', 'ar' => 'إعدادات واتساب', 'ur' => 'واٹس ایپ سیٹنگز', 'eu' => 'WhatsApp ezarpenak'],
                'whatsappDescription' => ['en' => 'Configure WhatsApp notifications', 'ar' => 'تكوين إشعارات واتساب', 'ur' => 'واٹس ایپ نوٹیفیکیشن کو ترتیب دیں', 'eu' => 'WhatsApp jakinarazpenak konfiguratu'],
                'enableWhatsapp' => ['en' => 'Enable WhatsApp', 'ar' => 'تفعيل واتساب', 'ur' => 'واٹس ایپ کو فعال کریں', 'eu' => 'WhatsApp gaitu'],
                'whatsappApiUrl' => ['en' => 'API URL', 'ar' => 'رابط API', 'ur' => 'API URL', 'eu' => 'API URLa'],
                'whatsappApiToken' => ['en' => 'API Token', 'ar' => 'رمز API', 'ur' => 'API ٹوکن', 'eu' => 'API tokena'],
                'whatsappPhoneId' => ['en' => 'Phone Number ID', 'ar' => 'معرف الرقم', 'ur' => 'فون نمبر آئیڈی', 'eu' => 'Telefono zenbakiaren IDa'],
                'whatsappBusinessId' => ['en' => 'Business Account ID', 'ar' => 'معرف الحساب', 'ur' => 'بزنس اکاؤنٹ آئیڈی', 'eu' => 'Negozio kontuaren IDa'],
                'twilioSettings' => ['en' => 'SMS Settings (Twilio)', 'ar' => 'إعدادات الرسائل', 'ur' => 'SMS سیٹنگز', 'eu' => 'SMS ezarpenak (Twilio)'],
                'twilioDescription' => ['en' => 'Configure SMS notifications', 'ar' => 'تكوين إشعارات الرسائل', 'ur' => 'SMS نوٹیفیکیشن کو ترتیب دیں', 'eu' => 'SMS jakinarazpenak konfiguratu'],
                'enableTwilio' => ['en' => 'Enable SMS', 'ar' => 'تفعيل الرسائل', 'ur' => 'SMS کو فعال کریں', 'eu' => 'SMS gaitu'],
                'twilioAccountSid' => ['en' => 'Account SID', 'ar' => 'معرف الحساب', 'ur' => 'اکاؤنٹ SID', 'eu' => 'Kontu SIDa'],
                'twilioAuthToken' => ['en' => 'Auth Token', 'ar' => 'رمز التحقق', 'ur' => 'آتھ ٹوکن', 'eu' => 'Auth tokena'],
                'twilioPhoneNumber' => ['en' => 'Phone Number', 'ar' => 'رقم الهاتف', 'ur' => 'فون نمبر', 'eu' => 'Telefono zenbakia'],
                'exportDatabase' => ['en' => 'Export Database', 'ar' => 'تصدير قاعدة البيانات', 'ur' => 'ڈیٹابیس ایکسپورٹ کریں', 'eu' => 'Datu basea esportatu'],
            ],
            'users' => [
                'title' => ['en' => 'Users', 'ar' => 'المستخدمون', 'ur' => 'صارفین', 'eu' => 'Erabiltzaileak'],
                'addUser' => ['en' => 'Add User', 'ar' => 'إضافة مستخدم', 'ur' => 'صارف شامل کریں', 'eu' => 'Erabiltzailea gehitu'],
                'name' => ['en' => 'Name', 'ar' => 'الاسم', 'ur' => 'نام', 'eu' => 'Izena'],
                'role' => ['en' => 'Role', 'ar' => 'الدور', 'ur' => 'کردار', 'eu' => 'Funtzioa'],
                'subscription' => ['en' => 'Subscription', 'ar' => 'الاشتراك', 'ur' => 'سبسکرپشن', 'eu' => 'Harpidetza'],
                'phone' => ['en' => 'Phone', 'ar' => 'الهاتف', 'ur' => 'فون', 'eu' => 'Telefonoa'],
                'owner' => ['en' => 'Owner', 'ar' => 'المالك', 'ur' => 'مالک', 'eu' => 'Jabea'],
                'createdAt' => ['en' => 'Created', 'ar' => 'تم الإنشاء', 'ur' => ' بنایا گیا', 'eu' => 'Sortuta'],
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
            'common' => [
                'add' => ['en' => 'Add', 'ar' => 'إضافة', 'ur' => 'شامل کریں', 'eu' => 'Gehitu'],
                'edit' => ['en' => 'Edit', 'ar' => 'تعديل', 'ur' => 'ترمیم', 'eu' => 'Editatu'],
                'delete' => ['en' => 'Delete', 'ar' => 'حذف', 'ur' => 'حذف کریں', 'eu' => 'Ezabatu'],
                'save' => ['en' => 'Save', 'ar' => 'حفظ', 'ur' => 'محفوظ کریں', 'eu' => 'Gorde'],
                'cancel' => ['en' => 'Cancel', 'ar' => 'إلغاء', 'ur' => 'منسوخ', 'eu' => 'Ezeztatu'],
                'update' => ['en' => 'Update', 'ar' => 'تحديث', 'ur' => 'اپڈیٹ', 'eu' => 'Eguneratu'],
                'enable' => ['en' => 'Enable', 'ar' => 'تفعيل', 'ur' => 'فعال کریں', 'eu' => 'Gaitu'],
                'disable' => ['en' => 'Disable', 'ar' => 'تعطيل', 'ur' => 'غیر فعال', 'eu' => 'Desgaitu'],
                'setDefault' => ['en' => 'Set Default', 'ar' => 'تحديد افتراضي', 'ur' => 'ڈیفالٹ سیٹ کریں', 'eu' => 'Ezarri lehenetsia'],
                'actions' => ['en' => 'Actions', 'ar' => 'الإجراءات', 'ur' => 'کارروائیاں', 'eu' => 'Ekintzak'],
                'loading' => ['en' => 'Loading...', 'ar' => 'جاري التحميل...', 'ur' => 'لوڈ ہو رہا ہے...', 'eu' => 'Kargatzen...'],
                'code' => ['en' => 'Code', 'ar' => 'الرمز', 'ur' => 'کوڈ', 'eu' => 'Kodea'],
                'name' => ['en' => 'Name', 'ar' => 'الاسم', 'ur' => 'نام', 'eu' => 'Izena'],
                'nativeName' => ['en' => 'Native Name', 'ar' => 'الاسم الأصلي', 'ur' => ' 本地 نام', 'eu' => 'Jatorrizko izena'],
                'direction' => ['en' => 'Direction', 'ar' => 'الاتجاه', 'ur' => 'سمت', 'eu' => 'Norabidea'],
                'status' => ['en' => 'Status', 'ar' => 'الحالة', 'ur' => 'حالت', 'eu' => 'Egoera'],
            ],
        ];

        foreach ($groups as $group => $keys) {
            foreach ($keys as $key => $langValues) {
                foreach ($langValues as $code => $value) {
                    $translations[] = [
                        'language_code' => $code,
                        'group' => $group,
                        'key' => $key,
                        'value' => $value,
                    ];
                }
            }
        }

        return $translations;
    }
}