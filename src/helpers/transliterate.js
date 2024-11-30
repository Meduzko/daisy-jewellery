// import CyrillicToTranslit from 'cyrillic-to-translit-js';

// // Initialize the transliteration instance with the Ukrainian preset
// const cyrillicToTranslit = new CyrillicToTranslit({ preset: 'uk' });

// /**
//  * Transliterates Ukrainian text and encodes it for use in a URL.
//  * @param {string} text - The Ukrainian text to be transliterated and encoded.
//  * @returns {string} - The encoded transliterated text.
//  */
// export function transliterateAndEncode(text) {
//   const transliteratedText = cyrillicToTranslit.transform(text);
//   const encodedText = encodeURIComponent(transliteratedText);
//   return encodedText;
// }

// /**
//  * Decodes text from a URL parameter and reverse transliterates it to Ukrainian.
//  * @param {string} text - The encoded transliterated text from the URL.
//  * @returns {string} - The original Ukrainian text.
//  */
// export function decodeAndReverseTransliterate(text) {
//   const decodedText = decodeURIComponent(text);
//   const originalText = cyrillicToTranslit.reverse(decodedText);
//   return originalText;
// }
