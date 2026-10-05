export type CaseStatus = "in_review" | "waiting"

/** Why a case is on today's roll: to hear the judgment, or for pleadings. */
export type CaseListing = "judgment" | "pleading"

export interface CourtCase {
  id: string
  caseNumber: string
  /** The appellant (المستأنف). */
  plaintiff: string
  /** The appellee (المستأنف ضده). */
  defendant: string
  listing: CaseListing
  status: CaseStatus
}

export interface SessionInfo {
  court: string
  hall: string
  startTime: string
}

export const SESSION_INFO: SessionInfo = {
  court: "الدائرة الاستئنافية لمحكمة الاستثمار والتجارة بمسقط",
  hall: "قاعة محكمة الاستثمار 6",
  startTime: "09:00",
}

/**
 * Today's hearing roll, in hearing order: the cases reserved for judgment come
 * first, then the cases listed for pleading.
 *
 * Sample data taken from the roll of 27/01/2026. The statuses are illustrative:
 * the first case is shown as being heard. Replace `fetchTodaysCases` with a
 * real API call later.
 */
const TODAYS_CASES: CourtCase[] = [
  { id: "1", caseNumber: "210/7103/2024", plaintiff: "الشركة الوطنية المتحدة للهندسة والمقاولات ش م م", defendant: "شركة سعود بهوان للسيارات ش م م", listing: "judgment", status: "in_review" },
  { id: "2", caseNumber: "512/7103/2024", plaintiff: "خميس بن عبدالله بن جمعة الهاشمي", defendant: "شركة اميكس (الشرق الاوسط) ش م ب م", listing: "judgment", status: "waiting" },
  { id: "3", caseNumber: "862/7103/2024", plaintiff: "الإدراك العالمية للتجارة ش.ش.و", defendant: "شركة دبليو جي تاول", listing: "judgment", status: "waiting" },
  { id: "4", caseNumber: "1005/7103/2024", plaintiff: "تميم بن ناصر بن حمود التميمي", defendant: "أنوار بن فاضل بن خلفان الرحبي", listing: "judgment", status: "waiting" },
  { id: "5", caseNumber: "1033/7103/2024", plaintiff: "شركة سواعد الوسطي للتجارة توصية", defendant: "شركة الهاشمي والرواس للتجارة والمقاولات ش م م", listing: "judgment", status: "waiting" },
  { id: "6", caseNumber: "1082/7103/2024", plaintiff: "شركة مكتوم للتجارة والمقاولات ش.م.م", defendant: "سفريات المدينة ش.م.م", listing: "judgment", status: "waiting" },
  { id: "7", caseNumber: "1121/7103/2024", plaintiff: "محمد بن بدر بن هلال البوسعيدي", defendant: "شركة سهم مزون ش.م.م", listing: "judgment", status: "waiting" },
  { id: "8", caseNumber: "1129/7103/2024", plaintiff: "شركة محمد بن جامع بن إسماعيل للتجارة", defendant: "الثبات للسفر والسياحة ش.م.م", listing: "judgment", status: "waiting" },
  { id: "9", caseNumber: "1503/7103/2024", plaintiff: "مديحة بنت علي بن حميد الكليبية", defendant: "شركة الموج مسقط ش م ع م", listing: "judgment", status: "waiting" },
  { id: "10", caseNumber: "209/7103/2025", plaintiff: "ناصر عثمان ناصر عبد الرحمن", defendant: "العربية للطيران", listing: "judgment", status: "waiting" },
  { id: "11", caseNumber: "224/7103/2025", plaintiff: "صادق جعفر سليمان - نبيل عبدالمنعم سليمان ناجواني - ريزون العقارية ش م م", defendant: "أروى بنت مبارك بن عبيد الزعابية", listing: "judgment", status: "waiting" },
  { id: "12", caseNumber: "230/7103/2025", plaintiff: "عادل بن سرحان بن خلفان المزروعي", defendant: "عائشة بنت يوسف بن محمد البلوشية - شركة نماء للكهرباء", listing: "judgment", status: "waiting" },
  { id: "13", caseNumber: "237/7103/2025", plaintiff: "شركة سما فهود العالمية ش.م.م", defendant: "شركة أوفست المحدودة ش.م.م", listing: "judgment", status: "waiting" },
  { id: "14", caseNumber: "254/7113/2025", plaintiff: "المجد السريع (بهوان للمقاولات)", defendant: "شركة بهوان للطاقة - مجموعة بهوان الهندسية ش م م - شركة بهوان لمواد البناء ش م م", listing: "judgment", status: "waiting" },
  { id: "15", caseNumber: "364/7122/2025", plaintiff: "ناصر بن علي بن محمد الحشار - درة الساحل للخدمات و التجارة ش.م.م - شركة خليج مسقط المتحدة ش.م.م", defendant: "شركة عمران وسمكن ايران", listing: "judgment", status: "waiting" },
  { id: "16", caseNumber: "374/7103/2025", plaintiff: "شركة حصن ريدان للمندي ش.م.م", defendant: "شمساء بنت علي بن مال الله البلوشية", listing: "judgment", status: "waiting" },
  { id: "17", caseNumber: "376/7103/2025", plaintiff: "مؤسسة الاعمال المتحدة ( ش .م .م )", defendant: "وزارة المالية – جهاز الضرائب – الامانة العامة للضرائب – سابقا", listing: "judgment", status: "waiting" },
  { id: "18", caseNumber: "378/7103/2025", plaintiff: "بوابة مسقط البلاتينية", defendant: "شركة خدمات التطوير والصيانة", listing: "judgment", status: "waiting" },
  { id: "19", caseNumber: "382/7103/2025", plaintiff: "شركة الافق الاصفر للتجارة ش ش و", defendant: "مشاريع مسمار العالمية", listing: "judgment", status: "waiting" },
  { id: "20", caseNumber: "384/7103/2025", plaintiff: "خالد بن هلال بن سالم السيابي - المعتز بن خالد بن هلال السيابي - شركة القارات الخمس ش م م", defendant: "طلال بن هلال بن سالم السيابي - وزارة التجارة والصناعه وترويج الاستثمار", listing: "judgment", status: "waiting" },
  { id: "21", caseNumber: "452/7103/2025", plaintiff: "شركة أصول للدواجن", defendant: "شركة النرجس العالمية - شركة أسطول الساحل المتحدة التضامنية", listing: "judgment", status: "waiting" },
  { id: "22", caseNumber: "460/7122/2025", plaintiff: "مهدي ايراج برهاني", defendant: "أحمد محمد دشتي", listing: "judgment", status: "waiting" },
  { id: "23", caseNumber: "501/7103/2025", plaintiff: "شركة فهود لخدمات حقول النفط والطاقة ش.م.م", defendant: "شركة كيمجي رامداس المحدودة ش.م.م", listing: "judgment", status: "waiting" },
  { id: "24", caseNumber: "502/7103/2025", plaintiff: "دي اتش ال جلوبال فوروردنج وشركاه ش م م", defendant: "شركة الاشعاع للشحن اللوجستي ( شركة منطقة حرة ) ش م م", listing: "judgment", status: "waiting" },
  { id: "25", caseNumber: "512/7103/2025", plaintiff: "شركة ظفار للهياكل والصناعات الحديدية", defendant: "شركة تيجان للمعدات", listing: "judgment", status: "waiting" },
  { id: "26", caseNumber: "536/7103/2025", plaintiff: "سليمان بن سيف بن علي الجلنداني", defendant: "شركة عمان للتسويق والخدمات ش.م.م", listing: "judgment", status: "waiting" },
  { id: "27", caseNumber: "1069/7122/2025", plaintiff: "شركة ظفار لتحلية المياه", defendant: "شركة ابينسا صلالة - شركة فيسيا - شركة فيسيا ايتاليمبيانتي اس بي ايه - ابينجو اغوا اس ابينسا انفرا يستروراس ميديو امبيانتي اس ايه سابقا", listing: "judgment", status: "waiting" },
  { id: "28", caseNumber: "1079/7103/2025", plaintiff: "الخليجية للربط الدولي", defendant: "ارشد محمود", listing: "judgment", status: "waiting" },
  { id: "29", caseNumber: "1080/7103/2025", plaintiff: "النديم العالمية", defendant: "شركة فخر السراء للتجارة", listing: "judgment", status: "waiting" },
  { id: "30", caseNumber: "1082/7103/2025", plaintiff: "معالم الروضة للتجارة(تاجر فرد) لمالكها احمد بن محمد بن سعود الحبسي", defendant: "ماجد الفطيم العقارية (عمان) ش م م", listing: "judgment", status: "waiting" },
  { id: "31", caseNumber: "1191/7103/2025", plaintiff: "مهدي بن صالح بن حسن البحراني", defendant: "حارث بن هاشل بن محمد المصلحي - وزارة التجارة والصناعة وترويج الاستثمار - بنك العز الاسلامي", listing: "judgment", status: "waiting" },
  { id: "32", caseNumber: "1462/7103/2025", plaintiff: "زكريا بن علي بن إبراهيم السيابي", defendant: "مهند محمد جبر المخامرة", listing: "judgment", status: "waiting" },
  { id: "33", caseNumber: "1467/7103/2025", plaintiff: "شركة ثمار الغبرة للتجارة ش ش و", defendant: "شركة المدينة للتأمين ش م ع ع", listing: "judgment", status: "waiting" },
  { id: "34", caseNumber: "1888/7103/2025", plaintiff: "الشركة العمانية المتحدة للتأمين ش.م.ع.ع", defendant: "منى بنت مبارك بن سالم الهنائية", listing: "judgment", status: "waiting" },
  { id: "35", caseNumber: "4133/7103/2025", plaintiff: "شركة أوبار للهندسة والمقاولات ش م م", defendant: "شركة وادي الجزي للطاقة ش م ع م - مكتب بي دي أو", listing: "judgment", status: "waiting" },
  { id: "36", caseNumber: "1535/7103/2023", plaintiff: "ادي عمان ش م م", defendant: "سليمان بن ناصر بن سليمان الرشيدي", listing: "pleading", status: "waiting" },
  { id: "37", caseNumber: "385/7103/2024", plaintiff: "شركة البستان للانشاءات", defendant: "محمد شاهد /باكستاني الجنسية - سند بن سعيد بن خميس الرزيقي", listing: "pleading", status: "waiting" },
  { id: "38", caseNumber: "393/7103/2024", plaintiff: "شركة أدي عمان (ش.م.م)", defendant: "شركة سالم محي الدين سيف وإخوانه للتجارة والمقاولات (ش.م.م)", listing: "pleading", status: "waiting" },
  { id: "39", caseNumber: "404/7103/2024", plaintiff: "الكنز لما وراء البحار ش ش و", defendant: "شركة اصول للدواجن ش م ع م", listing: "pleading", status: "waiting" },
  { id: "40", caseNumber: "509/7103/2024", plaintiff: "الشركة العمانية لخدمات المياه والصرف الصحي", defendant: "سليمان بن خميس بن سالم الحرملي", listing: "pleading", status: "waiting" },
  { id: "41", caseNumber: "604/7103/2024", plaintiff: "رحاب بنت عامر عدلي", defendant: "شركى الخطوط الجوية التركية - نقطة السفريات ش.م.م", listing: "pleading", status: "waiting" },
  { id: "42", caseNumber: "695/7103/2024", plaintiff: "واحة المستقبل الرائدة", defendant: "نيوايرا للتجارة والمقاولات ش ش و", listing: "pleading", status: "waiting" },
  { id: "43", caseNumber: "1029/7103/2024", plaintiff: "أحمد زاهر عرفة شحاته - الشركة الأهلية للتنمية الزراعية", defendant: "مصنع جعلان لإنتاج مسحوق وزيت السمك", listing: "pleading", status: "waiting" },
  { id: "44", caseNumber: "1116/7103/2024", plaintiff: "النهضة الوطنية التجارية ش م م", defendant: "الفا للسيارات ش م م", listing: "pleading", status: "waiting" },
  { id: "45", caseNumber: "1212/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي حيا للمياه", defendant: "الشركة الوطنية العمانية للهندسة والاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "46", caseNumber: "1213/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي", defendant: "الشركة الوطنية العمانية للهندسة والاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "47", caseNumber: "1214/7103/2024", plaintiff: "2/ الشركة العمانية لخدمات المياة والصرف الصحي", defendant: "الشركة الوطنية العمانية للهندسة والاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "48", caseNumber: "1215/7103/2024", plaintiff: "الشركة العمانية لخدمات المياه والصرف الصحي", defendant: "الشركة الوطنية العمانية للهندسة والاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "49", caseNumber: "1217/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي ( حيا للمياه )", defendant: "الشركة الوطنية العمانية للهندسة والاستثمار ش م ع ع - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "50", caseNumber: "1218/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي", defendant: "الشركة الوطنية العمانبة الهندسية والاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "51", caseNumber: "1219/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي ( حيا للمياه )", defendant: "الشركة الوطنية العمانية للهندسة والأستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "52", caseNumber: "1221/7103/2024", plaintiff: "الشركه العمانيه لخدمات المياه والصرف الصحي", defendant: "الشركة الوطنية العمانية للهندسة و الاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "53", caseNumber: "1222/7103/2024", plaintiff: "الشركة العمانية لخدمات الصرف الصحي", defendant: "الشركة الوطنية العمانية للهندسة و الاستثمار - وزارة الداخلية", listing: "pleading", status: "waiting" },
  { id: "54", caseNumber: "1240/7103/2024", plaintiff: "عادل بن سالم بن سليمان الفيروز", defendant: "شركة الاس للخدمات ةالتجارة - شرطة عمان السلطانية إدارة المرور", listing: "pleading", status: "waiting" },
  { id: "55", caseNumber: "1279/7103/2024", plaintiff: "شركة نماء لتوزيع الكهرباء", defendant: "شركة الشنفري للرخام ش.م.م", listing: "pleading", status: "waiting" },
  { id: "56", caseNumber: "1409/7103/2024", plaintiff: "الغواصة الزرقاء ش.م.م - زياد بن عايل بن فليفل الوهيبي", defendant: "المنازل العالمية الراقية والأعمال", listing: "pleading", status: "waiting" },
  { id: "57", caseNumber: "1471/7103/2024", plaintiff: "شركة اسكان العمانية للاستثمار ش.م.ع.م", defendant: "علي بن محمد بن علي زعنبوت المهري", listing: "pleading", status: "waiting" },
  { id: "58", caseNumber: "1492/7103/2024", plaintiff: "شركة المدينة للتأمين ش م ع ع", defendant: "مبارك بن راشد بن ناصر البلوشي", listing: "pleading", status: "waiting" },
  { id: "59", caseNumber: "1511/7103/2024", plaintiff: "سرايا بندر الجصة ش.م.ع.م", defendant: "ميان بنت حمزه بن عبدالله العصفور", listing: "pleading", status: "waiting" },
  { id: "60", caseNumber: "1524/7103/2024", plaintiff: "المعتصم محمد عبدالله الريامي", defendant: "أحمد خميس محمد التوبي - حمد خالد حمد المعمري - عيون مزون للتجارة", listing: "pleading", status: "waiting" },
  { id: "61", caseNumber: "1628/7113/2024", plaintiff: "حمد بن سيف بن سالم المسروري", defendant: "مؤسسة المنتجات الاسمنتية العمانية", listing: "pleading", status: "waiting" },
  { id: "62", caseNumber: "1681/7113/2024", plaintiff: "شركة جعلان اللوجستية ش م م", defendant: "شركة شل العمانية للتسويق ش.م.ع.ع", listing: "pleading", status: "waiting" },
  { id: "63", caseNumber: "79/7103/2025", plaintiff: "عبدالله بهون جزائري الجنسية", defendant: "مدرسة كوكبنا الدولية الخاصة", listing: "pleading", status: "waiting" },
  { id: "64", caseNumber: "181/7701/2025", plaintiff: "شركة دار العطاء للتجارة و الخدمات", defendant: "شركة تكافل عمان للتأمين ش.م.ع.ع", listing: "pleading", status: "waiting" },
  { id: "65", caseNumber: "303/7103/2025", plaintiff: "صالح علي صالح العبادي", defendant: "زياد سالم شنون الحسني - مشاريع ابو اليزن الحسني", listing: "pleading", status: "waiting" },
  { id: "66", caseNumber: "304/7103/2025", plaintiff: "الشركة العامة للتجارة والكهرباء (جينتكو)", defendant: "ماجد بن عبدالله بن محمد البطاشي - اللون الماسي للتجارة", listing: "pleading", status: "waiting" },
  { id: "67", caseNumber: "410/7103/2025", plaintiff: "صندوق تنمية المؤسسات الصغيرة والمتوسطة", defendant: "طالب بن غريب خميس - اليقظان بن علي بن منصور الهنائي - الملك المتحرك", listing: "pleading", status: "waiting" },
  { id: "68", caseNumber: "444/7103/2025", plaintiff: "عبدالله هلال عبدالله البوسعيدي", defendant: "شركة ألفا للسيارات", listing: "pleading", status: "waiting" },
  { id: "69", caseNumber: "448/7103/2025", plaintiff: "شركة ركن اليقين العالمية ش.م.م", defendant: "شركة البستان للتوريدات الفنية ش.م.م", listing: "pleading", status: "waiting" },
  { id: "70", caseNumber: "475/7103/2025", plaintiff: "الخليجية للرابط الدولي ش م م", defendant: "عمر فاروق بنجلاديشي الجنسية", listing: "pleading", status: "waiting" },
  { id: "71", caseNumber: "477/7103/2025", plaintiff: "الخليجية للرابط الدولي ش م م", defendant: "محمد سوهاج حسين محمد شان مياه بنجغلاديشي الجنسية", listing: "pleading", status: "waiting" },
  { id: "72", caseNumber: "481/7103/2025", plaintiff: "الموج الجديد للاعمال", defendant: "مشاريع المقيمي المتحدة", listing: "pleading", status: "waiting" },
  { id: "73", caseNumber: "524/7103/2025", plaintiff: "سعود بهوان للسيارات ش.م.م", defendant: "عادل بن سعيد بن حمدان الغيثي", listing: "pleading", status: "waiting" },
  { id: "74", caseNumber: "531/7103/2025", plaintiff: "مشاريع أبوسجى المقحوصي للتجارة ( منايف البريمي للتجارة )", defendant: "زاهب للاغذية", listing: "pleading", status: "waiting" },
  { id: "75", caseNumber: "863/7103/2025", plaintiff: "مؤسسة البوابة السابعة المتكاملة", defendant: "مؤسسة سلاسل جبال مسندم للتجارة - طارق بن راشد بن محمد المزروعي", listing: "pleading", status: "waiting" },
  { id: "76", caseNumber: "882/7103/2025", plaintiff: "شركة اي زد انجنيرس وشركاهم ش م م", defendant: "فاتنه محمد حمد الجابرية - شركة مسقط لتوزيع الكهرباء ش م ع م - مشروع ملعب مسقط للجولف ش م م - دار الاتقان للخدمات الهندسية ش م م", listing: "pleading", status: "waiting" },
  { id: "77", caseNumber: "884/7103/2025", plaintiff: "شركة المدينة للخدمات اللوجستية ش.م.ع.م", defendant: "خالد بن ابراهيم بن محمد الهنائي - شركة مجان للأغذية الخليجية توصية", listing: "pleading", status: "waiting" },
  { id: "78", caseNumber: "1081/7103/2025", plaintiff: "أسلم بن علي بن عامر الشكيلي - وجهة للياقة البدنية ش.م.م", defendant: "سهيلة إبراهيم السيد جمال الهاشمي", listing: "pleading", status: "waiting" },
  { id: "79", caseNumber: "1083/7103/2025", plaintiff: "محمد بن عبدالله بن صالح العريمي", defendant: "عبدالرحمن بن سعيد بن عامر القايدي - الدكتور للاستثمار", listing: "pleading", status: "waiting" },
  { id: "80", caseNumber: "1098/7103/2025", plaintiff: "جمعية ملاك مجمع تلال القرم", defendant: "عماد بن عبدالمجيد بن عبدالباقي اللواتي", listing: "pleading", status: "waiting" },
  { id: "81", caseNumber: "1099/7103/2025", plaintiff: "أحمد حسين جواد الخابوري", defendant: "مشاريع الرقيشي الوطنية", listing: "pleading", status: "waiting" },
  { id: "82", caseNumber: "1100/7103/2025", plaintiff: "جمعية ملاك مجمع تلال القرم", defendant: "عبدالله بن عبدالرحمن بن سعيد البلوشي", listing: "pleading", status: "waiting" },
  { id: "83", caseNumber: "1101/7103/2025", plaintiff: "جمعية ملاك مجمع تلال القرم", defendant: "مريم بنت علي بن سعيد الهنائية", listing: "pleading", status: "waiting" },
  { id: "84", caseNumber: "1118/7103/2025", plaintiff: "الشركة الهندية الجديدة للتأمين", defendant: "شركة التأمين العربية فالكون", listing: "pleading", status: "waiting" },
  { id: "85", caseNumber: "1120/7103/2025", plaintiff: "شركة فيافي المعمورة الشاملة للتجارة", defendant: "شركة تبيان للعقارات ش م م", listing: "pleading", status: "waiting" },
  { id: "86", caseNumber: "1121/7122/2025", plaintiff: "شركة خزانات فيجي وشركاهم", defendant: "شركة جلفار المسند للهندسة والمقاولات", listing: "pleading", status: "waiting" },
  { id: "87", caseNumber: "1212/7103/2025", plaintiff: "فالكون جيت للوكالات التجارية", defendant: "شركة تايونج انجيرنج كونستراكشن ليمتد (كورية الجنسية )", listing: "pleading", status: "waiting" },
  { id: "88", caseNumber: "1463/7103/2025", plaintiff: "ربيع علي محمد العكيمي", defendant: "مدارس الصحوة", listing: "pleading", status: "waiting" },
  { id: "89", caseNumber: "1492/7103/2025", plaintiff: "حسين بن علي بن سعيد التمتمي", defendant: "مدرسة الرنية الدولية الخاصة", listing: "pleading", status: "waiting" },
  { id: "90", caseNumber: "1500/7103/2025", plaintiff: "البستان للانشاءات", defendant: "شركة نهضة الدقم للمساكن ش م ع م", listing: "pleading", status: "waiting" },
  { id: "91", caseNumber: "1501/7103/2025", plaintiff: "شركة آفاق الخليج العالمية ش.م.م", defendant: "الشركة المتحدة الخليجية للمناولة ش.م.م", listing: "pleading", status: "waiting" },
  { id: "92", caseNumber: "1568/7103/2025", plaintiff: "(منفرد) شركه خدمات السعاده للسياحه - شركة محدودة المسؤولية", defendant: "شركة كوني السرين ش م م", listing: "pleading", status: "waiting" },
  { id: "93", caseNumber: "1724/7103/2025", plaintiff: "سمير منير أزور بخش البلوشي", defendant: "تيم ليدر لوجيستكس الخاصة المحدودة", listing: "pleading", status: "waiting" },
  { id: "94", caseNumber: "1868/7103/2025", plaintiff: "الشركة الأمريكية للتأمين على الحياة (متلايف ) (فرع عمان)", defendant: "ورثة المتوفي صبحي ميخائيل إلياس وهم زويا رجا وميشيل صبحي ومروة صبحي وسام صبحي توما", listing: "pleading", status: "waiting" },
  { id: "95", caseNumber: "1881/7103/2025", plaintiff: "الهناء للعطور ش ش و", defendant: "شركة الفيصل ش م م", listing: "pleading", status: "waiting" },
  { id: "96", caseNumber: "1892/7103/2025", plaintiff: "سفريات مزون ش م م", defendant: "بيت السفر ش م م", listing: "pleading", status: "waiting" },
  { id: "97", caseNumber: "1897/7103/2025", plaintiff: "الافاق المتحدة الرائدة ش م م", defendant: "الشركة الهندية الجديدة للتأمين المحدودة - شركة الأفق الواضح للتجارة ش م م", listing: "pleading", status: "waiting" },
  { id: "98", caseNumber: "1934/7103/2025", plaintiff: "شركة شويترام واولاده ش ذ م م", defendant: "المكتب الوطني للملكية الفكرية بوزارة التجارة والصناعة", listing: "pleading", status: "waiting" },
  { id: "99", caseNumber: "1938/7103/2025", plaintiff: "شركة محسن حيدر درويش (ش.م.م)", defendant: "مزاين بنت سالم بن خلفان الهاشلية", listing: "pleading", status: "waiting" },
  { id: "100", caseNumber: "1962/7103/2025", plaintiff: "شركة الفرات العظيم للتجارة والمقاولات", defendant: "مؤسسة بن عوض النقيب للتجارة والمقاولات - وزارة التجارة والصناعة وترويج الاستثمار", listing: "pleading", status: "waiting" },
  { id: "101", caseNumber: "2010/7122/2025", plaintiff: "شركة ريسوت للاسمنت", defendant: "شركة دامبسكيبسيلسكابيت نوردن ايه إس", listing: "pleading", status: "waiting" },
  { id: "102", caseNumber: "2015/7122/2025", plaintiff: "شركة ريسوت للاسمنت", defendant: "شركة امارات ماريتايم", listing: "pleading", status: "waiting" },
  { id: "103", caseNumber: "2021/7122/2025", plaintiff: "شركة ريسوت للاسمنت", defendant: "شركة ناجو شيبنج أس ايه", listing: "pleading", status: "waiting" },
  { id: "104", caseNumber: "2022/7122/2025", plaintiff: "شركة ريسوت للاسمنت", defendant: "شركة فرول للشحن", listing: "pleading", status: "waiting" },
  { id: "105", caseNumber: "2112/7103/2025", plaintiff: "الخليجية للرابط الدولي ش.م.م", defendant: "جانجير علم هارون ار راشد", listing: "pleading", status: "waiting" },
  { id: "106", caseNumber: "2121/7103/2025", plaintiff: "شركة الصاروج للانشاءات - شركة محدودة المسؤولية", defendant: "مرتفعات شموخ الشرقية ش.م.م", listing: "pleading", status: "waiting" },
  { id: "107", caseNumber: "2159/7103/2025", plaintiff: "الشركة العمانية لخدمات المياه والصرف الصحي", defendant: "محمد بن حمدان بن آدم الزدجالي", listing: "pleading", status: "waiting" },
  { id: "108", caseNumber: "2218/7103/2025", plaintiff: "الرشاء المتحدة", defendant: "سيف بن محمد بن سيف الشيدي", listing: "pleading", status: "waiting" },
  { id: "109", caseNumber: "2292/7103/2025", plaintiff: "بيت المرأة العالمية ش.ش.و", defendant: "شركة البصمة للتسويق توصيــــة", listing: "pleading", status: "waiting" },
  { id: "110", caseNumber: "2340/7103/2025", plaintiff: "عبدالعزيز الرئيسي للتجارة", defendant: "وفاء بنت علي بن حمد بن حمود آل فنه", listing: "pleading", status: "waiting" },
  { id: "111", caseNumber: "2343/7103/2025", plaintiff: "الشركة العمانية لخدمات الصرف الصحي", defendant: "شركة أفلاج الخليج للتجارة والمقاولات", listing: "pleading", status: "waiting" },
  { id: "112", caseNumber: "2375/7103/2025", plaintiff: "شركة التمان اندسيل فيروكروم ش.م.م", defendant: "شركة سد العامرات للتجارة ش.م.م - وزارة الطاقة والمعادن", listing: "pleading", status: "waiting" },
  { id: "113", caseNumber: "2402/7103/2025", plaintiff: "عطا الله بن محمد الطه", defendant: "شركة التأمين الأهلية ش.م.ع.م سابقاً ( شركة ليفا للتأمين ش م ع م ) حاليا - الجزيرة لخدمات التأمين ش م م", listing: "pleading", status: "waiting" },
  { id: "114", caseNumber: "2407/7103/2025", plaintiff: "شركة السيفة للتنمية السياحية ش.م.ع.م", defendant: "فوزي بن حمد بن سعيد الحارثي", listing: "pleading", status: "waiting" },
  { id: "115", caseNumber: "2408/7103/2025", plaintiff: "شركة السيفة للتنمية السياحية ش.م.ع.م", defendant: "محمود محمد إمام عامر - شيماء جمال عبدالمعطي سيد", listing: "pleading", status: "waiting" },
  { id: "116", caseNumber: "2409/7103/2025", plaintiff: "شركة السيفة للتنمية السياحية ش.م.ع.م", defendant: "ساره إبراهيم خدابخش", listing: "pleading", status: "waiting" },
  { id: "117", caseNumber: "3886/7103/2025", plaintiff: "سعيد بن ناصر بن حمد الجابري - مركز عُمان للرياضة والاستثمار العقاري", defendant: "بنك التنمية ش م ع م", listing: "pleading", status: "waiting" },
  { id: "118", caseNumber: "4184/7103/2025", plaintiff: "سامسونايت آي بي هولدنغز اس اسه ار ال", defendant: "شركة ايه دبليو اس للتوزيع - المكتب الوطني للملكية الفكرية", listing: "pleading", status: "waiting" },
  { id: "119", caseNumber: "4206/7103/2025", plaintiff: "كحيل وشركاه للتجارى ش ش و", defendant: "مانع بن سالم بن محمد القنوبي", listing: "pleading", status: "waiting" },
  { id: "120", caseNumber: "4266/7103/2025", plaintiff: "كارانجيت سينغ ماثارو", defendant: "شركة ماهراني بينتس المحدودة بجهورية الهند", listing: "pleading", status: "waiting" },
  { id: "121", caseNumber: "4285/7103/2025", plaintiff: "عبدالسلام كاري كلام", defendant: "شركة مشاريع شمس الاتحاد الوطنية ش.م.م", listing: "pleading", status: "waiting" },
  { id: "122", caseNumber: "4288/7103/2025", plaintiff: "مرتضى بن جعفر بن رحمة الله اللواتي - الشركة الحديثة - شركة محدودة المسؤولية", defendant: "الوسيط السابع للتجارة ش ش و", listing: "pleading", status: "waiting" },
  { id: "123", caseNumber: "4296/7103/2025", plaintiff: "شركة الصاروج للانشاءات ش.م.م", defendant: "شركة فيدريشي ستيرلنج باتكو ش.م.م", listing: "pleading", status: "waiting" },
  { id: "124", caseNumber: "4301/7103/2025", plaintiff: "ناصر بن سالم بن علي العبري", defendant: "توفيق بن محسن بن محمد اللواتي - مسعد عمر صدقي مصري الجنسية - مكتب الأول للإستشارات المالية", listing: "pleading", status: "waiting" },
  { id: "125", caseNumber: "4314/7103/2025", plaintiff: "شركة التأمين العربية فالكون ش م ع ع", defendant: "سيام بابو بيكا", listing: "pleading", status: "waiting" },
  { id: "126", caseNumber: "4335/7103/2025", plaintiff: "سيف بن سالم بن هاشم الغافري", defendant: "ناصر بن مبارك بن جمعة العريمي - لؤلؤه بنت مسلم بن سليم الفارسية - شركة الموحدة للهندسة و المقاولات ش م م", listing: "pleading", status: "waiting" },
  { id: "127", caseNumber: "4386/7103/2025", plaintiff: "الوسيط السابع للتجارة ش ش و", defendant: "مرتضى بن جعفر بن رحمة الله اللواتي - الشركة الحديثة ش م م", listing: "pleading", status: "waiting" },
  { id: "128", caseNumber: "4409/7103/2025", plaintiff: "سيام بابو بيكا", defendant: "شركة التأمين العربية فالكون ش م ع ع", listing: "pleading", status: "waiting" },
  { id: "129", caseNumber: "4755/7103/2025", plaintiff: "مشوار الدولية", defendant: "سالم سليمان سالم السيابي", listing: "pleading", status: "waiting" },
]

export async function fetchTodaysCases(): Promise<CourtCase[]> {
  return TODAYS_CASES
}
