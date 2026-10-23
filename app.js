const { useState, useEffect, useMemo, useRef } = React;

const MEDS_KEY     = 'medichopa-meds';
const DIARY_KEY    = 'medichopa-diary';
const LOGS_KEY     = 'medichopa-logs';
const THEME_KEY    = 'medichopa-theme';
const BOOKINGS_KEY = 'medichopa-bookings';
const LANG_KEY     = 'medichopa-lang';
const CONTACT_KEY  = 'medichopa-contact';
const uid = () => Math.random().toString(36).slice(2, 10);

let globalAudioCtx = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

function playSound(type = 'alarm') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'alarm') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const playChime = (startTime) => {
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime + index * 0.15);
          gain.gain.setValueAtTime(0.01, startTime + index * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.3, startTime + index * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.15 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime + index * 0.15);
          osc.stop(startTime + index * 0.15 + 0.5);
        });
      };
      const now = ctx.currentTime;
      playChime(now);
      playChime(now + 1.0);
      playChime(now + 2.0);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('Ошибка аудио:', e);
  }
}

function sendSystemNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
      tag: 'medichopa-alarm'
    });
  }
}

const I18N = {
  RU: {
    dashboard: 'Дашборд',
    medications: 'Лекарства',
    calendar: 'Календарь',
    consultation: 'Онлайн консультация врача',
    diary: 'Дневник',
    about: 'О проекте',
    sos: '🚨 SOS Экстренно',
    demo: '✨ Загрузить демо-данные',
    exportPdf: '📄 Экспорт в PDF',
    tipOfDay: 'Совет дня',
    nextTip: 'Другой совет 🔄',
    takenToday: 'Принято сегодня',
    pending: 'Ожидается',
    adherence: 'Соблюдение режима',
    todaySchedule: 'Расписание на сегодня',
    myMeds: 'Мои лекарства',
    addMed: '+ Добавить лекарство',
    call103: '📞 Позвонить 103 (Скорая помощь)',
    call112: '🛡️ Единая служба спасения 112',
    progressTitle: 'Прогресс приёма на сегодня',
    greeting: 'Добрый день 👋',
    all: 'Все',
    taken: 'Принятые',
    pendingStatus: 'Ожидают',
    noSchedule: 'Пока нет запланированных приёмов.',
    searchMed: '🔍 Поиск лекарства по названию...',
    noMeds: 'Пока нет лекарств. Добавьте первое.',
    notFound: 'Ничего не найдено по вашему запросу',
    clearLogs: '🗑️ Очистить историю приёмов',
    calendarSub: 'Все запланированные приёмы лекарств',
    back: '← Назад',
    forward: 'Вперёд →',
    diarySub: 'Отслеживайте симптомы и настроение',
    newEntry: 'Новая запись',
    moodLabel: 'Настроение',
    severityLabel: 'Тяжесть симптомов',
    symptomsLabel: 'Симптомы',
    notesLabel: 'Заметки',
    notesPlaceholder: 'Что-то ещё...',
    saveEntry: '+ Сохранить запись',
    dynamics: 'Динамика',
    noChartData: 'Пока нет данных для графика',
    history: 'История',
    noEntries: 'Пока нет записей',
    consultSub: 'Интеллектуальный помощник на основе вашего Дневника и видеосвязь со специалистами',
    myBookings: 'Мои запланированные консультации',
    doctorsList: 'Врачи-специалисты',
    bookBtn: 'Записаться',
    profileBtn: 'Профиль',
    aiChatTitle: '🤖 Умный чат на основе вашего Дневника',
    chatPlaceholder: 'Задайте вопрос врачу...',
    sendBtn: 'Отправить',
    trustedContact: '👨‍👩‍👧 Доверительный контакт',
    edit: '✏️ Изменить',
    delete: '🗑️ Удалить',
    call: 'Позвонить',
    saveContact: 'Сохранить контакт',
    cancel: 'Отмена',
    close: 'Закрыть',
    medMemo: 'Памятка для скорой помощи:',
    activeTherapy: 'Активная терапия:',
    formTablet: 'Таблетки',
    formCapsule: 'Капсулы',
    formSyrup: 'Сироп',
    formInjection: 'Инъекции',
    formDrops: 'Капли',
    withFoodLabel: 'Принимать с едой (🍽️)',
    dosageLabel: 'Дозировка',
    unitLabel: 'Единица',
    nameLabel: 'Название',
    formLabel: 'Форма',
    timeLabel: 'Время приёма (Будильник)',
    addTimeBtn: '+ Добавить время',
    photoLabel: '📸 Фото (Ссылка или файл)',
    deletePhoto: 'Удалить фото',
    editMedTitle: 'Редактировать лекарство',
    newMedTitle: 'Новое лекарство',
    docCardTitle: 'Карточка специалиста',
    workPlace: '🏥 Место работы:',
    educationTitle: '🎓 Образование:',
    aboutDoc: '📝 О специалисте:',
    statusDoc: 'Статус в MediChopa',
    bookingTitle: 'Запись на консультацию',
    dateLabel: 'Дата',
    timeLabelInput: 'Время',
    formatLabel: 'Формат',
    chatFormat: '💬 Чат-консультация',
    videoFormat: '📹 Видеовызов',
    audioFormat: '📞 Аудиозвонок',
    alarmTitle: 'Время принять лекарство!',
    snoozeBtn: '⏳ Напомнить через 5 мин',
    takenBtn: '✓ Принял',
    deleteModalTitle: 'Удалить лекарство?',
    deleteModalSub: 'Это действие также удалит всю историю приёмов этого препарата.'
  },
  KG: {
    dashboard: 'Башкы бет',
    medications: 'Дарылар',
    calendar: 'Календарь',
    consultation: 'Врач менен онлайн байланыш',
    diary: 'Күндөлүк',
    about: 'Долбоор жөнүндө',
    sos: '🚨 SOS Шашылыш',
    demo: '✨ Демо-маалыматтарды жүктөө',
    exportPdf: '📄 PDF отчет алуу',
    tipOfDay: 'Күндүн кеңеши',
    nextTip: 'Башка кеңеш 🔄',
    takenToday: 'Бүгүн ичилди',
    pending: 'Күтүлүүдө',
    adherence: 'Режимди сактоо',
    todaySchedule: 'Бүгүнкү графиги',
    myMeds: 'Менин дарыларым',
    addMed: '+ Дары кошуу',
    call103: '📞 103 Чалуу (Тез жардам)',
    call112: '🛡️ 112 Куткаруу кызматы',
    progressTitle: 'Бүгүнкү кабыл алуу прогресси',
    greeting: 'Кутман күн 👋',
    all: 'Бардыгы',
    taken: 'Ичилгендер',
    pendingStatus: 'Күтүлүүдө',
    noSchedule: 'Азырынча пландаштырылган дарылар жок.',
    searchMed: '🔍 Дарыны аты боюнча издөө...',
    noMeds: 'Азырынча дарылар жок. Биринчи дарыны кошуңуз.',
    notFound: 'Сиздин сурооңуз боюнча эч нерсе табылган жок',
    clearLogs: '🗑️ Кабыл алуу тарыхын тазалоо',
    calendarSub: 'Пландаштырылган дары ичүү убактылары',
    back: '← Мурунку',
    forward: 'Кийинки →',
    diarySub: 'Симптомдорду жана маанайды көзөмөлдөө',
    newEntry: 'Жаңы жазуу',
    moodLabel: 'Маанай',
    severityLabel: 'Оорунун оордугу',
    symptomsLabel: 'Симптомдор',
    notesLabel: 'Эскертүүлөр',
    notesPlaceholder: 'Кошумча маалымат...',
    saveEntry: '+ Жазууну сактоо',
    dynamics: 'Динамика',
    noChartData: 'График үчүн маалымат жок',
    history: 'Тарыхы',
    noEntries: 'Азырынча жазуулар жок',
    consultSub: 'Күндөлүгүңүздүн негизинде акылдуу жардамчы жана адистер менен видеобайланыш',
    myBookings: 'Менин пландаштырылган консультацияларым',
    doctorsList: 'Дарыгер-адистер',
    bookBtn: 'Жазылуу',
    profileBtn: 'Профиль',
    aiChatTitle: '🤖 Күндөлүгүңүздүн негизиндеги акылдуу чат',
    chatPlaceholder: 'Дарыгерге суроо бериңиз...',
    sendBtn: 'Жөнөтүү',
    trustedContact: '👨‍👩‍👧 Ишенимдүү байланыш',
    edit: '✏️ Өзгөртүү',
    delete: '🗑️ Өчүрүү',
    call: 'Чалуу',
    saveContact: 'Байланышты сактоо',
    cancel: 'Жокко чыгаруу',
    close: 'Жабуу',
    medMemo: 'Тез жардам үчүн эскертме:',
    activeTherapy: 'Учурда ичип жаткан дарылар:',
    formTablet: 'Таблеткалар',
    formCapsule: 'Капсулалар',
    formSyrup: 'Сироп',
    formInjection: 'Ийне (Инъекция)',
    formDrops: 'Тамчылар',
    withFoodLabel: 'Тамак менен ичүү (🍽️)',
    dosageLabel: 'Дозасы',
    unitLabel: 'Бирдиги',
    nameLabel: 'Аты',
    formLabel: 'Түрү',
    timeLabel: 'Ичүү убактысы (Будильник)',
    addTimeBtn: '+ Убакыт кошуу',
    photoLabel: '📸 Сүрөт (Шилтеме же файл)',
    deletePhoto: 'Сүрөттү өчүрүү',
    editMedTitle: 'Дарыны оңдоо',
    newMedTitle: 'Жаңы дары',
    docCardTitle: 'Адис карточкасы',
    workPlace: '🏥 Иш орду:',
    educationTitle: '🎓 Билими:',
    aboutDoc: '📝 Адис жөнүндө:',
    statusDoc: 'MediChopa статусу',
    bookingTitle: 'Консультацияга жазылуу',
    dateLabel: 'Күнү',
    timeLabelInput: 'Убактысы',
    formatLabel: 'Форматы',
    chatFormat: '💬 Чат аркылуу',
    videoFormat: '📹 Видеобайланыш',
    audioFormat: '📞 Аудио чалуу',
    alarmTitle: 'Дары ичүү убактысы келди!',
    snoozeBtn: '⏳ 5 мүнөттөн кийин эскертүү',
    takenBtn: '✓ Ичтим',
    deleteModalTitle: 'Дарыны өчүрөсүзбү?',
    deleteModalSub: 'Бул аракет ушул дарынын бардык кабыл алуу тарыхын өчүрөт.'
  },
  UZ: {
    dashboard: 'Bosh sahifa',
    medications: 'Dori-darmonlar',
    calendar: 'Kalendar',
    consultation: 'Shifokor bilan onlayn maslahat',
    diary: 'Kundalik',
    about: 'Loyiha haqida',
    sos: '🚨 SOS Favqulodda',
    demo: '✨ Demo maʼlumotlarni yuklash',
    exportPdf: '📄 PDF hisobot olish',
    tipOfDay: 'Kun maslahati',
    nextTip: 'Boshqa maslahat 🔄',
    takenToday: 'Bugun ichildi',
    pending: 'Kutilmoqda',
    adherence: 'Tartibga rioya qilish',
    todaySchedule: 'Bugungi jadval',
    myMeds: 'Mening dorilarim',
    addMed: '+ Dori qoʻshish',
    call103: '📞 103 ga qoʻngʻiroq qilish (Tez yordam)',
    call112: '🛡️ 112 Qutqaruv xizmati',
    progressTitle: 'Bugungi qabul qilish jarayoni',
    greeting: 'Xayrli kun 👋',
    all: 'Barchasi',
    taken: 'Ichilganlar',
    pendingStatus: 'Kutilmoqda',
    noSchedule: 'Hozircha rejalashtirilgan dorilar yoʻq.',
    searchMed: '🔍 Dorini nomi boʻyicha qidirish...',
    noMeds: 'Hozircha dorilar yoʻq. Birinchi dorini qoʻshing.',
    notFound: 'Sizning soʻrovingiz boʻyicha hech narsa topilmadi',
    clearLogs: '🗑️ Qabul qilish tarixini tozalash',
    calendarSub: 'Rejalashtirilgan dori ichish vaqtlari',
    back: '← Orqaga',
    forward: 'Oldinga →',
    diarySub: 'Alomatlar va kayfiyatni nazorat qilish',
    newEntry: 'Yangi yozuv',
    moodLabel: 'Kayfiyat',
    severityLabel: 'Ogʻriq ogʻirligi',
    symptomsLabel: 'Alomatlar',
    notesLabel: 'Izohlar',
    notesPlaceholder: 'Qoʻshimcha maʼlumot...',
    saveEntry: '+ Yozuvni saqlash',
    dynamics: 'Dinamika',
    noChartData: 'Grafik uchun maʼlumot yoʻq',
    history: 'Tarix',
    noEntries: 'Hozircha yozuvlar yoʻq',
    consultSub: 'Kundaligingiz asosida aqlli yordamchi va mutaxassislar bilan videobogʻlanish',
    myBookings: 'Mening rejalashtirilgan konsultatsiyalarim',
    doctorsList: 'Shifokor-mutaxassislar',
    bookBtn: 'Yozilish',
    profileBtn: 'Profil',
    aiChatTitle: '🤖 Kundaligingiz asosidagi aqlli chat',
    chatPlaceholder: 'Shifokorga savol bering...',
    sendBtn: 'Yuborish',
    trustedContact: '👨‍👩‍👧 Ishonchli aloqa',
    edit: '✏️ Oʻzgartirish',
    delete: '🗑️ Oʻchirish',
    call: 'Qoʻngʻiroq qilish',
    saveContact: 'Aloqani saqlash',
    cancel: 'Bekor qilish',
    close: 'Yopish',
    medMemo: 'Tez yordam uchun eslatma:',
    activeTherapy: 'Hozirda ichilayotgan dorilar:',
    formTablet: 'Tabletkalar',
    formCapsule: 'Kapsulalar',
    formSyrup: 'Sharbat',
    formInjection: 'Ukol (Inyeksiya)',
    formDrops: 'Tomchilar',
    withFoodLabel: 'Ovqat bilan ichish (🍽️)',
    dosageLabel: 'Dozasi',
    unitLabel: 'Birligi',
    nameLabel: 'Nomi',
    formLabel: 'Turi',
    timeLabel: 'Ichish vaqti (Budilnik)',
    addTimeBtn: '+ Vaqt qoʻshish',
    photoLabel: '📸 Rasm (Havola yoki fayl)',
    deletePhoto: 'Rasmni oʻchirish',
    editMedTitle: 'Dorini tahrirlash',
    newMedTitle: 'Yangi dori',
    docCardTitle: 'Mutaxassis kartochkasi',
    workPlace: '🏥 Ish joyi:',
    educationTitle: '🎓 Maʼlumoti:',
    aboutDoc: '📝 Mutaxassis haqida:',
    statusDoc: 'MediChopa statusi',
    bookingTitle: 'Konsultatsiyaga yozilish',
    dateLabel: 'Sana',
    timeLabelInput: 'Vaqti',
    formatLabel: 'Formati',
    chatFormat: '💬 Chat orqali',
    videoFormat: '📹 Videobogʻlanish',
    audioFormat: '📞 Audiogovur',
    alarmTitle: 'Dori ichish vaqti keldi!',
    snoozeBtn: '⏳ 5 daqiqadan soʻng eslatish',
    takenBtn: '✓ Ichdim',
    deleteModalTitle: 'Dorini oʻchirasizmi?',
    deleteModalSub: 'Bu amal ushbu dorining barcha qabul qilish tarixini oʻchiradi.'
  },
  EN: {
    dashboard: 'Dashboard',
    medications: 'Medications',
    calendar: 'Calendar',
    consultation: 'Online Doctor Consultation',
    diary: 'Health Diary',
    about: 'About Project',
    sos: '🚨 Emergency SOS',
    demo: '✨ Load Demo Data',
    exportPdf: '📄 Export to PDF',
    tipOfDay: 'Tip of the Day',
    nextTip: 'Another tip 🔄',
    takenToday: 'Taken Today',
    pending: 'Pending',
    adherence: 'Adherence Rate',
    todaySchedule: 'Today’s Schedule',
    myMeds: 'My Medications',
    addMed: '+ Add Medication',
    call103: '📞 Call 103 (Ambulance)',
    call112: '🛡️ Emergency Service 112',
    progressTitle: 'Today’s Intake Progress',
    greeting: 'Good day 👋',
    all: 'All',
    taken: 'Taken',
    pendingStatus: 'Pending',
    noSchedule: 'No scheduled intakes for today.',
    searchMed: '🔍 Search medication by name...',
    noMeds: 'No medications yet. Add your first one.',
    notFound: 'Nothing found for your request',
    clearLogs: '🗑️ Clear history',
    calendarSub: 'All scheduled medication times',
    back: '← Back',
    forward: 'Forward →',
    diarySub: 'Track your symptoms and mood',
    newEntry: 'New Entry',
    moodLabel: 'Mood',
    severityLabel: 'Symptom Severity',
    symptomsLabel: 'Symptoms',
    notesLabel: 'Notes',
    notesPlaceholder: 'Anything else...',
    saveEntry: '+ Save Entry',
    dynamics: 'Dynamics',
    noChartData: 'No chart data yet',
    history: 'History',
    noEntries: 'No entries yet',
    consultSub: 'Smart assistant based on your diary and video calls with specialists',
    myBookings: 'My Scheduled Consultations',
    doctorsList: 'Specialist Doctors',
    bookBtn: 'Book',
    profileBtn: 'Profile',
    aiChatTitle: '🤖 Smart Chat Based on Your Diary',
    chatPlaceholder: 'Ask a doctor a question...',
    sendBtn: 'Send',
    trustedContact: '👨‍👩‍👧 Trusted Contact',
    edit: '✏️ Edit',
    delete: '🗑️ Delete',
    call: 'Call',
    saveContact: 'Save Contact',
    cancel: 'Cancel',
    close: 'Close',
    medMemo: 'Emergency Memo:',
    activeTherapy: 'Active Therapy:',
    formTablet: 'Tablets',
    formCapsule: 'Capsules',
    formSyrup: 'Syrup',
    formInjection: 'Injections',
    formDrops: 'Drops',
    withFoodLabel: 'Take with food (🍽️)',
    dosageLabel: 'Dosage',
    unitLabel: 'Unit',
    nameLabel: 'Name',
    formLabel: 'Form',
    timeLabel: 'Intake Time (Alarm)',
    addTimeBtn: '+ Add Time',
    photoLabel: '📸 Photo (URL or file)',
    deletePhoto: 'Delete photo',
    editMedTitle: 'Edit Medication',
    newMedTitle: 'New Medication',
    docCardTitle: 'Specialist Card',
    workPlace: '🏥 Workplace:',
    educationTitle: '🎓 Education:',
    aboutDoc: '📝 About Specialist:',
    statusDoc: 'MediChopa Status',
    bookingTitle: 'Book Consultation',
    dateLabel: 'Date',
    timeLabelInput: 'Time',
    formatLabel: 'Format',
    chatFormat: '💬 Chat consultation',
    videoFormat: '📹 Video call',
    audioFormat: '📞 Audio call',
    alarmTitle: 'Time to take your medication!',
    snoozeBtn: '⏳ Remind in 5 min',
    takenBtn: '✓ Taken',
    deleteModalTitle: 'Delete medication?',
    deleteModalSub: 'This action will also remove all intake history for this drug.'
  }
};

