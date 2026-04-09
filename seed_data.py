#!/usr/bin/env python3
"""
Comprehensive data seeder for Manakher school platform.
Seeds: students (15+ per section), homework, materials, announcements.
"""

import urllib.request
import urllib.parse
import json
import random
import sys
import time

BASE = "http://127.0.0.1:8090"

# ── Auth ──────────────────────────────────────────────────────────────────────


def get_token():
    data = json.dumps(
        {"identity": "admin@manakher.com", "password": "Admin@12345"}
    ).encode()
    req = urllib.request.Request(
        f"{BASE}/api/collections/_superusers/auth-with-password",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)["token"]


def api(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE}{path}", data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        print(f"  ERROR {method} {path}: {e.code} {msg[:200]}", file=sys.stderr)
        return None


def get_all(collection, token, extra=""):
    r = api(
        "GET", f"/api/collections/{collection}/records?perPage=200{extra}", token=token
    )
    return r["items"] if r else []


# ── Data pools ────────────────────────────────────────────────────────────────

FIRST_NAMES_AR = [
    "نورة",
    "سارة",
    "ريم",
    "هند",
    "منال",
    "فاطمة",
    "لطيفة",
    "عائشة",
    "رنا",
    "دلال",
    "ميساء",
    "غادة",
    "حنان",
    "أمل",
    "شيماء",
    "مها",
    "وفاء",
    "أسماء",
    "سلمى",
    "رهف",
    "جواهر",
    "لجين",
    "ديمة",
    "رغد",
    "بسمة",
    "ملك",
    "روان",
    "شهد",
    "لمى",
    "جنى",
    "تالا",
    "يارا",
    "ناديا",
    "إيمان",
    "حلا",
    "صفاء",
    "مريم",
    "زينب",
    "خولة",
    "عبير",
    "وجد",
    "أريج",
    "سنا",
    "رنيم",
    "نجلاء",
    "هيفاء",
    "ثريا",
    "نادية",
    "ولاء",
]

LAST_NAMES_AR = [
    "الزهراني",
    "القحطاني",
    "العتيبي",
    "الدوسري",
    "الشهري",
    "الغامدي",
    "المالكي",
    "السلمي",
    "الحربي",
    "الجهني",
    "العنزي",
    "الرشيدي",
    "الزيد",
    "البلوي",
    "المطيري",
    "الحربي",
    "الأحمدي",
    "الصالحي",
    "الخالدي",
    "الرويلي",
    "السبيعي",
    "البقمي",
    "الثبيتي",
    "العمري",
    "المرواني",
    "الوادعي",
    "الشمري",
    "العجمي",
    "الحميدي",
    "الفيفي",
    "الزيداني",
    "الرحيلي",
    "الشلهوب",
    "القرني",
    "السيف",
    "الجريوي",
]

FIRST_NAMES_EN = [
    "Noura",
    "Sara",
    "Reem",
    "Hind",
    "Manal",
    "Fatima",
    "Latifa",
    "Aisha",
    "Rana",
    "Dalal",
    "Maysa",
    "Ghada",
    "Hanan",
    "Amal",
    "Shaimaa",
    "Maha",
    "Wafaa",
    "Asma",
    "Salma",
    "Rahaf",
    "Jawahir",
    "Lujain",
    "Dima",
    "Raghad",
    "Basma",
    "Malak",
    "Rawan",
    "Shahad",
    "Lama",
    "Jana",
    "Tala",
    "Yara",
    "Nadia",
    "Iman",
    "Hala",
    "Safaa",
    "Maryam",
    "Zainab",
    "Khawla",
    "Abeer",
    "Wajd",
    "Areej",
    "Sana",
    "Raneem",
    "Najlaa",
    "Haifa",
    "Thuraya",
    "Nadiya",
    "Walaa",
]

LAST_NAMES_EN = [
    "Al-Zahrani",
    "Al-Qahtani",
    "Al-Otaibi",
    "Al-Dosari",
    "Al-Shehri",
    "Al-Ghamdi",
    "Al-Maliki",
    "Al-Salmi",
    "Al-Harbi",
    "Al-Johani",
    "Al-Anazi",
    "Al-Rashidi",
    "Al-Zayd",
    "Al-Balawi",
    "Al-Mutairi",
    "Al-Ahmadi",
    "Al-Salihi",
    "Al-Khalidi",
    "Al-Ruwayili",
    "Al-Subaie",
    "Al-Baqami",
    "Al-Thubaiti",
    "Al-Omari",
    "Al-Marwani",
    "Al-Shamri",
    "Al-Ajmi",
    "Al-Humaidi",
    "Al-Fifi",
    "Al-Zaidani",
    "Al-Rahili",
    "Al-Shalhoub",
    "Al-Qarni",
]

