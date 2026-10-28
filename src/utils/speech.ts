// Speech synthesis utility for reading questions to elementary students
export function speakText(text: string, lang: 'zh-TW' | 'en-US' = 'zh-TW', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const cleanText = text
    .replace(/[（(][^）)]*[）)]/g, '') // remove parenthesized hints for cleaner speech
    .replace(/_{2,}/g, '空格') // read blanks as '空格'
    .replace(/÷/g, '除以')
    .replace(/×/g, '乘以')
    .replace(/=/g, '等於')
    .replace(/\+/g, '加上')
    .replace(/-/g, '減去');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower, comfortable for kids
  utterance.pitch = 1.05; // Slightly cheerful pitch

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  // Try to find natural Taiwanese voice
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'zh-TW') {
    const twVoice = voices.find((v) => v.lang === 'zh-TW' || v.lang.startsWith('zh-Hant'));
    if (twVoice) utterance.voice = twVoice;
  } else {
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
