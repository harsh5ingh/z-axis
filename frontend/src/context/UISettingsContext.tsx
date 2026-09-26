import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type RegionalLanguage = "English" | "हिन्दी" | "मराठी" | "বাংলা" | "தமிழ்" | "తెలుగు" | "ಕನ್ನಡ" | "ગુજરાતી" | "ਪੰਜਾਬੀ";
export type ThemePreference = "dark" | "system" | "light";
export type CityMode = "bhopal" | "reference";

type UISettings = {
  language: RegionalLanguage;
  setLanguage: (language: RegionalLanguage) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  city: CityMode;
  setCity: (city: CityMode) => void;
};

const UISettingsContext = createContext<UISettings | null>(null);

const translations: Partial<Record<RegionalLanguage, Record<string, string>>> = {
  "हिन्दी": {
    "New York City street and borough context": "न्यूयॉर्क शहर की सड़कें और पाँचों बोरो", "New York City · all five boroughs, streets and neighborhoods": "न्यूयॉर्क शहर · पाँचों बोरो, सड़कें और क्षेत्र",
    "Home": "होम", "About": "परिचय", "Features": "विशेषताएँ", "Use Cases": "उपयोग", "Contact": "संपर्क",
    "Select Region": "क्षेत्र चुनें", "Appearance": "दिखावट", "Dark": "डार्क", "System": "सिस्टम के अनुसार", "Light": "लाइट", "Regional Language": "क्षेत्रीय भाषा", "Public": "नागरिक", "Officer": "अधिकारी", "Open Public Portal": "नागरिक पोर्टल खोलें", "Open Officer Portal": "अधिकारी पोर्टल खोलें", "Sign In": "साइन इन", "Create Account": "खाता बनाएँ", "Logout": "लॉग आउट", "Try Demo Officer": "डेमो अधिकारी आज़माएँ", "SIH evaluation • No registration": "SIH मूल्यांकन • पंजीकरण आवश्यक नहीं",
    "Public Property Discovery": "सार्वजनिक संपत्ति खोज", "3D Cadastral Property Portal": "3D भू-अभिलेख संपत्ति पोर्टल", "Search parcels, explore 3D property volumes and review": "पार्सल खोजें, 3D संपत्ति आयतन देखें और जाँचें", "available spatial evidence.": "उपलब्ध स्थानिक साक्ष्य।", "3D City": "3D शहर", "Actual project data": "परियोजना का वास्तविक डेटा", "Reference data": "संदर्भ डेटा", "Public Access": "सार्वजनिक पहुँच", "Read Only": "केवल देखने के लिए",
    "SIH26011 prototype:": "SIH26011 प्रोटोटाइप:", "Bhopal uses the project building dataset. NYC is a reference demonstration. Derived floors, demo identifiers and technical checks are labelled in the viewer; this portal does not establish": "भोपाल में परियोजना का भवन डेटासेट उपयोग होता है। NYC संदर्भ प्रदर्शन है। व्युत्पन्न मंज़िलें, डेमो पहचान और तकनीकी जाँच व्यूअर में चिह्नित हैं; यह पोर्टल प्रमाणित नहीं करता", "ownership, legal rights or official ULPIN status.": "स्वामित्व, कानूनी अधिकार या आधिकारिक ULPIN स्थिति।",
    "Find a Property Record": "संपत्ति रिकॉर्ड खोजें", "Search backend-linked parcel, building or proposed property records. Use the 3D viewer below to inspect the Bhopal dataset or NYC reference data.": "बैकएंड से जुड़े पार्सल, भवन या प्रस्तावित संपत्ति रिकॉर्ड खोजें। नीचे के 3D व्यूअर में भोपाल डेटासेट या NYC संदर्भ डेटा देखें।", "Parcel code, building ID, proposed 3D ID, locality...": "पार्सल कोड, भवन ID, प्रस्तावित 3D ID, क्षेत्र...", "Searching...": "खोज रहे हैं...", "Search Cadastre": "भू-अभिलेख खोजें", "Recent searches:": "हाल की खोजें:", "Available record examples:": "उपलब्ध रिकॉर्ड उदाहरण:", "No API examples loaded. You can still explore the city dataset in the viewer.": "API उदाहरण उपलब्ध नहीं हैं। फिर भी व्यूअर में शहर का डेटासेट देखा जा सकता है।",
    "3D Volumetric Cadastre": "3D आयतन भू-अभिलेख", "Bhopal — GeoVISTA primary project dataset": "भोपाल — GeoVISTA का मुख्य परियोजना डेटासेट", "Reference City — New York City PS demonstration": "संदर्भ शहर — न्यूयॉर्क PS प्रदर्शन", "ACTUAL PROJECT DATA": "परियोजना का वास्तविक डेटा", "PROTOTYPE / REFERENCE DATA": "प्रोटोटाइप / संदर्भ डेटा", "Select a building or parcel": "भवन या पार्सल चुनें", "Inspect floors and Z range": "मंज़िलें और Z सीमा देखें", "Review prototype checks": "प्रोटोटाइप जाँचें देखें", "Bhopal project dataset": "भोपाल परियोजना डेटासेट", "NYC reference dataset": "NYC संदर्भ डेटासेट",
    "Bhopal street and neighborhood context": "भोपाल की सड़कें और क्षेत्र", "New York City street and neighborhood context": "न्यूयॉर्क शहर की सड़कें और क्षेत्र", "OpenStreetMap street basemap · separate from cadastral records": "OpenStreetMap सड़क मानचित्र · भू-अभिलेख से अलग", "2D CITY CONTEXT": "2D शहर संदर्भ", "Bhopal, Madhya Pradesh · locality and road context": "भोपाल, मध्य प्रदेश · क्षेत्र और सड़क संदर्भ", "Manhattan, New York City · neighborhood and road context": "मैनहैटन, न्यूयॉर्क · क्षेत्र और सड़क संदर्भ", "2D Record Footprint": "2D रिकॉर्ड का नक्शा", "API-linked record map; separate from the city dataset viewer above": "API रिकॉर्ड का नक्शा; ऊपर के शहर डेटासेट व्यूअर से अलग",
    "Prototype / reference data": "प्रोटोटाइप / संदर्भ डेटा", "New York City reference mode": "न्यूयॉर्क शहर संदर्भ मोड", "The 3D view loads open building footprints and public tax-lot sample data for the selected Manhattan area. Use the inspector inside the map to explore building height, derived floors, vertical extent and demonstration 3D identity.": "3D दृश्य चयनित मैनहैटन क्षेत्र के खुले भवन नक्शे और सार्वजनिक टैक्स-लॉट नमूने लोड करता है। भवन की ऊँचाई, व्युत्पन्न मंज़िलें, ऊर्ध्व सीमा और डेमो 3D पहचान देखने के लिए मानचित्र का इंस्पेक्टर खोलें।", "This is a PS workflow demonstration. It is not an official cadastral map, ownership record or government ULPIN.": "यह PS कार्यप्रवाह का प्रदर्शन है। यह आधिकारिक भू-अभिलेख नक्शा, स्वामित्व रिकॉर्ड या सरकारी ULPIN नहीं है।",
    "Search": "खोजें", "Layers": "लेयर", "Inspector": "इंस्पेक्टर", "GIS layers": "GIS लेयर", "Feature inspector": "फीचर इंस्पेक्टर", "Close": "बंद करें", "Clear": "हटाएँ", "Select": "चुनें", "Pan": "पैन", "Rotate": "घुमाएँ", "Zoom": "ज़ूम", "Floor view": "मंज़िल दृश्य", "X-Ray": "एक्स-रे", "Expand": "बड़ा करें", "Search visible building ID / BBL…": "दिख रहे भवन ID / BBL खोजें…", "No matching building in this loaded map sample.": "लोड किए गए मानचित्र नमूने में यह भवन नहीं मिला।", "Select a feature to inspect": "जाँच के लिए फीचर चुनें", "Bhopal 3D Cadastre": "भोपाल 3D भू-अभिलेख", "NYC reference data": "NYC संदर्भ डेटा", "Could not load this city": "शहर का डेटा लोड नहीं हुआ", "Retry": "फिर प्रयास करें",
    "From source data to a validated 3D property identity": "स्रोत डेटा से सत्यापित 3D संपत्ति पहचान तक", "Vertical property workflow": "ऊर्ध्व संपत्ति कार्यप्रवाह", "Footprint + Z-range = 3D property volume": "फुटप्रिंट + Z सीमा = 3D संपत्ति आयतन", "Prototype technical validation only · not official or legal cadastral validation.": "केवल प्रोटोटाइप तकनीकी सत्यापन · आधिकारिक या कानूनी भू-अभिलेख सत्यापन नहीं।",
  },
  "मराठी": { "Home": "मुख्यपृष्ठ", "About": "माहिती", "Features": "वैशिष्ट्ये", "Use Cases": "उपयोग", "Contact": "संपर्क", "Select Region": "प्रदेश निवडा", "Appearance": "दिसणे", "Dark": "डार्क", "System": "सिस्टम", "Light": "लाइट", "Regional Language": "प्रादेशिक भाषा", "Public": "नागरिक", "Officer": "अधिकारी", "Sign In": "साइन इन", "Create Account": "खाते तयार करा", "Logout": "लॉग आउट", "Public Property Discovery": "सार्वजनिक मालमत्ता शोध", "3D Cadastral Property Portal": "3D भू-अभिलेख मालमत्ता पोर्टल", "3D City": "3D शहर", "Actual project data": "प्रकल्पाचा प्रत्यक्ष डेटा", "Reference data": "संदर्भ डेटा", "Search Cadastre": "भू-अभिलेख शोधा", "Search": "शोधा", "Layers": "स्तर", "Inspector": "निरीक्षक", "Retry": "पुन्हा प्रयत्न करा" },
  "বাংলা": { "Home": "হোম", "About": "পরিচিতি", "Features": "বৈশিষ্ট্য", "Use Cases": "ব্যবহার", "Contact": "যোগাযোগ", "Select Region": "অঞ্চল নির্বাচন", "Appearance": "চেহারা", "Dark": "ডার্ক", "System": "সিস্টেম", "Light": "লাইট", "Regional Language": "আঞ্চলিক ভাষা", "Public": "সাধারণ", "Officer": "কর্মকর্তা", "Sign In": "সাইন ইন", "Create Account": "অ্যাকাউন্ট তৈরি", "Logout": "লগ আউট", "Public Property Discovery": "সর্বজনীন সম্পত্তি অনুসন্ধান", "3D Cadastral Property Portal": "3D ভূমি-রেকর্ড সম্পত্তি পোর্টাল", "3D City": "3D শহর", "Actual project data": "প্রকল্পের আসল তথ্য", "Reference data": "রেফারেন্স তথ্য", "Search Cadastre": "ভূমি-রেকর্ড খুঁজুন", "Search": "খুঁজুন", "Layers": "স্তর", "Inspector": "পরিদর্শক", "Retry": "আবার চেষ্টা করুন" },
  "தமிழ்": { "Home": "முகப்பு", "About": "பற்றி", "Features": "அம்சங்கள்", "Use Cases": "பயன்பாடுகள்", "Contact": "தொடர்பு", "Select Region": "பகுதியைத் தேர்ந்தெடுக்கவும்", "Appearance": "தோற்றம்", "Dark": "இருள்", "System": "கணினி", "Light": "ஒளி", "Regional Language": "வட்டார மொழி", "Public": "பொது", "Officer": "அலுவலர்", "Sign In": "உள்நுழை", "Create Account": "கணக்கை உருவாக்கு", "Logout": "வெளியேறு", "Public Property Discovery": "பொது சொத்து தேடல்", "3D Cadastral Property Portal": "3D நிலப் பதிவேட்டு சொத்து தளம்", "3D City": "3D நகரம்", "Actual project data": "திட்டத்தின் உண்மையான தரவு", "Reference data": "குறிப்பு தரவு", "Search Cadastre": "நிலப் பதிவேட்டைத் தேடு", "Search": "தேடு", "Layers": "அடுக்குகள்", "Inspector": "ஆய்வாளர்", "Retry": "மீண்டும் முயற்சி" },
  "తెలుగు": { "Home": "హోమ్", "About": "పరిచయం", "Features": "లక్షణాలు", "Use Cases": "వినియోగాలు", "Contact": "సంప్రదింపు", "Select Region": "ప్రాంతాన్ని ఎంచుకోండి", "Appearance": "రూపం", "Dark": "డార్క్", "System": "సిస్టమ్", "Light": "లైట్", "Regional Language": "ప్రాంతీయ భాష", "Public": "ప్రజలు", "Officer": "అధికారి", "Sign In": "సైన్ ఇన్", "Create Account": "ఖాతా సృష్టించండి", "Logout": "లాగ్ అవుట్", "Public Property Discovery": "ప్రజా ఆస్తి శోధన", "3D Cadastral Property Portal": "3D భూ రికార్డు ఆస్తి పోర్టల్", "3D City": "3D నగరం", "Actual project data": "ప్రాజెక్ట్ వాస్తవ డేటా", "Reference data": "రిఫరెన్స్ డేటా", "Search Cadastre": "భూ రికార్డును శోధించండి", "Search": "శోధన", "Layers": "లేయర్లు", "Inspector": "పరిశీలకుడు", "Retry": "మళ్లీ ప్రయత్నించండి" },
  "ಕನ್ನಡ": { "Home": "ಮುಖಪುಟ", "About": "ಪರಿಚಯ", "Features": "ವೈಶಿಷ್ಟ್ಯಗಳು", "Use Cases": "ಬಳಕೆ", "Contact": "ಸಂಪರ್ಕ", "Select Region": "ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ", "Appearance": "ರೂಪ", "Dark": "ಡಾರ್ಕ್", "System": "ಸಿಸ್ಟಮ್", "Light": "ಲೈಟ್", "Regional Language": "ಪ್ರಾದೇಶಿಕ ಭಾಷೆ", "Public": "ಸಾರ್ವಜನಿಕ", "Officer": "ಅಧಿಕಾರಿ", "Sign In": "ಸೈನ್ ಇನ್", "Create Account": "ಖಾತೆ ರಚಿಸಿ", "Logout": "ಲಾಗ್ ಔಟ್", "Public Property Discovery": "ಸಾರ್ವಜನಿಕ ಆಸ್ತಿ ಹುಡುಕಾಟ", "3D Cadastral Property Portal": "3D ಭೂ ದಾಖಲೆ ಆಸ್ತಿ ಪೋರ್ಟಲ್", "3D City": "3D ನಗರ", "Actual project data": "ಯೋಜನೆಯ ನೈಜ ಡೇಟಾ", "Reference data": "ಉಲ್ಲೇಖ ಡೇಟಾ", "Search Cadastre": "ಭೂ ದಾಖಲೆಯನ್ನು ಹುಡುಕಿ", "Search": "ಹುಡುಕಿ", "Layers": "ಪದರಗಳು", "Inspector": "ಪರಿಶೀಲಕ", "Retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" },
  "ગુજરાતી": { "Home": "મુખ્ય પૃષ્ઠ", "About": "પરિચય", "Features": "વિશેષતાઓ", "Use Cases": "ઉપયોગ", "Contact": "સંપર્ક", "Select Region": "વિસ્તાર પસંદ કરો", "Appearance": "દેખાવ", "Dark": "ડાર્ક", "System": "સિસ્ટમ", "Light": "લાઇટ", "Regional Language": "પ્રાદેશિક ભાષા", "Public": "જાહેર", "Officer": "અધિકારી", "Sign In": "સાઇન ઇન", "Create Account": "ખાતું બનાવો", "Logout": "લૉગ આઉટ", "Public Property Discovery": "જાહેર મિલકત શોધ", "3D Cadastral Property Portal": "3D જમીન-રેકોર્ડ મિલકત પોર્ટલ", "3D City": "3D શહેર", "Actual project data": "પ્રોજેક્ટનો વાસ્તવિક ડેટા", "Reference data": "સંદર્ભ ડેટા", "Search Cadastre": "જમીન-રેકોર્ડ શોધો", "Search": "શોધો", "Layers": "સ્તરો", "Inspector": "નિરીક્ષક", "Retry": "ફરી પ્રયાસ કરો" },
  "ਪੰਜਾਬੀ": { "Home": "ਮੁੱਖ ਪੰਨਾ", "About": "ਜਾਣ-ਪਛਾਣ", "Features": "ਖਾਸੀਅਤਾਂ", "Use Cases": "ਵਰਤੋਂ", "Contact": "ਸੰਪਰਕ", "Select Region": "ਖੇਤਰ ਚੁਣੋ", "Appearance": "ਦਿੱਖ", "Dark": "ਡਾਰਕ", "System": "ਸਿਸਟਮ", "Light": "ਲਾਈਟ", "Regional Language": "ਖੇਤਰੀ ਭਾਸ਼ਾ", "Public": "ਜਨਤਕ", "Officer": "ਅਧਿਕਾਰੀ", "Sign In": "ਸਾਈਨ ਇਨ", "Create Account": "ਖਾਤਾ ਬਣਾਓ", "Logout": "ਲੌਗ ਆਉਟ", "Public Property Discovery": "ਜਨਤਕ ਜਾਇਦਾਦ ਖੋਜ", "3D Cadastral Property Portal": "3D ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਜਾਇਦਾਦ ਪੋਰਟਲ", "3D City": "3D ਸ਼ਹਿਰ", "Actual project data": "ਪ੍ਰੋਜੈਕਟ ਦਾ ਅਸਲ ਡੇਟਾ", "Reference data": "ਹਵਾਲਾ ਡੇਟਾ", "Search Cadastre": "ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਖੋਜੋ", "Search": "ਖੋਜੋ", "Layers": "ਪਰਤਾਂ", "Inspector": "ਜਾਂਚਕਰਤਾ", "Retry": "ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ" },
};

