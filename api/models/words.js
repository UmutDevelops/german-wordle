// A1-A2 seviyesinde Almanca kelimeler ve ipuçları
const words = [
    { word: 'HALLO', hint: 'Man sagt das zur Begrüßung' },
    { word: 'DANKE', hint: 'Man sagt das, wenn man höflich ist' },
    { word: 'BITTE', hint: 'Ein höfliches Wort beim Fragen' },
    { word: 'HAUS', hint: 'Hier wohnen Menschen' },
    { word: 'AUTO', hint: 'Ein Fahrzeug mit vier Rädern' },
    { word: 'KATZE', hint: 'Ein beliebtes Haustier' },
    { word: 'HUND', hint: 'Ein treues Haustier' },
    { word: 'SCHULE', hint: 'Hier lernen Kinder' },
    { word: 'WASSER', hint: 'Man trinkt das jeden Tag' },
    { word: 'BUCH', hint: 'Man kann es lesen' },
    { word: 'APFEL', hint: 'Eine rote oder grüne Frucht' },
    { word: 'BROT', hint: 'Man isst es zum Frühstück' },
    { word: 'KAFFEE', hint: 'Ein heißes Getränk am Morgen' },
    { word: 'MILCH', hint: 'Ein weißes Getränk von der Kuh' },
    { word: 'ZUCKER', hint: 'Macht das Essen süß' },
    { word: 'SALZ', hint: 'Macht das Essen lecker' },
    { word: 'SONNE', hint: 'Scheint am Tag am Himmel' },
    { word: 'MOND', hint: 'Scheint in der Nacht am Himmel' },
    { word: 'FREUND', hint: 'Eine wichtige Person im Leben' },
    { word: 'STADT', hint: 'Viele Menschen leben hier' },
    { word: 'DORF', hint: 'Kleine Stadt auf dem Land' },
    { word: 'BAUM', hint: 'Wächst im Garten oder Wald' },
    { word: 'BLUME', hint: 'Riecht gut und ist bunt' },
    { word: 'BRIEF', hint: 'Man schreibt das an Freunde' },
    { word: 'FENSTER', hint: 'Man sieht dadurch nach draußen' },
    { word: 'TISCH', hint: 'Man isst daran' },
    { word: 'STUHL', hint: 'Man sitzt darauf' },
    { word: 'FARBE', hint: 'Rot, Blau und Grün sind das' },
    { word: 'MUSIK', hint: 'Man hört das gerne' },
    { word: 'BALL', hint: 'Man spielt damit Sport' },
    { word: 'HANDY', hint: 'Man telefoniert damit' },
    { word: 'MONAT', hint: 'Januar ist einer davon' },
    { word: 'BILD', hint: 'Man kann das anschauen' },
    { word: 'KINO', hint: 'Hier sieht man Filme' },
    { word: 'PIZZA', hint: 'Ein leckeres Essen aus Italien' }
];

// Rastgele kelime seç
const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

// Belirli bir indeksteki kelimeyi al
const getWordByIndex = (index) => {
  if (index >= 0 && index < words.length) {
    return words[index];
  }
  return null;
};

// Tüm kelimeleri getir
const getAllWords = () => {
  return words;
};

module.exports = {
  getRandomWord,
  getWordByIndex,
  getAllWords
};