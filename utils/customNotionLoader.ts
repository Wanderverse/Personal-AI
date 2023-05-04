import { Client as NotionClient } from "@notionhq/client";
import { Document } from "langchain/document";
import { BaseDocumentLoader } from "langchain/document_loaders";
import type { DocumentLoader } from "langchain/document_loaders";

export class CustomNotionLoader
  extends BaseDocumentLoader
  implements DocumentLoader
{
  notion: NotionClient;

  constructor(public notionApiKey: string, public databaseId: string) {
    super();
    this.notion = new NotionClient({ auth: notionApiKey });
  }

  async load(): Promise<Document[]> {
    try {
      const databaseQueryResponse = await this.notion.databases.query({
        database_id: this.databaseId,
      });

      const documents = databaseQueryResponse.results.map((page) => {
        const title = page.properties.title.plain_text;
        const content = page.properties.content.rich_text
          .map((c) => c.plain_text)
          .join(" ");

        // content &&
        //   content.map((c) => {
        //     const cleanedContent = c.plain_text.replace(/\s+/g, " ").trim();
        //     finalContent += " " + cleanedContent;
        //   });

        const cleanedContent = content.replace(/\s+/g, " ").trim();
        const contentLength = cleanedContent?.match(/\b\w+\b/g)?.length ?? 0;

        const metadata = {
          source: page.id,
          title,
          contentLength,
        };

        return new Document({ pageContent: cleanedContent, metadata });
      });

      return documents;
    } catch (error) {
      console.error(`Error while loading Notion data: ${error}`);
      return [];
    }
  }
}
