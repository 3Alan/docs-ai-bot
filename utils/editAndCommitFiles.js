const getRepoInfo = require('./getRepoInfo');
const isContentChanged = require('./isContentChanged');

/**
 *
 * @param {{ files: string[], branch: string, context: import('probot').Context, before: string }} param0
 * @returns
 */
async function editAndCommitFiles({ files, branch, context, before, getNewFiles, commitMessage }) {
  if (!files.length) {
    return 0;
  }

  const { repo, owner } = getRepoInfo(context);
  const changes = [];

  for (const filePath of files) {
    if (before && !(await isContentChanged({ context, current: branch, before, path: filePath }))) {
      return 0;
    }

    // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    const { data } = await context.octokit.repos.getContent({
      repo,
      owner,
      path: filePath
    });

    try {
      const rawContent = Buffer.from(data.content, 'base64').toString('utf-8');
      changes.push(await getNewFiles(rawContent, filePath));
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
    message: commitMessage,
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
