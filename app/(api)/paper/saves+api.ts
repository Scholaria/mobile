import { savedBy } from "@/lib/papers";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get("paperId");
    if (!paperId) {
        return Response.json({ error: "Paper ID is required" }, { status: 400 });
    }
    console.log(`Called : /paper/saves?paperId=${paperId}+api.ts GET`);
    const saves = await savedBy(paperId);
    return Response.json({ data: saves }, { status: 200 });
}