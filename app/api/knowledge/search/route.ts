import { knowledgeManager } from "@/lib/ai/rag/knowledge-manager";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const { query, libraryType = "all", limit = 5 } = await _req.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const results = await knowledgeManager.search(query, libraryType, limit);

  return NextResponse.json({
    results,
    query,
    libraryType,
    limit,
    total: results.length,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const knowledgeBases = knowledgeManager.listKnowledgeBases();

  return NextResponse.json({
    knowledgeBases,
  });
}