# ── Homework data ─────────────────────────────────────────────────────────────

HOMEWORK_TEMPLATES = {
    "MATH": [
        (
            "حل تمارين الكسور",
            "حلّي التمارين من الصفحة 45 إلى 48 في الكتاب المدرسي.\n\n**التمارين المطلوبة:**\n- تمرين 1 حتى 10 (جمع الكسور)\n- تمرين 11 حتى 15 (طرح الكسور)\n- مسألة التحدي في نهاية الصفحة\n\n*ملاحظة:* أظهري خطوات الحل كاملة.",
        ),
        (
            "مسائل المساحة والمحيط",
            "احسبي مساحة ومحيط الأشكال الهندسية التالية:\n\n1. مستطيل طوله 12 سم وعرضه 7 سم\n2. مربع طول ضلعه 9 سم\n3. مثلث قاعدته 8 سم وارتفاعه 6 سم\n\nاستخدمي القوانين الصحيحة وأظهري الحل بشكل منظم.",
        ),
        (
            "تمارين الأعداد الصحيحة",
            "حلّي التمارين التالية على الأعداد الصحيحة:\n\n**الجزء الأول:** العمليات الحسابية\n- ( -5 ) + ( -3 ) = ؟\n- 8 - ( -4 ) = ؟\n- ( -6 ) × 7 = ؟\n\n**الجزء الثاني:** رتّبي الأعداد تصاعدياً:\n-3، 7، -1، 0، -8، 5",
        ),
    ],
    "SCI": [
        (
            "تقرير عن دورة الماء في الطبيعة",
            "اكتبي تقريراً علمياً عن دورة الماء في الطبيعة يتضمن:\n\n1. **مراحل الدورة:** التبخر، التكاثف، التساقط، الجريان\n2. **رسم توضيحي** مرسوم باليد أو مطبوع\n3. **أهمية دورة الماء** في الحياة\n4. **الخلاصة:** فقرة من 5 جمل\n\nالطول المطلوب: صفحتان على الأقل.",
        ),
        (
            "تجربة نمو النبات",
            "نفّذي التجربة التالية في المنزل:\n\n**المواد:** بذور (فاصوليا أو حمص)، تربة، إناء صغير، ماء\n\n**الخطوات:**\n1. ازرعي البذرة في التربة\n2. سقّيها يومياً\n3. سجّلي ملاحظاتك كل يومين\n\n**التقرير:** قدّمي صوراً أو رسومات توضح مراحل النمو مع وصف لكل مرحلة.",
        ),
        (
            "بحث عن المجموعة الشمسية",
            "أعدّي بحثاً مختصراً عن المجموعة الشمسية:\n\n- عدد الكواكب وأسماؤها\n- مميزات كوكب الأرض عن غيره\n- ما هو أكبر كوكب وأصغر كوكب؟\n- ما الفرق بين الكوكب والنجم؟\n\nأضيفي صوراً أو رسوماً توضيحية.",
        ),
    ],
    "ARB": [
        (
            "قراءة وفهم المقروء",
            'اقرئي النص التالي ثم أجيبي عن الأسئلة:\n\n*النص:* الشجرة التي تقف وحدها في الصحراء لا تُثمر، أما الشجرة التي تنمو في غابة كثيفة فتتشابك جذورها مع جذور غيرها وتُزهر وتُثمر. كذلك الإنسان لا يكتمل إلا بمن حوله.\n\n**الأسئلة:**\n1. ما الفكرة الرئيسية للنص؟\n2. ما معنى كلمة "تُثمر"؟\n3. كيف شبّه الكاتب الإنسان؟\n4. اكتبي جملة معبّرة عن أهمية التعاون.',
        ),
        (
            "تعبير كتابي حر",
            'اكتبي موضوع تعبير من 10 جمل أو أكثر عن:\n\n**"مدرستي بيتي الثاني"**\n\nتحدّثي عن:\n- ما الذي تحبينه في مدرستك\n- صديقاتك وذكرياتك\n- حلمك المستقبلي بعد التخرج\n\nراعي علامات الترقيم وحسن الخط.',
        ),
        (
            "قواعد اللغة العربية",
            "راجعي درس الفاعل والمفعول به ثم:\n\n**الجزء الأول:** حدّدي الفاعل والمفعول به في الجمل التالية:\n1. كتبت الطالبةُ الدرسَ\n2. شربت البنتُ الحليبَ\n3. فتحت المعلمةُ النافذةَ\n\n**الجزء الثاني:** ضعي فاعلاً مناسباً في كل جملة:\n- _________ المسجدَ\n- _________ الكتابَ",
        ),
    ],
    "ENG": [
        (
            "Reading Comprehension Exercise",
            'Read the following paragraph and answer the questions:\n\n*"Fatima woke up early every morning. She helped her mother in the kitchen, then walked to school with her friends. She loved reading books and always got high grades. Her dream was to become a doctor one day."*\n\n**Questions:**\n1. What did Fatima do every morning?\n2. How did she go to school?\n3. What was her dream?\n4. Write 3 adjectives that describe Fatima.',
        ),
        (
            "Vocabulary and Writing",
            "**Part A:** Write the meaning of these words:\n1. Responsible\n2. Curious\n3. Achievement\n4. Environment\n5. Cooperation\n\n**Part B:** Write a short paragraph (5-7 sentences) about your favorite hobby. Use at least 3 words from Part A.",
        ),
        (
            "Grammar: Present Perfect",
            "Complete the sentences using the Present Perfect tense:\n\n1. She _______ (study) for two hours.\n2. They _______ (finish) the project.\n3. I _______ (never / visit) London.\n4. We _______ (just / eat) lunch.\n\nThen write 3 original sentences using Present Perfect about your own life.",
        ),
    ],
    "ISL": [
        (
            "حفظ آيات من القرآن الكريم",
            'احفظي الآيات الكريمة من سورة البقرة (الآيات 1-5) وكوني مستعدة للتسميع.\n\n**الآيات:**\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالم ﴿١﴾ ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ ﴿٢﴾\n\n**المطلوب:**\n- حفظ الآيات غيباً\n- كتابة الآيات من الذاكرة\n- معرفة معنى كلمة "المتقين"',
        ),
        (
            "بحث عن أركان الإسلام",
            "أعدّي بطاقة تعريفية عن أركان الإسلام الخمسة:\n\n1. اسم الركن\n2. تعريفه بإيجاز\n3. دليل من القرآن أو السنة\n\nقدّمي البطاقة بشكل منظم وجميل.",
        ),
    ],
    "SOC": [
        (
            "بحث عن المملكة العربية السعودية",
            "أعدّي بحثاً موجزاً يتضمن:\n\n- **الموقع الجغرافي:** حدود المملكة وأهم المدن\n- **الموارد الطبيعية:** النفط والمعادن والزراعة\n- **رؤية 2030:** ما هي وما أهدافها\n- **فقرة شخصية:** كيف يمكنك أنت أن تساهمي في تحقيق رؤية 2030؟",
        ),
        (
            "خريطة المنطقة العربية",
            "ارسمي خريطة المنطقة العربية وحدّدي عليها:\n\n- الدول العربية الكبرى\n- العواصم\n- المسطحات المائية (البحار والخلجان)\n- رتّبي الدول حسب المساحة من الأكبر إلى الأصغر",
        ),
    ],
    "CS": [
        (
            "تصميم عرض PowerPoint",
            "صمّمي عرضاً تقديمياً عن موضوع تختارينه (لا يقل عن 8 شرائح) يتضمن:\n\n- شريحة العنوان مع اسمك\n- مقدمة الموضوع\n- 5 شرائح للمحتوى مع صور\n- خاتمة وخلاصة\n- شريحة المصادر\n\nاحرصي على جماليات العرض واختيار الألوان المناسبة.",
        ),
        (
            "تمارين Excel الأساسية",
            "افتحي ملف Excel وأنجزي المطلوب:\n\n1. أنشئي جدولاً بأسماء 5 طالبات ودرجاتهن في 3 مواد\n2. احسبي المتوسط لكل طالبة باستخدام دالة AVERAGE\n3. حدّدي أعلى درجة باستخدام دالة MAX\n4. نسّقي الجدول بألوان مناسبة\n\nاحفظي الملف باسمك وأرسليه.",
        ),
    ],
}

