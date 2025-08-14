import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

// Stream the response to the terminal - just used for testing purposes
async function streamToTerminal(client, model, messages) {
  const events = await client.chat.completions.create({ messages, model, max_tokens: 1000, stream: true });
  for await (const event of events) {
    for (const choice of event.choices) {
      const delta = choice.delta?.content;
      if (delta !== undefined) {
        process.stdout.write(delta);
      }
    }
  }
}

// Get the full response - you would typically use something like this in your code
async function getFullResponse(client, model, messages) {
  const response = await client.chat.completions.create({ messages, model, max_tokens: 1000 });
  return response.choices[0].message.content;
}
  
async function main() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.OPENAI_API_VERSION;
  const client = new AzureOpenAI({ endpoint, apiKey, apiVersion });

  const model = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello! This is a test. Please write a long response" }
  ];

  await streamToTerminal(client, model, messages);

//  let response = await getFullResponse(client, model, messages);
//  process.stdout.write(response);
}

main();