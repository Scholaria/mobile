import { hot } from "@/lib/trends";
 
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    if (!period) {
        return Response.json({ error: "Period is required" }, { status: 400 });
    }
    console.log(`Called : /trends/hot?period=${period}+api.ts GET`);
    const papers = await hot(period);
    return Response.json({ data: papers }, { status: 200 });
}
