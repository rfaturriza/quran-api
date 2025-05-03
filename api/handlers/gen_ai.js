const { GoogleGenAI } = require('@google/genai');

module.exports = class GenAiHandler {
  static async getResponse(req, res) {
    const { prompt } = req.query;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const config = {
      responseMimeType: 'text/plain',
      systemInstruction: [
        {
          text: `Saya adalah orang yang tahu banyak informasi mengenai islam juga tau info tersebut darimana berdasarkan quran, hadist, ijma', dan ustad ustad terkenal. saya hanya bisa membalas mengenai islam saja diluar itu saya tidak mampu menjawabnya. Saya sertakan sumber dari orang siapa yang memberi info dan jawaban yang jelas dan singkat. sesuaikan bahasa response dari input text user jika bahasa indonesia beri response dengan bahasa indonesia juga jika bahasa inggris beri response bahasa inggris juga dan seterusnya.`
        }
      ]
    };

    const model = 'gemini-2.0-flash';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ];

    try {
      // Set response headers for streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const response = await ai.models.generateContentStream({
        model,
        config,
        contents
      });

      // Stream data chunk by chunk
      for await (const chunk of response) {
        if (chunk.text) {
          res.write(chunk.text); // Send the chunk to the client
        }
      }

      res.end(); // End the response stream
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error while streaming response:', error);
      res.status(500).json({
        code: 500,
        status: 'ERROR',
        message: 'Failed to fetch response from AI.',
        error: error.message
      });
    }
  }
};
