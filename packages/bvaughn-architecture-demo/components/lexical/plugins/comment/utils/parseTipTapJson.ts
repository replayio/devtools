export default function parseTipTapJson(json: any): string {
  let markdownString = "";

  json.content.forEach(({ content }: any) => {
    if (markdownString !== "") {
      markdownString += "\n\n";
    }

    content?.forEach(({ marks = [], text, type }: any) => {
      switch (type) {
        case "hardBreak": {
          markdownString += "\n";
          break;
        }
        case "text": {
          let formattedText = text;

          marks?.forEach(({ type }: any) => {
            switch (type) {
              case "bold": {
                formattedText = `**${formattedText}**`;
                break;
              }
              case "italic": {
                formattedText = `*${formattedText}*`;
                break;
              }
            }
          });

          markdownString += formattedText;
          break;
        }
        default: {
          markdownString += text;
          break;
        }
      }
    });
  });

  return markdownString;
}
