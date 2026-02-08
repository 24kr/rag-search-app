import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = [
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Supported: PDF, TXT, DOCX" },
                { status: 400 }
            );
        }

        // Save file
        const buffer = await file.arrayBuffer();
        const uploadDir = path.join(process.cwd(), "public/uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, file.name);
        fs.writeFileSync(filePath, Buffer.from(buffer));

        // Generate embedding using Gemini
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        const fileContent = Buffer.from(buffer).toString("utf-8");

        const embedding = await model.embedContent({
            content: fileContent.substring(0, 5000), // Limit to first 5000 chars
        });

        return NextResponse.json({
            success: true,
            message: "File uploaded and processed successfully",
            fileName: file.name,
            embedding: embedding.embedding.values,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}