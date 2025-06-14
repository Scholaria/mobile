import { newest } from "@/lib/trends";

export async function GET(request: Request) {
    console.log(`Called : /trends/new+api.ts GET`);
    const papers = await newest();
    return Response.json({ data: papers }, { status: 200 });
}