const HEALTH_TIPS = {
  RU: [
    '💧 Всегда запивайте таблетки достаточным количеством чистой воды комнатной температуры.',
    '🍊 Избегайте грейпфрутового сока при приеме многих препаратов: он может изменять их всасывание.',
    '⏰ Старайтесь принимать лекарства строго в одно и то же время для поддержания стабильной концентрации.',
    '📄 Всегда храните отчёт PDF для показа лечащему врачу на плановом приёме.',
    '☕ Не запивайте лекарства чаем или кофе — танины и кофеин могут снижать их эффективность.',
  ],
  KG: [
    '💧 Таблеткаларды дайыма бөлмө температурасындагы таза суу менен ичиңиз.',
    '🍊 Көптөгөн дарыларды ичүүдө грейпфрут ширесинен качыңыз: ал дарынын сорулуусун өзгөртүшү мүмкүн.',
    '⏰ Дарыларды туруктуу концентрацияда кармоо үчүн дайыма бир убакта ичүүгө аракет кылыңыз.',
    '📄 Пландаштырылган кабыл алууда дарыгерге көрсөтүү үчүн PDF отчетту сактап коюңуз.',
    '☕ Дарыларды чай же кофе менен ичпеңиз — таниндер жана кофеин алардын натыйжалуулугун төмөндөтүшү мүмкүн.',
  ],
  UZ: [
    '💧 Tabletkalarni doimo xona haroratidagi toza suv bilan iching.',
    '🍊 Koʻp dorilarni qabul qilishda greypfrut sharbatidan saqlaning: u dori soʻrilishini oʻzgartirishi mumkin.',
    '⏰ Doimiy konsentratsiyani saqlash uchun dorilarni qatʼiy bir vaqtda ichishga harakat qiling.',
    '📄 Shifokor koʻrigida koʻrsatish uchun PDF hisobotni doimo saqlab qoʻying.',
    '☕ Dorilarni choy yoki kofe bilan ichmang — taninlar va kofeina ularning taʼsirini kamaytirishi mumkin.',
  ],
  EN: [
    '💧 Always take pills with plenty of clean room-temperature water.',
    '🍊 Avoid grapefruit juice when taking medications as it can alter absorption.',
    '⏰ Try to take medications at the exact same time every day to maintain stable levels.',
    '📄 Keep your PDF report ready for your next doctor appointment.',
    '☕ Do not take medicines with tea or coffee — tannins and caffeine may reduce effectiveness.',
  ]
};

