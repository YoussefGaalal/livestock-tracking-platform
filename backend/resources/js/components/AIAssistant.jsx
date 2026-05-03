import { useState, useRef, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast & capable', context: '1M tokens' },
  { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash 001', description: 'Stable fast model', context: '1M tokens' },
  { id: 'gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight & fast', context: '1M tokens' },
];

const API_KEY_STORAGE = 'gemini_api_key';
const SETUP_COMPLETED_KEY = 'gemini_setup_completed';

export default function AIAssistant() {
  const { t, dir, language } = useI18n();
  const { user } = useAuth();
  const isRtl = dir === 'rtl';
  const [isOpen, setIsOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [setupApiKey, setSetupApiKey] = useState('');
  const [userContext, setUserContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasApiKey = !!apiKey;
  const hasCompletedSetup = localStorage.getItem(SETUP_COMPLETED_KEY) === 'true';

  useEffect(() => {
    if (isOpen && !hasApiKey && !hasCompletedSetup) {
      setShowSetup(true);
      setSetupStep(1);
    }
  }, [isOpen, hasApiKey, hasCompletedSetup]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && hasApiKey) {
      fetchUserContext();
    }
  }, [isOpen, user, hasApiKey]);

  const fetchUserContext = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': user?.id?.toString() || '',
        'X-User-Role': user?.role || '',
      };

      const [animalsRes, alertsRes, geofencesRes] = await Promise.all([
        fetch('http://localhost:8050/api/animals', { headers }).catch(() => null),
        fetch('http://localhost:8050/api/alerts', { headers }).catch(() => null),
        fetch('http://localhost:8050/api/geofences', { headers }).catch(() => null),
      ]);

      const [animals, alerts, geofences] = await Promise.all([
        animalsRes?.ok ? animalsRes.json() : Promise.resolve([]),
        alertsRes?.ok ? alertsRes.json() : Promise.resolve([]),
        geofencesRes?.ok ? geofencesRes.json() : Promise.resolve([]),
      ]);

      const activeAlerts = alerts.filter(a => !a.is_acknowledged)?.length || 0;
      const totalAnimals = Array.isArray(animals) ? animals.length : 0;
      const totalGeofences = Array.isArray(geofences) ? geofences.length : 0;

      setUserContext({
        userName: user?.name || 'User',
        userRole: user?.role || 'Unknown',
        totalAnimals,
        activeAlerts,
        totalGeofences,
        recentAnimals: Array.isArray(animals) ? animals.slice(0, 5).map(a => ({
          id: a.id,
          name: a.name || `Animal #${a.id}`,
          species: a.species || 'Unknown',
          status: a.status || 'Unknown',
        })) : [],
        recentAlerts: Array.isArray(alerts) ? alerts.slice(0, 3).map(a => ({
          id: a.id,
          type: a.type || 'Unknown',
          animalId: a.animal_id,
          acknowledged: a.is_acknowledged,
        })) : [],
        geofenceNames: Array.isArray(geofences) ? geofences.slice(0, 5).map(g => g.name || `Geofence #${g.id}`) : [],
      });
    } catch (error) {
      console.error('Failed to fetch user context:', error);
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    setSetupApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
    localStorage.setItem(SETUP_COMPLETED_KEY, 'true');
    setShowSetup(false);
    setSetupStep(1);
    fetchUserContext();
  };

  const handleSetupComplete = () => {
    if (setupApiKey.trim()) {
      saveApiKey(setupApiKey.trim());
    }
  };

  const skipSetup = () => {
    setShowSetup(false);
    localStorage.setItem(SETUP_COMPLETED_KEY, 'true');
  };

  const getWelcomeMessage = () => {
    if (language === 'ar') {
      let msg = `السلام عليكم ${userContext?.userName || 'user'}! `;
      if (userContext?.activeAlerts > 0) {
        msg += `لديك ${userContext.activeAlerts} تنبيه نشط. `;
      }
      msg += 'كيف يمكنني مساعدتك في إدارة قطيعك اليوم؟';
      return msg;
    }
    let msg = `As-salamu alaykum, ${userContext?.userName || 'user'}! `;
    if (userContext?.activeAlerts > 0) {
      msg += `You have ${userContext.activeAlerts} active alert${userContext.activeAlerts > 1 ? 's' : ''}. `;
    }
    msg += 'How can I help you manage your herd today?';
    return msg;
  };

  const buildSystemPrompt = () => {
    const ctx = userContext || { userName: user?.name || 'User', userRole: user?.role || 'Unknown', totalAnimals: 0, activeAlerts: 0, totalGeofences: 0, recentAnimals: [], recentAlerts: [], geofenceNames: [] };
    
    let prompt = `You are an AI assistant for "The Oasis" - a livestock tracking and management platform for camel herds.
You help users with:
- Animal health and care advice
- Task management guidance
- Geofence and tracking questions
- General farming best practices
- Arabic and English support

CURRENT USER CONTEXT:
- User: ${ctx.userName}
- Role: ${ctx.userRole}
- Total Animals: ${ctx.totalAnimals}
- Active Alerts: ${ctx.activeAlerts}
- Total Geofences: ${ctx.totalGeofences}`;

    if (ctx.recentAnimals?.length > 0) {
      prompt += `\n\nRECENT ANIMALS:\n${ctx.recentAnimals.map(a => `- ${a.name} (ID: ${a.id}, Species: ${a.species}, Status: ${a.status})`).join('\n')}`;
    }

    if (ctx.recentAlerts?.length > 0) {
      prompt += `\n\nRECENT ALERTS:\n${ctx.recentAlerts.map(a => `- Alert #${a.id}: ${a.type} for Animal #${a.animalId} (Acknowledged: ${a.acknowledged ? 'Yes' : 'No'})`).join('\n')}`;
    }

    if (ctx.geofenceNames?.length > 0) {
      prompt += `\n\nGEOFENCES:\n${ctx.geofenceNames.join(', ')}`;
    }

    prompt += `\n\nBe helpful, concise, and professional. Reference the user's actual data when answering questions. If you don't know something, say so.`;

    return prompt;
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'ar' 
          ? 'يرجى تعيين مفتاح Google Gemini API في الإعدادات لاستخدام المساعد الذكي.'
          : 'Please set your Google Gemini API key in settings to use the AI assistant.' 
      }]);
      setShowSettings(true);
      return;
    }

    const userMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const contents = [
        { role: 'user', parts: [{ text: buildSystemPrompt() }] },
        ...conversationHistory,
        { role: 'user', parts: [{ text: messageText }] }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || (language === 'ar' ? 'فشل في الحصول على رد' : 'Failed to get response'));
      }

      const data = await response.json();
      const finishReason = data.candidates?.[0]?.finishReason;
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        finishReason === 'MAX_TOKENS' 
                          ? (language === 'ar' ? 'تم الوصول للحد الأقصى من الرد.' : 'Response was truncated.')
                          : finishReason === 'SAFETY'
                          ? (language === 'ar' ? 'تم حظر هذا الرد بسبب مخاوف أمنية.' : 'This response was blocked for safety reasons.')
                          : (language === 'ar' ? 'لم يتم العثور على رد.' : 'No response generated.');

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const quickActions = [
    { icon: 'person_search', label: language === 'ar' ? 'ابحث عن حيوان' : 'Find Animal', action: () => sendMessage(language === 'ar' ? 'ابحث عن حيوان معين' : 'Help me find a specific animal') },
    { icon: 'summarize', label: language === 'ar' ? 'ملخص الصحة' : 'Health Summary', action: () => sendMessage(language === 'ar' ? 'أعطني ملخصاً عن صحة القطيع' : 'Give me a summary of herd health') },
    { icon: 'warning', label: language === 'ar' ? 'شرح التنبيهات' : 'Alerts Explanation', action: () => sendMessage(language === 'ar' ? 'اشرح لي التنبيهات الأخيرة' : 'Explain the recent alerts') },
  ];

  const suggestedQuestions = [
    language === 'ar' ? 'أي حيوان يحتاج اهتماماً؟' : 'Which animal needs attention?',
    language === 'ar' ? 'أنشئ تقريراً أسبوعياً' : 'Generate weekly report',
    language === 'ar' ? 'تحقق من حالة السياج الجغرافي' : 'Check geofence status',
  ];

  const renderSetup = () => (
    <div className={`fixed bottom-24 ${isRtl ? 'left-6' : 'right-6'} z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-[#fafaf5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]`}>
      <div className="bg-gradient-to-r from-[#002819] to-[#06402B] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center">
            <MaterialSymbol icon="smart_toy" size={24} className="text-[#D4AF37]" weight="fill" />
          </div>
          <div>
            <h3 className="text-white font-bold">{t('ai.title', 'AI Assistant')}</h3>
            <p className="text-white/60 text-xs">{language === 'ar' ? 'إعداد سريع' : 'Quick Setup'}</p>
          </div>
        </div>
        <button
          onClick={() => { setIsOpen(false); setShowSetup(false); }}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <MaterialSymbol icon="close" size={20} className="text-white/70" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {setupStep === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#002819]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MaterialSymbol icon="auto_awesome" size={40} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-xl font-bold text-[#002819] mb-2">
              {language === 'ar' ? 'مرحباً بك في المساعد الذكي!' : 'Welcome to AI Assistant!'}
            </h2>
            <p className="text-[#404943] mb-6 text-sm leading-relaxed">
              {language === 'ar' 
                ? 'احصل على مساعدة ذكية في إدارة قطيعك.，只需要一个免费的 Google Gemini API 密钥。'
                : 'Get smart assistance for managing your herd. All you need is a free Google Gemini API key.'}
            </p>
            <div className="bg-[#e8e8e3] rounded-2xl p-4 mb-6 text-left">
              <h3 className="font-bold text-[#002819] mb-2 flex items-center gap-2">
                <MaterialSymbol icon="check_circle" size={18} className="text-[#002819]" />
                {language === 'ar' ? 'ما تحتاجه:' : 'What you need:'}
              </h3>
              <ul className="text-sm text-[#404943] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  {language === 'ar' ? 'حساب Google (مجاني)' : 'A Google account (free)'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  {language === 'ar' ? 'مفتاح API من Google AI Studio' : 'API key from Google AI Studio'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  {language === 'ar' ? 'API مجاني وغير محدود' : 'Free & unlimited API access'}
                </li>
              </ul>
            </div>
            <button
              onClick={() => setSetupStep(2)}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold shadow-lg hover:bg-[#06402B] transition-all"
            >
              {language === 'ar' ? 'احصل على مفتاح API مجاني' : 'Get Free API Key'}
            </button>
            <button
              onClick={skipSetup}
              className="w-full py-3 mt-3 text-[#404943] text-sm hover:text-[#002819] transition-all"
            >
              {language === 'ar' ? 'لدي مفتاح بالفعل' : 'I already have a key'}
            </button>
          </div>
        )}

        {setupStep === 2 && (
          <div>
            <button
              onClick={() => setSetupStep(1)}
              className="flex items-center gap-2 text-[#404943] text-sm mb-4 hover:text-[#002819]"
            >
              <MaterialSymbol icon="arrow_back" size={18} />
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
            <h2 className="text-xl font-bold text-[#002819] mb-2">
              {language === 'ar' ? 'الخطوة 1: احصل على مفتاح API' : 'Step 1: Get Your API Key'}
            </h2>
            <p className="text-[#404943] mb-4 text-sm">
              {language === 'ar' 
                ? 'اتبع هذه الخطوات البسيطة:'
                : 'Follow these simple steps:'}
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex gap-3 p-3 bg-[#eeeee9] rounded-xl">
                <div className="w-8 h-8 bg-[#002819] text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div className="text-sm">
                  <p className="font-semibold text-[#002819]">
                    {language === 'ar' ? 'اذهب إلى Google AI Studio' : 'Go to Google AI Studio'}
                  </p>
                  <a 
                    href="https://aistudio.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#D4AF37] underline"
                  >
                    aistudio.google.com
                  </a>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#eeeee9] rounded-xl">
                <div className="w-8 h-8 bg-[#002819] text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div className="text-sm">
                  <p className="font-semibold text-[#002819]">
                    {language === 'ar' ? 'سجل الدخول بحسابك' : 'Sign in with your Google account'}
                  </p>
                  <p className="text-[#717973]">
                    {language === 'ar' ? 'استخدم حساب Google موجود أو أنشئ واحداً' : 'Use existing or create new Google account'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-[#eeeee9] rounded-xl">
                <div className="w-8 h-8 bg-[#002819] text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div className="text-sm">
                  <p className="font-semibold text-[#002819]">
                    {language === 'ar' ? 'انقر على "Get API Key"' : 'Click "Get API Key" button'}
                  </p>
                  <p className="text-[#717973]">
                    {language === 'ar' ? 'ثم "Create API Key"' : 'Then "Create API Key" in the sidebar'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSetupStep(3)}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold shadow-lg hover:bg-[#06402B] transition-all"
            >
              {language === 'ar' ? 'لدي المفتاح - التالي' : "I have the key - Next"}
            </button>
          </div>
        )}

        {setupStep === 3 && (
          <div>
            <button
              onClick={() => setSetupStep(2)}
              className="flex items-center gap-2 text-[#404943] text-sm mb-4 hover:text-[#002819]"
            >
              <MaterialSymbol icon="arrow_back" size={18} />
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
            <h2 className="text-xl font-bold text-[#002819] mb-2">
              {language === 'ar' ? 'الخطوة 2: أدخل مفتاح API' : 'Step 2: Enter Your API Key'}
            </h2>
            <p className="text-[#404943] mb-4 text-sm">
              {language === 'ar' 
                ? 'الصق مفتاح API الذي حصلت عليه من Google AI Studio'
                : 'Paste the API key you got from Google AI Studio'}
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={setupApiKey}
                onChange={(e) => setSetupApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 bg-white rounded-xl text-sm border-2 border-[#c0c9c1] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="bg-[#d2e8d9] rounded-xl p-4 mb-4 text-sm">
              <p className="text-[#002819] font-medium flex items-start gap-2">
                <MaterialSymbol icon="info" size={18} className="flex-shrink-0 mt-0.5" />
                {language === 'ar' 
                  ? 'مفتاحك محفوظ محلياً في متصفحك ولا يتم مشاركته مع أي خوادم خارجية.'
                  : 'Your key is stored locally in your browser and is never shared with external servers.'}
              </p>
            </div>
            <button
              onClick={handleSetupComplete}
              disabled={!setupApiKey.trim()}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold shadow-lg hover:bg-[#06402B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'ar' ? 'ابدأ استخدام المساعد الذكي' : 'Start Using AI Assistant'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-50 w-16 h-16 bg-gradient-to-br from-[#002819] to-[#06402B] rounded-full shadow-2xl shadow-[#002819]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group`}
      >
        {isOpen ? (
          <MaterialSymbol icon="close" size={28} className="text-white" />
        ) : (
          <>
            <MaterialSymbol icon="smart_toy" size={28} className="text-[#D4AF37]" weight="fill" />
            {userContext?.activeAlerts > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                {userContext.activeAlerts > 9 ? '9+' : userContext.activeAlerts}
              </div>
            )}
          </>
        )}
      </button>

      {isOpen && showSetup && renderSetup()}

      {isOpen && !showSetup && (
        <div className={`fixed bottom-24 ${isRtl ? 'left-6' : 'right-6'} z-50 w-[420px] max-w-[calc(100vw-3rem)] bg-[#fafaf5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]`}>
          <div className="bg-gradient-to-r from-[#002819] to-[#06402B] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center">
                <MaterialSymbol icon="smart_toy" size={24} className="text-[#D4AF37]" weight="fill" />
              </div>
              <div>
                <h3 className="text-white font-bold">{t('ai.title', 'AI Assistant')}</h3>
                <p className="text-white/60 text-xs">{user?.name ? `${user.name} • ${user.role}` : 'Gemini'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowSetup(true); setSetupStep(3); setSetupApiKey(apiKey); }}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MaterialSymbol icon="vpn_key" size={20} className="text-white/70" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MaterialSymbol icon="settings" size={20} className="text-white/70" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MaterialSymbol icon="delete" size={20} className="text-white/70" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <MaterialSymbol icon="close" size={20} className="text-white/70" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-[#e8e8e3] p-4 border-b border-[#c0c9c1]">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase mb-2">
                    {t('ai.geminiKey', 'Google Gemini API Key')}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-[#c0c9c1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase mb-2">
                    {t('ai.model', 'Model')}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-[#c0c9c1] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {GEMINI_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafaf5]">
            {messages.length === 0 && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#06402b] flex-shrink-0 flex items-center justify-center text-white shadow-md">
                  <MaterialSymbol icon="smart_toy" size={20} weight="fill" />
                </div>
                <div className="bg-[#e8e8e3] rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{getWelcomeMessage()}</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={action.action}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#eeeee9] border border-[#c0c9c1]/20 rounded-xl text-xs font-semibold text-[#002819] hover:bg-[#d2e8d9] transition-all"
                      >
                        <MaterialSymbol icon={action.icon} size={16} className="text-[#002819]" />
                        <span className="hidden sm:inline">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? (isRtl ? 'justify-start' : 'justify-end') : (isRtl ? 'justify-end' : 'justify-start')}`}>
                {msg.role === 'assistant' && !msg.isWelcome && (
                  <div className="w-10 h-10 rounded-full bg-[#06402b] flex-shrink-0 flex items-center justify-center text-white shadow-md mr-2">
                    <MaterialSymbol icon="smart_toy" size={20} weight="fill" />
                  </div>
                )}
                {msg.role === 'assistant' && !msg.isWelcome && (
                  <div className="bg-[#e8e8e3] text-[#1a1c19] rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
                {msg.role === 'user' && (
                  <>
                    <div className="bg-[#002819] text-white rounded-2xl rounded-tr-sm p-4 max-w-[80%]">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#d2e8d9] flex-shrink-0 flex items-center justify-center text-[#0c1f16] shadow-md ml-2 overflow-hidden">
                      <span className="text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={`flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
                {isRtl && (
                  <div className="w-10 h-10 rounded-full bg-[#06402b] flex-shrink-0 flex items-center justify-center text-white shadow-md mr-2">
                    <MaterialSymbol icon="smart_toy" size={20} weight="fill" />
                  </div>
                )}
                <div className="bg-[#e8e8e3] rounded-2xl rounded-tl-sm p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                {!isRtl && (
                  <div className="w-10 h-10 rounded-full bg-[#d2e8d9] flex-shrink-0 flex items-center justify-center text-[#0c1f16] shadow-md ml-2 overflow-hidden">
                    <span className="text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[#fafaf5]/80 backdrop-blur-xl border-t border-[#c0c9c1]">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap px-3 py-1.5 bg-[#e8e8e3] text-[#002819] rounded-full text-xs border border-[#c0c9c1]/20 hover:bg-[#002819] hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('ai.typeMessage', 'Ask your Majlis assistant...')}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#eeeee9] text-[#1a1c19] border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002819]/20 disabled:opacity-50 pr-24"
                />
                <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: language === 'ar' 
                          ? 'عذراً، النماذج النصية لا تدعم إرفاق الصور. يمكنك إرسال أسئلة نصية فقط.'
                          : 'Sorry, text-only models don\'t support image attachments. You can only send text questions.' 
                      }]);
                    }}
                    className="p-2 text-[#717973] hover:text-[#002819] hover:bg-[#d2e8d9] rounded-lg transition-colors"
                    title="Text only - images not supported"
                  >
                    <MaterialSymbol icon="attach_file" size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-[#717973] hover:text-[#002819] hover:bg-[#d2e8d9] rounded-lg transition-colors"
                    title="Voice input"
                  >
                    <MaterialSymbol icon="mic" size={18} />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 bg-[#002819] text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(0,40,25,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MaterialSymbol icon="send" size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
