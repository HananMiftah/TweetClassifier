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

export async function cleanTweetDjango(text: string): Promise<string> {
  try {
    const response = await fetch(
      "https://backend-apii-o46a.onrender.com/api/sentiment/clean/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );

    const data = await response.json();
    return data.cleaned || text;
  } catch (e) {
    console.error("Cleaning failed, using original text", e);
    return text;
  }
}
