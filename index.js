const summarizerFiles = require('./utils/summarizer');
const createBranch = require('./utils/createBranch');
const getRepoInfo = require('./utils/getRepoInfo');
const getAllFilePathList = require('./utils/getAllFilePathList');
const translateFiles = require('./utils/translate');

// TODO: 在项目中建立一个ai-bot.json文件
// 将prompt、主分支、commit模版等配置抽离
const mainBranch = 'main';

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = app => {
  app.on('issues.labeled', async context => {
    const { label, action, issue } = context.payload;

    if (action !== 'labeled' || (label.name !== 'summarizer' && label.name !== 'translate')) {
      return;
    }

    const { owner, repo } = getRepoInfo(context);
    const { data: commitData } = await context.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issue.number,
      body: label.name === 'summarizer' ? '开始总结文章...' : '开始翻译文章...'
    });

    const files = await getAllFilePathList(context);
    if (files.length === 0) {
      await context.octokit.issues.updateComment({
        owner,
        repo,
        comment_id: commitData.id,
        body: '没有内容需要处理'
      });

      return;
    }

    const branch = await createBranch(context);

    const completedCount =
      label === 'summarizer'
        ? await summarizerFiles({ files, branch, context })
        : await translateFiles({ files, branch, context });

    // https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#create-a-pull-request
    const { data: prData } = await context.octokit.pulls.create({
      repo,
      owner,
      title:
        label === 'summarizer'
          ? '[docs-ai-bot] summarizer all docs'
          : '[docs-ai-bot] translate all docs',
      head: branch,
      base: mainBranch,
      body: `所有文章总结完成，共处理${completedCount}个文件。\n Close ${issue.html_url}
      `,
      maintainer_can_modify: true // allows maintainers to edit your app's PR
    });

    await context.octokit.issues.updateComment({
      owner,
      repo,
      comment_id: commitData.id,
      body:
        label === 'summarizer'
          ? `所有文章总结完成，请合并 ${prData.html_url}`
          : `所有文章翻译完成，请合并 ${prData.html_url}`
    });

    app.log.info(files);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  // https://docs.github.com/en/webhooks/webhook-events-and-payloads#push
  app.on('push', async context => {
    const { commits, ref, before } = context.payload;
    const currentBranch = ref.split('/').pop();
    if (currentBranch !== mainBranch) {
      return;
    }

    const { owner, repo } = getRepoInfo(context);
    // 获取添加和修改的文件
    const files = commits
      .map(commit => commit.added.concat(commit.modified))
      .flat()
      .filter(item => /^(blog|docs)\/.*\.(md|mdx)$/.test(item));
    if (files.length === 0) {
      return;
    }

    const branch = await createBranch(context);

    const summaryCount = await summarizerFiles({ files, branch, context, before });
    const translationCount = await translateFiles({ files, branch, context, before });
    const completedCount = summaryCount + translationCount;

    // 没有内容改变，不需要提pr
    if (completedCount === 0) {
      app.log.info('没有内容改变，不需要提pr');
      return;
    }

    await context.octokit.pulls.create({
      repo,
      owner,
      title: '[docs-ai-bot] summarizer and translate docs',
      head: branch,
      base: mainBranch,
      body: `总结完成，共处理${completedCount}个文件`,
      maintainer_can_modify: true // allows maintainers to edit your app's PR
    });
  });
};
