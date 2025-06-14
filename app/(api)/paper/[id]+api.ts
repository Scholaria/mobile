import { getPaper } from "@/lib/papers";



export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const paperId = url.pathname.split('/').pop();  
        console.log(`Called : /paper/${paperId}+api.ts GET`);
        if (!paperId) {
            return Response.json({ error: "Paper ID is required" }, { status: 400 });
        }
        const paper = await getPaper(paperId);
        return Response.json({ data: paper }, { status: 200 });
    } catch (error) {
        return Response.json({ error: "Failed to get paper" }, { status: 500 });
    }
} 