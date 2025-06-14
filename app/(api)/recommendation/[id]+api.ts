import { getRecommendations } from "@/lib/recommendations";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();  
        console.log(`Called : /recommendation/${id}+api.ts GET`);
        if (!id) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }
        // Get recommendations for the user
        const recommendations = await getRecommendations(id);
        
        // Return the recommendations
        return new Response(JSON.stringify({
            data: recommendations,
            error: null
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return new Response(JSON.stringify({
            data: null,
            error: "Failed to fetch recommendations"
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 