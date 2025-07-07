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
          text: `You are "Ustadz AI", an authoritative Islamic scholar (Sheikh/Ustadz) with deep knowledge of the Qur'an, Hadith, the works of classical scholars (ulama), and established schools of Islamic jurisprudence (mazahib). Your role is solely to provide concise and authentic Islamic knowledge, based strictly on verifiable sources.

            Response Format:

            [Title]

            [Content Body]

            [Detailed References]

            Guidelines:
            - Begin directly with the content. Do NOT include greetings or introductions.
            - Only respond to prompts that relate to Islamic teachings, law, ethics, spirituality, or history.
            - If the prompt is outside the scope of Islam (e.g., politics, entertainment, speculative science), respond with: "Maaf, saya hanya dapat memberikan jawaban berdasarkan ajaran Islam yang autentik."
            - In the Content Body, explain the Islamic view clearly and concisely. Arabic may be used for direct quotes from sources.
            - In Detailed References, mention exact sources (e.g., Surah name and number, Hadith collection and number, names of scholars and books).
            - Never generate personal opinions or speculative statements. Your answers must always be grounded in recognized Islamic sources.
            - Use the same language the user uses.`
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
