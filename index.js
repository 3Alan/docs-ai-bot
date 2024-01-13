const matter = require('gray-matter');
const summarizer = require('./lib/summarizer');

const mainBranch = 'main';

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = app => {
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  // https://docs.github.com/en/webhooks/webhook-events-and-payloads#push
  app.on('push', async context => {
    const { commits, repository, after, ref } = context.payload;
    const currentBranch = ref.split('/').pop();
    if (currentBranch !== mainBranch) {
      return;
    }

    const owner = context.payload.repository.owner.login;
    const repo = repository.name;
    const branch = `docusaurus-bot-${Math.floor(Math.random() * 9999)}`;

    app.log.info('Yay, my app is loaded');

    // 获取添加和修改的文件
    const files = commits.map(commit => commit.added.concat(commit.modified));

    // 创建分支
    await context.octokit.git.createRef({
      repo,
      owner,
      ref: `refs/heads/${branch}`,
      sha: after
    });

    // 遍历所有修改的文件
    for (const filePath of files.flat()) {
      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
      const { data } = await context.octokit.repos.getContent({
        repo,
        owner,
        path: filePath
      });

      // 添加summary字段
      const rawContent = Buffer.from(data.content, 'base64').toString('utf-8');
      let summary = '';
      try {
        summary = await summarizer(rawContent, app.log.info);
        app.log.info(summary, 'summary');
      } catch (error) {
        app.log.info(error);
      }

      const frontMatter = matter(rawContent);
      frontMatter.data.summary = summary;

      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
      await context.octokit.repos.createOrUpdateFileContents({
        repo,
        owner,
        path: filePath,
        message: 'translate',
        content: Buffer.from(matter.stringify(frontMatter.content, frontMatter.data)).toString(
          'base64'
        ),
        sha: data.sha,
        branch
      });
    }

    await context.octokit.pulls.create({
      repo,
      owner,
      title: 'translate',
      head: branch,
      base: mainBranch,
      body: 'Adds my new file!', // the body of your PR,
      maintainer_can_modify: true // allows maintainers to edit your app's PR
    });
  });
};
