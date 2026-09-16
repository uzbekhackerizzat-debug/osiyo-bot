# 🛡 ASL BELGISI Qo'llab-quvvatlash Boti (@aslbelgisiuz_bot kloni)

O'zbekiston Respublikasining raqamli markirovkalash milliy axborot tizimi — **"ASL BELGISI"** rasmiy qo'llab-quvvatlash boti ([@aslbelgisiuz_bot](https://t.me/aslbelgisiuz_bot)) ning to'liq funksional dasturiy analogi.

---

## 🌟 Asosiy imkoniyatlar

1. **Ikki tilli interfeys (Bilingual)**:
   - 🇺🇿 O'zbekcha (Lotin)
   - 🇷🇺 Русский
   - Foydalanuvchi istalgan vaqtda tilni o'zgartira oladi (`🌐 Tilni o'zgartirish`).

2. **Texnik yordam so'rovi (Murojaat yaratish / Ticketing system)**:
   - Bosqichma-bosqich (FSM) qulay wizard:
     - **1-qadam:** STIR (9 xonali INN) yoki JShShIR (14 xonali PINFL) kiritish (format tekshiruvi bilan);
     - **2-qadam:** Tovar guruhini tanlash (Dori vositalari, Tamaki, Alkogol, Pivo, Suv va ichimliklar, Maishiy texnika va h.k.);
     - **3-qadam:** Bog'lanish uchun telefon raqami (tugma orqali yuborish yoki kiritish);
     - **4-qadam:** Muammo yoki xatolik tavsifi (matn, rasm/skrinshot yoki hujjat ilova qilish imkoni);
     - **5-qadam:** Tasdiqlash va noyob raqamli murojaat yaratish (masalan: `#AB-1001`).

3. **Admin va Operator boshqaruv tizimi**:
   - Yangi murojaatlar haqida admin(lar)ga va operatorlar guruhiga darhol barcha ma'lumotlar va biriktirilgan fayllar bilan xabar boradi.
   - Operator bevosita Telegram bot orqali:
     - `✍️ Javob berish` tugmasi yoki `/reply <ID> <javob>` buyrug'i orqali foydalanuvchiga rasmiy javob yubora oladi;
     - Foydalanuvchi botda: *"#AB-1001 raqamli murojaatingizga rasmiy javob keldi: ..."* ko'rinishida bildirishnoma oladi.
     - `⏳ Jarayonga olish` va `✅ Yopish` holatlarini o'zgartirish.
   - `/admin` buyrug'i orqali to'liq statistika (foydalanuvchilar soni, murojaatlar soni va holatlari).

4. **DataMatrix va Shtrix-kod tekshiruvi**:
   - Mahsulot qadog'idagi DataMatrix kodini yoki GTIN raqamini kiritib, mahsulotning milliy tizimda ro'yxatdan o'tganligini, ishlab chiqaruvchisini va haqiqiyligini tekshirish.
   - Shubhali yoki qalbaki tovarlar bo'yicha ogohlantirish.

5. **Ma'lumotlar bazasi va FAQ**:
   - O'zbekistonda majburiy markirovka muddatlari va tovar guruhlari bo'yicha to'liq qo'llanma.
   - Ko'p beriladigan savollarga (ERI kalit, ro'yxatdan o'tish, kod buyurtma qilish, ilovalar) javoblar.
   - Rasmiy aloqa ma'lumotlari (+998 71 203-88-72, support@crpt-turon.uz, help.crpt-turon.uz).

---

## 🚀 O'rnatish va Ishga tushirish

### 1. Telegramdan Bot Token olish:
1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va bot nomi hamda username'ini belgilang.
3. BotFather sizga bergan `HTTP API token` nusxasini oling.

### 2. O'zingizning Telegram ID raqamingizni bilish:
1. Telegramda [@userinfobot](https://t.me/userinfobot) ga kiring va `/start` bosing.
2. U sizga `Id: 123456789` raqamingizni beradi.

### 3. `.env` faylini sozlash:
Loyiha papkasidagi `.env` faylini oching va quyidagi ma'lumotlarni kiriting:

```env
BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_IDS=123456789
```

*(Agar bir nechta admin bo'lsa, ID larni vergul bilan ajrating: `ADMIN_IDS=123456789,987654321`)*

### 4. Botni ishga tushirish:

Oddiy ishga tushirish:
```bash
npm start
```

Dasturchi rejimida (kod o'zgarganda avtomatik qayta ishga tushish):
```bash
npm run dev
```

Testlarni ishga tushirish:
```bash
npm test
```

---

## 📂 Loyiha tuzilishi

```
tg bot iskandaraka/
├── data/                      # Ma'lumotlar bazasi (JSON fayllar)
│   ├── users.json             # Ro'yxatdan o'tgan foydalanuvchilar
│   ├── tickets.json           # Murojaatlar va ularning javoblari
│   └── products.json          # Markirovka tovarlari katalogi
├── src/
│   ├── bot.js                 # Asosiy ishga tushirish fayli
│   ├── config.js              # Muhit sozlamalari (.env)
│   ├── database/
│   │   └── db.js              # Ma'lumotlar bazasi bilan ishlash qatlami
│   ├── handlers/
│   │   ├── adminHandler.js    # Admin buyruqlari (/admin, /reply)
│   │   ├── faqHandler.js      # FAQ bo'limi boshqaruvi
│   │   └── ticketsHandler.js  # "Mening murojaatlarim" va tafsilotlar
│   ├── keyboards/
│   │   └── menus.js           # Menyu va tugmalar (inline & reply)
│   ├── locales/
│   │   ├── index.js           # Tarjimon moduli
│   │   ├── uz.js              # O'zbekcha matnlar
│   │   └── ru.js              # Ruscha matnlar
│   └── scenes/
│       ├── ticketWizard.js    # Murojaat yaratish bosqichlari (FSM)
│       ├── checkCodeScene.js  # Kod tekshirish sahnasi
│       └── adminReplyScene.js # Operator javob yozish sahnasi
├── tests/
│   └── test.js                # Avtomatlashtirilgan testlar
├── .env                       # Bot sozlamalari va token
├── .env.example               # Namuna sozlamalar
├── package.json               # Paketlar va buyruqlar
└── README.md                  # Qo'llanma
```

---

## 👮‍♂️ Admin buyruqlari

* `/admin` — Foydalanuvchilar va murojaatlar statistikasi paneli;
* `/reply <TICKET_ID> <JAVOB>` — Murojaatga tezkor javob yuborish (masalan: `/reply AB-1001 Xatolik tuzatildi`);
* Shuningdek, yangi murojaat kelganda xabar ostidagi **"✍️ Javob berish"** tugmasi orqali qulay javob yoza olasiz.
