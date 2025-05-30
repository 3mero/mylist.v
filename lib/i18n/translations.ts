export type Locale = "ar" | "en"

export interface Translations {
  common: {
    play: string
    pause: string
    next: string
    previous: string
    delete: string
    cancel: string
    save: string
    add: string
    edit: string
    search: string
    loading: string
    noResults: string
    confirm: string
    language: string
    settings: string
    home: string
    history: string
    playlists: string
    quality: string
    appName: string // Added for app name
    noThumbnail: string
    category: string
    tags: string
    off: string
    goHome: string
    backHome: string
    remove: string
    clear: string
    error: string
    removedFromThisPlaylist: string // For PlaylistSidebar toast
    videoRemovedFromApp: string // For SearchPage delete toast
    about: string
  }
  navigation: {
    // Added for sidebar navigation items
    home: string
    playlists: string
    history: string
    toggleSidebar: string
  }
  player: {
    addToPlaylist: string
    deleteVideo: string
    nextVideo: string
    playNow: string
    playingFrom: string
    playlist: string
    videoOf: string
    editTitle: string
    titleUpdated: string
    qualityChanged: string
    qualitySet: string
    noVideoSelected: string
    cinemaModeEnabled: string
    cinemaModeDisabled: string
    audioOnlyEnabled: string
    audioOnlyDisabled: string
    ccOn: string
    ccOff: string
    subtitlesUpdated: string
    subtitlesUpdateFailed: string
    manageSubtitles: string
    addSubtitles: string
    exitCinemaMode: string
    cinemaMode: string
    showVideo: string
    audioOnly: string
    audioOnlyMode: string
    addToPlaylistShort: string // For VideoCard button
  }
  home: {
    title: string // This might be deprecated if appName is used globally
    subtitle: string
    viewHistory: string
    createPlaylist: string
    recentlyWatched: string
    enterVideoUrl: string
    invalidUrl: string
    generateThumbnail: string
    generatingThumbnail: string
    singleUrl: string
    multipleUrls: string
    enterMultipleUrls: string
    processUrls: string
    noUrlsFound: string
    enterAtLeastOne: string
    lastWatchedPlaylist: string
    watchAgain: string
  }
  videoUrlInput: {
    // Added for VideoUrlInput specific translations
    singleUrlTab: string
    multipleUrlsTab: string
    multipleUrlsLabel: string
    processUrlsButton: string
  }
  search: {
    // Added for SearchPage specific translations
    placeholder: string
    pleaseEnterQuery: string
    noResults: string
    resultsTitle: string
    placeholderGlobal: string
    loading: string
    source: string
    sourceHistory: string
    sourcePlaylist: string // Already exists, ensure it's suitable
    pleaseEnterSearchTerm: string // For SearchPage
  }
  playlists: {
    myPlaylists: string
    noPlaylists: string
    createYourFirst: string
    videos: string
    updated: string
    name: string
    description: string
    descriptionPlaceholder: string
    namePlaceholder: string
    creating: string
    create: string
    playAll: string
    shufflePlay: string
    noVideosInPlaylist: string
    addedToPlaylist: string
    videoAddedToPlaylist: string
    title: string
    createPlaylist: string
    newPlaylist: string
    editPlaylist: string
    playlistName: string
    playlistDescription: string
    addVideosToPlaylist: string
    confirmDeletePlaylist: string
    playlistCreated: string
    playlistUpdated: string
    playlistDeleted: string
    videoRemovedFromPlaylist: string
    defaultPlaylist: string
    setDefault: string
    unsetDefault: string
    videoSingular: string // For PlaylistSidebar count
    shufflePlayShort: string // For PlaylistSidebar button
    clearAllWarning: string // For PlaylistSidebar dialog
    allVideosRemovedHistory: string // For PlaylistSidebar toast
  }
  history: {
    viewingHistory: string
    clearAll: string
    clearAllHistory: string
    clearAllHistoryConfirm: string
    searchHistory: string
    noVideosInHistory: string
    noVideosMatchingSearch: string
    videoRemoved: string
    watchedTimes: string
    watchedAgo: string
  }
  settings: {
    appearance: string
    performance: string
    dataManagement: string
    theme: string
    themeMode: string
    light: string
    dark: string
    system: string
    backgroundColor: string
    videoSettings: string
    optimizePlayback: string
    defaultQuality: string
    bufferSize: string
    autoplayNext: string // Renamed from autoplay
    lowSaveData: string
    mediumBalanced: string
    highQuality: string
    storage: string
    manageData: string
    currentUsage: string
    historyLimit: string
    historyLimitValue: (count: number) => string
    last20: string
    last50: string
    last100: string
    exportData: string
    importData: string
    deleteAllData: string
    deleteAllDataConfirm: string
    settingsSaved: string
    preferencesUpdated: string
    title: string
    loadError: string
    noSettingsFoundError: string
    saveSuccess: string
    saveError: string
    exportSuccess: string
    exportError: string
    importSuccess: string
    importError: string
    importErrorFormat: string
    confirmClearData: string
    clearDataSuccess: string
    clearDataError: string
    selectTheme: string
    lightTheme: string
    darkTheme: string
    systemTheme: string
    playback: string
    autoplay: string // Kept for compatibility, but autoplayNext is preferred
    selectVideoQuality: string
    qualityAuto: string
    quality1080p: string
    quality720p: string
    quality480p: string
    history: string
    historyLimitLabel: string
    selectHistoryLimit: string
    currentStorage: string
    clearAllData: string
  }
  welcome: {
    welcomeTitle: string
    welcomeSubtitle: string
    getStarted: string
    startNow: string
    createPlaylistNow: string
    playVideo: string
    features: string
    shortcuts: string
    videoPlayback: string
    videoPlaybackDesc: string
    playlistsFeature: string
    playlistsFeatureDesc: string
    historyFeature: string
    historyFeatureDesc: string
    customizeFeature: string
    customizeFeatureDesc: string
    playPause: string
    forward10: string
    backward10: string
    volumeUp: string
    volumeDown: string
    nextTrack: string
    previousTrack: string
    mute: string
    togglePlaylist: string
    startUsing: string
  }
  addMenu: {
    addVideoLink: string
  }
  addVideoDialog: {
    title: string
    videoUrl: string
    pleaseEnterValidUrl: string
    videoAdded: string
    videoStartedPlaying: string
    errorLoadingVideo: string
  }
  aboutDialog: {
    description: string
    version: string
    developedBy: string
    email: string
  }
}

