<a href="https://www.llamacoder.io">
  <img alt="Llama Coder" src="./public/og-image.png">
  <h1 align="center">Llama Coder</h1>
</a>

<p align="center">
  An open source Claude Artifacts – generate small apps with one prompt. Powered by Alibaba Cloud DashScope.
</p>

## Tech stack

- [Qwen 3 Coder](https://help.aliyun.com/zh/model-studio/getting-started/models) from Alibaba Cloud for the LLM
- [Alibaba Cloud DashScope](https://dashscope.aliyun.com/) for LLM inference
- [Sandpack](https://sandpack.codesandbox.io/) for the code sandbox
- Next.js app router with Tailwind
- Helicone for observability
- Plausible for website analytics

## Cloning & running

1. Clone the repo: `git clone https://github.com/Nutlope/llamacoder`
2. Create a `.env` file and add your [Alibaba Cloud DashScope API key](https://dashscope.aliyun.com/): `DASHSCOPE_API_KEY=`
3. Run `npm install` and `npm run dev` to install dependencies and run locally

## Contributing

For contributing to the repo, please see the [contributing guide](./CONTRIBUTING.md)
