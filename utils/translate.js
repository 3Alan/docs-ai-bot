const { GoogleGenerativeAI } = require('@google/generative-ai');
const editAndCommitFiles = require('./editAndCommitFiles');
const matter = require('gray-matter');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function translate(article) {
  // https://ai.google.dev/tutorials/node_quickstart?hl=zh-cn#control-content-generation
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.3
    }
  });

  const prompt = `Translate the following markdown into English
  
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
async function translateFiles({ files, branch, context, before }) {
  const getNewFiles = async (rawContent, filePath) => {
    const translatedContent = await translate(rawContent);
    if (/^blog\//.test(filePath)) {
      filePath = filePath.replace(/^blog\//, 'i18n/en/docusaurus-plugin-content-blog-blog/');
    } else {
      filePath = filePath.replace(/^docs\//, 'i18n/en/docusaurus-plugin-content-docs/current/');
    }

    const frontMatter = matter(translatedContent);
    frontMatter.data.ai_translation = true;

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
    commitMessage: 'translate article'
  });
}

module.exports = translateFiles;
