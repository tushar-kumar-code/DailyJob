# 🚀 DailyJob / CGNeeti (कामसाथी) - Run & Setup Guide

यह गाइड **Frontend (Node.js)** और **Backend (FastAPI / Python)** दोनों को एक साथ या अलग-अलग चलाने के सभी निर्देश प्रदान करती है।

---

## ⚡ त्वरित शुरुआत (Quick Start - One-Click Launcher)

टर्मिनल या कमांड प्रॉम्प्ट में प्रोजेक्ट के रूट फोल्डर से सिर्फ यह चलाएं:

```powershell
.\RUN.bat
```

*(या केवल `RUN` लिखकर `Enter` दबाएं)*

### `RUN.bat` क्या करेगा?

1. **Interactive Menu** दिखाएगा:
   - **`1` (Enter)** $\rightarrow$ **Frontend + Backend दोनों शुरू करेगा** (Recommended)
   - **`2`** $\rightarrow$ केवल **Frontend** (`http://localhost:8000`)
   - **`3`** $\rightarrow$ केवल **Backend** (`http://localhost:8001`)
   - **`4`** $\rightarrow$ **Backend Pytest Tests** (सभी 26 टेस्ट)
2. Backend (FastAPI) को एक समर्पित विंडो में शुरू करेगा।
3. आपके डिफ़ॉल्ट ब्राउज़र में Frontend UI (`http://localhost:8000`) अपने आप खोल देगा!

---

## 🧭 डायरेक्ट कमांड विकल्प (Direct CLI Flags)

यदि आप मेनू नहीं देखना चाहते हैं और सीधे चलाना चाहते हैं:

| कमांड                           | विवरण                                                                                              |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `.\RUN.bat both` (या `all`)    | **Frontend + Backend दोनों** को एक साथ स्टार्ट करता है।                 |
| `.\RUN.bat frontend` (या `fe`) | केवल Node.js**Frontend** चलाता है और ब्राउज़र खोलता है।              |
| `.\RUN.bat backend` (या `be`)  | केवल FastAPI**Backend** चलाता है और Swagger Docs खोलता है।                   |
| `.\RUN.bat test`                   | बैकएंड के सभी**26 यूनिट व इंटीग्रेशन टेस्ट** रन करता है। |
| `.\RUN.bat help`                   | सभी उपलब्ध कमांड्स की सहायता सूची दिखाता है।                       |

---

## 🌐 एकीकृत सेवाएं और पोर्ट्स (Integrated Services & Endpoints)

प्रोजेक्ट में **Reverse Proxy Gateway** सक्षम है, जिससे आप **एक ही पोर्ट (`8000`)** पर फ्रंटएंड और बैकएंड दोनों का आनंद ले सकते हैं:

