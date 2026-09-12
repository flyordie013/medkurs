/*
 * MEDBIKESI — единая конфигурация контактов и коммерческих данных.
 * Пустые значения намеренны: сайт не показывает цену или обещание,
 * пока владелец их не подтвердил.
 */
window.CONFIG = {
  brand: "MEDBIKESI",
  person: { ru: "", kz: "" },

  phone: "+7 775 778 64 83",
  phoneDigits: "77757786483",
  city: { ru: "Астана", kz: "Астана" },
  schedule: {
    ru: "Без выходных · ночные вызовы 20:00–08:00",
    kz: "Демалыссыз · түнгі шақырту 20:00–08:00"
  },
  experience: 18,

  /* Бесплатный ключ можно получить на web3forms.com. Без ключа форма
     честно переводит пользователя в WhatsApp с готовым сообщением. */
  formKey: "",

  prices: {
    im: "",
    iv: "",
    sc: "",
    drip: "",
    butterfly: "",
    dressing: "",
    catheter: "",
    enema: "",
    detox: "",
    detoxFull: "",
    trip: "",
    night: "",
    course5: ""
  },

  course: {
    price: "",
    duration: { ru: "Уточняется", kz: "Нақтыланады" },
    format: { ru: "Только офлайн", kz: "Тек офлайн" },
    language: { ru: "Казахский", kz: "Қазақ тілі" }
  },

  /* Скрипты подключаются только после заполнения ID. */
  analytics: {
    ga4MeasurementId: "",
    googleAdsId: "",
    whatsappConversionLabel: "",
    callConversionLabel: ""
  }
};
