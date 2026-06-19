// lib/dictionary.ts
//
// WYMÓG KRYTYCZNY: żaden tekst widoczny dla użytkownika nie może być
// hardcodowany w komponencie. Wszystkie napisy żyją tutaj.
// Komponenty importują: import { dictionary } from '@/lib/dictionary'
// i używają np. dictionary.public.submitCta — nigdy literału stringa w JSX.
//
// Zmiana nazwy marki, tonu komunikatów czy jakiegokolwiek tekstu UI to
// edycja jednego pola w tym pliku, nie szukanie po całym repo.

export const dictionary = {
  brand: {
    name: 'wpadka commentary',
    eyebrow: 'nikt nie jest clean (i to ok)',
    titleAccent: 'commentary',
  },

  public: {
    subtitle: 'wrzuć zrzut swojej najlepszej wpadki — pośmiejmy się razem, nie z Ciebie',
    step1Cta: 'wybierz zdjęcie',
    step1Hint: 'zrzut ekranu, screen z czata, cokolwiek — Twoja wpadka, Twoje zasady',
    dragHint: 'albo przeciągnij plik tutaj',
    fileTooLarge: 'plik jest większy niż 10 MB — wybierz mniejszy',
    fileWrongType: 'ten format nie jest wspierany — użyj PNG, JPG, HEIC lub WEBP',
    nicknameLabel: 'twoja ksywka',
    nicknamePlaceholder: 'np. anka_z_dzielni',
    nicknameRequired: 'ksywka jest wymagana',
    nicknameTooLong: 'max 50 znaków',
    channelLinkLabel: 'link z kontekstem (opcjonalnie)',
    channelLinkPlaceholder: 'np. link do wątku/posta, gdzie to się wydarzyło',
    channelLinkInvalid: 'to nie wygląda jak prawidłowy link',
    submitCta: 'wyślij wpadkę',
    sendingState: 'wysyłanie...',
    successTitle: 'wysłano!',
    successBody: 'admini już widzą Twoją wpadkę',
    errorTitle: 'ups, coś nie zadziałało',
    errorBody: 'nie udało się wysłać — spróbuj jeszcze raz',
    retryCta: 'spróbuj jeszcze raz',
    removeFileCta: 'usuń i wybierz inne',
    whatsappCta: 'zobacz nasz kanał WhatsApp',
    loginHint: 'jesteś adminem?',
  },

  adminLogin: {
    title: 'logowanie admina',
    usernameLabel: 'login',
    usernamePlaceholder: 'twój login',
    passwordLabel: 'hasło',
    passwordPlaceholder: 'twoje hasło',
    submitCta: 'zaloguj się',
    submittingState: 'logowanie...',
    noRegisterHint: 'konta tworzone są przez zaproszenie',
    genericError: 'nieprawidłowy login lub hasło',
    backToPublic: '← wróć do strony głównej',
  },

  activate: {
    title: 'aktywacja konta',
    intro: 'wybierz login i hasło, którymi będziesz się logować',
    usernameLabel: 'login',
    usernamePlaceholder: 'np. anka92',
    usernameHint: '3–30 znaków: litery, cyfry, podkreślenie',
    usernameTaken: 'ten login jest już zajęty',
    displayNameLabel: 'jak mamy Cię wyświetlać',
    displayNamePlaceholder: 'np. Anka',
    displayNameRequired: 'wpisz, jak mamy Cię wyświetlać',
    passwordLabel: 'hasło',
    passwordPlaceholder: 'min. 8 znaków',
    passwordTooShort: 'hasło musi mieć min. 8 znaków',
    confirmPasswordLabel: 'powtórz hasło',
    passwordsDontMatch: 'hasła nie są identyczne',
    submitCta: 'aktywuj konto',
    submittingState: 'aktywowanie...',
    successTitle: 'konto aktywowane!',
    successBody: 'możesz się teraz zalogować',
    goToLoginCta: 'przejdź do logowania',
    invalidTokenTitle: 'link jest nieprawidłowy',
    invalidTokenBody: 'sprawdź, czy wkleiłeś cały link, albo poproś operatora o nowy',
    usedTokenTitle: 'ten link został już wykorzystany',
    usedTokenBody: 'jeśli to nie Ty go użyłeś, poproś operatora o nowy link',
    expiredTokenTitle: 'ten link wygasł',
    expiredTokenBody: 'poproś operatora o nowy link aktywacyjny',
    genericError: 'coś nie zadziałało — spróbuj jeszcze raz',
  },

  adminQueue: {
    tabPending: 'kolejka',
    tabPendingShort: 'kolejka',
    tabScheduled: 'zaplanowane',
    tabScheduledShort: 'zapl.',
    tabDone: 'omówione',
    tabDoneShort: 'omów.',
    skipCta: 'pomiń',
    deleteCta: 'usuń',
    deleteConfirmTitle: 'usunąć to zgłoszenie?',
    deleteConfirmBody: 'tej operacji nie można odwrócić',
    deleteConfirmCta: 'tak, usuń',
    deleteCancelCta: 'nie, wróć',
    statusDoneLabel: 'omówione',
    statusDoneBy: (name: string) => `przez ${name}`,
    statusScheduledLabel: 'zaplanowane',
    emptyPending: 'kolejka jest pusta — wszystkie zgłoszenia obsłużone 🎉',
    emptyScheduled: 'nic nie jest zaplanowane — kolejka czeka w drugim tabie',
    emptyDone: 'jeszcze nic nie zostało omówione',
    bannerOverdue: (n: number) =>
      n === 1
        ? '1 zaplanowany post czeka na wysłanie'
        : `${n} zaplanowane posty czekają na wysłanie`,
    bannerCta: 'zobacz',
    loadingState: 'wczytywanie...',
    relativeJustNow: 'przed chwilą',
    relativeMinutesAgo: (n: number) => `${n} min temu`,
    relativeHoursAgo: (n: number) => `${n} godz. temu`,
    relativeDaysAgo: (n: number) => `${n} dni temu`,
    nextCta: 'dalej',
    logoutCta: 'wyloguj',
    settingsCta: 'ustawienia',
  },

  editor: {
    title: 'edytor komentarza',
    closeCta: 'zamknij',
    formatBold: 'pogrubienie',
    formatItalic: 'kursywa',
    formatStrikethrough: 'przekreślenie',
    formatMonospace: 'blok kodu',
    formatInlineCode: 'kod inline',
    formatInlineCodeSymbol: '`x`',
    formatBulletList: 'lista punktowana',
    formatNumberedList: 'lista numerowana',
    formatQuote: 'cytat',
    insertVariableCta: 'wstaw zmienną ▾',
    senderVarLabel: '%sender%',
    senderVarHint: 'ksywka osoby, która zgłosiła wpadkę',
    channelVarLabel: '%channel_link%',
    channelVarHint: 'link z kontekstu zgłoszenia (jeśli podany)',
    textareaPlaceholder: 'napisz swój komentarz tutaj... użyj *bold*, _italic_, ~strike~',
    previewLabel: 'podgląd',
    previewSignatureHint: 'podpis dodawany automatycznie z ustawień konta',
    settingsLinkCta: 'zmień w ustawieniach',
    missingChannelWarning: 'to zgłoszenie nie ma linku — %channel_link% zostanie puste',
    scheduleCta: 'zaplanuj wysłanie',
    schedulePickerTitle: 'kiedy wysłać?',
    scheduleDateLabel: 'data',
    scheduleTimeLabel: 'godzina',
    scheduleConfirmCta: 'zapisz termin',
    scheduleCancelCta: 'anuluj',
    schedulePastError: 'termin musi być w przyszłości',
    scheduleSavedToast: 'zaplanowano',
    copyCta: 'kopiuj do WhatsApp',
    copiedToast: 'skopiowano',
    emptyCommentError: 'wpisz treść komentarza',
    savingState: 'zapisywanie...',
    senderLabel: 'od',
    channelLinkLabel: 'link',
    noChannelLink: 'brak linku',
  },

  settings: {
    title: 'ustawienia',
    backCta: '← wróć do panelu',
    accountSection: 'twoje konto',
    loginLabel: 'login',
    displayNameLabel: 'wyświetlana nazwa',
    signatureSection: 'podpis',
    signatureLabel: 'twój podpis',
    signatureHint: 'doklejany automatycznie na końcu każdego komentarza przy kopiowaniu',
    signaturePlaceholder: 'np. *— Kasia*',
    previewLabel: 'podgląd',
    previewSamplePlaceholder: 'treść twojego komentarza tutaj...',
    previewSampleSender: 'anka92',
    saveCta: 'zapisz podpis',
    savingState: 'zapisywanie...',
    savedToast: 'zapisano',
    errorToast: 'nie udało się zapisać',
  },

  master: {
    title: 'panel operatora',
    backCta: '← wróć do panelu',
    invitesSection: 'linki aktywacyjne',
    generateCta: 'wygeneruj nowy link',
    generatingState: 'generowanie...',
    copyLinkCta: 'kopiuj link',
    linkCopiedToast: 'link skopiowany',
    expiresLabel: (date: string) => `wygasa ${date}`,
    usedLabel: 'wykorzystany',
    unusedLabel: 'aktywny',
    adminsSection: 'administratorzy',
    adminsEmpty: 'brak adminów — wygeneruj pierwszy link aktywacyjny',
    operatorBadge: 'operator',
    deactivateCta: 'dezaktywuj',
    deactivateConfirmTitle: 'dezaktywować to konto?',
    deactivateConfirmBody: 'osoba nie będzie mogła się już zalogować',
    deactivateConfirmCta: 'tak, dezaktywuj',
    deactivateCancelCta: 'nie, wróć',
  },

  common: {
    loading: 'wczytywanie...',
    error: 'wystąpił błąd',
    cancel: 'anuluj',
    confirm: 'potwierdź',
    close: 'zamknij',
    save: 'zapisz',
    yes: 'tak',
    no: 'nie',
    notFoundTitle: '404',
    notFoundSubtitle: 'Not Found',
    notFoundCta: '← strona główna',
  },
};

export type Dictionary = typeof dictionary;

/**
 * Dzieli dictionary.brand.name na część bazową i akcentowaną (titleAccent),
 * żeby komponenty mogły wyrenderować nazwę z kolorowym fragmentem bez
 * hardcodowania samej nazwy marki w JSX. Jeśli titleAccent nie jest
 * sufiksem name, całość trafia do baseName, a accent jest pusty.
 */
export function splitBrandName(): { baseName: string; accent: string } {
  const { name, titleAccent } = dictionary.brand;
  if (titleAccent && name.endsWith(titleAccent)) {
    return {
      baseName: name.slice(0, name.length - titleAccent.length),
      accent: titleAccent,
    };
  }
  return { baseName: name, accent: '' };
}
