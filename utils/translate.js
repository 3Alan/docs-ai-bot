const editAndCommitFiles = require('./editAndCommitFiles');
const matter = require('gray-matter');
const { translate } = require('../llms/openai');

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
