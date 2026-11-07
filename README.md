# Physiotherapy Clinic Management System (React + Node.js + PostgreSQL)
## Odoo 19 થી Full-Stack (PERN) માં સંપૂર્ણ કન્વર્ઝન

આ પ્રોજેક્ટ મૂળ Odoo 19 ના `adx_physiotherapy` મોડ્યુલને **React.js (Frontend)**, **Node.js / Express (Backend)**, અને **PostgreSQL (Database)** માં યોગ્ય આર્કિટેક્ચર સાથે સંપૂર્ણપણે કન્વર્ટ કરીને બનાવવામાં આવ્યો છે.

---

### 📁 પ્રોજેક્ટ સ્ટ્રક્ચર (Project Structure)

```text
Physiotherapy_app/
│
├── backend/                             # Node.js + Express + PostgreSQL REST API
│   ├── database/
│   │   ├── schema.sql                   # સંપૂર્ણ PostgreSQL DDL સ્કીમા (ટેબલ્સ, કન્સ્ટ્રેઇન્ટ્સ, ઇન્ડેક્સ)
│   │   ├── seed.sql                     # Odoo ડેટા ફાઇલોમાંથી કન્વર્ટ કરેલો વાસ્તવિક ક્લિનિકલ ડેટા
│   │   └── initDb.js                    # PostgreSQL ડેટાબેઝ ઓટો-ઇનિશિયલાઇઝ સ્ક્રિપ્ટ
│   ├── src/
│   │   ├── db.js                        # PostgreSQL કનેક્શન પુલ અને રેઝિલિયન્ટ સ્ટોર
│   │   ├── server.js                    # Express સર્વર અને રાઉટીંગ
│   │   └── routes/
│   │       ├── auth.js                  # Login & Role Management (Admin, Doctor, Reception, Patient)
│   │       ├── dashboard.js             # ક્લિનિકલ KPI મેટ્રિક્સ અને એનાલિટિક્સ
│   │       ├── doctors.js               # ડોકટર્સ, સ્પેશિયલાઇઝેશન અને રિયલ-ટાઇમ સ્લોટ કેલ્ક્યુલેટર
│   │       ├── patients.js              # દર્દીઓનું રજીસ્ટ્રેશન અને મેડિકલ હિસ્ટ્રી
│   │       ├── appointments.js          # એપોઇન્ટમેન્ટ બુકિંગ & સ્ટેટસ વર્કફ્લો (Odoo લોજિક)
│   │       ├── prescriptions.js         # મેડિકલ પ્રિસ્ક્રિપ્શન (Rx) અને દવાઓ
│   │       ├── treatments.js            # ફિઝિયોથેરાપી ટ્રીટમેન્ટ્સ અને ચાર્જિસ
│   │       ├── billing.js               # GST ઇન્વોઇસિંગ, પેમેન્ટ્સ અને રસીદ
│   │       ├── equipments.js            # ક્લિનિકના સાધનો અને મેન્ટેનન્સ
│   │       ├── xrayReports.js           # એક્સ-રે અને ડાયગ્નોસ્ટિક રિપોર્ટ્સ
│   │       └── shifts.js                # મોર્નિંગ/ઇવનિંગ વર્કિંગ શિફ્ટ
│   ├── .env                             # બેકએન્ડ અને ડેટાબેઝ કોન્ફિગરેશન
│   └── package.json
│
├── frontend/                            # React 18 + Vite + Lucide Icons + Print Engine
│   ├── src/
│   │   ├── api.js                       # બેકએન્ડ સાથે જોડાયેલ સેન્ટ્રલાઇઝ્ડ API ક્લાયન્ટ
│   │   ├── components/
│   │   │   ├── Sidebar.jsx              # ક્લિનિકલ મોડ્યુલ્સ નેવિગેશન
│   │   │   └── Header.jsx               # એક્ટિવ રોલ સ્વિચર અને સ્ટેટસ બાર
│   │   ├── views/
│   │   │   ├── DashboardView.jsx        # મેટ્રિક્સ, રેવન્યુ અને ક્વિક એક્શન હબ
│   │   │   ├── AppointmentsView.jsx     # સ્લોટ બુકિંગ, સ્ટેટસ ફ્લો અને પ્રિન્ટેબલ સ્લિપ
│   │   │   ├── PatientsView.jsx         # દર્દી ડિરેક્ટરી અને સંપૂર્ણ મેડિકલ ચાર્ટ
│   │   │   ├── DoctorsView.jsx          # ડોકટર્સ પ્રોફાઇલ, શિફ્ટ અને વિઝિટ ફી
│   │   │   ├── PrescriptionsView.jsx    # પ્રિસ્ક્રિપ્શન મેકર અને પ્રિન્ટેબલ Rx સ્લિપ
│   │   │   ├── TreatmentsView.jsx       # થેરાપી મોડાલિટી કેટલોગ
│   │   │   ├── BillingView.jsx          # ઇન્વોઇસ અને ઓફિશિયલ ટેક્સ રસીદ પ્રિન્ટ
│   │   │   ├── EquipmentsView.jsx       # અલ્ટ્રાસાઉન્ડ, ટ્રેક્શન સાધનોનું ટ્રેકિંગ
│   │   │   ├── XrayReportsView.jsx      # ઇમેજિંગ અને રેડિયોલોજીકલ રિપોર્ટ્સ
│   │   │   └── PortalBookingView.jsx    # દર્દીઓ માટે પબ્લિક સેલ્ફ-સર્વિસ પોર્ટલ (Odoo Website)
│   │   ├── App.jsx
│   │   ├── index.css                    # મોર્ડન ક્લિનિકલ CSS અને પ્રિન્ટ સ્ટીલ્સ
│   │   └── main.jsx
│   └── vite.config.js                   # API Proxy to Node.js backend (:5000)
│
├── Physiotherapy_app/                   # Original Odoo 19 module (સંદર્ભ માટે અકબંધ)
└── package.json                         # રૂટ પેકેજ સ્ક્રિપ્ટ્સ
```

