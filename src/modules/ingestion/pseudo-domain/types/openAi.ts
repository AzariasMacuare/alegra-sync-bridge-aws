import OpenAI, { APIPromise } from 'openai';

type OpenAiChatCompletions = Omit<OpenAI.Chat.Completions, '#private' | ' responsePromise' | ' parseResponse' | ' parsedPromise'>;

export type OpenAiResponse = APIPromise<OpenAiChatCompletions>;
