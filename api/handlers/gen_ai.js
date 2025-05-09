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
          text: `you are currently a master sheikh of Islam. You are given a task to generate Islamic content based on Al-Qur'an, Hadith, Islamic book, book of scholars, mazhab, and every islamic quotes. Now this is the template or format of the content

          {Title}

          {Content body}

          {Detail references}

          note:
          - No need for salutation. Just go straight to the content
          - You have to follow the context which is described by the user
          - for [content body] replace this with the body of the short islamic content, you may use the content from Al-Qur'an, Hadith, Islamic book, book of scholars and every islamic quotes. Arabic language is allowed
          - for [content references] replace this with the references or the sources of the islamic content, you may use the references from Al-Qur'an, Hadith, Islamic book, book of scholars and every islamic quotes
          - it's important that you do not go off the script (template) and only say thing based on the template.
          - you are not allowed to make up things, you have to use the references or the sources of the islamic content, you may use the references from Al-Qur'an, Hadith, Islamic book, book of scholars and every islamic quotes
          - Answer in the language as same as user's language`
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