const DOCTORS = [
  { 
    id: 'd1', 
    name: 'Др. Асанова Айгуль Кубанычбековна', 
    spec: 'Терапевт / Врач общей практики', 
    exp: '14 лет', 
    rating: '4.9', 
    reviewsCount: 142,
    clinic: 'Медицинский центр КГМА им. И.К. Ахунбаева, г. Бишкек',
    education: 'КГМА им. И.К. Ахунбаева (Лечебное дело), ординатура в НЦКТиТ',
    about: 'Специализируется на комплексной диагностике внутренних органов, ведении хронических больных и подборе индивидуальных схем медикаментозной терапии.',
    photo: 'https://talapker.shailoo.gov.kg/media/candidate/%D1%84%D0%BE%D1%82%D0%BE_2025_ovzzO7u.jpg', 
    status: '🟢 Онлайн' 
  },
  { 
    id: 'd2', 
    name: 'Др. Бекбоев Азамат Алмазович', 
    spec: 'Кардиолог / Аритмолог', 
    exp: '18 лет', 
    rating: '5.0', 
    reviewsCount: 230,
    clinic: 'Национальный центр кардиологии и терапии им. академика М. Миррахимова',
    education: 'КРСУ им. Б.Н. Ельцина (Кардиология)',
    about: 'Эксперт в области профилактики и лечения артериальной гипертензии, ишемической болезни сердца и анализа совместимости сложных кардиопрепаратов.',
    photo: 'https://talapker.shailoo.gov.kg/media/candidate/%D0%98%D0%B1%D1%80%D0%B0%D0%B3%D0%B8%D0%BC%D0%BE%D0%B2_%D0%91.%D0%90.png', 
    status: '🟢 Онлайн' 
  },
  { 
    id: 'd3', 
    name: 'Др. Исмаилова Динара Нурлановна', 
    spec: 'Невролог / Сомнолог', 
    exp: '10 лет', 
    rating: '4.8', 
    reviewsCount: 108,
    clinic: 'Медицинский центр неврологии и эпилептологии «Кортекс», г. Бишкек',
    education: 'КГМА им. И.К. Ахунбаева (Неврология)',
    about: 'Специализируется на лечении головных болей, нарушений сна, вегетативных расстройств и коррекции ноотропной терапии.',
    photo: 'https://talapker.shailoo.gov.kg/media/candidate/dc114d12-b1af-44ff-b371-633cdc294692.jpg', 
    status: '🟡 На приёме' 
  },
  { 
    id: 'd4', 
    name: 'Др. Жумагулов Нурбек Болотбекович', 
    spec: 'Эндокринолог', 
    exp: '12 лет', 
    rating: '4.9', 
    reviewsCount: 125,
    clinic: 'Национальный госпиталь при МЗ КР (Отделение эндокринологии)',
    education: 'КГМА им. И.К. Ахунбаева (Эндокринология)',
    about: 'Эксперт по вопросам сахарного диабета, патологий щитовидной железы и метаболических нарушениях. Коррекция сахароснижающей терапии.',
    photo: 'https://talapker.shailoo.gov.kg/media/candidate/%D0%A4%D0%BE%D1%82%D0%BE.JPG', 
    status: '🟢 Онлайн' 
  },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const KNOWN_INTERACTIONS = [
  { a: 'warfarin', b: 'aspirin',   severity: 'high',   message: 'Повышенный риск кровотечения. Требуется контроль МНО.' },
  { a: 'ibuprofen', b: 'lisinopril', severity: 'medium', message: 'Возможно снижение эффекта от давления и нагрузка на почки.' },
  { a: 'metformin', b: 'alcohol',  severity: 'high',   message: 'Риск лактоацидоза. Избегайте алкоголя.' },
  { a: 'paracetamol', b: 'warfarin', severity: 'medium', message: 'Длительный приём усиливает антикоагулянтный эффект.' },
];

function checkInteractions(medNames) {
  const lower = medNames.map((n) => n.toLowerCase());
  const warnings = [];
  KNOWN_INTERACTIONS.forEach(({ a, b, severity, message }) => {
    const hasA = lower.some((n) => n.includes(a));
    const hasB = lower.some((n) => n.includes(b));
    if (hasA && hasB) warnings.push({ severity, drugs: [a, b], message });
  });
  return warnings;
}

function exportToPDF(meds, logs, diary) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MediChopa — Медицинский отчёт', 14, 20);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Сформировано: ${new Date().toLocaleString('ru-RU')} (StudEXPO-2026)`, 14, 40);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Лекарства', 14, 55);

  doc.autoTable({
    startY: 60,
    head: [['Название', 'Дозировка', 'Форма', 'Время приёма', 'Заметки']],
    body: meds.map((m) => [m.name, `${m.dosage} ${m.unit}`, m.form, m.times.join(', '), m.notes || '—']),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233] },
    styles: { font: 'helvetica', fontSize: 10 },
  });

  let y = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('История приёмов', 14, y);

  doc.autoTable({
    startY: y + 5,
    head: [['Дата', 'Лекарство', 'Время', 'Статус']],
    body: logs.slice(-20).map((log) => {
      const med = meds.find((m) => m.id === log.medId);
      return [
        log.scheduledAt.split('T')[0],
        med?.name || '—',
        log.scheduledAt.split('T')[1].slice(0, 5),
        log.status === 'taken' ? 'Принято' : 'Пропущено',
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233] },
    styles: { font: 'helvetica', fontSize: 10 },
  });

  doc.save(`medichopa-report-${Date.now()}.pdf`);
}