const additionalTranslations: Partial<Record<RegionalLanguage, Record<string, string>>> = {
  "हिन्दी": {
    "Public Access": "सार्वजनिक पहुँच", "Loading or searching the property records…": "संपत्ति रिकॉर्ड लोड या खोजे जा रहे हैं…", "No API examples loaded. You can still explore the city dataset in the viewer.": "API उदाहरण लोड नहीं हुए। फिर भी व्यूअर में शहर का डेटासेट देखा जा सकता है।", "Choose city + data mode": "शहर और डेटा मोड चुनें", "Bhopal actual · NYC reference": "भोपाल वास्तविक · NYC संदर्भ", "3D VIEW": "3D दृश्य", "2D CADASTRE": "2D भू-अभिलेख", "2D Record Footprint": "2D रिकॉर्ड मानचित्र", "City map": "शहर का मानचित्र", "API-linked record map; separate from the city dataset viewer above": "API रिकॉर्ड मानचित्र; ऊपर के शहर डेटासेट व्यूअर से अलग", "Search parcels, explore 3D property volumes and review": "पार्सल खोजें, 3D संपत्ति आयतन देखें और जाँचें", "available spatial evidence.": "उपलब्ध स्थानिक साक्ष्य।", "Find a Property Record": "संपत्ति रिकॉर्ड खोजें", "Prototype workflow status: Under review.": "प्रोटोटाइप कार्यप्रवाह स्थिति: समीक्षा में।", "This status comes from the linked property record. It does not indicate government review or legal cadastral verification.": "यह स्थिति जुड़े संपत्ति रिकॉर्ड से आती है। इसका अर्थ सरकारी समीक्षा या कानूनी भू-अभिलेख सत्यापन नहीं है।", "Synthetic demo record": "सिंथेटिक डेमो रिकॉर्ड", "API-linked record": "API से जुड़ा रिकॉर्ड", "Proposed 3D property identifier · prototype only, not an official ULPIN": "प्रस्तावित 3D संपत्ति पहचान · केवल प्रोटोटाइप, आधिकारिक ULPIN नहीं", "Prototype record status": "प्रोटोटाइप रिकॉर्ड स्थिति", "Floor Level": "मंज़िल स्तर", "Unit Number": "इकाई संख्या", "Vertical Elevation": "ऊर्ध्व ऊँचाई", "Footprint Area": "फुटप्रिंट क्षेत्र", "Report prototype issue": "प्रोटोटाइप समस्या बताएँ", "Record revision:": "रिकॉर्ड संशोधन:", "Technical confidence for this linked record only; it does not establish ownership or legal validity.": "केवल इस जुड़े रिकॉर्ड का तकनीकी भरोसा; यह स्वामित्व या कानूनी वैधता स्थापित नहीं करता।", "Check each source label and demo flag before interpreting evidence as measured or authoritative.": "साक्ष्य को मापा हुआ या आधिकारिक मानने से पहले स्रोत लेबल और डेमो संकेत जाँचें।", "Synthetic demo parcel": "सिंथेटिक डेमो पार्सल", "API-linked parcel": "API से जुड़ा पार्सल", "District / State": "ज़िला / राज्य", "Surface Area": "सतह क्षेत्र", "Detected Structure Candidate": "संभावित संरचना मिली", "Candidate": "संभावित संरचना", "Estimated Height:": "अनुमानित ऊँचाई:", "Elevated Transit Infrastructure": "ऊँचा परिवहन ढाँचा", "Prototype technical confidence; not a land-title or ownership score.": "प्रोटोटाइप तकनीकी भरोसा; भूमि-अधिकार या स्वामित्व स्कोर नहीं।", "Evidence may be synthetic or derived. Use the displayed source and status fields as provenance hints.": "साक्ष्य सिंथेटिक या व्युत्पन्न हो सकता है। दिखाए गए स्रोत और स्थिति को डेटा-स्रोत संकेत मानें।", "Technical Confidence Score": "तकनीकी भरोसा स्कोर", "Prototype Multi-Factor Spatial Index": "प्रोटोटाइप बहु-कारक स्थानिक सूचकांक", "Evidence (25%)": "साक्ष्य (25%)", "Geometry (25%)": "ज्यामिति (25%)", "Position (20%)": "स्थिति (20%)", "Agreement (20%)": "सहमति (20%)", "Rules (10%)": "नियम (10%)", "Notice:": "सूचना:", "Attached Spatial Evidence": "संलग्न स्थानिक साक्ष्य", "Source date:": "स्रोत दिनांक:", "Guided Assistant": "मार्गदर्शित सहायक", "GeoVISTA Guided Assistant": "GeoVISTA मार्गदर्शित सहायक", "Rule-based prototype guide · no AI inference": "नियम-आधारित प्रोटोटाइप मार्गदर्शक · AI अनुमान नहीं", "Ask about this property...": "इस संपत्ति के बारे में पूछें...", "Select a parcel to view 2D Cadastral boundary": "2D भू-अभिलेख सीमा देखने के लिए पार्सल चुनें", "Parcel": "पार्सल", "Building": "भवन", "Selected Unit": "चयनित इकाई", "Report a Property Data Issue": "संपत्ति डेटा समस्या दर्ज करें", "Prototype Report Recorded": "प्रोटोटाइप रिपोर्ट दर्ज हुई", "Vertical Height / Floor Discrepancy": "ऊँचाई / मंज़िल में अंतर", "Building / Unit Boundary Differs from Site": "भवन / इकाई की सीमा स्थल से अलग है", "Incorrect Geographical Location": "भौगोलिक स्थान गलत है", "Outdated Property Record": "संपत्ति रिकॉर्ड पुराना है", "Provide specific details about the observed discrepancy...": "देखे गए अंतर का स्पष्ट विवरण दें...", "OpenStreetMap street basemap · separate from cadastral records": "OpenStreetMap सड़क मानचित्र · भू-अभिलेख रिकॉर्ड से अलग", "Map controls and source attributes are shown in English.": "मानचित्र नियंत्रण और स्रोत विशेषताएँ अंग्रेज़ी में दिखाई जाती हैं।"
  },
  "मराठी": {
    "New York City street and borough context": "न्यूयॉर्क शहरातील रस्ते आणि पाचही बरो", "New York City · all five boroughs, streets and neighborhoods": "न्यूयॉर्क शहर · पाचही बरो, रस्ते आणि परिसर",
    "Find a Property Record": "मालमत्ता नोंद शोधा", "Search Cadastre": "भू-अभिलेख शोधा", "Searching...": "शोध सुरू आहे...", "Recent searches:": "अलीकडील शोध:", "Available record examples:": "उपलब्ध नोंदींची उदाहरणे:", "3D Volumetric Cadastre": "3D आयतन भू-अभिलेख", "2D Record Footprint": "2D नोंद नकाशा", "Public Access": "सार्वजनिक प्रवेश", "Read Only": "फक्त वाचन", "Select a building or parcel": "इमारत किंवा पार्सल निवडा", "Inspect floors and Z range": "मजले आणि Z मर्यादा तपासा", "Review prototype checks": "प्रोटोटाइप तपासण्या पाहा", "Layers": "स्तर", "Search": "शोधा", "Inspector": "निरीक्षक", "Guided Assistant": "मार्गदर्शित सहाय्यक", "Map controls and source attributes are shown in English.": "नकाशा नियंत्रण आणि स्रोत गुणधर्म इंग्रजीत दाखवले आहेत."
  },
  "বাংলা": {
    "New York City street and borough context": "নিউ ইয়র্ক শহরের রাস্তা ও পাঁচটি বরো", "New York City · all five boroughs, streets and neighborhoods": "নিউ ইয়র্ক সিটি · পাঁচটি বরো, রাস্তা ও এলাকা",
    "Find a Property Record": "সম্পত্তির রেকর্ড খুঁজুন", "Search Cadastre": "ভূমি-রেকর্ড খুঁজুন", "Searching...": "খোঁজা হচ্ছে...", "Recent searches:": "সাম্প্রতিক অনুসন্ধান:", "Available record examples:": "উপলভ্য রেকর্ডের উদাহরণ:", "3D Volumetric Cadastre": "3D আয়তনভিত্তিক ভূমি-রেকর্ড", "2D Record Footprint": "2D রেকর্ড মানচিত্র", "Public Access": "সর্বজনীন প্রবেশাধিকার", "Read Only": "শুধু দেখা যাবে", "Select a building or parcel": "একটি ভবন বা পার্সেল বেছে নিন", "Inspect floors and Z range": "তলা ও Z সীমা দেখুন", "Review prototype checks": "প্রোটোটাইপ যাচাই দেখুন", "Layers": "স্তর", "Search": "খুঁজুন", "Inspector": "পরিদর্শক", "Guided Assistant": "নির্দেশিত সহায়ক", "Map controls and source attributes are shown in English.": "মানচিত্রের নিয়ন্ত্রণ ও উৎসের তথ্য ইংরেজিতে দেখানো হয়েছে।"
  },
  "தமிழ்": {
    "New York City street and borough context": "நியூயார்க் நகரச் சாலைகள் மற்றும் ஐந்து பேரோக்கள்", "New York City · all five boroughs, streets and neighborhoods": "நியூயார்க் நகரம் · ஐந்து பேரோக்கள், சாலைகள் மற்றும் பகுதிகள்",
    "Find a Property Record": "சொத்து பதிவைத் தேடுங்கள்", "Search Cadastre": "நிலப் பதிவைத் தேடுங்கள்", "Searching...": "தேடுகிறது...", "Recent searches:": "சமீபத்திய தேடல்கள்:", "Available record examples:": "கிடைக்கும் பதிவு எடுத்துக்காட்டுகள்:", "3D Volumetric Cadastre": "3D கன அளவு நிலப் பதிவு", "2D Record Footprint": "2D பதிவு வரைபடம்", "Public Access": "பொது அணுகல்", "Read Only": "பார்வைக்கு மட்டும்", "Select a building or parcel": "கட்டிடம் அல்லது நிலப்பகுதியைத் தேர்ந்தெடுக்கவும்", "Inspect floors and Z range": "தளங்களையும் Z வரம்பையும் பார்க்கவும்", "Review prototype checks": "முன்மாதிரி சரிபார்ப்புகளைப் பார்க்கவும்", "Layers": "அடுக்குகள்", "Search": "தேடல்", "Inspector": "ஆய்வாளர்", "Guided Assistant": "வழிகாட்டி", "Map controls and source attributes are shown in English.": "வரைபடக் கட்டுப்பாடுகளும் தரவு மூல விவரங்களும் ஆங்கிலத்தில் காட்டப்படும்."
  },
  "తెలుగు": {
    "New York City street and borough context": "న్యూయార్క్ నగర రహదారులు, ఐదు బరోలు", "New York City · all five boroughs, streets and neighborhoods": "న్యూయార్క్ నగరం · ఐదు బరోలు, రహదారులు, ప్రాంతాలు",
    "Find a Property Record": "ఆస్తి రికార్డును కనుగొనండి", "Search Cadastre": "భూ రికార్డును శోధించండి", "Searching...": "శోధిస్తోంది...", "Recent searches:": "ఇటీవలి శోధనలు:", "Available record examples:": "అందుబాటులోని రికార్డు ఉదాహరణలు:", "3D Volumetric Cadastre": "3D ఘనపరిమాణ భూ రికార్డు", "2D Record Footprint": "2D రికార్డు మ్యాప్", "Public Access": "ప్రజా ప్రవేశం", "Read Only": "చూడటానికి మాత్రమే", "Select a building or parcel": "భవనం లేదా పార్సెల్ ఎంచుకోండి", "Inspect floors and Z range": "అంతస్తులు, Z పరిధిని చూడండి", "Review prototype checks": "ప్రోటోటైప్ తనిఖీలను చూడండి", "Layers": "లేయర్లు", "Search": "శోధించండి", "Inspector": "పరిశీలకుడు", "Guided Assistant": "మార్గదర్శి", "Map controls and source attributes are shown in English.": "మ్యాప్ నియంత్రణలు, మూల వివరాలు ఇంగ్లీషులో చూపబడతాయి."
  },
  "ಕನ್ನಡ": {
    "New York City street and borough context": "ನ್ಯೂಯಾರ್ಕ್ ನಗರದ ರಸ್ತೆಗಳು ಮತ್ತು ಐದು ಬರೋಗಳು", "New York City · all five boroughs, streets and neighborhoods": "ನ್ಯೂಯಾರ್ಕ್ ನಗರ · ಐದು ಬರೋಗಳು, ರಸ್ತೆಗಳು ಮತ್ತು ಪ್ರದೇಶಗಳು",
    "Find a Property Record": "ಆಸ್ತಿ ದಾಖಲೆಯನ್ನು ಹುಡುಕಿ", "Search Cadastre": "ಭೂ ದಾಖಲೆಯನ್ನು ಹುಡುಕಿ", "Searching...": "ಹುಡುಕಲಾಗುತ್ತಿದೆ...", "Recent searches:": "ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು:", "Available record examples:": "ಲಭ್ಯ ದಾಖಲೆ ಉದಾಹರಣೆಗಳು:", "3D Volumetric Cadastre": "3D ಘನಪರಿಮಾಣ ಭೂ ದಾಖಲೆ", "2D Record Footprint": "2D ದಾಖಲೆ ನಕ್ಷೆ", "Public Access": "ಸಾರ್ವಜನಿಕ ಪ್ರವೇಶ", "Read Only": "ವೀಕ್ಷಣೆಗೆ ಮಾತ್ರ", "Select a building or parcel": "ಕಟ್ಟಡ ಅಥವಾ ಪಾರ್ಸೆಲ್ ಆಯ್ಕೆಮಾಡಿ", "Inspect floors and Z range": "ಮಹಡಿಗಳು ಮತ್ತು Z ವ್ಯಾಪ್ತಿ ನೋಡಿ", "Review prototype checks": "ಮಾದರಿ ಪರಿಶೀಲನೆಗಳನ್ನು ನೋಡಿ", "Layers": "ಪದರಗಳು", "Search": "ಹುಡುಕಿ", "Inspector": "ಪರಿಶೀಲಕ", "Guided Assistant": "ಮಾರ್ಗದರ್ಶಿ", "Map controls and source attributes are shown in English.": "ನಕ್ಷೆಯ ನಿಯಂತ್ರಣಗಳು ಮತ್ತು ಮೂಲ ವಿವರಗಳು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ."
  },
  "ગુજરાતી": {
    "New York City street and borough context": "ન્યૂયોર્ક શહેરના રસ્તા અને પાંચેય બરો", "New York City · all five boroughs, streets and neighborhoods": "ન્યૂયોર્ક શહેર · પાંચેય બરો, રસ્તા અને વિસ્તારો",
    "Find a Property Record": "મિલકતનો રેકોર્ડ શોધો", "Search Cadastre": "જમીન-રેકોર્ડ શોધો", "Searching...": "શોધ ચાલુ છે...", "Recent searches:": "તાજેતરની શોધ:", "Available record examples:": "ઉપલબ્ધ રેકોર્ડનાં ઉદાહરણો:", "3D Volumetric Cadastre": "3D ઘનફળ જમીન-રેકોર્ડ", "2D Record Footprint": "2D રેકોર્ડ નકશો", "Public Access": "જાહેર પ્રવેશ", "Read Only": "માત્ર જોવા માટે", "Select a building or parcel": "મકાન અથવા પાર્સલ પસંદ કરો", "Inspect floors and Z range": "માળ અને Z મર્યાદા જુઓ", "Review prototype checks": "પ્રોટોટાઇપ તપાસ જુઓ", "Layers": "સ્તરો", "Search": "શોધો", "Inspector": "નિરીક્ષક", "Guided Assistant": "માર્ગદર્શક સહાયક", "Map controls and source attributes are shown in English.": "નકશાના નિયંત્રણો અને ડેટા સ્ત્રોતની વિગતો અંગ્રેજીમાં છે."
  },
  "ਪੰਜਾਬੀ": {
    "New York City street and borough context": "ਨਿਊਯਾਰਕ ਸ਼ਹਿਰ ਦੀਆਂ ਸੜਕਾਂ ਅਤੇ ਪੰਜੇ ਬਰੋ", "New York City · all five boroughs, streets and neighborhoods": "ਨਿਊਯਾਰਕ ਸ਼ਹਿਰ · ਪੰਜੇ ਬਰੋ, ਸੜਕਾਂ ਅਤੇ ਇਲਾਕੇ",
    "Find a Property Record": "ਜਾਇਦਾਦ ਦਾ ਰਿਕਾਰਡ ਲੱਭੋ", "Search Cadastre": "ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਖੋਜੋ", "Searching...": "ਖੋਜ ਜਾਰੀ ਹੈ...", "Recent searches:": "ਹਾਲੀਆ ਖੋਜਾਂ:", "Available record examples:": "ਉਪਲਬਧ ਰਿਕਾਰਡ ਦੀਆਂ ਮਿਸਾਲਾਂ:", "3D Volumetric Cadastre": "3D ਆਇਤਨ ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ", "2D Record Footprint": "2D ਰਿਕਾਰਡ ਨਕਸ਼ਾ", "Public Access": "ਜਨਤਕ ਪਹੁੰਚ", "Read Only": "ਸਿਰਫ਼ ਵੇਖਣ ਲਈ", "Select a building or parcel": "ਇਮਾਰਤ ਜਾਂ ਪਾਰਸਲ ਚੁਣੋ", "Inspect floors and Z range": "ਮੰਜ਼ਿਲਾਂ ਅਤੇ Z ਸੀਮਾ ਵੇਖੋ", "Review prototype checks": "ਪ੍ਰੋਟੋਟਾਈਪ ਜਾਂਚਾਂ ਵੇਖੋ", "Layers": "ਪਰਤਾਂ", "Search": "ਖੋਜੋ", "Inspector": "ਜਾਂਚਕਰਤਾ", "Guided Assistant": "ਰਾਹ-ਦਰਸ਼ਕ ਸਹਾਇਕ", "Map controls and source attributes are shown in English.": "ਨਕਸ਼ੇ ਦੇ ਨਿਯੰਤਰਣ ਅਤੇ ਸਰੋਤ ਵੇਰਵੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ।"
  },
};

