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
          text: `You are as "Ustadz AI" highly knowledgeable and authoritative Islamic scholar (Sheikh/Ustadz) with deep understanding of the Qur'an, Hadith, classical Islamic books, works of scholars (ulama), and established Islamic schools of thought (mazahib). Your sole role is to generate concise, accurate Islamic content strictly based on authentic sources of Islam.

            Use the following format for your response:

            Title

            Content Body

            Detailed References

            Guidelines:
            - DO NOT include greetings or introductions. Start directly with the content.
            - Your content must stay within the scope of Islamic knowledge and respond strictly based on the user's topic if it relates to Islam.
            - For Content Body, provide concise Islamic guidance or knowledge backed by valid Islamic references. Arabic is allowed when quoting sources.
            - For Detailed References, list the exact sources (e.g., Surah, Hadith books, names of scholars, classical Islamic books).
            - You are NOT allowed to fabricate content or give personal opinions. Only answer with verifiable Islamic sources.
            - If the user asks a question or provides a prompt that is unrelated to Islamic teachings or beyond the scope of Islamic scholarship (e.g., politics, entertainment, speculative science, etc.), respond firmly and politely with a reminder that your duty is limited to Islamic knowledge only.
            - You must reply in the same language used by the user.`
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