function SosModal({ open, onClose, meds, lang, contact, setContact }) {
  if (!open) return null;
  const t = I18N[lang];
  const medList = meds.map(m => m.name).join(', ') || (lang === 'KG' ? 'Көрсөтүлгөн эмес' : lang === 'UZ' ? 'Koʻrsatilmagan' : 'Not specified');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(contact?.name || '');
  const [phoneInput, setPhoneInput] = useState(contact?.phone || '');

  useEffect(() => {
    setNameInput(contact?.name || '');
    setPhoneInput(contact?.phone || '');
  }, [contact, open]);

  const handleSaveContact = (e) => {
    e.preventDefault();
    setContact({ name: nameInput.trim(), phone: phoneInput.trim() });
    setEditing(false);
  };

  const handleDeleteContact = () => {
    setContact({ name: '', phone: '' });
    setNameInput('');
    setPhoneInput('');
    setEditing(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, borderTop: '6px solid #dc2626', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚨</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{t.sos}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <a href="tel:103" className="btn-primary" style={{ background: '#dc2626', color: '#fff', justifyContent: 'center', padding: '14px', fontSize: 15, fontWeight: 700, textDecoration: 'none', borderRadius: 10 }}>
            {t.call103}
          </a>
          <a href="tel:112" className="btn-ghost" style={{ justifyContent: 'center', padding: '12px', fontSize: 14, fontWeight: 600, textDecoration: 'none', borderColor: '#dc2626', color: '#dc2626' }}>
            {t.call112}
          </a>
        </div>

        <div style={{ background: 'var(--primary-50)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-800)' }}>{t.trustedContact}</span>
            {contact?.phone && !editing && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: 11, padding: '2px 8px' }}>{t.edit}</button>
                <button className="btn-ghost" onClick={handleDeleteContact} style={{ fontSize: 11, padding: '2px 8px', color: 'var(--red-500)', borderColor: 'var(--red-500)' }}>{t.delete}</button>
              </div>
            )}
          </div>

          {editing || !contact?.phone ? (
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <input type="text" className="input" placeholder={lang === 'KG' ? "Аты (мисалы, Апам)" : lang === 'UZ' ? "Ismi (masalan, Onam)" : "Name (e.g. Mom)"} value={nameInput} onChange={(e) => setNameInput(e.target.value)} required />
              <input type="tel" className="input" placeholder="+996..." value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} required />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: 12, padding: '6px' }}>{t.saveContact}</button>
                {contact?.phone && <button type="button" className="btn-ghost" onClick={() => setEditing(false)} style={{ fontSize: 12, padding: '6px' }}>{t.cancel}</button>}
              </div>
            </form>
          ) : (
            <div style={{ fontSize: 13, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><b>{contact.name}:</b> {contact.phone}</span>
                <a href={`tel:${contact.phone}`} className="btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}>{t.call}</a>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
          <b>{t.medMemo}</b><br/>
          💊 {t.activeTherapy} <b>{medList}</b>.
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>{t.close}</button>
        </div>
      </div>
    </div>
  );
}

function AlarmModal({ alarm, onTake, onSnooze, lang }) {
  if (!alarm) return null;
  const t = I18N[lang];
  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}>
      <div className="modal" style={{ maxWidth: 420, textAlign: 'center', padding: '32px 24px', border: '2px solid var(--primary-500)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-600)', marginBottom: 4 }}>{t.alarmTitle}</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{alarm.med.name}</div>
        <div style={{ fontSize: 15, color: 'var(--slate-600)', marginBottom: 8 }}>
          {alarm.med.dosage} {alarm.med.unit} · {alarm.med.withFood ? (lang === 'KG' ? '🍽️ Тамак менен' : lang === 'UZ' ? '🍽️ Ovqat bilan' : '🍽️ With food') : (lang === 'KG' ? '☕ Ач карын' : lang === 'UZ' ? '☕ Och qoringa' : '☕ On empty stomach')}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn-ghost" onClick={onSnooze} style={{ flex: 1 }}>{t.snoozeBtn}</button>
          <button type="button" className="btn-primary" onClick={onTake} style={{ flex: 1, justifyContent: 'center' }}>{t.takenBtn}</button>
        </div>
      </div>
    </div>
  );
}

