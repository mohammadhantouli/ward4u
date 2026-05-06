import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext(null);

export const ar = {
  // Nav
  home: 'الرئيسية',
  shop: 'المتجر',
  wedding: 'الزفاف',
  gifts: 'الهدايا',
  about: 'عن المتجر',
  signIn: 'تسجيل الدخول',
  signOut: 'تسجيل الخروج',
  profile: 'الملف الشخصي',
  orders: 'طلباتي',
  admin: 'لوحة الإدارة',
  wishlist: 'المفضلة',
  cart: 'السلة',

  // Hero
  heroTag: 'زهور طازجة يومياً',
  heroTitle: 'أجمل الزهور',
  heroTitleSpan: 'تُوصَل إليك',
  heroSub: 'زهور فاخرة يتم اختيارها يومياً — من الورود الرومانسية إلى تنسيقات الأعراس الفاخرة.',
  shopNow: 'تسوّق الآن',
  weddingCollection: 'مجموعة الزفاف',

  // Features
  sameDay: 'توصيل في نفس اليوم',
  sameDaySub: 'اطلب قبل الساعة 2 ظهراً',
  freshness: 'ضمان الطازجية',
  freshnessSub: 'وعد النضارة 7 أيام',
  secure: 'دفع آمن',
  secureSub: 'حماية 100٪',
  support: 'دعم على مدار الساعة',
  supportSub: 'نحن دائماً هنا لك',

  // Sections
  shopByCategory: 'تسوّق حسب الفئة',
  shopByCategorySub: 'ابحث عن الزهور المثالية لكل مناسبة',
  featured: 'التنسيقات المميزة',
  featuredSub: 'أبرز المنتجات التي يحبها عملاؤنا',
  viewAll: 'عرض جميع المنتجات',
  weddingBannerTitle: 'زهور الأعراس والمناسبات',
  weddingBannerSub: 'من الحفلات الصغيرة إلى الاحتفالات الكبرى — نصنع تجارب زهرية لا تُنسى.',
  exploreWedding: 'استعرض مجموعة الزفاف',
  testimonials: 'ماذا يقول عملاؤنا',
  testimonialsSub: 'تقييمات حقيقية من محبي الزهور',

  // Shop
  shopTitle: 'متجر الزهور',
  filters: 'الفلاتر',
  allCategories: 'الكل',
  search: 'بحث',
  searchPlaceholder: 'ابحث عن الزهور...',
  sortNewest: 'الأحدث',
  sortPriceLow: 'السعر: من الأقل',
  sortPriceHigh: 'السعر: من الأعلى',
  sortNameAZ: 'الاسم أ–ي',
  noProducts: 'لا توجد زهور. حاول تعديل الفلاتر.',
  clearFilters: 'مسح الفلاتر',
  clearSearch: 'مسح البحث',
  available: 'منتج متاح',

  // Product card / detail
  addToCart: 'أضف إلى السلة',
  added: 'تمت الإضافة!',
  outOfStock: 'نفد المخزون',
  inStock: 'متوفر في المخزون',
  backToShop: 'العودة للمتجر',
  customerReviews: 'تقييمات العملاء',
  writeReview: 'اكتب تقييماً',
  comment: 'تعليق',
  submitReview: 'إرسال التقييم',
  submitting: 'جارٍ الإرسال...',
  noReviews: 'لا توجد تقييمات بعد. كن الأول!',
  signInToReview: 'يرجى تسجيل الدخول لكتابة تقييم',
  shareExperience: 'شاركنا تجربتك...',

  // Cart
  cartTitle: 'سلة التسوق',
  cartEmpty: 'سلتك فارغة',
  cartEmptySub: 'أضف بعض الزهور الجميلة للبدء!',
  subtotal: 'المجموع الفرعي',
  delivery: 'رسوم التوصيل',
  total: 'الإجمالي',
  checkout: 'إتمام الشراء',
  continueShopping: 'مواصلة التسوق',

  // Checkout
  checkoutTitle: 'إتمام الطلب',
  deliveryDetails: 'تفاصيل التوصيل',
  fullName: 'الاسم الكامل',
  phone: 'رقم الجوال',
  city: 'المدينة',
  district: 'الحي',
  street: 'الشارع',
  notes: 'ملاحظات',
  notesPlaceholder: 'أي تعليمات خاصة...',
  paymentMethod: 'طريقة الدفع',
  cashOnDelivery: 'الدفع عند الاستلام (نقداً)',
  cardOnDelivery: 'الدفع عند الاستلام (بطاقة)',
  placeOrder: 'تأكيد الطلب',
  placingOrder: 'جارٍ تأكيد الطلب...',
  yourOrder: 'طلبك',

  // Auth
  welcomeBack: 'مرحباً بعودتك',
  signInSub: 'سجّل الدخول إلى حسابك',
  createAccount: 'إنشاء حساب',
  createAccountSub: 'انضم إلى ورد4يو اليوم',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  passwordMin: '8 أحرف على الأقل',
  confirmPassword: 'تأكيد كلمة المرور',
  loginBtn: 'تسجيل الدخول',
  registerBtn: 'إنشاء حساب',
  pleaseWait: 'يرجى الانتظار...',

  // Orders
  ordersTitle: 'طلباتي',
  noOrders: 'لا توجد طلبات بعد',
  noOrdersSub: 'ستظهر طلباتك هنا بعد إجراء عملية شراء.',
  orderDate: 'التاريخ',
  statusLabels: {
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    preparing: 'جارٍ التحضير',
    out_for_delivery: 'في الطريق إليك',
    delivered: 'تم التوصيل',
    cancelled: 'ملغى',
  },

  // Profile
  profileTitle: 'ملفي الشخصي',
  editProfile: 'تعديل الملف',
  saveChanges: 'حفظ التغييرات',
  saving: 'جارٍ الحفظ...',

  // About
  aboutTitle: 'عن ورد 4U',
  aboutSub: 'تفتّح بشغف منذ اليوم الأول',
  ourStory: 'قصتنا',
  ourStoryText1: 'وُلد ورد 4U من إيمان بسيط — أن للزهور قدرة على التعبير عمّا تعجز عنه الكلمات. انطلاقاً من الرياض، نختار أجود الزهور محلياً وعالمياً لنصنع تنسيقات تتحدث من القلب.',
  ourStoryText2: 'كل باقة نصنعها تُعدّ بمحبة واهتمام بالتفاصيل، والتزام بإضفاء الجمال على لحظاتك اليومية.',
  whyChooseUs: 'لماذا تختار ورد 4U؟',
  valueMadeWithLove: 'مصنوع بحب',
  valueMadeWithLoveDesc: 'كل تنسيق يُصنع يدوياً بعناية وشغف من قِبل أمهر منسقي الزهور لدينا.',
  valueFresh: 'طازج يومياً',
  valueFreshDesc: 'نختار ونُنسّق الزهور يومياً لضمان أقصى درجات الطازجية والحيوية.',
  valuePremium: 'جودة استثنائية',
  valuePremiumDesc: 'فقط أجود الزهور تدخل متجرنا — جمال يمكنك الوثوق به.',

  // Footer
  footerDesc: 'نوصل جمال الطبيعة إلى عتبة بابك. زهور طازجة، لحظات من القلب.',
  quickLinks: 'روابط سريعة',
  categories: 'الفئات',
  contact: 'تواصل معنا',

  // Admin
  dashboard: 'لوحة التحكم',
  products: 'المنتجات',
  totalOrders: 'إجمالي الطلبات',
  revenue: 'الإيرادات',
  addProduct: 'إضافة منتج',
  editProduct: 'تعديل المنتج',
  newProduct: 'منتج جديد',
  name: 'الاسم',
  slug: 'الرابط المختصر',
  description: 'الوصف',
  price: 'السعر (₪)',
  originalPrice: 'السعر الأصلي',
  stock: 'المخزون',
  imageUrl: 'رابط الصورة',
  category: 'الفئة',
  featured: 'مميز',
  active: 'نشط',
  save: 'حفظ',
  cancel: 'إلغاء',
  update: 'تحديث',
  create: 'إنشاء',
  delete: 'حذف',
  customer: 'العميل',
  items: 'عناصر',
  status: 'الحالة',
  date: 'التاريخ',
  image: 'الصورة',

  // Misc
  sar: '₪',
  ratingOf: 'من 5',
  reviews: 'تقييم',
  quantity: 'الكمية',
  unit: 'وحدة',
};

export const en = {
  home: 'Home', shop: 'Shop', wedding: 'Wedding', gifts: 'Gifts', about: 'About',
  signIn: 'Sign In', signOut: 'Sign Out', profile: 'Profile', orders: 'Orders',
  admin: 'Admin', wishlist: 'Wishlist', cart: 'Cart',
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    document.documentElement.dir  = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  const t = ar;

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRTL: true }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
