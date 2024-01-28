const { OpenAI } = require('openai');

async function translate(article) {
  const config = {
    apiKey: process.env.OPENAI_API_KEY
  };
  if (process.env.OPENAI_API_BASE_URL) {
    config.baseURL = process.env.OPENAI_API_BASE_URL;
  }

  const openai = new OpenAI(config);

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a translator for Markdown documents.' },
      {
        role: 'user',
        content: `Translate the following markdown into English

      ${article}
      `
      }
    ],
    model: 'gpt-3.5-turbo-16k'
  });

  return chatCompletion.choices[0].message.content;
}

async function summarizer(article) {
  const config = {
    apiKey: process.env.OPENAI_API_KEY
  };
  if (process.env.OPENAI_API_BASE_URL) {
    config.baseURL = process.env.OPENAI_API_BASE_URL;
  }

  const openai = new OpenAI(config);

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a summarizer for Markdown documents.' },
      {
        role: 'user',
        content: `Summarize the following markdown in Chinese. Try to use your own words when possible. Keep your answer under 5 sentences.
  
        ${article}
        `
      }
    ],
    model: 'gpt-3.5-turbo'
  });

  return chatCompletion.choices[0].message.content;
}

module.exports = {
  translate,
  summarizer
};
