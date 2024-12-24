export const findUrls = (text: string): { start: number; end: number; url: string }[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls: { start: number; end: number; url: string }[] = [];
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push({
      start: match.index,
      end: match.index + match[0].length,
      url: match[0]
    });
  }
  
  return urls;
};

export const splitTextWithUrls = (text: string) => {
  const urls = findUrls(text);
  if (urls.length === 0) return [{ type: 'text', content: text }];

  const parts: { type: 'text' | 'url'; content: string }[] = [];
  let lastIndex = 0;

  urls.forEach(({ start, end, url }) => {
    if (start > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, start) });
    }
    parts.push({ type: 'url', content: url });
    lastIndex = end;
  });

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
};