MATERIAL_TEMPLATES = {
    "MATH": [
        (
            "مقدمة في الكسور الاعتيادية",
            "<h2>الكسور الاعتيادية</h2><p>الكسر هو جزء من كل، ويُكتب على شكل <strong>بسط / مقام</strong>.</p><h3>أنواع الكسور</h3><ul><li><strong>كسر حقيقي:</strong> البسط أصغر من المقام (مثل 3/4)</li><li><strong>كسر غير حقيقي:</strong> البسط أكبر من المقام (مثل 7/3)</li><li><strong>العدد الكسري:</strong> عدد صحيح مع كسر (مثل 2½)</li></ul><h3>جمع الكسور ذات المقامات المتساوية</h3><p>نجمع البسطين ونُبقي المقام كما هو:</p><p><strong>مثال:</strong> 2/5 + 1/5 = 3/5</p>",
        ),
        (
            "قوانين المساحة والمحيط",
            "<h2>المساحة والمحيط</h2><h3>المستطيل</h3><ul><li><strong>المحيط</strong> = 2 × (الطول + العرض)</li><li><strong>المساحة</strong> = الطول × العرض</li></ul><h3>المربع</h3><ul><li><strong>المحيط</strong> = 4 × الضلع</li><li><strong>المساحة</strong> = الضلع × الضلع</li></ul><h3>المثلث</h3><ul><li><strong>المحيط</strong> = مجموع الأضلاع الثلاثة</li><li><strong>المساحة</strong> = (القاعدة × الارتفاع) ÷ 2</li></ul><p><em>تذكّري: وحدة المساحة مربّعة (سم²) ووحدة المحيط خطية (سم)</em></p>",
        ),
    ],
    "SCI": [
        (
            "دورة الماء في الطبيعة",
            "<h2>دورة الماء في الطبيعة</h2><p>الماء يتحرك باستمرار بين الأرض والغلاف الجوي في دورة لا تنتهي.</p><h3>مراحل الدورة</h3><ol><li><strong>التبخر:</strong> تسخن الشمس سطح البحار والأنهار فيتحول الماء إلى بخار ويرتفع.</li><li><strong>التكاثف:</strong> يبرد البخار في الطبقات العليا ويتحول إلى قطرات ماء مكوّناً السحاب.</li><li><strong>التساقط:</strong> تسقط قطرات الماء على شكل مطر أو ثلج أو برَد.</li><li><strong>الجريان:</strong> يجري الماء على سطح الأرض نحو البحار والأنهار أو يتسرب إلى باطن الأرض.</li></ol><p>هذه الدورة تضمن توفر الماء العذب على كوكب الأرض.</p>",
        ),
        (
            "الخلية - وحدة بناء الحياة",
            "<h2>الخلية</h2><p>الخلية هي أصغر وحدة حية قادرة على تنفيذ وظائف الحياة.</p><h3>أنواع الخلايا</h3><ul><li><strong>الخلية النباتية:</strong> تحتوي على جدار خلوي وبلاستيدات خضراء</li><li><strong>الخلية الحيوانية:</strong> لا تحتوي على جدار خلوي</li></ul><h3>مكوّنات الخلية الأساسية</h3><ol><li><strong>النواة:</strong> مركز التحكم، تحتوي على المادة الوراثية (DNA)</li><li><strong>السيتوبلازم:</strong> سائل يملأ الخلية وتسبح فيه العضيّات</li><li><strong>الغشاء الخلوي:</strong> يحيط بالخلية وينظم ما يدخل ويخرج</li></ol>",
        ),
    ],
    "ARB": [
        (
            "أسلوب الاستفهام",
            "<h2>أسلوب الاستفهام</h2><p>الاستفهام هو طلب العلم بشيء مجهول باستخدام أداة من أدوات الاستفهام.</p><h3>أدوات الاستفهام</h3><ul><li><strong>هل:</strong> للسؤال عن الفعل (هل ذهبتِ؟)</li><li><strong>ما / ماذا:</strong> للسؤال عن الأشياء (ما اسمكِ؟)</li><li><strong>من:</strong> للسؤال عن العاقل (من جاء؟)</li><li><strong>متى:</strong> للسؤال عن الزمان (متى الاختبار؟)</li><li><strong>أين:</strong> للسؤال عن المكان (أين الكتاب؟)</li><li><strong>كيف:</strong> للسؤال عن الحال (كيف حالكِ؟)</li><li><strong>لماذا:</strong> للسؤال عن السبب</li></ul>",
        ),
        (
            "علامات الترقيم",
            "<h2>علامات الترقيم في اللغة العربية</h2><p>علامات الترقيم أدوات كتابية تُوضّح المعنى وتُيسّر القراءة.</p><h3>أهم العلامات</h3><ul><li><strong>الفاصلة (،):</strong> توضع بين الجمل القصيرة المرتبطة</li><li><strong>النقطة (.):</strong> توضع في نهاية الجملة التامة</li><li><strong>علامة الاستفهام (؟):</strong> توضع بعد كل سؤال</li><li><strong>علامة التعجب (!):</strong> توضع بعد الجمل التعجبية والأمرية</li><li><strong>النقطتان (:):</strong> توضعان قبل التفصيل والأمثلة</li></ul>",
        ),
    ],
    "ENG": [
        (
            "Parts of Speech",
            "<h2>Parts of Speech</h2><p>In English, words are classified into 8 main parts of speech:</p><ol><li><strong>Noun:</strong> names a person, place, thing, or idea (girl, school, book)</li><li><strong>Pronoun:</strong> replaces a noun (she, they, it)</li><li><strong>Verb:</strong> shows action or state (run, is, think)</li><li><strong>Adjective:</strong> describes a noun (beautiful, tall, happy)</li><li><strong>Adverb:</strong> modifies a verb or adjective (quickly, very, always)</li><li><strong>Preposition:</strong> shows relationship (in, on, at, under)</li><li><strong>Conjunction:</strong> joins words or clauses (and, but, because)</li><li><strong>Interjection:</strong> expresses emotion (Wow! Oh! Yes!)</li></ol>",
        ),
        (
            "Tenses Overview",
            "<h2>English Verb Tenses</h2><h3>Present Tenses</h3><ul><li><strong>Simple Present:</strong> I study every day.</li><li><strong>Present Continuous:</strong> I am studying now.</li><li><strong>Present Perfect:</strong> I have studied this chapter.</li></ul><h3>Past Tenses</h3><ul><li><strong>Simple Past:</strong> I studied yesterday.</li><li><strong>Past Continuous:</strong> I was studying when she called.</li></ul><h3>Future Tenses</h3><ul><li><strong>Simple Future:</strong> I will study tomorrow.</li><li><strong>Going to:</strong> I am going to study tonight.</li></ul>",
        ),
    ],
    "ISL": [
        (
            "أركان الإسلام الخمسة",
            "<h2>أركان الإسلام الخمسة</h2><p>قال النبي ﷺ: <em>«بُنِيَ الإسلامُ على خمسٍ»</em></p><ol><li><strong>الشهادتان:</strong> شهادة أن لا إله إلا الله وأن محمداً رسول الله</li><li><strong>الصلاة:</strong> خمس صلوات في اليوم والليلة</li><li><strong>الزكاة:</strong> إخراج جزء من المال للمحتاجين</li><li><strong>الصوم:</strong> صوم شهر رمضان المبارك</li><li><strong>الحج:</strong> حج بيت الله لمن استطاع إليه سبيلاً</li></ol><p>هذه الأركان هي الأساس الذي يقوم عليه دين الإسلام.</p>",
        ),
    ],
    "SOC": [
        (
            "موقع المملكة العربية السعودية",
            "<h2>موقع المملكة العربية السعودية</h2><p>تقع المملكة العربية السعودية في الجزء الجنوبي الغربي من قارة آسيا، في منطقة تُعرف بشبه الجزيرة العربية.</p><h3>الحدود</h3><ul><li><strong>شمالاً:</strong> الأردن، العراق، الكويت</li><li><strong>جنوباً:</strong> اليمن، عُمان</li><li><strong>شرقاً:</strong> قطر، الإمارات، الخليج العربي</li><li><strong>غرباً:</strong> البحر الأحمر</li></ul><h3>المساحة والسكان</h3><p>تبلغ مساحة المملكة حوالي <strong>2.15 مليون كيلومتر مربع</strong>، مما يجعلها الثالثة عشرة عالمياً من حيث المساحة. يبلغ عدد السكان نحو <strong>35 مليون نسمة</strong>.</p>",
        ),
    ],
    "CS": [
        (
            "مقدمة في الحوسبة والمعلوماتية",
            "<h2>مقدمة في علوم الحاسوب</h2><p>الحاسوب جهاز إلكتروني يعالج البيانات وفق تعليمات مُبرمَجة.</p><h3>مكوّنات الحاسوب</h3><ul><li><strong>المعالج (CPU):</strong> عقل الحاسوب، ينفذ العمليات الحسابية والمنطقية</li><li><strong>الذاكرة العشوائية (RAM):</strong> تخزين مؤقت للبيانات أثناء التشغيل</li><li><strong>القرص الصلب (HDD/SSD):</strong> تخزين دائم للملفات والبرامج</li><li><strong>بطاقة الشاشة (GPU):</strong> معالجة الصور والفيديو</li></ul><h3>أنواع البرامج</h3><ol><li><strong>نظام التشغيل:</strong> مثل Windows وmacOS وLinux</li><li><strong>تطبيقات المكتب:</strong> Word, Excel, PowerPoint</li><li><strong>المتصفحات:</strong> Chrome, Firefox, Safari</li></ol>",
        ),
    ],
}

