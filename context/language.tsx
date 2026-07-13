import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

type Language = 'en' | 'ar';

interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    error: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    noResults: string;
    all: string;
    today: string;
  };
  // Navigation
  nav: {
    home: string;
    medicines: string;
    profile: string;
  };
  // Home screen
  home: {
    greeting: {
      morning: string;
      afternoon: string;
      evening: string;
    };
    medicinesTracked: string;
    expired: string;
    expiringSoon: string;
    good: string;
    totalMedicines: string;
    activeMedications: string;
    noActiveMedications: string;
    noActiveMedsDesc: string;
    nextReminder: string;
    inventories: string;
    quickStats: string;
    medicineOverview: string;
    medicinesWord: string;
    goodLabel: string;
    expiringSoonLabel: string;
    expiredLabel: string;
    saveYourMeds: string;
    signInToSyncCloud: string;
    localMode: string;
    activeCount: string;
    stop: string;
    myInventories: string;
    locationCount: string;
    allMedicines: string;
    medsAcrossInvs: string;
    noInventoriesYet: string;
    noInventoriesDesc: string;
    unassigned: string;
    attentionNeeded: string;
    expiredAlertSingle: string;
    expiredAlertPlural: string;
  };
  // Medicines screen
  medicines: {
    title: string;
    medicinesTracked: string;
    inventories: string;
    searchPlaceholder: string;
    sort: string;
    filter: string;
    sortBy: {
      expiringSoon: string;
      latestExp: string;
      az: string;
      za: string;
    };
    categories: {
      all: string;
      antibiotic: string;
      painkiller: string;
      antihistamine: string;
      antiviral: string;
      vitamin: string;
      supplement: string;
      antifungal: string;
      antacid: string;
      steroid: string;
      other: string;
    };
    status: {
      expired: string;
      expiring: string;
      good: string;
    };
    noMedicines: string;
    noMedicinesDesc: string;
    noResults: string;
    deleteMedicineTitle: string;
    deleteMedicineConfirm: string;
    allInventories: string;
    manageInventories: string;
    createNewInventory: string;
    organizeByLocation: string;
    chooseIcon: string;
    inventoryNamePlaceholder: string;
    yourInventories: string;
    deleteInventoryTitle: string;
    deleteInventoryConfirm: string;
    addMedicine: string;
    scanLabel: string;
    scanLabelSub: string;
    orEnterManually: string;
    medicineName: string;
    medicineNamePlaceholder: string;
    expirationDateLabel: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    categoryLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    inventoryLabel: string;
    saving: string;
    errors: {
      nameRequired: string;
      dateRequired: string;
      dateInvalid: string;
      quantityMin: string;
      addFailed: string;
    };
    scan: {
      title: string;
      uploadPhoto: string;
      uploadSubtitle: string;
      cameraAccessNeeded: string;
      allowCameraText: string;
      allowCameraBtn: string;
      alignLabel: string;
      scanning: string;
      tapToScan: string;
      scanComplete: string;
      name: string;
      expiry: string;
      useDetails: string;
      rescan: string;
      noInfoFound: string;
      scanFailed: string;
      captureFailed: string;
      cameraError: string;
      readFailed: string;
      couldNotRead: string;
    };
  };
  // Medicine details
  medicineDetails: {
    expirationDate: string;
    quantity: string;
    units: string;
    category: string;
    storageLocation: string;
    description: string;
    notes: string;
    addToSchedule: string;
    expiresToday: string;
    expiresIn: string;
    expiredAgo: string;
    today: string;
    daysLeft: string;
  };
  // Add/Edit Medicine Modal
  medicineForm: {
    addTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    expirationLabel: string;
    expirationPlaceholder: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    inventoryLabel: string;
    inventoryPlaceholder: string;
    addButton: string;
    saveButton: string;
    errors: {
      nameRequired: string;
      expirationRequired: string;
      invalidDate: string;
      quantityMin: string;
    };
  };
  // Schedule
  schedule: {
    title: string;
    dosage: string;
    dosagePlaceholder: string;
    frequency: string;
    frequencyOptions: {
      onceDaily: string;
      twiceDaily: string;
      threeTimesDaily: string;
      everyOtherDay: string;
      weekly: string;
      asNeeded: string;
    };
    timesOfDay: string;
    endDate: string;
    endDateOptional: string;
    notes: string;
    saveButton: string;
    removeSchedule: string;
  };
  // Inventories
  inventories: {
    title: string;
    manageTitle: string;
    createNew: string;
    createDesc: string;
    chooseIcon: string;
    namePlaceholder: string;
    yourInventories: string;
    noInventories: string;
    noInventoriesDesc: string;
    confirmDelete: string;
  };
  // Profile
  profile: {
    title: string;
    darkMode: string;
    personalInfo: string;
    editInfo: string;
    fullName: string;
    fullNamePlaceholder: string;
    age: string;
    agePlaceholder: string;
    gender: string;
    genderOptions: {
      male: string;
      female: string;
      other: string;
    };
    healthConditions: string;
    addCondition: string;
    conditionPlaceholder: string;
    noConditions: string;
    notifications: string;
    notificationsDesc: string;
    notifyExpired: string;
    notifyExpiredDesc: string;
    notifyExpiringSoon: string;
    notifyExpiringSoonDesc: string;
    notifyScheduled: string;
    notifyScheduledDesc: string;
    language: string;
    languageDesc: string;
    languages: {
      en: string;
      ar: string;
    };
    syncData: string;
    syncDesc: string;
    signedInAs: string;
    localMode: string;
    signInToSync: string;
    localBadge: string;
    syncPromptTitle: string;
    syncPromptSub: string;
    uploading: string;
    changePhoto: string;
    addPhoto: string;
    on: string;
    off: string;
    saving: string;
    saved: string;
    saveProfile: string;
    currentIllnesses: string;
    noIllnesses: string;
    addIllnessPlaceholder: string;
    removeIllness: string;
    removeIllnessConfirm: string;
    ageLabel: string;
    genderLabel: string;
    illnessesLabel: string;
    yourName: string;
    saveError: string;
    uploadError: string;
    signInRequired: string;
    signInRequiredDesc: string;
  };
  // Auth
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    signInButton: string;
    signUpButton: string;
    signOut: string;
    noAccount: string;
    haveAccount: string;
    appTitle: string;
    appSubtitle: string;
    welcomeBack: string;
    createAccount: string;
    pleaseWait: string;
    fillAllFields: string;
    continueAsGuest: string;
    errors: {
      invalidEmail: string;
      wrongPassword: string;
      emailInUse: string;
      weakPassword: string;
    };
  };
  // Notifications
  notifications: {
    medicineReminder: string;
    expiredMedicine: string;
    expiringSoon: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      error: 'Error',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      noResults: 'No results',
      all: 'All',
      today: 'Today',
    },
    nav: {
      home: 'Home',
      medicines: 'Medicines',
      profile: 'Profile',
    },
    home: {
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
      },
      medicinesTracked: 'medicines tracked',
      expired: 'Expired',
      expiringSoon: 'Expiring Soon',
      good: 'Good',
      totalMedicines: 'medicines',
      activeMedications: 'Active Medications',
      noActiveMedications: 'No active medications',
      noActiveMedsDesc: 'Open a medicine and tap "Add to Daily Schedule"',
      nextReminder: 'Next reminder',
      inventories: 'Inventories',
      quickStats: 'Quick Stats',
      medicineOverview: 'Medicine Overview',
      medicinesWord: 'medicines',
      goodLabel: 'Good',
      expiringSoonLabel: 'Expiring soon',
      expiredLabel: 'Expired',
      saveYourMeds: 'Save your medicines',
      signInToSyncCloud: 'Sign in to sync to the cloud',
      localMode: 'Local Mode',
      activeCount: 'active',
      stop: 'Stop',
      myInventories: 'My Inventories',
      locationCount: 'location{s}',
      allMedicines: 'All Medicines',
      medsAcrossInvs: '{count} medicine{s} across {invCount} inventor{ies}',
      noInventoriesYet: 'No inventories yet',
      noInventoriesDesc: 'Go to Medicines to create your first inventory',
      unassigned: 'Unassigned',
      attentionNeeded: 'Attention Needed',
      expiredAlertSingle: 'You have {count} expired medicine that needs to be replaced or removed.',
      expiredAlertPlural: 'You have {count} expired medicines that need to be replaced or removed.',
    },
    medicines: {
      title: 'Medicines',
      medicinesTracked: 'medicines tracked',
      inventories: 'Inventories',
      searchPlaceholder: 'Search medicines...',
      sort: 'Sort',
      filter: 'Filter',
      sortBy: {
        expiringSoon: 'Expiring soon',
        latestExp: 'Latest exp.',
        az: 'A - Z',
        za: 'Z - A',
      },
      categories: {
        all: 'All',
        antibiotic: 'Antibiotic',
        painkiller: 'Painkiller',
        antihistamine: 'Antihistamine',
        antiviral: 'Antiviral',
        vitamin: 'Vitamin',
        supplement: 'Supplement',
        antifungal: 'Antifungal',
        antacid: 'Antacid',
        steroid: 'Steroid',
        other: 'Other',
      },
      status: {
        expired: 'Expired',
        expiring: 'Expiring Soon',
        good: 'Good',
      },
      noMedicines: 'No medicines yet',
      noMedicinesDesc: 'Tap the + button to add your first medicine',
      noResults: 'No results found',
      deleteMedicineTitle: 'Delete Medicine',
      deleteMedicineConfirm: 'Are you sure you want to delete this medicine?',
      allInventories: 'All',
      manageInventories: 'Manage Inventories',
      createNewInventory: 'Create New Inventory',
      organizeByLocation: 'Organize medicines by location',
      chooseIcon: 'Choose an icon',
      inventoryNamePlaceholder: 'e.g. Bathroom Cabinet',
      yourInventories: 'Your Inventories',
      deleteInventoryTitle: 'Delete Inventory',
      deleteInventoryConfirm: 'Medicines in it will become unassigned.',
      addMedicine: 'Add Medicine',
      scanLabel: 'Scan Medicine Label',
      scanLabelSub: 'Auto-fill name & expiry date',
      orEnterManually: 'or enter manually',
      medicineName: 'Medicine Name *',
      medicineNamePlaceholder: 'e.g. Amoxicillin',
      expirationDateLabel: 'Expiration Date *',
      quantityLabel: 'Quantity *',
      quantityPlaceholder: 'e.g. 30',
      categoryLabel: 'Category',
      notesLabel: 'Notes (optional)',
      notesPlaceholder: 'e.g. Take with food',
      inventoryLabel: 'Inventory',
      saving: 'Saving...',
      errors: {
        nameRequired: 'Medicine name is required',
        dateRequired: 'Expiration date is required',
        dateInvalid: 'Please enter a valid expiration date',
        quantityMin: 'Quantity must be at least 1',
        addFailed: 'Failed to add medicine',
      },
      scan: {
        title: 'Scan Medicine',
        uploadPhoto: 'Upload a photo',
        uploadSubtitle: 'Take a photo of the medicine label showing the name and expiration date',
        cameraAccessNeeded: 'Camera Access Needed',
        allowCameraText: 'Allow camera access to scan medicine labels',
        allowCameraBtn: 'Allow Camera',
        alignLabel: 'Align the medicine label inside the frame',
        scanning: 'Scanning...',
        tapToScan: 'Tap to scan',
        scanComplete: 'Scan complete',
        name: 'Name',
        expiry: 'Expiry',
        useDetails: 'Use These Details',
        rescan: 'Rescan',
        noInfoFound: 'No medicine info found. Try a clearer photo with the label in frame.',
        scanFailed: 'Scan failed. Please try again or enter details manually.',
        captureFailed: 'Failed to capture photo. Please try again.',
        cameraError: 'Camera error. Please try again.',
        readFailed: 'Failed to read file',
        couldNotRead: 'Could not read image',
      },
    },
    medicineDetails: {
      expirationDate: 'Expiration Date',
      quantity: 'Quantity',
      units: 'units',
      category: 'Category',
      storageLocation: 'Storage Location',
      description: 'Description',
      notes: 'Notes',
      addToSchedule: 'Add to Daily Schedule',
      expiresToday: 'Expires this month',
      expiresIn: 'Expires in',
      expiredAgo: 'Expired',
      today: 'Today',
      daysLeft: 'left',
    },
    medicineForm: {
      addTitle: 'Add Medicine',
      editTitle: 'Edit Medicine',
      nameLabel: 'Medicine Name',
      namePlaceholder: 'e.g. Amoxicillin',
      expirationLabel: 'Expiration Date',
      expirationPlaceholder: 'YYYY/MM',
      quantityLabel: 'Quantity',
      quantityPlaceholder: 'Number of units',
      categoryLabel: 'Category',
      categoryPlaceholder: 'Select category',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Optional description or instructions',
      notesLabel: 'Notes',
      notesPlaceholder: 'Any additional notes',
      inventoryLabel: 'Inventory',
      inventoryPlaceholder: 'Select inventory',
      addButton: 'Add Medicine',
      saveButton: 'Save Changes',
      errors: {
        nameRequired: 'Medicine name is required',
        expirationRequired: 'Expiration date is required',
        invalidDate: 'Please enter a valid expiration date',
        quantityMin: 'Quantity must be at least 1',
      },
    },
    schedule: {
      title: 'Add to Schedule',
      dosage: 'Dosage',
      dosagePlaceholder: 'e.g. 500mg',
      frequency: 'Frequency',
      frequencyOptions: {
        onceDaily: 'Once daily',
        twiceDaily: 'Twice daily',
        threeTimesDaily: 'Three times daily',
        everyOtherDay: 'Every other day',
        weekly: 'Weekly',
        asNeeded: 'As needed',
      },
      timesOfDay: 'Times of Day',
      endDate: 'End Date',
      endDateOptional: 'Optional end date',
      notes: 'Notes',
      saveButton: 'Add to Schedule',
      removeSchedule: 'Remove from Schedule',
    },
    inventories: {
      title: 'Inventories',
      manageTitle: 'Manage Inventories',
      createNew: 'Create New Inventory',
      createDesc: 'Organize medicines by location',
      chooseIcon: 'Choose an icon',
      namePlaceholder: 'e.g. Bathroom Cabinet',
      yourInventories: 'Your Inventories',
      noInventories: 'No inventories yet',
      noInventoriesDesc: 'Create your first inventory to organize medicines',
      confirmDelete: 'Delete this inventory? Medicines in it will become unassigned.',
    },
    profile: {
      title: 'Profile',
      darkMode: 'Dark Mode',
      personalInfo: 'Personal Info',
      editInfo: 'Edit Personal Info',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your name',
      age: 'Age',
      agePlaceholder: 'Your age',
      gender: 'Gender',
      genderOptions: {
        male: 'Male',
        female: 'Female',
        other: 'Other',
      },
      healthConditions: 'Health Conditions',
      addCondition: 'Add Condition',
      conditionPlaceholder: 'Condition name',
      noConditions: 'No conditions added',
      notifications: 'Notifications',
      notificationsDesc: 'Manage your reminder preferences',
      notifyExpired: 'Expired Medicines',
      notifyExpiredDesc: 'Get notified when medicines expire',
      notifyExpiringSoon: 'Expiring Soon',
      notifyExpiringSoonDesc: 'Warn before medicines expire (30 days)',
      notifyScheduled: 'Scheduled Medications',
      notifyScheduledDesc: "Remind when it's time to take your medicines",
      language: 'Language',
      languageDesc: 'Change app language',
      languages: {
        en: 'English',
        ar: 'العربية',
      },
      syncData: 'Sync Data',
      syncDesc: 'Sign in to sync your data across devices',
      signedInAs: 'Signed in as',
      localMode: 'Local Mode',
      signInToSync: 'Sign In to Sync',
      localBadge: 'Local',
      syncPromptTitle: 'Save your data to the cloud',
      syncPromptSub: 'Sign in to sync medicines, inventories, and settings',
      uploading: 'Uploading...',
      changePhoto: 'Change photo',
      addPhoto: 'Add photo',
      on: 'On',
      off: 'Off',
      saving: 'Saving...',
      saved: 'Saved!',
      saveProfile: 'Save Profile',
      currentIllnesses: 'Current Illnesses',
      noIllnesses: 'No illnesses added yet',
      addIllnessPlaceholder: 'Add illness...',
      removeIllness: 'Remove Illness',
      removeIllnessConfirm: 'Are you sure?',
      ageLabel: 'Age',
      genderLabel: 'Gender',
      illnessesLabel: 'Illnesses',
      yourName: 'Your Name',
      saveError: 'Failed to save profile.',
      uploadError: 'Failed to upload photo.',
      signInRequired: 'Sign In Required',
      signInRequiredDesc: 'Please sign in to upload a profile picture.',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      password: 'Password',
      passwordPlaceholder: 'Enter password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm password',
      signInButton: 'Sign In',
      signUpButton: 'Create Account',
      signOut: 'Sign Out',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      appTitle: 'MedVault',
      appSubtitle: 'Track your medicines, stay safe',
      welcomeBack: 'Welcome back',
      createAccount: 'Create account',
      pleaseWait: 'Please wait...',
      fillAllFields: 'Please fill in all fields',
      continueAsGuest: 'Continue as Guest',
      errors: {
        invalidEmail: 'Please enter a valid email',
        wrongPassword: 'Incorrect password',
        emailInUse: 'Email already in use',
        weakPassword: 'Password should be at least 6 characters',
      },
    },
    notifications: {
      medicineReminder: 'Time for',
      expiredMedicine: 'has expired',
      expiringSoon: 'expires soon',
    },
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      error: 'خطأ',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      loading: 'جاري التحميل...',
      noResults: 'لا توجد نتائج',
      all: 'الكل',
      today: 'اليوم',
    },
    nav: {
      home: 'الرئيسية',
      medicines: 'الأدوية',
      profile: 'الملف الشخصي',
    },
    home: {
      greeting: {
        morning: 'صباح الخير',
        afternoon: 'مساء الخير',
        evening: 'مساء الخير',
      },
      medicinesTracked: 'دواء متتبع',
      expired: 'منتهي الصلاحية',
      expiringSoon: 'ينتهي قريباً',
      good: 'سليم',
      totalMedicines: 'دواء',
      activeMedications: 'الأدوية الحاليه',
      noActiveMedications: 'لا توجد أدوية حالية',
      noActiveMedsDesc: 'افتح دواء واضغط "إضافة إلى الجدول اليومي"',
      nextReminder: 'التذكير التالي',
      inventories: 'المخازن',
      quickStats: 'إحصائيات سريعة',
      medicineOverview: 'نظرة عامة على الأدوية',
      medicinesWord: 'دواء',
      goodLabel: 'سليم',
      expiringSoonLabel: 'قريب الانتهاء',
      expiredLabel: 'منتهي',
      saveYourMeds: 'احفظ أدويتك',
      signInToSyncCloud: 'سجل الدخول للمزامنة مع السحابة',
      localMode: 'الوضع المحلي',
      activeCount: 'حالي',
      stop: 'إيقاف',
      myInventories: 'مخزوناتي',
      locationCount: 'موقع{s}',
      allMedicines: 'كل الأدوية',
      medsAcrossInvs: '{count} دواء عبر {invCount} موقع{ies}',
      noInventoriesYet: 'لا توجد مخزونات بعد',
      noInventoriesDesc: 'اذهب إلى الأدوية لإنشاء مخزونك الأول',
      unassigned: 'غير مصنف',
      attentionNeeded: 'تنبيه',
      expiredAlertSingle: 'لديك {count} دواء منتهي الصلاحية يحتاج إلى استبدال أو إزالة.',
      expiredAlertPlural: 'لديك {count} أدوية منتهية الصلاحية تحتاج إلى استبدال أو إزالة.',
    },
    medicines: {
      title: 'الأدوية',
      medicinesTracked: 'دواء متتبع',
      inventories: 'المخازن',
      searchPlaceholder: 'بحث في الأدوية...',
      sort: 'ترتيب',
      filter: 'تصفية',
      sortBy: {
        expiringSoon: 'ينتهي قريباً',
        latestExp: 'أبعد تاريخ انتهاء',
        az: 'أ - ي',
        za: 'ي - أ',
      },
      categories: {
        all: 'الكل',
        antibiotic: 'مضاد حيوي',
        painkiller: 'مسكن ألم',
        antihistamine: 'مضاد هيستامين',
        antiviral: 'مضاد فيروسات',
        vitamin: 'فيتامين',
        supplement: 'مكمل غذائي',
        antifungal: 'مضاد فطريات',
        antacid: 'مضاد حموضة',
        steroid: 'ستيرويد',
        other: 'أخرى',
      },
      status: {
        expired: 'منتهي الصلاحية',
        expiring: 'ينتهي قريباً',
        good: 'سليم',
      },
      noMedicines: 'لا توجد أدوية',
      noMedicinesDesc: 'اضغط على زر + لإضافة أول دواء',
      noResults: 'لم يتم العثور على نتائج',
      deleteMedicineTitle: 'حذف الدواء',
      deleteMedicineConfirm: 'هل أنت متأكد أنك تريد حذف هذا الدواء؟',
      allInventories: 'الكل',
      manageInventories: 'إدارة المخزونات',
      createNewInventory: 'إنشاء مخزون جديد',
      organizeByLocation: 'نظّم الأدوية حسب الموقع',
      chooseIcon: 'اختر أيقونة',
      inventoryNamePlaceholder: 'مثال: خزانة الحمام',
      yourInventories: 'مخزوناتك',
      deleteInventoryTitle: 'حذف المخزون',
      deleteInventoryConfirm: 'ستصبح الأدوية فيه غير مصنفة.',
      addMedicine: 'إضافة دواء',
      scanLabel: 'مسح ملصق الدواء',
      scanLabelSub: 'تعبئة الاسم وتاريخ الانتهاء تلقائيًا',
      orEnterManually: 'أو أدخل يدويًا',
      medicineName: 'اسم الدواء *',
      medicineNamePlaceholder: 'مثال: أموكسيسيلين',
      expirationDateLabel: 'تاريخ الانتهاء *',
      quantityLabel: 'الكمية *',
      quantityPlaceholder: 'مثال: 30',
      categoryLabel: 'الفئة',
      notesLabel: 'ملاحظات (اختياري)',
      notesPlaceholder: 'مثال: يؤخذ مع الطعام',
      inventoryLabel: 'المخزون',
      saving: 'جارٍ الحفظ...',
      errors: {
        nameRequired: 'اسم الدواء مطلوب',
        dateRequired: 'تاريخ الانتهاء مطلوب',
        dateInvalid: 'يرجى إدخال تاريخ انتهاء صالح',
        quantityMin: 'يجب أن تكون الكمية 1 على الأقل',
        addFailed: 'فشل في إضافة الدواء',
      },
      scan: {
        title: 'مسح الدواء',
        uploadPhoto: 'رفع صورة',
        uploadSubtitle: 'التقط صورة لملصق الدواء توضح الاسم وتاريخ الانتهاء',
        cameraAccessNeeded: 'الوصول إلى الكاميرا مطلوب',
        allowCameraText: 'اسمح بالوصول إلى الكاميرا لمسح ملصقات الأدوية',
        allowCameraBtn: 'السماح بالكاميرا',
        alignLabel: 'وجّه ملصق الدواء داخل الإطار',
        scanning: 'جارٍ المسح...',
        tapToScan: 'اضغط للمسح',
        scanComplete: 'اكتمل المسح',
        name: 'الاسم',
        expiry: 'الانتهاء',
        useDetails: 'استخدام هذه التفاصيل',
        rescan: 'إعادة المسح',
        noInfoFound: 'لم يتم العثور على معلومات الدواء. جرّب صورة أوضح مع ظهور الملصق.',
        scanFailed: 'فشل المسح. حاول مرة أخرى أو أدخل التفاصيل يدويًا.',
        captureFailed: 'فشل التقاط الصورة. حاول مرة أخرى.',
        cameraError: 'خطأ في الكاميرا. حاول مرة أخرى.',
        readFailed: 'فشل في قراءة الملف',
        couldNotRead: 'تعذرت قراءة الصورة',
      },
    },
    medicineDetails: {
      expirationDate: 'تاريخ الانتهاء',
      quantity: 'الكمية',
      units: 'وحدة',
      category: 'الفئة',
      storageLocation: 'مكان التخزين',
      description: 'الوصف',
      notes: 'ملاحظات',
      addToSchedule: 'إضافة إلى الجدول اليومي',
      expiresToday: 'ينتهي هذا الشهر',
      expiresIn: 'ينتهي خلال',
      expiredAgo: 'منتهي منذ',
      today: 'اليوم',
      daysLeft: 'متبقي',
    },
    medicineForm: {
      addTitle: 'إضافة دواء',
      editTitle: 'تعديل دواء',
      nameLabel: 'اسم الدواء',
      namePlaceholder: 'مثال: أموكسيسيلين',
      expirationLabel: 'تاريخ الانتهاء',
      expirationPlaceholder: 'سنة/شهر',
      quantityLabel: 'الكمية',
      quantityPlaceholder: 'عدد الوحدات',
      categoryLabel: 'الفئة',
      categoryPlaceholder: 'اختر الفئة',
      descriptionLabel: 'الوصف',
      descriptionPlaceholder: 'وصف أو تعليمات اختيارية',
      notesLabel: 'ملاحظات',
      notesPlaceholder: 'أي ملاحظات إضافية',
      inventoryLabel: 'المخزن',
      inventoryPlaceholder: 'اختر المخزن',
      addButton: 'إضافة دواء',
      saveButton: 'حفظ التغييرات',
      errors: {
        nameRequired: 'اسم الدواء مطلوب',
        expirationRequired: 'تاريخ الانتهاء مطلوب',
        invalidDate: 'الرجاء إدخال تاريخ انتهاء صحيح',
        quantityMin: 'الكمية يجب أن تكون 1 على الأقل',
      },
    },
    schedule: {
      title: 'إضافة إلى الجدول',
      dosage: 'الجرعة',
      dosagePlaceholder: 'مثال: 500 ملغ',
      frequency: 'التكرار',
      frequencyOptions: {
        onceDaily: 'مرة يومياً',
        twiceDaily: 'مرتين يومياً',
        threeTimesDaily: '3 مرات يومياً',
        everyOtherDay: 'كل يومين',
        weekly: 'أسبوعياً',
        asNeeded: 'حسب الحاجة',
      },
      timesOfDay: 'أوقات اليوم',
      endDate: 'تاريخ الانتهاء',
      endDateOptional: 'تاريخ انتهاء اختياري',
      notes: 'ملاحظات',
      saveButton: 'إضافة إلى الجدول',
      removeSchedule: 'إزالة من الجدول',
    },
    inventories: {
      title: 'المخازن',
      manageTitle: 'إدارة المخازن',
      createNew: 'إنشاء مخزن جديد',
      createDesc: 'نظم الأدوية حسب الموقع',
      chooseIcon: 'اختر أيقونة',
      namePlaceholder: 'مثال: خزانة الحمام',
      yourInventories: 'مخازنك',
      noInventories: 'لا توجد مخازن',
      noInventoriesDesc: 'أنشئ مخزنك الأول لتنظيم الأدوية',
      confirmDelete: 'حذف هذا المخزن؟ الأدوية فيه ستكون غير مصنفة.',
    },
    profile: {
      title: 'الملف الشخصي',
      darkMode: 'الوضع الداكن',
      personalInfo: 'المعلومات الشخصية',
      editInfo: 'تعديل المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك',
      age: 'العمر',
      agePlaceholder: 'عمرك',
      gender: 'الجنس',
      genderOptions: {
        male: 'ذكر',
        female: 'أنثى',
        other: 'أخرى',
      },
      healthConditions: 'الحالات الصحية',
      addCondition: 'إضافة حالة',
      conditionPlaceholder: 'اسم الحالة',
      noConditions: 'لم تتم إضافة حالات',
      notifications: 'الإشعارات',
      notificationsDesc: 'إدارة تفضيلات التذكير',
      notifyExpired: 'الأدوية منتهية الصلاحية',
      notifyExpiredDesc: 'الحصول على إشعار عند انتهاء صلاحية الأدوية',
      notifyExpiringSoon: 'ينتهي قريباً',
      notifyExpiringSoonDesc: 'تحذير قبل انتهاء الأدوية (30 يوم)',
      notifyScheduled: 'الأدوية المجدولة',
      notifyScheduledDesc: 'تذكير عندما يحين وقت تناول الأدوية',
      language: 'اللغة',
      languageDesc: 'تغيير لغة التطبيق',
      languages: {
        en: 'English',
        ar: 'العربية',
      },
      syncData: 'مزامنة البيانات',
      syncDesc: 'سجل الدخول لمزامنة بياناتك عبر الأجهزة',
      signedInAs: 'مسجل الدخول كـ',
      localMode: 'الوضع المحلي',
      signInToSync: 'سجل الدخول للمزامنة',
      localBadge: 'محلي',
      syncPromptTitle: 'احفظ بياناتك في السحابة',
      syncPromptSub: 'سجل الدخول لمزامنة الأدوية والمخزونات والإعدادات',
      uploading: 'جاري الرفع...',
      changePhoto: 'تغيير الصورة',
      addPhoto: 'إضافة صورة',
      on: 'مفعّل',
      off: 'متوقف',
      saving: 'جاري الحفظ...',
      saved: 'تم الحفظ!',
      saveProfile: 'حفظ الملف الشخصي',
      currentIllnesses: 'الحالات الصحية الحالية',
      noIllnesses: 'لم تتم إضافة حالات بعد',
      addIllnessPlaceholder: 'إضافة حالة...',
      removeIllness: 'إزالة الحالة',
      removeIllnessConfirm: 'هل أنت متأكد؟',
      ageLabel: 'العمر',
      genderLabel: 'الجنس',
      illnessesLabel: 'الحالات',
      yourName: 'اسمك',
      saveError: 'فشل في حفظ الملف الشخصي.',
      uploadError: 'فشل في رفع الصورة.',
      signInRequired: 'مطلوب تسجيل الدخول',
      signInRequiredDesc: 'يرجى تسجيل الدخول لرفع صورة الملف الشخصي.',
    },
    auth: {
      signIn: 'تسجيل الدخول',
      signUp: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'بريدك@الالكتروني.com',
      password: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      signInButton: 'تسجيل الدخول',
      signUpButton: 'إنشاء حساب',
      signOut: 'تسجيل الخروج',
      noAccount: 'ليس لديك حساب؟',
      haveAccount: 'لديك حساب بالفعل؟',
      appTitle: 'ميدفولت',
      appSubtitle: 'تتبع أدويتك، ابقَ آمنًا',
      welcomeBack: 'مرحبًا بعودتك',
      createAccount: 'إنشاء حساب',
      pleaseWait: 'يرجى الانتظار...',
      fillAllFields: 'يرجى ملء جميع الحقول',
      continueAsGuest: 'المتابعة كضيف',
      errors: {
        invalidEmail: 'الرجاء إدخال بريد إلكتروني صحيح',
        wrongPassword: 'كلمة المرور غير صحيحة',
        emailInUse: 'البريد الإلكتروني مستخدم بالفعل',
        weakPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      },
    },
    notifications: {
      medicineReminder: 'حان وقت',
      expiredMedicine: 'منتهي الصلاحية',
      expiringSoon: 'ينتهي قريباً',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANGUAGE_KEY = 'medtrack_language';

function getStoredLanguage(): Language {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ar') {
      return stored;
    }
  }
  return 'en';
}

function setStoredLanguage(lang: Language) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lang);
    // Set document direction for RTL
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(stored);
    setStoredLanguage(stored);
    setLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  };

  const isRTL = language === 'ar';
  const t = translations[language];

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