| सर्विस                       | URL (Unified Gateway)                                                               | Direct Backend URL                                                      | विवरण                                                    |
| :--------------------------------- | :---------------------------------------------------------------------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------ |
| **Frontend UI (Web App)**    | [http://localhost:8000](http://localhost:8000)                                       | [http://localhost:8001/app](http://localhost:8001/app)                   | संपूर्ण यूजर इंटरफ़ेस (UI)                 |
| **Backend REST API**         | [http://localhost:8000/api/*](http://localhost:8000/api)                             | [http://localhost:8001/api/*](http://localhost:8001)                     | सभी FastAPI एंडपॉइंट्स (ऑटो-प्रॉक्सी) |
| **Interactive Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs)                             | [http://localhost:8001/docs](http://localhost:8001/docs)                 | इंटरएक्टिव API टेस्टिंग और डॉक्स     |
| **ReDoc API Documentation**  | [http://localhost:8000/redoc](http://localhost:8000/redoc)                           | [http://localhost:8001/redoc](http://localhost:8001/redoc)               | वैकल्पिक विस्तृत API डॉक्स                |
| **OpenAPI JSON Schema**      | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)             | [http://localhost:8001/openapi.json](http://localhost:8001/openapi.json) | OpenAPI v3.1 स्कीमा                                     |
| **Integrated Health Status** | [http://localhost:8000/api/backend-status](http://localhost:8000/api/backend-status) | [http://localhost:8001/health](http://localhost:8001/health)             | लाइव डायग्नोस्टिक व लेटेंसी चेकर  |

> 💡 **इन-ऐप API हब (In-App API Portal):**
> वेब ऐप्लिकेशन के शीर्ष नेविगेशन बार में **`⚡ API Hub`** बटन या साइडबार मेनू में **`Backend API Hub`** पर क्लिक करके सीधे ऐप के अंदर से ही लाइव बैकएंड स्थिति, पिंग टेस्ट और सभी डॉक्स तक 1-क्लिक एक्सेस प्राप्त कर सकते हैं।

---

## 📋 मैन्युअल रूप से चलाना (Manual Run Instructions)

यदि आप `RUN.bat` के बिना अलग-अलग टर्मिनल्स में मैनुअली चलाना चाहते हैं:

### 1. Frontend चलाना (Node.js Server)

```powershell
# प्रोजेक्ट रूट डायरेक्टरी में:
node server.js
```

*या npm द्वारा:*

```powershell
npm run serve
```

👉 ब्राउज़र में खोलें: [http://localhost:8000](http://localhost:8000)

---

### 2. Backend चलाना (FastAPI + Uvicorn)

```powershell
# backend फोल्डर में जाकर:
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

*या रूट फोल्डर से npm द्वारा:*

```powershell
npm run serve:backend
```

👉 ब्राउज़र में API Docs खोलें: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### 3. Backend टेस्ट्स चलाना (Pytest)

```powershell
cd backend
python -m pytest -v
```

*या रूट फोल्डर से:*

```powershell
npm run test:backend
```

---

## ⚙️ सिस्टम आवश्यकताएं (Prerequisites)

1. **Node.js (v16+)**:
   - चेक करें: `node -v`
   - यदि इंस्टॉल नहीं है: [https://nodejs.org](https://nodejs.org) से LTS वर्जन डाउनलोड करें।
2. **Python (3.10+)**:
   - चेक करें: `python --version`
   - डिपेंडेंसी इंस्टॉल करें:
     ```powershell
     cd backend
     pip install -r requirements.txt
     ```
3. **Firebase कॉन्फ़िगरेशन (वैकल्पिक / Mock Engine)**:
   - यदि आपके पास `serviceAccountKey.json` नहीं है, तो बैकएंड स्वतः **In-Memory Mock Firestore Engine** पर चलता है।
   - इससे विकास और टेस्टिंग बिना किसी क्रेडेंशियल के 100% कार्य करती है।

---

## 🛑 सर्वर कैसे बंद करें (Stopping the Servers)

1. **Frontend**: जिस टर्मिनल में `server.js` चल रहा है, उसमें **`Ctrl + C`** दबाएं।
2. **Backend**: अलग खुली हुई `DailyJob Backend (FastAPI - Port 8001)` विंडो को बंद (Close `X`) करें या उसमें **`Ctrl + C`** दबाएं।

---

## 🛠️ सामान्य समस्याएं और समाधान (Troubleshooting)

### 1. `This site can't be reached (ERR_CONNECTION_REFUSED)`

**कारण:**

- ब्राउज़र ने सर्वर के पूरी तरह शुरू होने (1-2 सेकंड) से पहले ही पेज लोड करने का प्रयास किया, अथवा
- Windows पर `localhost` को केवल IPv6 (`::1`) पर ढूंढने का प्रयास किया जा रहा था।
  **समाधान:**

1. टर्मिनल में जांचें कि `RUN.bat` या `node server.js` चल रहा है और `Integrated Server Active` लिखा आया है।
2. ब्राउज़र में **Reload** बटन दबाएं या सीधे **[http://																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																											127.0.0.1:8000](http://127.0.0.1:8000)** खोलें।

---

### 2. `EADDRINUSE: address already in use :::8000` या `:::8001`

**कारण:** पोर्ट 8000 या 8001 पर पहले से कोई पुराना सर्वर बैकग्राउंड में चल रहा है।
**समाधान:**

```powershell
# पोर्ट 8000 का PID देखें:
netstat -ano | findstr :8000
# प्रोसेस को बंद करें:
taskkill /PID <PID_NUMBER> /F

# पोर्ट 8001 का PID देखें:
netstat -ano | findstr :8001
# प्रोसेस को बंद करें:
taskkill /PID <PID_NUMBER> /F
```

### 2. Python या Uvicorn Not Recognized

**कारण:** Python आपके सिस्टम `PATH` में नहीं है या डिपेंडेंसी इंस्टॉल नहीं हैं।
**समाधान:**

```powershell
cd backend
pip install -r requirements.txt
```

### 3. Node.js Not Recognized

**कारण:** Node.js इंस्टॉल नहीं है या PATH में नहीं है।
**समाधान:** [https://nodejs.org](https://nodejs.org) से Node.js इंस्टॉल करें और टर्मिनल दोबारा खोलें।

---

## 📂 मुख्य फाइल्स (Key Files)

- [RUN.bat](file:///c:/Users/user/tushar/DailyJob/RUN.bat) - Unified One-Click Launcher (Frontend + Backend)
- [RUN.md](file:///c:/Users/user/tushar/DailyJob/RUN.md) - यह संपूर्ण गाइड
- [server.js](file:///c:/Users/user/tushar/DailyJob/server.js) - Node.js Frontend सर्वर
- [backend/app/main.py](file:///c:/Users/user/tushar/DailyJob/backend/app/main.py) - FastAPI Backend एंट्रीपॉइंट
- [backend/requirements.txt](file:///c:/Users/user/tushar/DailyJob/backend/requirements.txt) - Python पैकेज आवश्यकताएं
- [backend/README.md](file:///c:/Users/user/tushar/DailyJob/backend/README.md) - बैकएंड आर्किटेक्चर गाइड
- [package.json](file:///c:/Users/user/tushar/DailyJob/package.json) - NPM स्क्रिप्ट्स
