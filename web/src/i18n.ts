// Internationalization: English, Hindi, Punjabi
export type Lang = "en" | "hi" | "pa";

const translations: Record<string, Record<Lang, string>> = {
  // App shell
  "app.title": { en: "AGRICULTURE REMOTE SENSING — CROP YIELD PREDICTION & ANALYTICS", hi: "कृषि रिमोट सेंसिंग — फसल उपज पूर्वानुमान और विश्लेषण", pa: "ਖੇਤੀ ਰਿਮੋਟ ਸੈਂਸਿੰਗ — ਫ਼ਸਲ ਝਾੜ ਪੂਰਵਾਨੁਮਾਨ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ" },
  "app.logo": { en: "CROP YIELD ANALYTICS", hi: "फसल उपज विश्लेषण", pa: "ਫ਼ਸਲ ਝਾੜ ਵਿਸ਼ਲੇਸ਼ਣ" },
  "app.live": { en: "LIVE DATA", hi: "लाइव डेटा", pa: "ਲਾਈਵ ਡੇਟਾ" },
  "app.demo": { en: "DEMO DATA", hi: "डेमो डेटा", pa: "ਡੈਮੋ ਡੇਟਾ" },
  "app.loading": { en: "Loading agricultural data…", hi: "कृषि डेटा लोड हो रहा है…", pa: "ਖੇਤੀ ਡੇਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…" },
  "app.error": { en: "Could not load data — check the API", hi: "डेटा लोड नहीं हो सका — API जांचें", pa: "ਡੇਟਾ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ — API ਜਾਂਚੋ" },

  // Tabs
  "tab.overview": { en: "Overview", hi: "अवलोकन", pa: "ਸਮੁੱਚਾ ਝਲਕਾਰਾ" },
  "tab.crops": { en: "Crops", hi: "फसलें", pa: "ਫ਼ਸਲਾਂ" },
  "tab.districts": { en: "Districts", hi: "जिले", pa: "ਜ਼ਿਲ੍ਹੇ" },
  "tab.predictions": { en: "Predictions", hi: "पूर्वानुमान", pa: "ਪੂਰਵਾਨੁਮਾਨ" },
  "tab.maps": { en: "Maps", hi: "मानचित्र", pa: "ਨਕਸ਼ੇ" },
  "tab.analytics": { en: "Analytics", hi: "विश्लेषण", pa: "ਵਿਸ਼ਲੇਸ਼ਣ" },
  "tab.environment": { en: "Environment", hi: "पर्यावरण", pa: "ਮਾਹੌਲ" },
  "tab.reliability": { en: "Reliability", hi: "विश्वसनीयता", pa: "ਭਰੋਸੇਯੋਗਤਾ" },
  "tab.data": { en: "Data Explorer", hi: "डेटा एक्सप्लोरर", pa: "ਡੇਟਾ ਖੋਜਕ" },
  "tab.reports": { en: "Reports", hi: "रिपोर्ट", pa: "ਰਿਪੋਰਟਾਂ" },
  "tab.about": { en: "About", hi: "के बारे में", pa: "ਬਾਰੇ" },
  "tab.suitability": { en: "Crop Fit", hi: "फसल उपयुक्तता", pa: "ਫ਼ਸਲ ਯੋਗਤਾ" },
  "tab.chatbot": { en: "AI Assistant", hi: "AI सहायक", pa: "AI ਸਹਾਇਕ" },
  "tab.glossary": { en: "Glossary", hi: "शब्दकोश", pa: "ਸ਼ਬਦ-ਕੋਸ਼" },
  "tab.compare": { en: "Compare", hi: "तुलना", pa: "ਤੁਲਨਾ" },

  // Subtitles
  "sub.overview": { en: "Key statistics, dataset overview, model performance and quick insights.", hi: "मुख्य आंकड़े, डेटासेट अवलोकन, मॉडल प्रदर्शन और त्वरित अंतर्दृष्टि।", pa: "ਮੁੱਖ ਅੰਕੜੇ, ਡੇਟਾਸੇਟ ਝਲਕਾਰਾ, ਮਾਡਲ ਪ੍ਰਦਰਸ਼ਨ ਅਤੇ ਤੁਰੰਤ ਜਾਣਕਾਰੀ।" },
  "sub.crops": { en: "View all crops, search, and see crop-wise statistics.", hi: "सभी फसलें देखें, खोजें, और फसल-वार आंकड़े देखें।", pa: "ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ ਵੇਖੋ, ਖੋਜੋ, ਅਤੇ ਫ਼ਸਲ-ਵਾਰ ਅੰਕੜੇ ਵੇਖੋ।" },
  "sub.districts": { en: "Explore all districts and district-wise performance.", hi: "सभी जिलों और जिला-वार प्रदर्शन का अन्वेषण करें।", pa: "ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ ਅਤੇ ਜ਼ਿਲ੍ਹਾ-ਵਾਰ ਪ੍ਰਦਰਸ਼ਨ ਦੀ ਪੜਚੋਲ ਕਰੋ।" },
  "sub.predictions": { en: "View predicted vs actual yields with filtering.", hi: "फ़िल्टरिंग के साथ अनुमानित बनाम वास्तविक उपज देखें।", pa: "ਫ਼ਿਲਟਰਿੰਗ ਨਾਲ ਅਨੁਮਾਨਿਤ ਬਨਾਮ ਅਸਲ ਝਾੜ ਵੇਖੋ।" },
  "sub.maps": { en: "Interactive maps for yield prediction, NDVI and indices.", hi: "उपज पूर्वानुमान, NDVI और सूचकांकों के लिए इंटरैक्टिव मानचित्र।", pa: "ਝਾੜ ਪੂਰਵਾਨੁਮਾਨ, NDVI ਅਤੇ ਸੂਚਕਾਂ ਲਈ ਇੰਟਰਐਕਟਿਵ ਨਕਸ਼ੇ।" },
  "sub.analytics": { en: "In-depth charts and analytics for trends.", hi: "रुझानों के लिए गहन चार्ट और विश्लेषण।", pa: "ਰੁਝਾਨਾਂ ਲਈ ਡੂੰਘੇ ਚਾਰਟ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ।" },
  "sub.environment": { en: "Compare environmental trends across years.", hi: "वर्षों में पर्यावरणीय रुझानों की तुलना करें।", pa: "ਸਾਲਾਂ ਵਿੱਚ ਮਾਹੌਲੀ ਰੁਝਾਨਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ।" },
  "sub.reliability": { en: "Model reliability, uncertainty, and confidence metrics.", hi: "मॉडल विश्वसनीयता, अनिश्चितता और आत्मविश्वास मीट्रिक।", pa: "ਮਾਡਲ ਭਰੋਸੇਯੋਗਤਾ, ਅਨਿਸ਼ਚਿਤਤਾ ਅਤੇ ਯਕੀਨ ਮੈਟ੍ਰਿਕ।" },
  "sub.data": { en: "Explore dataset with custom filters and downloads.", hi: "कस्टम फ़िल्टर और डाउनलोड के साथ डेटासेट का अन्वेषण करें।", pa: "ਕਸਟਮ ਫ਼ਿਲਟਰ ਅਤੇ ਡਾਊਨਲੋਡ ਨਾਲ ਡੇਟਾਸੇਟ ਦੀ ਪੜਚੋਲ ਕਰੋ।" },
  "sub.reports": { en: "Generate downloadable reports and visual summaries.", hi: "डाउनलोड करने योग्य रिपोर्ट और दृश्य सारांश बनाएं।", pa: "ਡਾਊਨਲੋਡ ਕਰਨ ਯੋਗ ਰਿਪੋਰਟਾਂ ਅਤੇ ਵਿਜ਼ੂਅਲ ਸਾਰ ਬਣਾਓ।" },
  "sub.about": { en: "Project information and methodology.", hi: "परियोजना जानकारी और कार्यप्रणाली।", pa: "ਪ੍ਰੋਜੈਕਟ ਜਾਣਕਾਰੀ ਅਤੇ ਕਾਰਜ-ਪ੍ਰਣਾਲੀ।" },
  "sub.suitability": { en: "Crop Fit Console — enter site conditions, rank crops by suitability.", hi: "फसल उपयुक्तता — साइट स्थितियां दर्ज करें, फसलों को उपयुक्तता से रैंक करें।", pa: "ਫ਼ਸਲ ਯੋਗਤਾ — ਸਾਈਟ ਸਥਿਤੀਆਂ ਦਰਜ ਕਰੋ, ਫ਼ਸਲਾਂ ਨੂੰ ਯੋਗਤਾ ਨਾਲ ਰੈਂਕ ਕਰੋ।" },
  "sub.chatbot": { en: "AI-powered agricultural assistant for yield and crop advice.", hi: "उपज और फसल सलाह के लिए AI-संचालित कृषि सहायक।", pa: "ਝਾੜ ਅਤੇ ਫ਼ਸਲ ਸਲਾਹ ਲਈ AI-ਸੰਚਾਲਿਤ ਖੇਤੀ ਸਹਾਇਕ।" },
  "sub.glossary": { en: "Definitions of technical terms used throughout the dashboard.", hi: "डैशबोर्ड में उपयोग किए गए तकनीकी शब्दों की परिभाषाएं।", pa: "ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਵਰਤੇ ਗਏ ਤਕਨੀਕੀ ਸ਼ਬਦਾਂ ਦੀਆਂ ਪਰਿਭਾਸ਼ਾਵਾਂ।" },
  "sub.compare": { en: "Compare districts or crops side-by-side.", hi: "जिलों या फसलों की तुलना करें।", pa: "ਜ਼ਿਲ੍ਹਿਆਂ ਜਾਂ ਫ਼ਸਲਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ।" },

  // Suitability
  "suit.siteReadings": { en: "SITE READING", hi: "साइट रीडिंग", pa: "ਸਾਈਟ ਰੀਡਿੰਗ" },
  "suit.soilPH": { en: "Soil pH", hi: "मिट्टी का pH", pa: "ਮਿੱਟੀ ਦਾ pH" },
  "suit.soilMoisture": { en: "Soil Moisture", hi: "मिट्टी की नमी", pa: "ਮਿੱਟੀ ਦੀ ਨਮੀ" },
  "suit.meanTemp": { en: "Mean Temp", hi: "औसत तापमान", pa: "ਔਸਤ ਤਾਪਮਾਨ" },
  "suit.annualRainfall": { en: "Annual Rainfall", hi: "वार्षिक वर्षा", pa: "ਸਲਾਨਾ ਮੀਂਹ" },
  "suit.altitude": { en: "Altitude", hi: "ऊंचाई", pa: "ਉੱਚਾਈ" },
  "suit.nitrogen": { en: "Nitrogen Index", hi: "नाइट्रोजन सूचकांक", pa: "ਨਾਈਟ੍ਰੋਜਨ ਸੂਚਕਾਂਕ" },
  "suit.phosphorus": { en: "Phosphorus Index", hi: "फॉस्फोरस सूचकांक", pa: "ਫਾਸਫੋਰਸ ਸੂਚਕਾਂਕ" },
  "suit.potassium": { en: "Potassium Index", hi: "पोटैशियम सूचकांक", pa: "ਪੋਟਾਸ਼ੀਅਮ ਸੂਚਕਾਂਕ" },
  "suit.decisionLogic": { en: "DECISION LOGIC", hi: "निर्णय तर्क", pa: "ਫ਼ੈਸਲਾ ਤਰਕ" },
  "suit.ruleBased": { en: "Rule-based", hi: "नियम-आधारित", pa: "ਨਿਯਮ-ਅਧਾਰਿਤ" },
  "suit.weightedScore": { en: "Weighted Score", hi: "भारित स्कोर", pa: "ਭਾਰਿਤ ਸਕੋਰ" },
  "suit.hybrid": { en: "Hybrid", hi: "हाइब्रिड", pa: "ਹਾਈਬ੍ਰਿਡ" },
  "suit.paramWeights": { en: "PARAMETER WEIGHTS", hi: "पैरामीटर भार", pa: "ਪੈਰਾਮੀਟਰ ਭਾਰ" },
  "suit.cropPresets": { en: "CROP REQUIREMENT PRESETS", hi: "फसल आवश्यकता प्रीसेट", pa: "ਫ਼ਸਲ ਲੋੜ ਪ੍ਰੀਸੈਟ" },
  "suit.rankedResults": { en: "RANKED RESULTS", hi: "रैंक किए गए परिणाम", pa: "ਰੈਂਕ ਕੀਤੇ ਨਤੀਜੇ" },
  "suit.useMyLocation": { en: "📍 Use My Location", hi: "📍 मेरा स्थान उपयोग करें", pa: "📍 ਮੇਰੀ ਲੋਕੇਸ਼ਨ ਵਰਤੋ" },
  "suit.fetchingClimate": { en: "Fetching live climate data…", hi: "लाइव जलवायु डेटा प्राप्त हो रहा है…", pa: "ਲਾਈਵ ਮੌਸਮ ਡੇਟਾ ਪ੍ਰਾਪਤ ਹੋ ਰਿਹਾ ਹੈ…" },
  "suit.locationFetched": { en: "Live climate data loaded!", hi: "लाइव जलवायु डेटा लोड!", pa: "ਲਾਈਵ ਮੌਸਮ ਡੇਟਾ ਲੋਡ!" },

  // Chatbot
  "chat.title": { en: "AI Agricultural Assistant", hi: "AI कृषि सहायक", pa: "AI ਖੇਤੀ ਸਹਾਇਕ" },
  "chat.placeholder": { en: "Ask about crops, yields, soil…", hi: "फसलों, उपज, मिट्टी के बारे में पूछें…", pa: "ਫ਼ਸਲਾਂ, ਝਾੜ, ਮਿੱਟੀ ਬਾਰੇ ਪੁੱਛੋ…" },
  "chat.send": { en: "Send", hi: "भेजें", pa: "ਭੇਜੋ" },

  // Common
  "common.export": { en: "📤 Export", hi: "📤 निर्यात", pa: "📤 ਨਿਕਾਸ" },
  "common.search": { en: "Search…", hi: "खोजें…", pa: "ਖੋਜੋ…" },
  "common.close": { en: "✕ Close", hi: "✕ बंद करें", pa: "✕ ਬੰਦ ਕਰੋ" },
  "common.all": { en: "All", hi: "सभी", pa: "ਸਾਰੇ" },
  "common.years": { en: "Years", hi: "वर्ष", pa: "ਸਾਲ" },
  "common.season": { en: "Season", hi: "मौसम", pa: "ਮੌਸਮ" },
  "common.year": { en: "Year", hi: "वर्ष", pa: "ਸਾਲ" },
  "common.crop": { en: "Crop", hi: "फसल", pa: "ਫ਼ਸਲ" },
  "common.district": { en: "District", hi: "जिला", pa: "ਜ਼ਿਲ੍ਹਾ" },
  "common.yield": { en: "Yield", hi: "उपज", pa: "ਝਾੜ" },
  "common.samples": { en: "Samples", hi: "नमूने", pa: "ਨਮੂਨੇ" },
  "common.showMap": { en: "Show Map", hi: "मानचित्र दिखाएं", pa: "ਨਕਸ਼ਾ ਦਿਖਾਓ" },
  "common.apply": { en: "Apply", hi: "लागू करें", pa: "ਲਾਗੂ ਕਰੋ" },
  "common.generate": { en: "Generate", hi: "जनरेट करें", pa: "ਬਣਾਓ" },

  // Overview
  "overview.totalSamples": { en: "Total Samples", hi: "कुल नमूने", pa: "ਕੁੱਲ ਨਮੂਨੇ" },
  "overview.districts": { en: "Districts", hi: "जिले", pa: "ਜ਼ਿਲ੍ਹੇ" },
  "overview.crops": { en: "Crops", hi: "फसलें", pa: "ਫ਼ਸਲਾਂ" },
  "overview.years": { en: "Years", hi: "वर्ष", pa: "ਸਾਲ" },
  "overview.seasons": { en: "Seasons", hi: "मौसम", pa: "ਮੌਸਮ" },
  "overview.modelPerformance": { en: "Model Performance (Overall)", hi: "मॉडल प्रदर्शन (समग्र)", pa: "ਮਾਡਲ ਪ੍ਰਦਰਸ਼ਨ (ਸਮੁੱਚਾ)" },
  "overview.mae": { en: "MAE (KG/HA)", hi: "MAE (KG/HA)", pa: "MAE (KG/HA)" },
  "overview.rmse": { en: "RMSE (KG/HA)", hi: "RMSE (KG/HA)", pa: "RMSE (KG/HA)" },
  "overview.r2": { en: "R² SCORE", hi: "R² स्कोर", pa: "R² ਸਕੋਰ" },
  "overview.samplesOverYears": { en: "Samples Over Years", hi: "वर्षों में नमूने", pa: "ਸਾਲਾਂ ਵਿੱਚ ਨਮੂਨੇ" },
  "overview.top5Crops": { en: "Top 5 Crops by Samples", hi: "नमूनों में शीर्ष 5 फसलें", pa: "ਨਮੂਨਿਆਂ ਵਿੱਚ ਟਾਪ 5 ਫ਼ਸਲਾਂ" },
  "overview.seasonSplit": { en: "Samples by Season", hi: "मौसम अनुसार नमूने", pa: "ਮੌਸਮ ਅਨੁਸਾਰ ਨਮੂਨੇ" },

  // Charts
  "chart.yieldOverYears": { en: "Average Yield Over Years", hi: "वर्षों में औसत उपज", pa: "ਸਾਲਾਂ ਵਿੱਚ ਔਸਤ ਝਾੜ" },
  "chart.yieldDist": { en: "Yield Distribution", hi: "उपज वितरण", pa: "ਝਾੜ ਵੰਡ" },
  "chart.summaryStats": { en: "Summary Statistics", hi: "सारांश आंकड़े", pa: "ਸਾਰ ਅੰਕੜੇ" },
  "chart.mean": { en: "Mean", hi: "औसत", pa: "ਔਸਤ" },
  "chart.median": { en: "Median", hi: "मध्यिका", pa: "ਮੱਧ" },
  "chart.min": { en: "Min", hi: "न्यूनतम", pa: "ਘੱਟੋ-ਘੱਟ" },
  "chart.max": { en: "Max", hi: "अधिकतम", pa: "ਵੱਧੋ-ਵੱਧ" },
  "chart.stdDev": { en: "Std Dev", hi: "मानक विचलन", pa: "ਮਿਆਰੀ ਵਿਚਲਨ" },

  // Predictions
  "pred.actualVsPredicted": { en: "Actual vs Predicted Yield", hi: "वास्तविक बनाम अनुमानित उपज", pa: "ਅਸਲ ਬਨਾਮ ਅਨੁਮਾਨਿਤ ਝਾੜ" },
  "pred.recentPredictions": { en: "Recent Predictions", hi: "हाल के पूर्वानुमान", pa: "ਤਾਜ਼ਾ ਪੂਰਵਾਨੁਮਾਨ" },

  // Reports
  "reports.cropReport": { en: "Crop Report", hi: "फसल रिपोर्ट", pa: "ਫ਼ਸਲ ਰਿਪੋਰਟ" },
  "reports.districtReport": { en: "District Report", hi: "जिला रिपोर्ट", pa: "ਜ਼ਿਲ੍ਹਾ ਰਿਪੋਰਟ" },
  "reports.seasonalReport": { en: "Seasonal Report", hi: "मौसमी रिपोर्ट", pa: "ਮੌਸਮੀ ਰਿਪੋਰਟ" },
  "reports.modelReport": { en: "Model Performance Report", hi: "मॉडल प्रदर्शन रिपोर्ट", pa: "ਮਾਡਲ ਪ੍ਰਦਰਸ਼ਨ ਰਿਪੋਰਟ" },
  "reports.dataReport": { en: "Data Summary Report", hi: "डेटा सारांश रिपोर्ट", pa: "ਡੇਟਾ ਸਾਰ ਰਿਪੋਰਟ" },
  "reports.mapReport": { en: "Map & Index Report", hi: "मानचित्र और सूचकांक रिपोर्ट", pa: "ਨਕਸ਼ਾ ਅਤੇ ਸੂਚਕਾਂਕ ਰਿਪੋਰਟ" },

  // About
  "about.title": { en: "About", hi: "के बारे में", pa: "ਬਾਰੇ" },
  "about.project": { en: "Agriculture Remote Sensing Project", hi: "कृषि रिमोट सेंसिंग परियोजना", pa: "ਖੇਤੀ ਰਿਮੋਟ ਸੈਂਸਿੰਗ ਪ੍ਰੋਜੈਕਟ" },
  "about.description": { en: "This project uses satellite imagery, environmental data, and machine learning to predict crop yields across Punjab's 22 districts.", hi: "यह परियोजना पंजाब के 22 जिलों में फसल उपज की भविष्यवाणी के लिए उपग्रह इमेजरी, पर्यावरणीय डेटा और मशीन लर्निंग का उपयोग करती है।", pa: "ਇਹ ਪ੍ਰੋਜੈਕਟ ਪੰਜਾਬ ਦੇ 22 ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਫ਼ਸਲ ਝਾੜਾਂ ਦੀ ਭਵਿੱਖਬਾਣੀ ਲਈ ਸੈਟਲਾਈਟ ਤਸਵੀਰਾਂ, ਮਾਹੌਲੀ ਡੇਟਾ ਅਤੇ ਮਸ਼ੀਨ ਲਰਨਿੰਗ ਦੀ ਵਰਤੋਂ ਕਰਦਾ ਹੈ।" },
  "about.dataSources": { en: "Data Sources", hi: "डेटा स्रोत", pa: "ਡੇਟਾ ਸੋਰਸ" },
  "about.methodology": { en: "Methodology", hi: "कार्यप्रणाली", pa: "ਕਾਰਜ-ਪ੍ਰਣਾਲੀ" },
};

export function t(key: string, lang: Lang = "en"): string {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];
