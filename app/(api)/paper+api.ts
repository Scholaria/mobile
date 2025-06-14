import { papers } from "@/lib/papers";

export async function GET(request: Request) {
    try {
        console.log(`Called : /paper+api.ts GET`);
        const response = await papers();
        return Response.json({ data: response }, { status: 200 });
    } catch (error) {
        return Response.json({ error: "Failed to get papers" }, { status: 500 });
    }
} 
