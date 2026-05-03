<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES 'utf8mb4'");
$pdo->exec("SET CHARACTER SET utf8mb4");

// Clear existing Basque translations
$pdo->exec("DELETE FROM translations WHERE language_code='eu'");

$translations = [
    // common
    ['eu', 'common', 'appName', 'Oasia'],
    ['eu', 'common', 'quickActions', 'Ekintza azkarrak'],
    ['eu', 'common', 'success', 'Arrakasta'],
    ['eu', 'common', 'error', 'Errorea'],
    
    // dashboard
    ['eu', 'dashboard', 'title', 'Azpiegitura'],
    ['eu', 'dashboard', 'totalAnimals', 'Animalia kopurua'],
    ['eu', 'dashboard', 'activeAlerts', 'Alerta aktiboak'],
    ['eu', 'dashboard', 'grazingZones', 'Larreetan'],
    ['eu', 'dashboard', 'pendingTasks', 'Zereginak'],
    
    // animals
    ['eu', 'animals', 'title', 'Animaliak'],
    ['eu', 'animals', 'addAnimal', 'Animalia gehitu'],
    ['eu', 'animals', 'editAnimal', 'Animalia editatu'],
    ['eu', 'animals', 'name', 'Izena'],
    ['eu', 'animals', 'species', 'Speziea'],
    ['eu', 'animals', 'breed', 'Arraza'],
    ['eu', 'animals', 'status', 'Egoera'],
    ['eu', 'animals', 'age', 'Adina'],
    ['eu', 'animals', 'weight', 'Pisua'],
    
    // devices
    ['eu', 'devices', 'title', 'Gailuak'],
    ['eu', 'devices', 'addDevice', 'Gailua gehitu'],
    ['eu', 'devices', 'deviceId', 'Gailuaren ID'],
    ['eu', 'devices', 'batteryLevel', 'Bateria maila'],
    ['eu', 'devices', 'firmware', 'Firmwarea'],
    
    // auth
    ['eu', 'auth', 'login', 'Saioa hasi'],
    ['eu', 'auth', 'register', 'Erregistratu'],
    ['eu', 'auth', 'welcomeBack', 'Ongi itzuli'],
    ['eu', 'auth', 'loginSubtitle', 'Saioa hasi zure abereak ikusten jarraitzeko'],
    ['eu', 'auth', 'email', 'Posta elektronikoa'],
    ['eu', 'auth', 'password', 'Pasahitza'],
    ['eu', 'auth', 'confirmPassword', 'Pasahitza berretsi'],
    ['eu', 'auth', 'rememberMe', 'Gogorau'],
    ['eu', 'auth', 'forgotPassword', 'Pasahitza ahaztu?'],
    ['eu', 'auth', 'noAccount', 'Ez daukazu konturik?'],
    ['eu', 'auth', 'enterEmail', 'Sartu zure posta elektronikoa'],
    ['eu', 'auth', 'enterPassword', 'Sartu zure pasahitza'],
    ['eu', 'auth', 'emailRequired', 'Posta elektronikoa beharrezkoa da'],
    ['eu', 'auth', 'invalidEmail', 'Sartu posta elektroniko bali bat'],
    ['eu', 'auth', 'passwordRequired', 'Pasahitza beharrezkoa da'],
    ['eu', 'auth', 'passwordMinLength', 'Pasahitzak 4 karaktere izan behar ditu gutxieneko'],
    
    // nav
    ['eu', 'nav', 'dashboard', 'Azpiegitura'],
    ['eu', 'nav', 'animals', 'Animaliak'],
    ['eu', 'nav', 'devices', 'Gailuak'],
    ['eu', 'nav', 'geofences', 'Geofenceak'],
    ['eu', 'nav', 'alerts', 'Alertsak'],
    ['eu', 'nav', 'tasks', 'Zereginak'],
    ['eu', 'nav', 'settings', 'Ezarpenak'],
    ['eu', 'nav', 'profile', 'Profila'],
    ['eu', 'nav', 'team', 'Taldea'],
    ['eu', 'nav', 'users', 'Erabiltzaileak'],
    ['eu', 'nav', 'mapView', 'Mapa ikuspegia'],
    ['eu', 'nav', 'auctions', 'Molkak'],
    ['eu', 'nav', 'reports', 'Txostenak'],
    ['eu', 'nav', 'medicalRecords', 'Eraso medikuak'],
    ['eu', 'nav', 'vaccinations', 'Txertaketak'],
    
    // settings
    ['eu', 'settings', 'title', 'Ezarpenak'],
    ['eu', 'settings', 'account', 'Kontua'],
    ['eu', 'settings', 'notifications', 'Jakinarazpenak'],
    ['eu', 'settings', 'appSettings', 'Apparen ezarpenak'],
    ['eu', 'settings', 'about', 'Honi buruz'],
    ['eu', 'settings', 'pushNotifications', 'Push jakinarazpenak'],
    ['eu', 'settings', 'pushNotificationsSubtitle', 'Alertsak jaso zure gailuan'],
    ['eu', 'settings', 'emailNotifications', 'Posta jakinarazpenak'],
    ['eu', 'settings', 'emailNotificationsSubtitle', 'Eguneratzeak posta bidali'],
    ['eu', 'settings', 'darkMode', 'Ilun modua'],
    ['eu', 'settings', 'darkModeSubtitle', 'Ilun gaia erabili'],
    ['eu', 'settings', 'locationTracking', 'Kokapena jarraitzea'],
    ['eu', 'settings', 'locationTrackingSubtitle', 'Animalien kokapena jarraitu'],
    ['eu', 'settings', 'temperatureUnit', 'Tenperatura unitatea'],
    ['eu', 'settings', 'language', 'Hizkuntza'],
    ['eu', 'settings', 'appVersion', 'App bertsioa'],
    ['eu', 'settings', 'privacyPolicy', 'Pribatutasun politika'],
    ['eu', 'settings', 'termsOfService', 'Zerbitzu baldintzak'],
    ['eu', 'settings', 'signOut', 'Saioa amaitu'],
    
    // users
    ['eu', 'users', 'title', 'Erabiltzaileak'],
    ['eu', 'users', 'addUser', 'Erabiltzailea gehitu'],
    ['eu', 'users', 'name', 'Izena'],
    ['eu', 'users', 'role', 'Funtzioa'],
    ['eu', 'users', 'subscription', 'Harpidetza'],
    ['eu', 'users', 'phone', 'Telefonoa'],
    ['eu', 'users', 'owner', 'Jabea'],
    ['eu', 'users', 'createdAt', 'Sortuta'],
    
    // team
    ['eu', 'team', 'title', 'Taldea'],
    ['eu', 'team', 'teamMembers', 'Taldekideak'],
    
    // alerts
    ['eu', 'alerts', 'title', 'Alertsak'],
    ['eu', 'alerts', 'geofenceEntry', 'Geofence sarrera'],
    ['eu', 'alerts', 'geofenceExit', 'Geofence irteera'],
    ['eu', 'alerts', 'temperature', 'Tenperatura'],
    ['eu', 'alerts', 'deviceOffline', 'Gailua konektatu gabe'],
    ['eu', 'alerts', 'critical', 'Kritikoa'],
    
    // errors
    ['eu', 'errors', 'unauthorized', 'Baimendu gabe'],
    ['eu', 'errors', 'serverError', 'Zerbitzarierrorea'],
    ['eu', 'errors', 'networkError', 'Sare errorea'],
    
    // subscription
    ['eu', 'subscription', 'title', 'Harpidetza'],
    ['eu', 'subscription', 'active', 'Aktiboa'],
    ['eu', 'subscription', 'selectPlan', 'Plan bat aukeratu'],
];

$stmt = $pdo->prepare("INSERT INTO translations (language_code, `group`, `key`, value) VALUES (?, ?, ?, ?)");
foreach ($translations as $t) {
    $stmt->execute($t);
}

echo "Inserted " . count($translations) . " Basque translations\n";