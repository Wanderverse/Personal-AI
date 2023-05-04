import { Document } from "langchain/document";
import * as fs from "fs/promises";
import { CustomNotionLoader } from "@/utils/customNotionLoader";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Embeddings, OpenAIEmbeddings } from "langchain/embeddings";
import { SupabaseVectorStore } from "langchain/vectorstores";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { supabaseClient } from "@/utils/supabase-client";
import { databaseIds } from "@/config/notionIds";

async function extractDataFromNotionDatabase(
  notionApiKey: string,
  databaseId: string
): Promise<Document[]> {
  try {
    const loader = new CustomNotionLoader(notionApiKey, databaseId);
    const docs = await loader.load();
    return docs;
  } catch (error) {
    console.error(
      `Error while extracting data from database ${databaseId}: ${error}`
    );
    return [];
  }
}

async function extractDataFromNotionDatabases(
  notionApiKey: string,
  databaseIds: string[]
): Promise<Document[]> {
  console.log("extracting data from notion databases...");
  const documents: Document[] = [];

  for (const databaseId of databaseIds) {
    console.log(databaseId);
    const docs = await extractDataFromNotionDatabase(notionApiKey, databaseId);
    documents.push(...docs);
    console.log(...docs, documents);
  }

  console.log("data extracted from notion databases");
  const json = JSON.stringify(documents);
  await fs.writeFile("thiennguyen.json", json);
  console.log("json file containing data saved on disk");
  return documents;
}

async function embedDocuments(
  client: SupabaseClient,
  docs: Document[],
  embeddings: Embeddings
) {
  console.log("creating embeddings...");
  await SupabaseVectorStore.fromDocuments(client, docs, embeddings);
  console.log("embeddings successfully stored in supabase");
}

async function splitDocsIntoChunks(docs: Document[]): Promise<Document[]> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });
  return await textSplitter.splitDocuments(docs);
}

(async function run(notionApiKey: string, databaseIds: string[]) {
  try {
    //load data from each Notion database
    const rawDocs = await extractDataFromNotionDatabases(
      notionApiKey,
      databaseIds
    );
    //split docs into chunks for openai context window
    const docs = await splitDocsIntoChunks(rawDocs);
    //embed docs into supabase
    await embedDocuments(supabaseClient, docs, new OpenAIEmbeddings());
  } catch (error) {
    console.log("error occured:", error);
  }
})(process.env.NOTION_API_KEY, databaseIds);