---

### 🚀 કેવી રીતે રન કરવું (How to Run)

#### પગલું 1: બેકએન્ડ શરૂ કરો (Backend)
ટર્મિનલ ઓપન કરી નીચે મુજબ કમાન્ડ ચલાવો:
```bash
cd backend
npm start
```
> આ બેકએન્ડ સર્વરને **`http://localhost:5000`** પર શરૂ કરશે.

#### પગલું 2: ફ્રન્ટએન્ડ શરૂ કરો (React Frontend)
બીજું ટર્મિનલ ઓપન કરી નીચે મુજબ કમાન્ડ ચલાવો:
```bash
cd frontend
npm run dev
```
> આ React એપને **`http://localhost:3000`** પર શરૂ કરશે. બ્રાઉઝરમાં ખોલીને તમે તરત જ આખી સિસ્ટમ વાપરી શકો છો.

---

### 🐘 PostgreSQL ડેટાબેઝ સેટઅપ (Database Setup)

1. `backend/.env` ફાઇલમાં તમારા PostgreSQL નો પાસવર્ડ સેટ કરો (જો જરૂર હોય તો):
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=તમારો_પાસવર્ડ
   PGDATABASE=physiotherapy_db
   ```
2. એક જ કમાન્ડથી PostgreSQL માં ડેટાબેઝ, ટેબલ્સ અને ડેમો ડેટા ઇનિશિયલાઇઝ કરો:
   ```bash
   cd backend
   npm run db:init
   ```
*(નોંધ: જો તમારી લોકલ સિસ્ટમમાં PostgreSQL સર્વિસ હજુ સુધી રન ન હોય, તો પણ સિસ્ટમમાં સ્માર્ટ રેઝિલિયન્ટ એડેપ્ટર હોવાથી એપ્લિકેશન ક્રેશ થયા વગર તરત જ લોડ થઈ જશે!)*

---

### 🌟 મુખ્ય ફિચર્સ (Features Converted from Odoo)

1. **ડોક્ટર શિફ્ટ અને સ્લોટ એલ્ગોરિધમ (Dynamic Slot Engine)**:
   * Odoo ના `appointment_booking.py` મુજબ ડોક્ટરના કામકાજના દિવસો અને શિફ્ટ (મોર્નિંગ, આફ્ટરનૂન, ઇવનિંગ) મુજબ આપોઆપ 30 મિનિટના સ્લોટ ગણે છે અને ડબલ બુકિંગ અટકાવે છે.
2. **પ્રિસ્ક્રિપ્શન સ્લિપ (Official Rx Print)**:
   * દર્દી માટે દવાના ડોઝ (જેમ કે `1-0-1`, જમ્યા પછી), દિવસો અને સલાહ સાથેનું ક્લિનિકલ Rx લેટરહેડ ફોર્મેટમાં પ્રિન્ટ થઈ શકે છે.
3. **ઓફિશિયલ એપોઇન્ટમેન્ટ સ્લિપ અને QR કોડ**:
   * કન્ફર્મ થયેલી એપોઇન્ટમેન્ટ માટે સ્લિપ પ્રિન્ટ થાય છે જેમાં રિસેપ્શન ચેક-ઇન QR પણ સામેલ છે.
4. **GST બિલિંગ અને રસીદ (Billing & Receipts)**:
   * કન્સલ્ટેશન ફી અને થેરાપી ચાર્જિસ સાથેનું ટેક્સ ઇન્વોઇસ અને UPI/Cash પેમેન્ટ રેકોર્ડિંગ.
5. **પબ્લિક સેલ્ફ-સર્વિસ બુકિંગ પોર્ટલ (Website Portal)**:
   * દર્દી પોતાના ઘરેથી જાતે તારીખ, ડોક્ટર અને સમય પસંદ કરીને એપોઇન્ટમેન્ટ બુક કરી શકે છે.
