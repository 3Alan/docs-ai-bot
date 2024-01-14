const getRepoInfo = require('./getRepoInfo');

const mainBranch = 'main';

/**
 * 创建分支
 * @param {import('probot').Context} context
 * @returns
 */
async function createBranch(context) {
  const { repo, owner } = getRepoInfo(context);
  const branch = `docusaurus-bot-${Math.floor(Math.random() * 9999)}`;

  const { data: refData } = await context.octokit.git.getRef({
    repo,
    owner,
    ref: `heads/${mainBranch}`
  });

  // 创建分支
  await context.octokit.git.createRef({
    repo,
    owner,
    ref: `refs/heads/${branch}`,
    sha: refData.object.sha
  });

  return branch;
}

module.exports = createBranch;