function AboutModal({ open, onClose, lang }) {
  if (!open) return null;
  const t = I18N[lang];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, padding: 24 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>💊</span>
            <span>MediChopa — StudEXPO-2026</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          <div style={{ background: 'var(--primary-50)', padding: 14, borderRadius: 12, border: '1px solid var(--primary-100)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary-800)', marginBottom: 4 }}>
              🎓 {lang === 'KG' ? 'Долбоордун автору жана иштеп чыгуучусу' : lang === 'UZ' ? 'Loyiha muallifi va dasturchisi' : 'Author and Developer'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-800)' }}>
              Чолпонай Токтобекова / Cholponai Toktobekova
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)', marginTop: 2 }}>
              {lang === 'KG' ? 'И. Арабаев атындагы КМУ' : lang === 'UZ' ? 'I. Arabayev nomidagi QDU' : 'Kyrgyz State University named after I. Arabaev'}
            </div>
          </div>

          <div>
            <p style={{ margin: 0 }}>
              <b>MediChopa</b> — {lang === 'KG' ? 'дарыларды убагында кабыл алууну көзөмөлдөө жана дарыгерлер менен байланышуу платформасы.' : lang === 'UZ' ? 'dorilarni oʻz vaqtida qabul qilish va shifokorlar bilan bogʻlanish platformasi.' : 'a web platform for medication compliance tracking and doctor consultations.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--slate-500)', borderTop: '1px dashed var(--border-color)', paddingTop: 10 }}>
            <span>🏛️ Выставка: <b>StudEXPO-2026</b></span>
            <span>📍 Бишкек, Кыргызстан</span>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ open, onConfirm, onClose, lang }) {
  if (!open) return null;
  const t = I18N[lang];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.deleteModalTitle}</div>
        <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 20 }}>{t.deleteModalSub}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>{t.cancel}</button>
          <button type="button" className="btn-primary" onClick={onConfirm} style={{ flex: 1, background: 'var(--red-500)' }}>{t.delete}</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, onOpenAbout, missedCount, lang }) {
  const t = I18N[lang];
  const nav = [
    { id: 'dashboard',   label: t.dashboard,   icon: '📊', badge: missedCount > 0 ? missedCount : null },
    { id: 'medications', label: t.medications, icon: '💊' },
    { id: 'calendar',    label: t.calendar,    icon: '📅' },
    { id: 'consultation',label: t.consultation,icon: '👨‍⚕️' },
    { id: 'diary',       label: t.diary,       icon: '📓' },
  ];
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <div>
            <div className="logo-title">MediChopa</div>
            <div className="logo-subtitle">StudEXPO-2026</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((n) => (
            <button
              key={n.id}
              className={`sidebar-link ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span>{n.icon}</span> <span style={{ fontSize: 13 }}>{n.label}</span>
              </span>
              {n.badge && (
                <span style={{
                  background: 'var(--red-500)', color: '#fff',
                  fontSize: 11, fontWeight: 600, padding: '2px 6px',
                  borderRadius: '10px', minWidth: 18, textAlign: 'center'
                }}>
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ padding: '8px 0' }}>
        <button className="sidebar-link" onClick={onOpenAbout} style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
          <span>ℹ️</span> {t.about}
        </button>
      </div>
    </aside>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function InteractionAlert({ warning }) {
  return (
    <div className={`interaction-alert ${warning.severity}`}>
      <div style={{ fontSize: 18 }}>⚠️</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
          {warning.drugs[0]} + {warning.drugs[1]}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{warning.message}</div>
      </div>
    </div>
  );
}

function MedicationCard({ med, onRequestDelete, onEdit, lang }) {
  const t = I18N[lang];
  const formMap = {
    tablet: t.formTablet,
    capsule: t.formCapsule,
    syrup: t.formSyrup,
    injection: t.formInjection,
    drops: t.formDrops
  };
  return (
    <div className="med-card">
      <div className="med-top">
        <div className="med-info">
          {med.photoUrl ? (
            <img src={med.photoUrl} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--primary-100)' }} />
          ) : (
            <div className="med-avatar" style={{ background: med.color }}>
              {med.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="med-name">{med.name}</div>
            <div className="med-meta">
              {med.dosage} {med.unit} · {formMap[med.form]} {med.withFood ? (lang === 'KG' ? '· 🍽️ Тамак менен' : lang === 'UZ' ? '· 🍽️ Ovqat bilan' : '· 🍽️ With food') : (lang === 'KG' ? '· ☕ Ач карын' : lang === 'UZ' ? '· ☕ Och qoringa' : '· ☕ Empty stomach')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="delete-btn" onClick={() => onEdit(med)} style={{ color: 'var(--primary-600)', fontSize: 14 }}>✏️</button>
          <button className="delete-btn" onClick={() => onRequestDelete(med.id)}>✕</button>
        </div>
      </div>
      {med.notes && (
        <div style={{ fontSize: 12, color: 'var(--slate-600)', background: 'var(--primary-50)', padding: '6px 10px', borderRadius: 6, marginBottom: 8, fontStyle: 'italic' }}>
          📝 {med.notes}
        </div>
      )}
      <div className="med-times">
        {med.times.map((timeItem) => (
          <span key={timeItem} className="time-chip">🕐 {timeItem}</span>
        ))}
      </div>
    </div>
  );
}

function AddMedModal({ open, onClose, onSave, editingMed, lang }) {
  const t = I18N[lang];
  const COLORS = ['#0ea5e9', '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6'];
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('мг');
  const [form, setForm] = useState('tablet');
  const [times, setTimes] = useState(['08:00']);
  const [withFood, setWithFood] = useState(false);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name || '');
      setDosage(editingMed.dosage || '');
      setUnit(editingMed.unit || 'мг');
      setForm(editingMed.form || 'tablet');
      setTimes(editingMed.times || ['08:00']);
      setWithFood(!!editingMed.withFood);
      setNotes(editingMed.notes || '');
      setColor(editingMed.color || COLORS[0]);
      setPhotoUrl(editingMed.photoUrl || '');
    } else {
      setName(''); setDosage(''); setTimes(['08:00']); setNotes('');
      setWithFood(false); setColor(COLORS[0]); setForm('tablet'); setUnit('мг'); setPhotoUrl('');
    }
  }, [editingMed, open]);

  if (!open) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => setPhotoUrl(uploadEvent.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;
    onSave({
      id: editingMed ? editingMed.id : uid(),
      name: name.trim(), dosage: dosage.trim(), unit, form,
      times, withFood, notes: notes.trim(), color, photoUrl,
      startDate: editingMed ? editingMed.startDate : new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const formOptions = [
    { val: 'tablet', label: t.formTablet },
    { val: 'capsule', label: t.formCapsule },
    { val: 'syrup', label: t.formSyrup },
    { val: 'injection', label: t.formInjection },
    { val: 'drops', label: t.formDrops },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">{editingMed ? t.editMedTitle : t.newMedTitle}</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.nameLabel}</label>
            <input className="input" placeholder="Аспирин" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t.dosageLabel}</label>
              <input className="input" placeholder="500" value={dosage} onChange={(e) => setDosage(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t.unitLabel}</label>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option>мг</option><option>мл</option><option>г</option><option>капли</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.formLabel}</label>
            <div className="chip-row">
              {formOptions.map((item) => (
                <button key={item.val} type="button" className={`chip ${form === item.val ? 'active' : ''}`} onClick={() => setForm(item.val)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.timeLabel}</label>
            {times.map((timeVal, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="time" className="input" value={timeVal} onChange={(e) => {
                  const next = [...times]; next[index] = e.target.value; setTimes(next);
                }} />
                {times.length > 1 && (
                  <button type="button" className="delete-btn" onClick={() => setTimes(times.filter((_, j) => j !== index))}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={() => setTimes([...times, '12:00'])}>{t.addTimeBtn}</button>
          </div>
          
          <div className="form-group">
            <label className="form-label">{t.photoLabel}</label>
            {photoUrl && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <img src={photoUrl} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} alt="Preview" />
                <button type="button" className="btn-ghost" onClick={() => setPhotoUrl('')} style={{ fontSize: 12, color: 'var(--red-500)' }}>{t.deletePhoto}</button>
              </div>
            )}
            <input 
              type="text" 
              className="input" 
              placeholder="https://... (прямая ссылка на фото)" 
              value={photoUrl.startsWith('data:') ? '' : photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
              style={{ marginBottom: 8 }}
            />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: 13 }} />
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={withFood} onChange={(e) => setWithFood(e.target.checked)} />
              {t.withFoodLabel}
            </label>
            <div className="color-dots">
              {COLORS.map((c) => (
                <button key={c} type="button" className={`color-dot ${color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary">{lang === 'KG' ? 'Сактоо' : lang === 'UZ' ? 'Saqlash' : 'Сохранить'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ meds, logs, onRequestDeleteMed, onEditMed, markTaken, getTodaySchedule, diary, loadDemoData, isDark, toggleTheme, onSosClick, onOpenAdd, lang, setLang }) {
  const t = I18N[lang];
  const [warnings, setWarnings] = useState([]);
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [tipIndex, setTipIndex] = useState(0);

  const schedule = getTodaySchedule();
  const taken   = schedule.filter((s) => s.status === 'taken').length;
  const pending = schedule.filter((s) => s.status !== 'taken').length;
  const total = schedule.length;
  const progressPercent = total > 0 ? Math.round((taken / total) * 100) : 0;

  const filteredSchedule = schedule.filter(item => {
    if (scheduleFilter === 'pending') return item.status !== 'taken';
    if (scheduleFilter === 'taken') return item.status === 'taken';
    return true;
  });

  const adherenceRate = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    const takenCount = logs.filter(l => l.status === 'taken').length;
    return Math.round((takenCount / logs.length) * 100);
  }, [logs]);

  useEffect(() => {
    if (meds.length < 2) { setWarnings([]); return; }
    setWarnings(checkInteractions(meds.map((m) => m.name)));
  }, [meds]);

  const localeCode = lang === 'KG' ? 'ky-KG' : lang === 'UZ' ? 'uz-UZ' : lang === 'EN' ? 'en-US' : 'ru-RU';
  const today = new Date().toLocaleDateString(localeCode, {
    day: 'numeric', month: 'long', weekday: 'long',
  });

  const currentTips = HEALTH_TIPS[lang] || HEALTH_TIPS.RU;
  const nextTip = () => setTipIndex((prev) => (prev + 1) % currentTips.length);

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <h2 className="page-title">{t.greeting}</h2>
          <p className="text-muted">{today}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            className="btn-ghost" 
            onClick={() => {
              if (lang === 'RU') setLang('KG');
              else if (lang === 'KG') setLang('UZ');
              else if (lang === 'UZ') setLang('EN');
              else setLang('RU');
            }} 
            style={{ fontWeight: 700, padding: '8px 12px' }}
          >
            🌐 {lang === 'RU' ? 'Русский' : lang === 'KG' ? 'Кыргызча' : lang === 'UZ' ? "Oʻzbekcha" : "English"}
          </button>
          <button className="btn-primary" onClick={onSosClick} style={{ background: '#dc2626', animation: 'pulse 2s infinite', fontWeight: 700 }}>
            {t.sos}
          </button>
          <button className="btn-ghost" onClick={toggleTheme} style={{ padding: '8px 12px' }}>{isDark ? '☀️' : '🌙'}</button>
          {meds.length === 0 && <button className="btn-accent" onClick={loadDemoData}>{t.demo}</button>}
          <button className="btn-primary" onClick={() => exportToPDF(meds, logs, diary)}>{t.exportPdf}</button>
        </div>
      </div>

      {total > 0 && (
        <div className="card mb-6" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            <span>📊 {t.progressTitle}</span>
            <span>{taken} / {total} ({progressPercent}%)</span>
          </div>
          <div style={{ width: '100%', background: 'var(--primary-100)', height: 10, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, background: 'var(--emerald-500)', height: '100%', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      <div className="card mb-6" style={{ background: isDark ? '#1e293b' : 'var(--primary-50)', borderColor: 'var(--primary-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 24 }}>💡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.tipOfDay}</div>
            <p style={{ fontSize: 13, color: 'var(--slate-700)', marginTop: 2 }}>{currentTips[tipIndex % currentTips.length]}</p>
          </div>
        </div>
        <button className="btn-ghost" onClick={nextTip} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{t.nextTip}</button>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6">
          {warnings.map((w, i) => <InteractionAlert key={i} warning={w} />)}
        </div>
      )}

      <div className="stats">
        <StatCard icon="✓" label={t.takenToday} value={taken} color="emerald" />
        <StatCard icon="⏰" label={t.pending} value={pending} color="primary" />
        <StatCard icon="📈" label={t.adherence} value={`${adherenceRate}%`} color="emerald" />
      </div>

      <div className="grid-2">
        <div>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t.todaySchedule}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`chip ${scheduleFilter === 'all' ? 'active' : ''}`} onClick={() => setScheduleFilter('all')} style={{ fontSize: 11, padding: '4px 8px' }}>{t.all}</button>
              <button className={`chip ${scheduleFilter === 'pending' ? 'active' : ''}`} onClick={() => setScheduleFilter('pending')} style={{ fontSize: 11, padding: '4px 8px' }}>{t.pendingStatus}</button>
              <button className={`chip ${scheduleFilter === 'taken' ? 'active' : ''}`} onClick={() => setScheduleFilter('taken')} style={{ fontSize: 11, padding: '4px 8px' }}>{t.taken}</button>
            </div>
          </div>

          {filteredSchedule.length === 0 ? (
            <div className="empty-state">{t.noSchedule}</div>
          ) : filteredSchedule.map((item) => {
            const med = meds.find((m) => m.id === item.medId);
            if (!med) return null;
            const time = item.scheduledAt.split('T')[1].slice(0, 5);
            return (
              <div key={item.id} className={`schedule-item ${item.status}`}>
                <div className="schedule-left">
                  <div className="schedule-time">{time}</div>
                  <div>
                    <div className="schedule-name">{med.name}</div>
                    <div className="schedule-dosage">{med.dosage} {med.unit}</div>
                  </div>
                </div>
                {item.status === 'taken' ? (
                  <span className="status-taken">✓ {t.taken}</span>
                ) : (
                  <button className="btn-primary" onClick={() => markTaken(med.id, item.scheduledAt)}>{t.takenBtn}</button>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <div className="section-title">
            {t.myMeds} ({meds.length})
            <button className="add-btn" onClick={onOpenAdd}>+</button>
          </div>
          {meds.length === 0 ? (
            <div className="empty-state">{t.noMeds}</div>
          ) : (
            meds.map((med) => (
              <MedicationCard key={med.id} med={med} onRequestDelete={onRequestDeleteMed} onEdit={onEditMed} lang={lang} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Medications({ meds, onRequestDeleteMed, onEditMed, onOpenAdd, lang }) {
  const t = I18N[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const filteredMeds = meds.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h2 className="page-title">{t.myMeds}</h2>
        </div>
        <button className="btn-primary" onClick={onOpenAdd}>{t.addMed}</button>
      </div>

      <input type="text" className="input mb-4" placeholder={t.searchMed} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

      {filteredMeds.length === 0 ? (
        <div className="empty-state">{t.notFound}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredMeds.map((m) => <MedicationCard key={m.id} med={m} onRequestDelete={onRequestDeleteMed} onEdit={onEditMed} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

function CalendarPage({ meds, lang }) {
  const t = I18N[lang];
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const localeCode = lang === 'KG' ? 'ky-KG' : lang === 'UZ' ? 'uz-UZ' : lang === 'EN' ? 'en-US' : 'ru-RU';
  const monthName = current.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' });

  const eventsByDay = useMemo(() => {
    const map = {};
    meds.forEach((med) => {
      const start = new Date(med.startDate || todayStr);
      const end = new Date(start.getTime() + 30 * 864e5);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        med.times.forEach((timeVal) => {
          map[key].push({ id: `${med.id}-${timeVal}`, time: timeVal, name: med.name, color: med.color || '#0ea5e9' });
        });
      }
    });
    return map;
  }, [meds]);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ other: true, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      other: false,
      day: d,
      key,
      isToday: key === todayStr,
      events: (eventsByDay[key] || []).sort((a, b) => a.time.localeCompare(b.time)),
    });
  }
  while (cells.length % 7 !== 0) cells.push({ other: true, day: null });

  const weekdays = lang === 'KG' ? ['Дүй', 'Шей', 'Шар', 'Бей', 'Жум', 'Ише', 'Жек'] : lang === 'UZ' ? ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'] : lang === 'EN' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div>
      <h2 className="page-title">{t.calendar}</h2>
      <p className="page-sub">{t.calendarSub}</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn-ghost" onClick={() => setCurrent(new Date(year, month - 1, 1))}>{t.back}</button>
          <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>{monthName}</div>
          <button className="btn-ghost" onClick={() => setCurrent(new Date(year, month + 1, 1))}>{t.forward}</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, fontWeight: 600, fontSize: 13, color: 'var(--slate-500)' }}>
          {weekdays.map((w) => <div key={w} style={{ textAlign: 'center' }}>{w}</div>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {cells.map((c, i) => (
            <div key={i} style={{
              minHeight: 70, padding: 6, border: '1px solid var(--border-color)', borderRadius: 8,
              background: c.other ? 'transparent' : (c.isToday ? 'var(--primary-50)' : 'var(--bg-card)'),
              opacity: c.other ? 0.3 : 1
            }}>
              {c.day && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{c.day}</div>}
              {c.events && c.events.slice(0, 2).map((e, j) => (
                <div key={j} style={{ background: e.color, color: '#fff', fontSize: 10, padding: '2px 4px', borderRadius: 4, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.time} {e.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiaryPage({ entries, addEntry, removeEntry, lang }) {
  const t = I18N[lang];
  const MOODS = [
    { value: 1, emoji: '😢' }, { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' }, { value: 4, emoji: '🙂' }, { value: 5, emoji: '😄' },
  ];
  const SYMPTOMS = lang === 'KG' 
    ? ['Баш оору', 'Көңүл айнуу', 'Баш айлануу', 'Чарчоо', 'Ич оору', 'Уйкусуздук', 'Алсыздануу']
    : lang === 'UZ'
    ? ['Bosh ogʻrigʻi', 'Koʻngil aynishi', 'Bosh aylanishi', 'Charchoq', 'Qorin ogʻrigʻi', 'Uyqusizlik', 'Holsizlik']
    : lang === 'EN'
    ? ['Headache', 'Nausea', 'Dizziness', 'Fatigue', 'Abdominal pain', 'Insomnia', 'Weakness']
    : ['Головная боль', 'Тошнота', 'Головокружение', 'Усталость', 'Боль в животе', 'Бессонница', 'Слабость'];

  const [mood, setMood] = useState(3);
  const [severity, setSeverity] = useState(3);
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const toggleSymptom = (s) => setSymptoms((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addEntry({ mood, severity, symptoms, notes });
    setMood(3); setSeverity(3); setSymptoms([]); setNotes('');
  };

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();

    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const localeCode = lang === 'KG' ? 'ky-KG' : lang === 'UZ' ? 'uz-UZ' : lang === 'EN' ? 'en-US' : 'ru-RU';

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: sorted.map((e) => new Date(e.date).toLocaleDateString(localeCode, { day: 'numeric', month: 'short' })),
        datasets: [
          { label: t.moodLabel, data: sorted.map((e) => e.mood), borderColor: '#0ea5e9', fill: false, tension: 0.3 },
          { label: t.severityLabel, data: sorted.map((e) => e.severity), borderColor: '#f59e0b', fill: false, tension: 0.3 }
        ],
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    return () => chartRef.current && chartRef.current.destroy();
  }, [entries, lang]);

  return (
    <div>
      <h2 className="page-title">{t.diary}</h2>
      <p className="page-sub">{t.diarySub}</p>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t.newEntry}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.moodLabel}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {MOODS.map((m) => (
                  <button key={m.value} type="button" className={`chip ${mood === m.value ? 'active' : ''}`} onClick={() => setMood(m.value)} style={{ fontSize: 20 }}>
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.severityLabel}: {severity}/10</label>
              <input type="range" min="0" max="10" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.symptomsLabel}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SYMPTOMS.map((s) => (
                  <button key={s} type="button" className={`chip ${symptoms.includes(s) ? 'active' : ''}`} onClick={() => toggleSymptom(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.notesLabel}</label>
              <textarea className="input" rows="2" placeholder={t.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t.saveEntry}</button>
          </form>
        </div>

        <div>
          <div className="card mb-4">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t.dynamics}</h3>
            <div style={{ height: 200, position: 'relative' }}>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t.history} ({entries.length})</h3>
            {entries.length === 0 ? <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>{t.noEntries}</p> : (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...entries].reverse().map((e) => (
                  <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <div>
                      <div><b>{new Date(e.date).toLocaleDateString()}</b> · {t.moodLabel}: {e.mood}/5</div>
                      {e.symptoms?.length > 0 && <div style={{ color: 'var(--slate-500)' }}>{e.symptoms.join(', ')}</div>}
                    </div>
                    <button className="delete-btn" onClick={() => removeEntry(e.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationPage({ meds, diary, bookings, setBookings, lang }) {
  const t = I18N[lang];
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [profileDoc, setProfileDoc] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingFormat, setBookingFormat] = useState(t.chatFormat);

  const getInitialGreeting = () => {
    if (!diary || diary.length === 0) {
      return lang === 'KG'
        ? 'Саламатсызбы! Мен MediChopa AI-ассистентимин. Сурооңузду бериңиз.'
        : lang === 'UZ'
        ? 'Assalomu alaykum! Men MediChopa AI-yordamchisiman. Savolingizni berishingiz mumkin.'
        : lang === 'EN'
        ? 'Hello! I am MediChopa AI Assistant. Ask me any question.'
        : 'Здравствуйте! Я интеллектуальный ассистент MediChopa. Задайте мне любой вопрос.';
    }
    const lastEntry = diary[diary.length - 1];
    return lang === 'KG'
      ? `Саламатсызбы! Күндөлүк боюнча: маанайыңыз ${lastEntry.mood}/5, оору деңгээли ${lastEntry.severity}/10.`
      : lang === 'UZ'
      ? `Assalomu alaykum! Kundalik boʻyicha: kayfiyatingiz ${lastEntry.mood}/5, ogʻriq darajasi ${lastEntry.severity}/10.`
      : lang === 'EN'
      ? `Hello! Based on diary: mood ${lastEntry.mood}/5, severity ${lastEntry.severity}/10.`
      : `Здравствуйте! По последней записи: настроение ${lastEntry.mood}/5, тяжесть ${lastEntry.severity}/10. Чем помочь?`;
  };

  const [messages, setMessages] = useState([{ sender: 'doctor', text: getInitialGreeting() }]);
  const [inputMsg, setInputMsg] = useState('');

  const analyzeDiaryAndAnswer = (userText) => {
    const medList = meds.map(m => m.name).join(', ') || (lang === 'KG' ? 'дарылар жок' : lang === 'UZ' ? 'dorilar yoʻq' : lang === 'EN' ? 'no active meds' : 'нет препаратов');
    return lang === 'KG'
      ? `Сурооңуз кабыл алынды. Активдүү дарылар: ${medList}.`
      : lang === 'UZ'
      ? `Soʻrovingiz qabul qilindi. Faol dorilar: ${medList}.`
      : lang === 'EN'
      ? `Request received. Active medications: ${medList}.`
      : `Ваш запрос принят. Текущие препараты: ${medList}.`;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const userText = inputMsg.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setTimeout(() => {
      const reply = analyzeDiaryAndAnswer(userText);
      setMessages((prev) => [...prev, { sender: 'doctor', text: reply }]);
    }, 600);
  };

  const handleBook = (e) => {
    e.preventDefault();
    setBookings((prev) => [{ id: uid(), docName: selectedDoc.name, date: bookingDate, time: bookingTime, format: bookingFormat }, ...prev]);
    setSelectedDoc(null);
  };

  return (
    <div>
      <h2 className="page-title">{t.consultation}</h2>
      <p className="page-sub">{t.consultSub}</p>

      {bookings.length > 0 && (
        <div className="mb-6">
          <div className="section-title">{t.myBookings} ({bookings.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {bookings.map((b) => (
              <div key={b.id} className="card" style={{ padding: 12, borderLeft: '4px solid var(--primary-500)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{b.docName}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{b.date} / {b.time} · {b.format}</div>
                <button className="delete-btn" onClick={() => setBookings(bookings.filter(x => x.id !== b.id))} style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4 }}>{t.delete}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div>
          <div className="section-title">{t.doctorsList}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DOCTORS.map((doc) => (
              <div key={doc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={doc.photo} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{doc.spec}</div>
                    <div style={{ fontSize: 11, color: 'var(--emerald-600)', marginTop: 2 }}>{doc.status} · ⭐ {doc.rating}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-primary" onClick={() => setSelectedDoc(doc)} style={{ fontSize: 11, padding: '4px 8px' }}>{t.bookBtn}</button>
                  <button className="btn-ghost" onClick={() => setProfileDoc(doc)} style={{ fontSize: 11, padding: '4px 8px' }}>{t.profileBtn}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">{t.aiChatTitle}</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 380, padding: 12 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? 'var(--primary-500)' : 'var(--primary-50)',
                  color: m.sender === 'user' ? '#fff' : 'var(--slate-800)',
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, maxWidth: '85%', lineHeight: 1.4
                }}>
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input type="text" className="input" placeholder={t.chatPlaceholder} value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} />
              <button type="submit" className="btn-primary">{t.sendBtn}</button>
            </form>
          </div>
        </div>
      </div>

      {profileDoc && (
        <div className="modal-backdrop" onClick={() => setProfileDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div className="modal-title">{t.docCardTitle}</div>
              <button className="close-btn" onClick={() => setProfileDoc(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src={profileDoc.photo} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid var(--primary-500)' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>{profileDoc.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 600 }}>{profileDoc.spec}</p>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>
                ⭐ {profileDoc.rating} ({profileDoc.reviewsCount} reviews) · Exp: {profileDoc.exp}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--slate-700)', lineHeight: 1.5 }}>
              <div style={{ background: 'var(--primary-50)', padding: 10, borderRadius: 8 }}>
                <b>{t.workPlace}</b><br/>{profileDoc.clinic}
              </div>
              <div style={{ background: 'var(--primary-50)', padding: 10, borderRadius: 8 }}>
                <b>{t.educationTitle}</b><br/>{profileDoc.education}
              </div>
              <div>
                <b>{t.aboutDoc}</b><br/>{profileDoc.about}
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setProfileDoc(null)} style={{ flex: 1 }}>{t.close}</button>
              <button className="btn-primary" onClick={() => { setSelectedDoc(profileDoc); setProfileDoc(null); }} style={{ flex: 1 }}>{t.bookBtn}</button>
            </div>
          </div>
        </div>
      )}

      {selectedDoc && (
        <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">{t.bookingTitle}: {selectedDoc.name}</div>
              <button className="close-btn" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">{t.dateLabel}</label>
                <input type="date" className="input" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t.timeLabelInput}</label>
                <input type="time" className="input" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t.formatLabel}</label>
                <select className="input" value={bookingFormat} onChange={(e) => setBookingFormat(e.target.value)}>
                  <option>{t.chatFormat}</option>
                  <option>{t.videoFormat}</option>
                  <option>{t.audioFormat}</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setSelectedDoc(null)}>{t.cancel}</button>
                <button type="submit" className="btn-primary">{t.bookBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [page, setPage] = useState('dashboard');
  const [meds, setMeds] = useState(() => loadJSON(MEDS_KEY, []));
  const [logs, setLogs] = useState(() => loadJSON(LOGS_KEY, []));
  const [diary, setDiary] = useState(() => loadJSON(DIARY_KEY, []));
  const [bookings, setBookings] = useState(() => loadJSON(BOOKINGS_KEY, []));
  const [isDark, setIsDark] = useState(() => loadJSON(THEME_KEY, false));
  const [lang, setLang] = useState(() => loadJSON(LANG_KEY, 'RU'));
  const [contact, setContact] = useState(() => loadJSON(CONTACT_KEY, { name: 'Мама', phone: '+996508847375' }));
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const triggeredAlarmsRef = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDate = now.toISOString().split('T')[0];

      meds.forEach((med) => {
        med.times.forEach((timeVal) => {
          if (timeVal === currentHHMM) {
            const alarmKey = `${med.id}-${todayDate}-${timeVal}`;
            if (!triggeredAlarmsRef.current.has(alarmKey)) {
              triggeredAlarmsRef.current.add(alarmKey);
              playSound('alarm');
              const msgBody = `${med.dosage} ${med.unit} · ${med.withFood ? '🍽️ Food' : '☕ Empty'}`;
              sendSystemNotification(`⏰ Time for: ${med.name}`, msgBody);
              setActiveAlarm({ med, time: timeVal });
            }
          }
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [meds]);

  useEffect(() => saveJSON(MEDS_KEY, meds), [meds]);
  useEffect(() => saveJSON(LOGS_KEY, logs), [logs]);
  useEffect(() => saveJSON(DIARY_KEY, diary), [diary]);
  useEffect(() => saveJSON(BOOKINGS_KEY, bookings), [bookings]);
  useEffect(() => saveJSON(LANG_KEY, lang), [lang]);
  useEffect(() => saveJSON(CONTACT_KEY, contact), [contact]);
  useEffect(() => {
    saveJSON(THEME_KEY, isDark);
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [isDark]);

  const saveMed = (medData) => {
    setMeds((prev) => {
      const exists = prev.some((m) => m.id === medData.id);
      if (exists) return prev.map((m) => m.id === medData.id ? medData : m);
      return [...prev, medData];
    });
    setEditingMed(null);
  };

  const confirmDeleteMed = () => {
    if (!deleteId) return;
    setMeds((s) => s.filter((m) => m.id !== deleteId));
    setLogs((s) => s.filter((l) => l.medId !== deleteId));
    setDeleteId(null);
  };

  // Ровно 5 лекарств для демо-режима
  const loadDemoData = () => {
    const today = new Date().toISOString().split('T')[0];
    const isKg = lang === 'KG';
    const isUz = lang === 'UZ';
    const isEn = lang === 'EN';

    const demoMeds = [
      { id: 'demo1', name: 'Аспирин', dosage: '100', unit: 'мг', form: 'tablet', times: ['09:00'], withFood: true, notes: isEn ? 'Take with water' : isUz ? 'Suv bilan ichish' : isKg ? 'Суу менен ичүү' : 'Запивать водой', color: '#0ea5e9', startDate: today, photoUrl: '' },
      { id: 'demo2', name: 'Варфарин', dosage: '2.5', unit: 'мг', form: 'tablet', times: ['18:00'], withFood: false, notes: isEn ? 'Control MNO' : isUz ? 'MNO nazorati' : isKg ? 'МНО көзөмөлдөө' : 'Контроль МНО', color: '#f59e0b', startDate: today, photoUrl: '' },
      { id: 'demo3', name: 'Омепразол', dosage: '20', unit: 'мг', form: 'capsule', times: ['08:30'], withFood: false, notes: isEn ? 'Before meals' : isUz ? 'Ovqatdan oldin' : isKg ? 'Тамакка чейин' : 'До еды', color: '#10b981', startDate: today, photoUrl: '' },
      { id: 'demo4', name: 'Парацетамол', dosage: '500', unit: 'мг', form: 'tablet', times: ['14:00'], withFood: true, notes: isEn ? 'If fever occurs' : isUz ? 'Isitma chiqqanda' : isKg ? 'Ысытма чыкканда' : 'При температуре', color: '#38bdf8', startDate: today, photoUrl: '' },
      { id: 'demo5', name: 'Магне B6', dosage: '1', unit: 'г', form: 'tablet', times: ['21:00'], withFood: true, notes: isEn ? 'Before bed' : isUz ? 'Kechqurun' : isKg ? 'Кечинде' : 'Перед сном', color: '#8b5cf6', startDate: today, photoUrl: '' },
    ];
    setMeds(demoMeds);
    setLogs([]);
    setDiary([
      { id: 'd1', date: new Date().toISOString(), mood: 4, severity: 2, symptoms: [], notes: isEn ? 'Great day!' : isUz ? 'Ajoyib kun!' : isKg ? 'Сонун күн!' : 'Отличный день!' }
    ]);
  };

  const markTaken = (medId, scheduledAt) => {
    playSound('success');
    setLogs((s) => [...s, { id: uid(), medId, scheduledAt, takenAt: new Date().toISOString(), status: 'taken' }]);
  };

  const getTodaySchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    const items = [];
    meds.forEach((med) => {
      med.times.forEach((time) => {
        const scheduledAt = `${today}T${time}:00`;
        const log = logs.find((l) => l.medId === med.id && l.scheduledAt === scheduledAt);
        items.push(log || { id: uid(), medId: med.id, scheduledAt, status: 'pending' });
      });
    });
    return items;
  };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} onOpenAbout={() => setAboutOpen(true)} missedCount={0} lang={lang} />
      <main className="content">
        {page === 'dashboard' && <Dashboard meds={meds} logs={logs} diary={diary} onRequestDeleteMed={(id) => setDeleteId(id)} onEditMed={(med) => { setEditingMed(med); setAddModalOpen(true); }} markTaken={markTaken} getTodaySchedule={getTodaySchedule} loadDemoData={loadDemoData} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onSosClick={() => setSosModalOpen(true)} onOpenAdd={() => { setEditingMed(null); setAddModalOpen(true); }} lang={lang} setLang={setLang} />}
        {page === 'medications' && <Medications meds={meds} onRequestDeleteMed={(id) => setDeleteId(id)} onEditMed={(med) => { setEditingMed(med); setAddModalOpen(true); }} onOpenAdd={() => { setEditingMed(null); setAddModalOpen(true); }} lang={lang} />}
        {page === 'calendar' && <CalendarPage meds={meds} lang={lang} />}
        {page === 'consultation' && <ConsultationPage meds={meds} diary={diary} bookings={bookings} setBookings={setBookings} lang={lang} />}
        {page === 'diary' && <DiaryPage entries={diary} addEntry={(entry) => setDiary([...diary, { ...entry, id: uid(), date: new Date().toISOString() }])} removeEntry={(id) => setDiary(diary.filter(e => e.id !== id))} lang={lang} />}
      </main>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} lang={lang} />
      <ConfirmDeleteModal open={!!deleteId} onConfirm={confirmDeleteMed} onClose={() => setDeleteId(null)} lang={lang} />
      <SosModal open={sosModalOpen} onClose={() => setSosModalOpen(false)} meds={meds} lang={lang} contact={contact} setContact={setContact} />
      <AddMedModal open={addModalOpen} onClose={() => { setAddModalOpen(false); setEditingMed(null); }} onSave={saveMed} editingMed={editingMed} lang={lang} />
      <AlarmModal alarm={activeAlarm} onTake={() => {
        if (activeAlarm) {
          const today = new Date().toISOString().split('T')[0];
          markTaken(activeAlarm.med.id, `${today}T${activeAlarm.time}:00`);
        }
        setActiveAlarm(null);
      }} onSnooze={() => setActiveAlarm(null)} lang={lang} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);