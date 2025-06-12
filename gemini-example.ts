// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Type } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: ["title", "description"],
      properties: {
        title: {
          type: Type.STRING,
        },
        description: {
          type: Type.STRING,
        },
      },
    },
  };
  const model = "gemini-2.0-flash";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `次のドキュメントファイル群を読んで、GitHubリポジトリのタイトル(title)と説明文(description)を提案してください。なお、descriptionに適切なフレーズがあればそのまま利用してください。要約する必要はありません。ただ長すぎる場合は30語(日本語は100文字)程度に収まるようにしてください。

---README.md
lightfile-proxy-v2
LightFile Proxyのバージョン2です。
---`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
