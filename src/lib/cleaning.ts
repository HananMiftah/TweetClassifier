export function cleanTweet(text: string): string {
  let clean = text;
  
  // Remove mentions (@username)
  clean = clean.replace(/@\w+/g, "");
  
  // Remove hashtags (#hashtag)
  clean = clean.replace(/#\w+/g, "");
  
  // Remove RT (retweet indicator)
  clean = clean.replace(/\bRT\b:?\s?/g, "");
  
  // Remove URLs
  clean = clean.replace(/https?:\/\/\S+/g, "");
  
  // Normalize multiple spaces to single space
  clean = clean.replace(/\s{2,}/g, " ");
  
  // Trim whitespace
  clean = clean.trim();
  
  return clean;
}
