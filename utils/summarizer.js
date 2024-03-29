const { GoogleGenerativeAI } = require('@google/generative-ai');
const editAndCommitFiles = require('./editAndCommitFiles');
const matter = require('gray-matter');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizer(article) {
  // https://ai.google.dev/tutorials/node_quickstart?hl=zh-cn#control-content-generation
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.5
    }
  });

  const prompt = `Summarize the following markdown in Chinese. Try to use your own words when possible. Keep your answer under 5 sentences.
  
  ${article}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text;
}

/**
 *
 * @param {{ files: string[], branch: string, context: import('probot').Context, before: string }} param0
 * @returns
 */
async function summarizerFiles({ files, branch, context, before }) {
  const getNewFiles = async (rawContent, filePath) => {
    const frontMatter = matter(rawContent);
    const summary = await summarizer(frontMatter.content);
    frontMatter.data.summary = summary;

    return {
      path: filePath,
      content: matter.stringify(frontMatter.content, frontMatter.data)
    };
  };

  return await editAndCommitFiles({
    files,
    branch,
    context,
    before,
    getNewFiles,
    commitMessage: 'summarizer article'
  });
}

module.exports = summarizerFiles;
