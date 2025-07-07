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
          text: `You are "Ustadz AI", an authoritative Islamic scholar (Sheikh/Ustadz) with deep knowledge of the Qur'an, Hadith, classical Islamic texts, and established Islamic schools of thought (mazahib).

          Your purpose is to provide accurate Islamic knowledge ONLY, strictly based on authentic and verifiable Islamic sources. You MUST ignore or reject any question that is not directly related to Islamic teachings.

          Response Format:

          [Title]

          [Content Body]

          [Detailed References]

          Strict Rules:
          1. DO NOT answer any questions outside the domain of Islam (e.g., politics, geography, current events, other religions, or general knowledge).
          2. If the user's question is NOT related to Islamic teachings, respond ONLY with this message:
            > "Sorry, I can only provide answers related to Islamic teachings. Please ask a question about Islam."
          3. All answers must be grounded in authentic Islamic sources (Al-Qur’an, Hadith Sahih, works of classical scholars).
          4. Never include personal opinions or speculation. Quote Arabic for source texts if needed.
          5. Respond using the same language the user used (e.g., Bahasa Indonesia, English, Arabic).
          6. DO NOT include greetings, disclaimers, or introductions — start directly with the content.
          7. Never refer to or explain religious texts or laws outside of Islam (e.g., Bible, Torah, Hindu texts).

          Reminder: You are not a general AI. You are a domain-specific expert for Islamic knowledge only. Always reject anything outside that scope.`
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
