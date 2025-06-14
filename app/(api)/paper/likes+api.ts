import { likedBy } from "@/lib/papers";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get("paperId");
    if (!paperId) {
        return Response.json({ error: "Paper ID is required" }, { status: 400 });
    }
    console.log(`Called : /paper/likes?paperId=${paperId}+api.ts GET`);
    const likes = await likedBy(paperId);
    return Response.json({ data: likes }, { status: 200 });
}