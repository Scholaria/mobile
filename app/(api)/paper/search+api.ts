import { searchPapers } from "@/lib/papers";

/**
 * This function is used to search for papers by title, authors or categories
 * @param request - The request object
 * @returns The papers object
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    console.log(`Called : /paper/search?query=${query} GET`);
    if (!query) {
        return Response.json({ error: "Query is required" }, { status: 400 });
    }
    // Fix agsint SQL injections
    // const papers = await searchPapers(query);
    // return Response.json({ data: papers }, { status: 200 });
}