ANNOUNCEMENTS = [
    {
        "title_ar": "موعد الاختبارات النصفية",
        "title_en": "Midterm Exams Schedule",
        "body": "<h2>الاختبارات النصفية</h2><p>تُعلن إدارة المدرسة عن موعد الاختبارات النصفية للفصل الدراسي الثاني:</p><ul><li><strong>الأسبوع الأول:</strong> اللغة العربية والرياضيات</li><li><strong>الأسبوع الثاني:</strong> العلوم والاجتماعيات</li><li><strong>الأسبوع الثالث:</strong> اللغة الإنجليزية والتربية الإسلامية</li></ul><p>على الطالبات الالتزام بمواعيد الدخول وإحضار ما يلزم من أدوات.</p><p><em>نتمنى للجميع التوفيق والنجاح.</em></p>",
        "scope": "global",
    },
    {
        "title_ar": "رحلة ترفيهية تعليمية",
        "title_en": "Educational Field Trip",
        "body": "<h2>رحلة تعليمية ترفيهية</h2><p>يسعدنا الإعلان عن الرحلة التعليمية الترفيهية لهذا الفصل الدراسي.</p><h3>التفاصيل</h3><ul><li><strong>الوجهة:</strong> المتحف الوطني بالرياض</li><li><strong>التاريخ:</strong> الأسبوع القادم</li><li><strong>المواعيد:</strong> من 8 صباحاً حتى 2 ظهراً</li></ul><h3>المتطلبات</h3><ol><li>إحضار رسالة موافقة ولي الأمر</li><li>الالتزام بالزي المدرسي</li><li>إحضار غداء خفيف وزجاجة ماء</li></ol><p><strong>ملاحظة:</strong> التسجيل إلزامي ويُغلق خلال 3 أيام.</p>",
        "scope": "global",
    },
    {
        "title_ar": "حفل تكريم المتفوقات",
        "title_en": "Honor Students Ceremony",
        "body": "<h2>حفل تكريم المتفوقات</h2><p>تفخر مدرسة مناخر الأساسية المؤنثة بتكريم طالباتها المتفوقات في الفصل الدراسي الأول.</p><p>سيُقام الحفل في قاعة الاجتماعات الكبرى بحضور الإدارة والمعلمات وأولياء الأمور.</p><h3>التفاصيل</h3><ul><li><strong>الموعد:</strong> يوم الأربعاء القادم، الساعة 10 صباحاً</li><li><strong>المكان:</strong> قاعة الاجتماعات الكبرى</li></ul><p>نهنئ جميع المتفوقات ونتمنى لهن مزيداً من التألق والنجاح.</p>",
        "scope": "global",
    },
    {
        "title_ar": "تعليمات الاختبارات",
        "title_en": "Exam Instructions",
        "body": "<h2>تعليمات الاختبارات</h2><p>يرجى الاطلاع على التعليمات التالية والالتزام بها خلال فترة الاختبارات:</p><ol><li>الحضور قبل 15 دقيقة من موعد الاختبار</li><li>إحضار القلم والمسطرة وما يلزم</li><li>إغلاق الجوالات كلياً</li><li>عدم التحدث مع الزميلات خلال الاختبار</li><li>تسليم ورقة الإجابة عند انتهاء الوقت</li></ol><p><strong>التوفيق لجميع الطالبات.</strong></p>",
        "scope": "global",
    },
    {
        "title_ar": "إجازة اليوم الوطني",
        "title_en": "National Day Holiday",
        "body": "<h2>إجازة اليوم الوطني</h2><p>بمناسبة اليوم الوطني للمملكة العربية السعودية، تُعلن المدرسة عن إجازة رسمية.</p><p>نُشارك وطننا الغالي احتفالاته ونجدد العهد بالولاء والانتماء لهذا الوطن الكريم.</p><p><strong>عودة الدراسة:</strong> يوم الأحد بعد الإجازة في موعدها المعتاد.</p><p><em>كل عام والمملكة بخير وازدهار.</em></p>",
        "scope": "global",
    },
    {
        "title_ar": "اجتماع أولياء الأمور",
        "title_en": "Parent-Teacher Meeting",
        "body": "<h2>اجتماع أولياء الأمور</h2><p>تدعو المدرسة أولياء الأمور لحضور الاجتماع الدوري للاطلاع على مستوى تقدم الطالبات ومناقشة أي استفسارات.</p><h3>جدول الاجتماعات</h3><ul><li><strong>الصفوف 1-3:</strong> السبت الساعة 8-10 صباحاً</li><li><strong>الصفوف 4-6:</strong> السبت الساعة 10-12 ظهراً</li><li><strong>الصفوف 7-10:</strong> الأحد الساعة 8-11 صباحاً</li></ul><p>نأمل حضور ولي أمر كل طالبة في الموعد المخصص.</p>",
        "scope": "global",
    },
    {
        "title_ar": "مسابقة القراءة",
        "title_en": "Reading Competition",
        "body": "<h2>مسابقة القراءة المدرسية</h2><p>تُطلق المدرسة مسابقة القراءة السنوية بهدف تعزيز حب القراءة لدى الطالبات.</p><h3>تفاصيل المسابقة</h3><ul><li><strong>المشاركة:</strong> مفتوحة لجميع الصفوف</li><li><strong>الشرط:</strong> قراءة كتاب وتقديم ملخص عنه</li><li><strong>الجوائز:</strong> قسائم شرائية وشهادات تقدير</li></ul><h3>للتسجيل</h3><p>راجعي أمينة المكتبة أو معلمة اللغة العربية.</p><p><em>شجّعي نفسك واقرئي!</em></p>",
        "scope": "global",
    },
]

