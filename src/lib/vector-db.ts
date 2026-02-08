import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function storeEmbedding(
    documentId: string,
    embedding: number[]
) {
    const index = pc.Index("rag-documents");

    await index.upsert({
        records: [
            {
                id: documentId,
                values: embedding,
                metadata: {
                    source: "pdf",
                },
            },
        ],
    });
}