export const translations: Record<Locale, Translations> = {
  ar: {
    common: {
      play: "تشغيل",
      pause: "إيقاف",
      next: "التالي",
      previous: "السابق",
      delete: "حذف",
      cancel: "إلغاء",
      save: "حفظ",
      add: "إضافة",
      edit: "تعديل",
      search: "بحث",
      loading: "جاري التحميل...",
      noResults: "لا توجد نتائج",
      confirm: "تأكيد",
      language: "اللغة",
      settings: "الإعدادات",
      home: "الرئيسية",
      history: "السجل",
      playlists: "قوائم التشغيل",
      quality: "الجودة",
      appName: "قائمة فيديوهاتي", // Updated
      noThumbnail: "لا توجد صورة مصغرة",
      category: "الفئة",
      tags: "الوسوم",
      off: "إيقاف",
      goHome: "العودة للرئيسية",
      backHome: "العودة للرئيسية",
      remove: "إزالة",
      clear: "مسح",
      error: "حدث خطأ.",
      removedFromThisPlaylist: "تمت إزالته من قائمة التشغيل هذه.",
      videoRemovedFromApp: "تمت إزالة الفيديو من التطبيق.",
      about: "حول التطبيق",
    },
    navigation: {
      home: "الرئيسية",
      playlists: "قوائم التشغيل",
      history: "السجل",
      toggleSidebar: "تبديل الشريط الجانبي",
    },
    player: {
      addToPlaylist: "إضافة لقائمة",
      deleteVideo: "حذف الفيديو",
      nextVideo: "الفيديو التالي",
      playNow: "تشغيل الآن",
      playingFrom: "يتم التشغيل من",
      playlist: "قائمة التشغيل",
      videoOf: "من",
      editTitle: "تعديل العنوان",
      titleUpdated: "تم تحديث عنوان الفيديو",
      qualityChanged: "تم تغيير الجودة",
      qualitySet: "تم ضبط جودة الفيديو على",
      noVideoSelected: "لم يتم اختيار فيديو",
      cinemaModeEnabled: "تم تفعيل وضع السينما",
      cinemaModeDisabled: "تم تعطيل وضع السينما",
      audioOnlyEnabled: "تم تفعيل وضع الصوت فقط",
      audioOnlyDisabled: "تم تعطيل وضع الصوت فقط",
      ccOn: "الترجمة مفعلة",
      ccOff: "الترجمة معطلة",
      subtitlesUpdated: "تم تحديث الترجمات",
      subtitlesUpdateFailed: "فشل تحديث الترجمات",
      manageSubtitles: "إدارة الترجمات",
      addSubtitles: "إضافة ترجمات",
      exitCinemaMode: "الخروج من وضع السينما",
      cinemaMode: "وضع السينما",
      showVideo: "عرض الفيديو",
      audioOnly: "صوت فقط",
      audioOnlyMode: "وضع الصوت فقط",
      addToPlaylistShort: "إضافة لقائمة",
    },
    home: {
      title: "مشغل الفيديو",
      subtitle: "شاهد الفيديوهات وأنشئ قوائم التشغيل الخاصة بك",
      viewHistory: "سجل المشاهدة",
      createPlaylist: "إنشاء قائمة تشغيل",
      recentlyWatched: "شوهد مؤخرًا",
      enterVideoUrl: "أدخل رابط الفيديو (MP4, WebM, YouTube, إلخ)",
      invalidUrl: "الرجاء إدخال رابط فيديو صالح",
      generateThumbnail: "توليد صورة مصغرة",
      generatingThumbnail: "جاري التوليد...",
      singleUrl: "رابط واحد",
      multipleUrls: "روابط متعددة",
      enterMultipleUrls: "أدخل روابط متعددة (رابط واحد في كل سطر)",
      processUrls: "معالجة الروابط",
      noUrlsFound: "لم يتم العثور على روابط",
      enterAtLeastOne: "الرجاء إدخال رابط واحد على الأقل",
      lastWatchedPlaylist: "آخر قائمة تشغيل مشاهدة",
      watchAgain: "مشاهدة مجددًا",
    },
    videoUrlInput: {
      singleUrlTab: "رابط فردي",
      multipleUrlsTab: "روابط متعددة",
      multipleUrlsLabel: "أدخل روابط متعددة (واحد في كل سطر)",
      processUrlsButton: "معالجة الروابط",
    },
    search: {
      placeholder: "ابحث في السجل...", // Used in history page
      placeholderGlobal: "ابحث في الفيديوهات وقوائم التشغيل...", // Used in global search input
      pleaseEnterQuery: "الرجاء إدخال عبارة بحث.",
      noResults: "لا توجد فيديوهات تطابق",
      resultsTitle: "نتائج البحث عن",
      loading: "جار البحث...",
      source: "المصدر",
      sourceHistory: "السجل",
      sourcePlaylist: "قائمة التشغيل",
      pleaseEnterSearchTerm: "الرجاء إدخال مصطلح بحث للبدء.",
    },
    playlists: {
      myPlaylists: "قوائم التشغيل",
      noPlaylists: "لا توجد قوائم تشغيل",
      createYourFirst: "أنشئ أول قائمة تشغيل",
      videos: "فيديو",
      updated: "تم التحديث",
      name: "الاسم",
      description: "الوصف (اختياري)",
      descriptionPlaceholder: "مجموعة من الفيديوهات المفضلة لدي",
      namePlaceholder: "قائمة التشغيل الخاصة بي",
      creating: "جاري الإنشاء...",
      create: "إنشاء",
      playAll: "تشغيل الكل",
      shufflePlay: "تشغيل عشوائي",
      noVideosInPlaylist: "لا توجد فيديوهات في هذه القائمة",
      addedToPlaylist: "تمت الإضافة للقائمة",
      videoAddedToPlaylist: "تمت إضافة الفيديو إلى القائمة",
      title: "قوائم التشغيل",
      createPlaylist: "إنشاء قائمة تشغيل",
      newPlaylist: "قائمة تشغيل جديدة",
      editPlaylist: "تعديل قائمة التشغيل",
      playlistName: "اسم قائمة التشغيل",
      playlistDescription: "الوصف (اختياري)",
      addVideosToPlaylist: "أضف فيديوهات للبدء.",
      confirmDeletePlaylist: "هل أنت متأكد أنك تريد حذف قائمة التشغيل هذه؟",
      playlistCreated: "تم إنشاء قائمة التشغيل بنجاح.",
      playlistUpdated: "تم تحديث قائمة التشغيل بنجاح.",
      playlistDeleted: "تم حذف قائمة التشغيل.",
      videoRemovedFromPlaylist: "تمت إزالة الفيديو من قائمة التشغيل.",
      defaultPlaylist: "قائمة التشغيل الافتراضية",
      setDefault: "تعيين كافتراضي",
      unsetDefault: "إلغاء التعيين كافتراضي",
      videoSingular: "فيديو",
      shufflePlayShort: "عشوائي",
      clearAllWarning:
        "سيؤدي هذا إلى إزالة جميع مقاطع الفيديو من قائمة التشغيل هذه وحذفها من سجلّك. لا يمكن التراجع عن هذا الإجراء.",
      allVideosRemovedHistory: "تمت إزالة جميع مقاطع الفيديو من قائمة التشغيل هذه وسجلّك.",
    },
    history: {
      viewingHistory: "سجل المشاهدة",
      clearAll: "حذف الكل",
      clearAllHistory: "حذف كل السجل",
      clearAllHistoryConfirm: "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف كل سجل المشاهدة نهائياً.",
      searchHistory: "البحث في السجل...",
      noVideosInHistory: "لا توجد فيديوهات في السجل",
      noVideosMatchingSearch: "لا توجد فيديوهات تطابق البحث",
      videoRemoved: "تم حذف الفيديو من السجل",
      watchedTimes: "تمت المشاهدة",
      watchedAgo: "منذ",
      clearAllHistoryConfirm: "هل أنت متأكد أنك تريد مسح كل سجل المشاهدة؟ لا يمكن التراجع عن هذا الإجراء.",
      videoRemoved: "تمت إزالة الفيديو من السجل.",
      noVideosInHistory: "لا توجد فيديوهات في سجلك بعد.",
      noVideosMatchingSearch: "لا توجد فيديوهات في السجل تطابق بحثك.",
      watchedTimes: "شوهد",
    },
    settings: {
      appearance: "المظهر",
      performance: "الأداء",
      dataManagement: "إدارة البيانات",
      theme: "السمة",
      themeMode: "وضع السمة",
      light: "فاتح",
      dark: "داكن",
      system: "النظام",
      backgroundColor: "لون الخلفية",
      videoSettings: "إعدادات الفيديو",
      optimizePlayback: "تحسين أداء التشغيل",
      defaultQuality: "جودة الفيديو الافتراضية",
      bufferSize: "حجم التخزين المؤقت",
      autoplayNext: "تشغيل الفيديو التالي تلقائياً",
      lowSaveData: "منخفض (توفير البيانات)",
      mediumBalanced: "متوسط (متوازن)",
      highQuality: "عالي (جودة أفضل)",
      storage: "التخزين",
      manageData: "إدارة بيانات التطبيق",
      currentUsage: "الاستخدام الحالي",
      historyLimit: "حد السجل",
      historyLimitValue: (count: number) => `آخر ${count} فيديو`,
      last20: "آخر 20 فيديو",
      last50: "آخر 50 فيديو",
      last100: "آخر 100 فيديو",
      exportData: "تصدير البيانات",
      importData: "استيراد البيانات",
      deleteAllData: "حذف جميع البيانات",
      deleteAllDataConfirm:
        "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع الفيديوهات وقوائم التشغيل والإعدادات نهائياً.",
      settingsSaved: "تم حفظ الإعدادات",
      preferencesUpdated: "تم تحديث التفضيلات",
      title: "الإعدادات",
      loadError: "خطأ في تحميل الإعدادات",
      noSettingsFoundError: "لم يتم العثور على إعدادات. حاول إنشاء ملف تعريف جديد.",
      saveSuccess: "تم حفظ الإعدادات بنجاح",
      saveError: "خطأ في حفظ الإعدادات",
      exportSuccess: "تم تصدير البيانات بنجاح",
      exportError: "خطأ في تصدير البيانات",
      importSuccess: "تم استيراد البيانات بنجاح",
      importError: "خطأ في استيراد البيانات",
      importErrorFormat: "خطأ: تنسيق ملف الاستيراد غير صالح.",
      confirmClearData: "هل أنت متأكد أنك تريد حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.",
      clearDataSuccess: "تم حذف جميع البيانات بنجاح",
      clearDataError: "خطأ في حذف البيانات",
      selectTheme: "اختر السمة",
      lightTheme: "فاتح",
      darkTheme: "داكن",
      systemTheme: "النظام",
      playback: "التشغيل",
      autoplay: "تشغيل تلقائي",
      selectVideoQuality: "اختر جودة الفيديو",
      qualityAuto: "تلقائي",
      quality1080p: "1080p",
      quality720p: "720p",
      quality480p: "480p",
      history: "السجل",
      historyLimitLabel: "حد السجل",
      selectHistoryLimit: "اختر حد السجل",
      currentStorage: "التخزين الحالي",
      clearAllData: "حذف جميع البيانات",
    },
    welcome: {
      welcomeTitle: "مرحباً بك في تطبيق مشغل الفيديو",
      welcomeSubtitle: "تطبيق لتشغيل الفيديوهات وإدارة قوائم التشغيل بسهولة",
      getStarted: "البداية",
      startNow: "ابدأ الآن",
      createPlaylistNow: "إنشاء قائمة تشغيل",
      playVideo: "تشغيل فيديو",
      features: "المميزات",
      shortcuts: "اختصارات لوحة المفاتيح",
      videoPlayback: "تشغيل الفيديو",
      videoPlaybackDesc: "يمكنك تشغيل الفيديوهات من روابط مباشرة أو من منصات مثل يوتيوب",
      playlistsFeature: "قوائم التشغيل",
      playlistsFeatureDesc: "أنشئ قوائم تشغيل مخصصة وأضف إليها الفيديوهات المفضلة لديك",
      historyFeature: "سجل المشاهدة",
      historyFeatureDesc: "احتفظ بسجل للفيديوهات التي شاهدتها مؤخراً",
      customizeFeature: "تخصيص الإعدادات",
      customizeFeatureDesc: "خصص مظهر التطبيق وإعدادات الأداء حسب تفضيلاتك",
      playPause: "تشغيل/إيقاف",
      forward10: "تقديم 10 ثوان",
      backward10: "إرجاع 10 ثوان",
      volumeUp: "رفع الصوت",
      volumeDown: "خفض الصوت",
      nextTrack: "الفيديو التالي",
      previousTrack: "الفيديو السابق",
      mute: "كتم الصوت",
      togglePlaylist: "إظهار/إخفاء قائمة التشغيل",
      startUsing: "ابدأ الاستخدام",
    },
    addMenu: {
      addVideoLink: "إضافة رابط فيديو",
    },
    addVideoDialog: {
      title: "إضافة رابط فيديو",
      videoUrl: "رابط الفيديو",
      pleaseEnterValidUrl: "الرجاء إدخال رابط فيديو صالح",
      videoAdded: "تم إضافة الفيديو",
      videoStartedPlaying: "بدأ تشغيل الفيديو",
      errorLoadingVideo: "خطأ في تحميل الفيديو",
    },
    aboutDialog: {
      description: "تم تطوير هذا التطبيق باستخدام v0.dev",
      version: "الإصدار",
      developedBy: "طُوِّر بواسطة",
      email: "البريد الإلكتروني",
    },
  },
  en: {
    common: {
      play: "Play",
      pause: "Pause",
      next: "Next",
      previous: "Previous",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      add: "Add",
      edit: "Edit",
      search: "Search",
      loading: "Loading...",
      noResults: "No results",
      confirm: "Confirm",
      language: "Language",
      settings: "Settings",
      home: "Home",
      history: "History",
      playlists: "Playlists",
      quality: "Quality",
      appName: "My List Videos", // Updated
      noThumbnail: "No Thumbnail",
      category: "Category",
      tags: "Tags",
      off: "Off",
      goHome: "Go Home",
      backHome: "Back to Home",
      remove: "Remove",
      clear: "Clear",
      error: "An error occurred.",
      removedFromThisPlaylist: "removed from this playlist.",
      videoRemovedFromApp: "Video removed from the application.",
      about: "About",
    },
    navigation: {
      home: "Home",
      playlists: "Playlists",
      history: "History",
      toggleSidebar: "Toggle Sidebar",
    },
    player: {
      addToPlaylist: "Add to Playlist",
      deleteVideo: "Delete Video",
      nextVideo: "Next Video",
      playNow: "Play Now",
      playingFrom: "Playing from",
      playlist: "Playlist",
      videoOf: "of",
      editTitle: "Edit Title",
      titleUpdated: "Video title updated",
      qualityChanged: "Quality Changed",
      qualitySet: "Video quality set to",
      noVideoSelected: "No video selected",
      cinemaModeEnabled: "Cinema mode enabled",
      cinemaModeDisabled: "Cinema mode disabled",
      audioOnlyEnabled: "Audio only mode enabled",
      audioOnlyDisabled: "Audio only mode disabled",
      ccOn: "CC On",
      ccOff: "CC Off",
      subtitlesUpdated: "Subtitles updated",
      subtitlesUpdateFailed: "Failed to update subtitles",
      manageSubtitles: "Manage Subtitles",
      addSubtitles: "Add Subtitles",
      exitCinemaMode: "Exit Cinema Mode",
      cinemaMode: "Cinema Mode",
      showVideo: "Show Video",
      audioOnly: "Audio Only",
      audioOnlyMode: "Audio Only Mode",
      addToPlaylistShort: "Add to Playlist",
    },
    home: {
      title: "Video Player",
      subtitle: "Watch videos and create your own playlists",
      viewHistory: "View History",
      createPlaylist: "Create Playlist",
      recentlyWatched: "Recently Watched",
      enterVideoUrl: "Enter video URL (MP4, WebM, YouTube, etc.)",
      invalidUrl: "Please enter a valid video URL",
      generateThumbnail: "Generate Thumbnail",
      generatingThumbnail: "Generating...",
      singleUrl: "Single URL",
      multipleUrls: "Multiple URLs",
      enterMultipleUrls: "Enter multiple URLs (one per line)",
      processUrls: "Process URLs",
      noUrlsFound: "No URLs found",
      enterAtLeastOne: "Please enter at least one URL",
      lastWatchedPlaylist: "Last Watched Playlist",
      watchAgain: "Watch Again",
    },
    videoUrlInput: {
      singleUrlTab: "Single URL",
      multipleUrlsTab: "Multiple URLs",
      multipleUrlsLabel: "Enter multiple URLs (one per line)",
      processUrlsButton: "Process URLs",
    },
    search: {
      placeholder: "Search history...", // Used in history page
      placeholderGlobal: "Search videos and playlists...", // Used in global search input
      pleaseEnterQuery: "Please enter a search term.",
      noResults: "No videos found for",
      resultsTitle: "Search Results for",
      loading: "Searching...",
      source: "Source",
      sourceHistory: "History",
      sourcePlaylist: "Playlist",
      pleaseEnterSearchTerm: "Please enter a search term to begin.",
    },
    playlists: {
      myPlaylists: "My Playlists",
      noPlaylists: "No playlists yet",
      createYourFirst: "Create your first playlist",
      videos: "videos",
      updated: "Updated",
      name: "Name",
      description: "Description (optional)",
      descriptionPlaceholder: "A collection of my favorite videos",
      namePlaceholder: "My Playlist",
      creating: "Creating...",
      create: "Create",
      playAll: "Play All",
      shufflePlay: "Shuffle Play",
      noVideosInPlaylist: "No videos in this playlist yet",
      addedToPlaylist: "Added to playlist",
      videoAddedToPlaylist: "Video has been added to the playlist",
      title: "Playlists",
      createPlaylist: "Create Playlist",
      newPlaylist: "New Playlist",
      editPlaylist: "Edit Playlist",
      playlistName: "Playlist Name",
      playlistDescription: "Description (Optional)",
      addVideosToPlaylist: "Add videos to get started.",
      confirmDeletePlaylist: "Are you sure you want to delete this playlist?",
      playlistCreated: "Playlist created successfully.",
      playlistUpdated: "Playlist updated successfully.",
      playlistDeleted: "Playlist deleted.",
      videoRemovedFromPlaylist: "Video removed from playlist.",
      defaultPlaylist: "Default Playlist",
      setDefault: "Set as Default",
      unsetDefault: "Unset as Default",
      videoSingular: "video",
      shufflePlayShort: "Shuffle",
      clearAllWarning:
        "This will remove all videos from this playlist and delete them from your history. This action cannot be undone.",
      allVideosRemovedHistory: "All videos removed from this playlist and your history.",
    },
    history: {
      viewingHistory: "Viewing History",
      clearAll: "Clear All",
      clearAllHistory: "Clear all history?",
      clearAllHistoryConfirm: "This action cannot be undone. This will permanently delete all your viewing history.",
      searchHistory: "Search history...",
      noVideosInHistory: "No videos in history yet",
      noVideosMatchingSearch: "No videos found matching your search",
      videoRemoved: "Video has been removed from history",
      watchedTimes: "Watched",
      watchedAgo: "ago",
      clearAllHistoryConfirm: "Are you sure you want to clear all viewing history? This action cannot be undone.",
      videoRemoved: "Video removed from history.",
      noVideosInHistory: "No videos in your history yet.",
      noVideosMatchingSearch: "No videos in history match your search.",
      watchedTimes: "Watched",
    },
    settings: {
      appearance: "Appearance",
      performance: "Performance",
      dataManagement: "Data Management",
      theme: "Theme",
      themeMode: "Theme Mode",
      light: "Light",
      dark: "Dark",
      system: "System",
      backgroundColor: "Background Color",
      videoSettings: "Video Settings",
      optimizePlayback: "Optimize video playback performance",
      defaultQuality: "Default Video Quality",
      bufferSize: "Buffer Size",
      autoplayNext: "Autoplay next video",
      lowSaveData: "Low (Save data)",
      mediumBalanced: "Medium (Balanced)",
      highQuality: "High (Better quality)",
      storage: "Storage",
      manageData: "Manage your application data",
      currentUsage: "Current storage usage",
      historyLimit: "History Limit",
      historyLimitValue: (count: number) => `Last ${count} videos`,
      last20: "Last 20 videos",
      last50: "Last 50 videos",
      last100: "Last 100 videos",
      exportData: "Export Data",
      importData: "Import Data",
      deleteAllData: "Delete All Data",
      deleteAllDataConfirm:
        "This action cannot be undone. This will permanently delete all your videos, playlists, and settings.",
      settingsSaved: "Settings saved",
      preferencesUpdated: "Your preferences have been updated",
      title: "Settings",
      loadError: "Error loading settings",
      noSettingsFoundError: "No settings found. Try creating a new profile.",
      saveSuccess: "Settings saved successfully",
      saveError: "Error saving settings",
      exportSuccess: "Data exported successfully",
      exportError: "Error exporting data",
      importSuccess: "Data imported successfully",
      importError: "Error importing data",
      importErrorFormat: "Error: Invalid import file format.",
      confirmClearData: "Are you sure you want to delete all data? This action cannot be undone.",
      clearDataSuccess: "All data deleted successfully",
      clearDataError: "Error deleting data",
      selectTheme: "Select Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      systemTheme: "System",
      playback: "Playback",
      autoplay: "Autoplay",
      selectVideoQuality: "Select Video Quality",
      qualityAuto: "Auto",
      quality1080p: "1080p",
      quality720p: "720p",
      quality480p: "480p",
      history: "History",
      historyLimitLabel: "History Limit",
      selectHistoryLimit: "Select History Limit",
      currentStorage: "Current Storage",
      clearAllData: "Clear All Data",
    },
    welcome: {
      welcomeTitle: "Welcome to Video Player",
      welcomeSubtitle: "An app to play videos and manage playlists easily",
      getStarted: "Get Started",
      startNow: "Start Now",
      createPlaylistNow: "Create Playlist",
      playVideo: "Play Video",
      features: "Features",
      shortcuts: "Keyboard Shortcuts",
      videoPlayback: "Video Playback",
      videoPlaybackDesc: "Play videos from direct links or platforms like YouTube",
      playlistsFeature: "Playlists",
      playlistsFeatureDesc: "Create custom playlists and add your favorite videos to them",
      historyFeature: "Viewing History",
      historyFeatureDesc: "Keep track of videos you've watched recently",
      customizeFeature: "Customize Settings",
      customizeFeatureDesc: "Customize the app appearance and performance settings to your preferences",
      playPause: "Play/Pause",
      forward10: "Forward 10 seconds",
      backward10: "Backward 10 seconds",
      volumeUp: "Volume Up",
      volumeDown: "Volume Down",
      nextTrack: "Next Video",
      previousTrack: "Previous Video",
      mute: "Mute",
      togglePlaylist: "Toggle Playlist",
      startUsing: "Start Using",
    },
    addMenu: {
      addVideoLink: "Add Video Link",
    },
    addVideoDialog: {
      title: "Add Video Link",
      videoUrl: "Video URL",
      pleaseEnterValidUrl: "Please enter a valid video URL",
      videoAdded: "Video Added",
      videoStartedPlaying: "Video started playing",
      errorLoadingVideo: "Error loading video",
    },
    aboutDialog: {
      description: "This application was developed using v0.dev",
      version: "Version",
      developedBy: "Developed by",
      email: "Email",
    },
  },
}
