# Docs AI Bot

An AI bot powered by Gemini that helps you to summarize and translate your documents. This bot is specifically designed for Docusaurus.

## Features

- 🤖 Automatically summarize your documents and create a PR
- 🤖 Automatically translate your documents and create a PR

> A GitHub App built with [Probot](https://github.com/probot/probot) that A Probot app

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t docs-ai-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> docs-ai-bot
```

## Contributing

If you have suggestions for how docs-ai-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2024 3Alan
