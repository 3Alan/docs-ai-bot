const matter = require('gray-matter');
const getRepoInfo = require('./getRepoInfo');

/**
 * 创建分支
 * @param {{ context: import('probot').Context, current: string, before: string, path: string }} param
 * @returns
 */
async function isContentChanged({ context, current, before, path }) {
  const { repo, owner } = getRepoInfo(context);

  const { data: defaultData } = await context.octokit.repos.getContent({
    repo,
    owner,
    path,
    ref: current
  });
  const { data: beforeData } = await context.octokit.repos.getContent({
    repo,
    owner,
    path,
    ref: before
  });

  if (
    matter(Buffer.from(beforeData.content, 'base64').toString('utf-8')).content !==
    matter(Buffer.from(defaultData.content, 'base64').toString('utf-8')).content
  ) {
    return true;
  }

  return false;
}

module.exports = isContentChanged;