const hindiPortalTranslations: Record<string, string> = {
  "Search parcels, explore 3D property volumes and review available spatial evidence.": "पार्सल खोजें, 3D संपत्ति आयतन देखें और उपलब्ध स्थानिक साक्ष्य जाँचें।",
  "Search properties, explore 3D property volumes and review available spatial evidence.": "संपत्तियाँ खोजें, 3D संपत्ति आयतन देखें और उपलब्ध स्थानिक साक्ष्य जाँचें।", "The linked record is tagged as rural. Confirm its source and survey status in the evidence before using it for decisions.": "जुड़ा रिकॉर्ड ग्रामीण चिह्नित है। निर्णय से पहले साक्ष्य में उसके स्रोत और सर्वेक्षण स्थिति की पुष्टि करें।", "The linked record is tagged as urban. Any 3D candidate or infrastructure relationship shown here is prototype context, not a legal parcel determination.": "जुड़ा रिकॉर्ड शहरी चिह्नित है। यहाँ दिखाया गया 3D संभावित भवन या बुनियादी ढाँचे का संबंध प्रोटोटाइप संदर्भ है, कानूनी पार्सल निर्धारण नहीं।", "This score indicates spatial data consistency and sensor evidence completeness. It does not certify legal ownership or title registry.": "यह स्कोर स्थानिक डेटा की संगति और सेंसर साक्ष्य की पूर्णता बताता है। यह कानूनी स्वामित्व या अधिकार अभिलेख प्रमाणित नहीं करता।", "Vertical property workflow": "ऊर्ध्व संपत्ति कार्यप्रवाह", "Footprint + Z-range = 3D property volume": "फुटप्रिंट + Z-सीमा = 3D संपत्ति आयतन", "Select a building, choose a level, adjust the vertical extent, highlight its volume, then generate a demonstration identity.": "भवन चुनें, मंज़िल चुनें, ऊर्ध्व सीमा तय करें, उसका आयतन हाइलाइट करें और डेमो पहचान बनाएँ।", "Prototype technical workflow": "प्रोटोटाइप तकनीकी कार्यप्रवाह", "Parcel + building": "पार्सल + भवन", "Matched by source key": "स्रोत कुंजी से मिलान", "Building selected": "भवन चुना गया", "Vertical level": "ऊर्ध्व मंज़िल", "Z range": "Z सीमा", "3D identity": "3D पहचान", "Not generated yet": "अभी बनाई नहीं गई", "No ownership or legal unit boundary implied": "स्वामित्व या कानूनी इकाई सीमा का दावा नहीं", "Topology / validation": "टोपोलॉजी / सत्यापन", "Prototype geometry checks": "प्रोटोटाइप ज्यामिति जाँच", "Run checks": "जाँच चलाएँ", "Running…": "जाँच जारी है…", "Geometry checks have not been run for this selection.": "इस चयन के लिए ज्यामिति जाँच अभी नहीं चली है।", "GeoVISTA AI / ML pipeline": "GeoVISTA AI / ML पाइपलाइन", "From source data to a validated 3D property identity": "स्रोत डेटा से सत्यापित 3D संपत्ति पहचान तक", "Implemented": "लागू", "Prototype / planned": "प्रोटोटाइप / नियोजित", "Input imagery / point cloud": "इनपुट इमेजरी / पॉइंट क्लाउड", "Building footprints": "भवन फुटप्रिंट", "Height + base elevation": "ऊँचाई + आधार ऊँचाई", "Floor segmentation": "मंज़िल विभाजन", "Volume + topology checks": "आयतन + टोपोलॉजी जाँच", "3D property identity": "3D संपत्ति पहचान", "No model inference is run in this demo.": "इस डेमो में कोई मॉडल अनुमान नहीं चलता।", "Loads source polygons from the selected city.": "चुने गए शहर के स्रोत बहुभुज लोड करता है।", "Reads supplied source attributes; no new prediction.": "दिए गए स्रोत गुण पढ़ता है; कोई नया अनुमान नहीं।", "Equal-height floor bands derived from available height.": "उपलब्ध ऊँचाई से समान ऊँचाई वाले मंज़िल खंड निकाले गए हैं।", "Local geometric envelope and deterministic checks.": "स्थानीय ज्यामितीय आयतन और नियत जाँच।", "Demo token only; not an official ULPIN.": "केवल डेमो टोकन; आधिकारिक ULPIN नहीं।", "Technical prototype validation only · not official or legal cadastral validation.": "केवल तकनीकी प्रोटोटाइप सत्यापन · आधिकारिक या कानूनी भू-अभिलेख सत्यापन नहीं।", "Run prototype validation": "प्रोटोटाइप सत्यापन चलाएँ", "Checking geometry…": "ज्यामिति जाँची जा रही है…", "VALID": "वैध", "WARNING": "चेतावनी", "ERROR": "त्रुटि", "Prototype Report Recorded": "प्रोटोटाइप रिपोर्ट दर्ज हुई", "Submit Report": "रिपोर्ट भेजें", "Cancel": "रद्द करें", "Close": "बंद करें", "Data Provenance": "डेटा स्रोत", "About": "परिचय", "Quick Links": "त्वरित लिंक", "Help & Support": "सहायता और समर्थन", "FAQs": "अक्सर पूछे जाने वाले प्रश्न", "Sitemap": "साइटमैप", "Public Portal": "नागरिक पोर्टल", "Officer Portal": "अधिकारी पोर्टल", "Sign Out": "लॉग आउट", "Terms of Use": "उपयोग की शर्तें", "Privacy Policy": "गोपनीयता नीति", "Accessibility": "सुगम्यता"
};

