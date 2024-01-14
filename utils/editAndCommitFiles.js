const matter = require('gray-matter');
const summarizer = require('./summarizer');
const getRepoInfo = require('./getRepoInfo');

/**
 * 总结相关文件
 * @param {string} filePathList
 * @param {string} branch
 * @param {import('probot').Context} context
 * @returns {number}
 */
async function editAndCommitFiles(filePathList, branch, context) {
  if (!filePathList.length) {
    return;
  }

  const { repo, owner } = getRepoInfo(context);
  const changes = [];

  for (const filePath of filePathList) {
    // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    const { data } = await context.octokit.repos.getContent({
      repo,
      owner,
      path: filePath
    });

    try {
      // 添加summary字段
      const rawContent = Buffer.from(data.content, 'base64').toString('utf-8');
      const summary = await summarizer(rawContent);

      const frontMatter = matter(rawContent);
      frontMatter.data.summary = summary;

      changes.push({
        path: filePath,
        content: matter.stringify(frontMatter.content, frontMatter.data)
      });
    } catch (error) {
      console.log(error);
      continue;
    }
  }

  if (changes.length === 0) {
    return 0;
  }

  // https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree
  const { data } = await context.octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  });

  const tree = await context.octokit.git.createTree({
    owner,
    repo,
    tree: changes.map(item => ({
      path: item.path,
      content: item.content,
      mode: '100644',
      type: 'blob'
    })),
    base_tree: data.object.sha
  });

  const commit = await context.octokit.git.createCommit({
    owner,
    repo,
    message: 'summarizer article',
    tree: tree.data.sha,
    parents: [data.object.sha]
  });

  await context.octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.data.sha
  });

  return changes.length;
}

module.exports = editAndCommitFiles;