# ── Main seeding logic ────────────────────────────────────────────────────────


def seed_students(token, sections):
    """Add ~15 students per section (currently have 2 per section = 40 total, need 13+ more each)"""
    print("\n🎓 Seeding students...")

    # Track name combos to avoid duplicates
    used_names = set()
    created = 0

    for sec in sections:
        grade_num = sec["grade_order"]
        sec_id = sec["id"]
        sec_label = f"{sec['grade_ar']} {sec['section_ar']}"

        # We need 15 students per section (already have ~2, add 13 more)
        for i in range(13):
            # Pick unique name combo
            attempts = 0
            while attempts < 50:
                fn_idx = random.randint(0, len(FIRST_NAMES_AR) - 1)
                ln_idx = random.randint(0, len(LAST_NAMES_AR) - 1)
                name_ar = f"{FIRST_NAMES_AR[fn_idx]} {LAST_NAMES_AR[ln_idx]}"
                name_en = f"{FIRST_NAMES_EN[fn_idx]} {LAST_NAMES_EN[ln_idx % len(LAST_NAMES_EN)]}"
                key = name_ar
                if key not in used_names:
                    used_names.add(key)
                    break
                attempts += 1

            # Generate email from English name + grade + section index
            slug = name_en.lower().replace(" ", ".").replace("-", "")
            email = f"{slug}.g{grade_num}s{i}@students.manakher.edu"

            payload = {
                "email": email,
                "password": "Student@12345",
                "passwordConfirm": "Student@12345",
                "name_ar": name_ar,
                "name_en": name_en,
                "role": "student",
                "sections": [sec_id],
            }
            r = api("POST", "/api/collections/users/records", payload, token)
            if r and r.get("id"):
                created += 1
            elif r is None:
                # Might be duplicate email, skip
                pass

    print(f"  Created {created} new students")
    return created


