type Link = {
  shortLink: string;
};

export async function createShortLink(url: string) {
  const resp = await fetch("/recording/api/short-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  const data = (await resp.json()) as Link;
  navigator.clipboard.writeText(data.shortLink);
  console.log("...", data);
}