const languageTags: Record<RegionalLanguage, string> = {
  English: "en", "हिन्दी": "hi", "मराठी": "mr", "বাংলা": "bn", "தமிழ்": "ta", "తెలుగు": "te", "ಕನ್ನಡ": "kn", "ગુજરાતી": "gu", "ਪੰਜਾਬੀ": "pa",
};

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function UISettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<RegionalLanguage>(() => readPreference("geovista.ui.language", Object.keys(languageTags) as RegionalLanguage[], "English"));
  const [theme, setTheme] = useState<ThemePreference>(() => readPreference("geovista.ui.theme", ["dark", "system", "light"] as const, "system"));
  const [city, setCity] = useState<CityMode>(() => readPreference("geovista.ui.city", ["bhopal", "reference"] as const, "bhopal"));
  const originalText = useRef(new WeakMap<Text, string>());
  const appliedText = useRef(new WeakMap<Text, string>());
  const originalAttributes = useRef(new WeakMap<Element, Map<string, string>>());
  const appliedAttributes = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    try { window.localStorage.setItem("geovista.ui.language", language); } catch { /* preference remains active for this page */ }
    document.documentElement.lang = languageTags[language];
    const dictionary = { ...(translations[language] ?? {}), ...(additionalTranslations[language] ?? {}), ...(language === "हिन्दी" ? hindiPortalTranslations : {}) };
    const excluded = (element: Element | null) => Boolean(element?.closest("[data-language-static], script, style, textarea, input, select, option"));

    const translateText = (node: Text) => {
      const current = node.nodeValue ?? "";
      const previousTranslation = appliedText.current.get(node);
      if (previousTranslation && current === previousTranslation) return;
      const source = previousTranslation ? current : (originalText.current.get(node) ?? current);
      originalText.current.set(node, source);
      const trimmed = source.trim();
      const translated = excluded(node.parentElement) ? source : dictionary[trimmed];
      if (translated && translated !== trimmed) {
        const leading = source.match(/^\s*/)?.[0] ?? "";
        const trailing = source.match(/\s*$/)?.[0] ?? "";
        const output = `${leading}${translated}${trailing}`;
        appliedText.current.set(node, output);
        node.nodeValue = output;
      } else {
        appliedText.current.delete(node);
        if (current !== source) node.nodeValue = source;
      }
    };

    const translateAttributes = (element: Element) => {
      if (excluded(element)) return;
      const applied = appliedAttributes.current.get(element) ?? new Map<string, string>();
      const originals = originalAttributes.current.get(element) ?? new Map<string, string>();
      for (const name of ["placeholder", "title", "aria-label"]) {
        const current = element.getAttribute(name);
        if (current === null) continue;
        if (applied.get(name) === current) continue;
        const source = applied.has(name) ? current : (originals.get(name) ?? current);
        originals.set(name, source);
        const translated = dictionary[source.trim()];
        if (translated) {
          element.setAttribute(name, translated);
          applied.set(name, translated);
        } else {
          applied.delete(name);
          if (current !== source) element.setAttribute(name, source);
        }
      }
      originalAttributes.current.set(element, originals);
      appliedAttributes.current.set(element, applied);
    };

    const scan = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateText(node as Text);
      if (root instanceof Element) translateAttributes(root);
      root.querySelectorAll?.("*").forEach(translateAttributes);
    };

    const restorePreviousTranslations = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const last = appliedText.current.get(text);
        const source = originalText.current.get(text);
        if (last && text.nodeValue === last && source !== undefined) text.nodeValue = source;
        appliedText.current.delete(text);
      }
      document.body.querySelectorAll("*").forEach((element) => {
        const applied = appliedAttributes.current.get(element);
        const originals = originalAttributes.current.get(element);
        if (!applied || !originals) return;
        for (const [name, last] of applied) {
          if (element.getAttribute(name) === last && originals.has(name)) element.setAttribute(name, originals.get(name)!);
        }
        applied.clear();
      });
    };

    restorePreviousTranslations();
    scan(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target instanceof Text) translateText(record.target);
        else record.addedNodes.forEach((node) => {
          if (node instanceof Text) translateText(node);
          else if (node instanceof Element) scan(node);
        });
        if (record.type === "attributes" && record.target instanceof Element) translateAttributes(record.target);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    try { window.localStorage.setItem("geovista.ui.theme", theme); } catch { /* preference remains active for this page */ }
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      root.dataset.theme = theme;
      root.dataset.colorScheme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.style.colorScheme = root.dataset.colorScheme;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem("geovista.ui.city", city); } catch { /* preference remains active for this page */ }
  }, [city]);

  const value = useMemo(() => ({ language, setLanguage, theme, setTheme, city, setCity }), [language, theme, city]);
  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) throw new Error("useUISettings must be used within UISettingsProvider");
  return context;
}
