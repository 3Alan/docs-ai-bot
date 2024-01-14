const getRepoInfo = require('./getRepoInfo');

const mainBranch = 'main';

/**
 * @param {import('probot').Context} context
 * @returns {string[]}
 */
async function getAllFilePathList(context) {
  const { repo, owner } = getRepoInfo(context);

  // TODO: 配置化
  const dirList = ['blog', 'docs'];
  let result = [];

  for (const dir of dirList) {
    const { data } = await context.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: mainBranch
    });

    const targetSha = data.tree.find(item => item.path === dir).sha;

    // 递归找到所有的md文件
    const { data: docsData } = await context.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: targetSha,
      recursive: true
    });
    const files = docsData.tree
      .filter(item => /\.md(x?)$/.test(item.path))
      .map(item => `${dir}/${item.path}`);
    result.push(...files);
  }

  return result;
}

module.exports = getAllFilePathList;
