/**
 * @param {import('probot').Context} context
 * @returns {{owner: string, repo: string}}
 */
function getRepoInfo(context) {
  const { repository } = context.payload;
  const owner = repository.owner.login;
  const repo = repository.name;

  return {
    owner,
    repo
  };
}

module.exports = getRepoInfo;
