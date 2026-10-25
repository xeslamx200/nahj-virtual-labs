# دليل النشر على Vercel

## لماذا Vercel
- التطبيق خادم Express واحد: يقدّم الواجهة (`dist/`) وواجهة `/api`، ويستدعي Gemini من الخادم فقط. لا يعتمد على ملفات محلية ولا على مسارات Windows، والواجهة تتصل بـ `/api/...` بمسار نسبي (لا يوجد `localhost` في الكود المنشور).
- على Vercel تُخدَّم الواجهة من الـ CDN، ويعمل `api/index.js` كدالة (Function) تغلّف نفس تطبيق Express (`server/app.js`) دون تغيير في منطقه. لا تنام الدالة كما تنام الخدمات المجانية على Render، وهذا مهم لعرض مباشر أمام الحضور.
- **بديل:** Render (Web Service) يشغّل `npm ci && npm run build` ثم `npm start` دون أي تعديل، لكن الخطة المجانية تنام بعد فترة خمول وأول طلب قد يستغرق دقيقة. لم أجرّبه ولم أضف له ملف إعداد.

## ما اختُبر وما لم يُختبر
- **اختُبر محليًّا:** بناء الإنتاج، وتشغيل `api/index.js` كدالة (دون ملف `.env`)، وكل حالات الإعداد (بلا مفتاح / مفتاح بلا فهرس / مفتاح وفهرس)، واختبارات الوحدة، وحزمة e2e على Edge، وفحص Console وNetwork.
- **لم يُختبر:** النشر الفعلي على Vercel نفسه (يتطلب تسجيل دخولك). لذلك أول نشر هو أول اختبار حقيقي لـ `vercel.json` وإعادة توجيه `/api/*`؛ نفّذ قائمة التحقق أدناه قبل الاجتماع.

## المتغيّرات (الأسماء فقط)
| المتغيّر | مطلوب؟ | ملاحظة |
|---|---|---|
| `GEMINI_API_KEY` | نعم للذكاء الاصطناعي الحي | سرّ. أضِفه من لوحة Vercel بنوع **Sensitive**. بدونه يعمل المعلّم غير المتصل فقط |
| `GEMINI_MODEL` | اختياري | الافتراضي في الكود `gemini-flash-lite-latest` (سريع) |
| `GEMINI_FALLBACK_MODELS` | اختياري | الافتراضي `gemini-flash-latest` |
| `GEMINI_TIMEOUT_MS` | اختياري | مهلة كل نموذج، الافتراضي 15000 |
| `ASSISTANT_RATE_LIMIT` | اختياري | طلبات/دقيقة لكل IP، الافتراضي 20 |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | لا حاجة | Claude غير مستخدم |
| `TEXTBOOK_INDEX_PATH` | اختياري | مسار الفهرس إن لم يكن في `server/textbook/` |

لا تضف `PORT`. وتذكّر أن متغيّرًا في بيئة جهازك (مثل `ANTHROPIC_API_KEY`) لا يصل إلى Vercel؛ ما تضبطه في لوحة Vercel فقط هو ما يعمل هناك.

## الطريقة أ: من GitHub (موصى بها)
1. في PowerShell داخل مجلد المشروع:
   ```powershell
   git init
   git add -A
   git status        # تأكد أنه لا يظهر .env ولا server/textbook/index.json ولا dist ولا ملفات PDF
   git commit -m "Virtual Science Labs"
   ```
2. على github.com أنشئ مستودعًا **خاصًّا (Private)**، ثم:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/<حسابك>/<المستودع>.git
   git push -u origin main
   ```
   المستودع الخاص مهم: المشروع يتضمن ملخصات منهجية مكتوبة يدويًّا من الكتب (`src/curriculum/`) وأرقام من أمثلتها.
3. في vercel.com: **Add New → Project → Import** المستودع. الإعدادات تُقرأ من `vercel.json` (Vite، الأمر `npm run build`، المجلد `dist`).
4. قبل الضغط على Deploy افتح **Environment Variables** وأضف `GEMINI_API_KEY` (Sensitive) و`GEMINI_MODEL=gemini-flash-lite-latest` للبيئة Production.
5. Deploy. إن أضفت المتغيّرات بعد النشر فأعد النشر (Redeploy) كي تُقرأ.
6. **Settings → Deployment Protection:** إن طلب الرابط تسجيل دخول Vercel عند فتحه في نافذة خاصة، فعطّل Vercel Authentication للبيئة Production حتى يفتحه الحضور.

## الطريقة ب: من الجهاز مباشرة بلا GitHub
```powershell
npx vercel login
npx vercel --prod
```
يرفع هذا المجلد كما هو مع احترام `.vercelignore` (لا يرفع `.env` ولا الفهرس).

## قائمة التحقق بعد النشر (استبدل النطاق برابطك)
1. `https://<النطاق>/api/health` ← `{"ok":true}`
2. `https://<النطاق>/api/assistant/status` ← `available: true, provider: "gemini"`
3. افتح `https://<النطاق>/#/lab/electricity` ثم أعد تحميل الصفحة (F5): يجب أن تبقى في نفس المعمل.
4. افتح المساعد واسأل «ما هو الأمبير؟»: يجب أن تظهر شارة «ذكاء اصطناعي» وزمن نحو 1–3 ثوانٍ.
5. في Vercel → Logs ابحث عن `[assistant] ok` (يُسجَّل المزوّد والنموذج والزمن فقط، ولا أسئلة ولا مفاتيح).
6. إن فشل `/api/*` بـ 404، فمشكلة إعادة التوجيه في `vercel.json`: أرسل لي ناتج Logs.

## الفهرس الدراسي (استرجاع نصوص الكتب)
- **افتراضيًّا لا يُنشر** (`.vercelignore` و`.gitignore`). التطبيق يعمل، ويعرض للطالب تنبيهًا بأن استرجاع الكتاب غير مفعّل، ولا يضع أي استشهاد مختلَق. (اختُبر محليًّا.)
- نصوص الكتب ملكية وزارة التربية والتعليم والتعليم العالي: **لا تفعّله على استضافة عامة إلا بعد التأكد من الإذن.** وهذا قرارك.
- إن حصلت على الإذن: انشر عبر **الطريقة ب فقط** (لا تدفعه إلى GitHub): احذف السطر `server/textbook/index.json` من `.vercelignore`، وأضف في `vercel.json` تحت `functions → api/index.js` السطر `"includeFiles": "server/textbook/index.json"`، ثم `npx vercel --prod`. تحقق أن `/api/assistant/status` يعرض `textbook.available: true`. (هذا المسار لم يُجرَّب على Vercel.)

## قبل الاجتماع
- حصة Gemini المجانية محدودة بعدد الطلبات في الدقيقة وفي اليوم: جرّب قبل الاجتماع بوقت كافٍ ولا تشغّل اختبارات آلية كثيرة قبله. عند تجاوزها تُعرض رسالة واضحة ويجيب المعلّم غير المتصل بعلامة «مُعدّ مسبقًا».
- خطة Hobby في Vercel للاستخدام غير التجاري. إن كان العرض لجهة تجارية فراجع شروط الخدمة أو استخدم خطة Pro.
