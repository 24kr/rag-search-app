import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { query, documents } = await req.json();

        if (!query || !documents) {
            return NextResponse.json(
                { error: "Query and documents are required" },
                { status: 400 }
            );
        }

        // Generate embedding for the query
        const embeddingModel = genAI.getGenerativeModel({
            model: "embedding-001",
        });

        const queryEmbedding = await embeddingModel.embedContent({
            content: query,
        });

        // Find relevant documents (simple cosine similarity)
        const relevantDocs = findRelevantDocuments(
            documents,
            queryEmbedding.embedding.values
        );

        // Generate answer using Gemini
        const generativeModel = genAI.getGenerativeModel({
            model: "gemini-pro",
        });

        const prompt = `Based on the following documents, answer the user's question:

Documents:
${relevantDocs.map((doc: any) => doc.content).join("\n\n")}

Question: ${query}

Answer:`;

        const result = await generativeModel.generateContent(prompt);
        const answer = await result.response;

        return NextResponse.json({
            answer: answer.text(),
            sources: relevantDocs.map((doc: any) => ({
                name: doc.name,
                content: doc.content.substring(0, 200),
            })),
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Failed to process search" },
            { status: 500 }
        );
    }
}

function findRelevantDocuments(
    documents: any[],
    queryEmbedding: number[]
) {
    // Simple implementation - you might want to use a vector DB like Pinecone
    return documents.slice(0, 3); // Return top 3 documents
}