def seed_homework(token, teachers, sections, subjects):
    """Seed homework assignments for each teacher across their sections"""
    print("\n📝 Seeding homework...")

    # Build subject code map
    subj_by_id = {s["id"]: s for s in subjects}
    created = 0

    due_dates = [
        "2026-04-15",
        "2026-04-20",
        "2026-04-22",
        "2026-04-28",
        "2026-05-05",
        "2026-05-10",
        "2026-05-15",
        "2026-05-20",
    ]

    for teacher in teachers:
        t_sections = teacher.get("sections", [])
        t_subjects = teacher.get("subjects", [])

        for subj_id in t_subjects:
            subj = subj_by_id.get(subj_id)
            if not subj:
                continue
            code = subj["code"]
            templates = HOMEWORK_TEMPLATES.get(code, [])
            if not templates:
                continue

            for sec_id in t_sections[:4]:  # up to 4 sections per teacher
                for tmpl in templates[:2]:  # 2 homework per section per subject
                    title, desc_text = tmpl
                    desc_html = f"<p>{desc_text}</p>".replace(
                        "\n\n", "</p><p>"
                    ).replace("\n", "<br>")
                    due = random.choice(due_dates)
                    sub_type = random.choice(["online", "onsite"])

                    payload = {
                        "title": title,
                        "description": f"<div>{desc_html}</div>",
                        "due_date": due,
                        "submission_type": sub_type,
                        "teacher": teacher["id"],
                        "section": sec_id,
                        "subject": subj_id,
                    }
                    r = api("POST", "/api/collections/homework/records", payload, token)
                    if r and r.get("id"):
                        created += 1

    print(f"  Created {created} homework assignments")
    return created


