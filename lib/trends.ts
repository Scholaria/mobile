import { dbIsLocal, getLocalPool, getNeonClient } from "./db";

export async function top(period: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations,
                   COUNT(l.paper_id) as like_count
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            LEFT JOIN user_likes l ON a.paper_id = l.paper_id
            ${period !== 'all' ? `WHERE a.published >= NOW() - INTERVAL '1 ${period}'` : ''}
            GROUP BY a.id, i.paper_id
            ORDER BY like_count DESC
            LIMIT 5
        `);
        return res.rows;
    } else {
        const sql = getNeonClient();
        const interval = period !== 'all' ? `INTERVAL '1 ${period}'` : '';
        const res = await sql`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations,
                   COUNT(l.paper_id) as like_count
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            LEFT JOIN user_likes l ON a.paper_id = l.paper_id
            ${period !== 'all' ? sql`WHERE a.published >= NOW() - ${interval}` : sql``}
            GROUP BY a.id, i.paper_id
            ORDER BY like_count DESC
            LIMIT 5
        `;
        return res;
    }
}

export async function hot(period: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations,
                   COUNT(DISTINCT l.paper_id) + COUNT(DISTINCT s.paper_id) as activity_count
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            LEFT JOIN user_likes l ON a.paper_id = l.paper_id
            LEFT JOIN user_saves s ON a.paper_id = s.paper_id
            ${period !== 'all' ? `WHERE a.published >= NOW() - INTERVAL '1 ${period}'` : ''}
            GROUP BY a.id, i.paper_id
            ORDER BY activity_count DESC
            LIMIT 10
        `);
        return res.rows;
    } else {
        const sql = getNeonClient();
        const interval = period !== 'all' ? `INTERVAL '1 ${period}'` : '';
        const res = await sql`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations,
                   COUNT(DISTINCT l.paper_id) + COUNT(DISTINCT s.paper_id) as activity_count
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            LEFT JOIN user_likes l ON a.paper_id = l.paper_id
            LEFT JOIN user_saves s ON a.paper_id = s.paper_id
            ${period !== 'all' ? sql`WHERE a.published >= NOW() - ${interval}` : sql``}
            GROUP BY a.id, i.paper_id
            ORDER BY activity_count DESC
            LIMIT 10
        `;
        return res;
    }
}

export async function newest() {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            ORDER BY a.published DESC
            LIMIT 10
        `);
        return res.rows;
    } else {
        const sql = getNeonClient();
        const res = await sql`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            ORDER BY a.published DESC
            LIMIT 10
        `;
        return res;
    }
}