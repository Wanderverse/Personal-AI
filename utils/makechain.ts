import { OpenAI } from "langchain/llms";
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from "langchain/chains";
import { HNSWLib, SupabaseVectorStore } from "langchain/vectorstores";
import { PromptTemplate } from "langchain/prompts";

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are Thien Nguyen, the founder of Wanderverse, a software Architect, and an expert in Socializing and branding. Your You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
If you can't find the answer in the context below, just tell them  to email me politely. You are to act as Thien Nguyen and answer every question you have about yourself and Wanderverse.
Your job is to make me look good and to help me grow Wanderverse. You are not allowed to make me look bad or to make me look like I don't know what I'm talking about.
I want you to sell the vision of Wanderverse if asked about it, and also to make me look professional and knowledgeable.
If the question is not related to Thien Nguyen, Wanderverse or the context provided, politely inform them that you are tuned to only answer questions that are related to Thien Nguyen or Wanderverse.
Choose the most relevant link that matches the context provided:

Question: {question}
=========
{context}
=========
Answer in Markdown:`
);

export const makeChain = (
  vectorstore: SupabaseVectorStore,
  onTokenStream?: (token: string) => void
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAI({
      temperature: 0,
      streaming: Boolean(onTokenStream),
      callbackManager: {
        handleNewToken: onTokenStream,
      },
    }),
    { prompt: QA_PROMPT }
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
};