def seed_materials(token, teachers, sections, subjects):
    """Seed learning materials for each teacher"""
    print("\n📚 Seeding learning materials...")

    subj_by_id = {s["id"]: s for s in subjects}
    created = 0

    for teacher in teachers:
        t_sections = teacher.get("sections", [])
        t_subjects = teacher.get("subjects", [])

        for subj_id in t_subjects:
            subj = subj_by_id.get(subj_id)
            if not subj:
                continue
            code = subj["code"]
            templates = MATERIAL_TEMPLATES.get(code, [])
            if not templates:
                continue

            for tmpl in templates:
                title, body_html = tmpl
                for sec_id in t_sections[:3]:  # up to 3 sections
                    payload = {
                        "title": title,
                        "body": body_html,
                        "link_url": "",
                        "teacher": teacher["id"],
                        "section": sec_id,
                        "subject": subj_id,
                    }
                    r = api(
                        "POST", "/api/collections/materials/records", payload, token
                    )
                    if r and r.get("id"):
                        created += 1

    print(f"  Created {created} learning materials")
    return created


def seed_announcements(token, teachers):
    """Seed announcements from teachers"""
    print("\n📢 Seeding announcements...")
    created = 0

    for i, ann in enumerate(ANNOUNCEMENTS):
        teacher = teachers[i % len(teachers)]
        payload = {
            "title": ann["title_ar"],
            "body": ann["body"],
            "scope": ann["scope"],
            "section": "",
            "author": teacher["id"],
        }
        r = api("POST", "/api/collections/announcements/records", payload, token)
        if r and r.get("id"):
            created += 1

    # Add a few section-specific ones
    for teacher in teachers[:5]:
        t_sections = teacher.get("sections", [])
        if not t_sections:
            continue
        sec_id = t_sections[0]
        payload = {
            "title": "تذكير بتسليم الواجب",
            "body": "<p>تذكير لطالبات الشعبة بضرورة تسليم الواجبات المتأخرة قبل نهاية الأسبوع.</p><p>على كل طالبة لم تُسلّم واجبها مراجعة المعلمة في أقرب وقت.</p>",
            "scope": "section",
            "section": sec_id,
            "author": teacher["id"],
        }
        r = api("POST", "/api/collections/announcements/records", payload, token)
        if r and r.get("id"):
            created += 1

    print(f"  Created {created} announcements")
    return created


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Authenticating...")
    token = get_token()
    print("Authenticated.")

    sections = get_all("class_sections", token, "&sort=grade_order,section_ar")
    subjects = get_all("subjects", token)
    teachers = get_all("users", token, "&filter=role='teacher'")

    print(
        f"Found: {len(sections)} sections, {len(subjects)} subjects, {len(teachers)} teachers"
    )

    seed_students(token, sections)
    seed_materials(token, teachers, sections, subjects)
    seed_homework(token, teachers, sections, subjects)
    seed_announcements(token, teachers)

    # Final counts
    print("\n── Final counts ──")
    for col in ["users", "materials", "homework", "announcements"]:
        filt = "&filter=role='student'" if col == "users" else ""
        r = api("GET", f"/api/collections/{col}/records?perPage=1{filt}", token=token)
        label = "students" if col == "users" else col
        print(f"  {label}: {r.get('totalItems', '?') if r else 'error'}")

    print("\nDone!")
