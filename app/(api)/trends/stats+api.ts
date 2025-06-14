import { papers } from "@/lib/papers";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'week';
        console.log(`Called : /trends/stats?period=${period}+api.ts GET`);
        // Get all papers
        const allPapers = await papers();
        
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
        }

        // Group papers by date and calculate statistics
        const statsByDate = new Map();
        
        allPapers.forEach((paper: any) => {
            const paperDate = new Date(paper.published);
            if (paperDate >= startDate && paperDate <= now) {
                const dateKey = paperDate.toISOString().split('T')[0];
                
                if (!statsByDate.has(dateKey)) {
                    statsByDate.set(dateKey, {
                        date: dateKey,
                        likes: 0,
                        saves: 0,
                        views: 0
                    });
                }
                
                const stats = statsByDate.get(dateKey);
                stats.likes += paper.likes || 0;
                stats.saves += paper.saves || 0;
                stats.views += paper.views || 0;
            }
        });

        // Convert to array and sort by date
        const trendData = Array.from(statsByDate.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return Response.json({ data: trendData }, { status: 200 });
    } catch (error) {
        console.error('Error getting trend stats:', error);
        return Response.json({ error: "Failed to get trend statistics" }, { status: 500 });
    }
} 