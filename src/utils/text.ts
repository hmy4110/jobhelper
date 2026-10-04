/**
 * Korean character and byte counting utility
 */
export function countKoreanText(text: string) {
  const withSpaces = text.length;
  const withoutSpaces = text.replace(/\s/g, '').length;
  
  // Korean byte count (EUC-KR typically 2 bytes, UTF-8 3 bytes; Korean job portals like JobKorea/Saramin usually count 2 bytes per Korean char, 1 byte for ascii)
  let byteCount = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode <= 0x007f) {
      byteCount += 1;
    } else {
      byteCount += 2;
    }
  }

  return {
    withSpaces,
    withoutSpaces,
    byteCount,
  };
}

/**
 * Speech synthesis helper for reading interview questions
 */
export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  // Strip markdown symbols for natural reading
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .slice(0, 300); // limit chunk for smooth speech

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ko-KR';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
