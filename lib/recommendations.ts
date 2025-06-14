import { dbIsLocal, getLocalPool, getNeonClient } from "./db";

/**
 * 
 * simple recommendation system, it will just use the users last 5 liked papers' categories to find similar papers
 * Get personalized paper recommendations for a user based on their interests and liked papers
 * If the user has no likes, returns random papers
 * @param userId - The user's Clerk ID
 * @returns Array of recommended papers with full paper information
 */
export async function getRecommendations(userId: string, limit: number = 5, offset: number = 0) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        // First check if user has any likes
        const userLikesCheck = await pool.query(
            'SELECT COUNT(*) FROM user_likes WHERE user_id = $1',
            [userId]
        );
        
        if (userLikesCheck.rows[0].count === '0') {
            // If no likes, return papers ordered by md5 hash for deterministic randomization
            const randomPapers = await pool.query(`
                SELECT 
                    p.*,
                    i.summary,
                    i.keywords,
                    i.organizations,
                    COALESCE(l.like_count, 0) as like_count,
                    COALESCE(s.save_count, 0) as save_count,
                    md5(p.paper_id) as random_order
                FROM arxiv_papers p
                LEFT JOIN paper_inference i ON p.paper_id = i.paper_id
                LEFT JOIN (
                    SELECT paper_id, COUNT(*) as like_count 
                    FROM user_likes 
                    GROUP BY paper_id
                ) l ON p.paper_id = l.paper_id
                LEFT JOIN (
                    SELECT paper_id, COUNT(*) as save_count 
                    FROM user_saves 
                    GROUP BY paper_id
                ) s ON p.paper_id = s.paper_id
                ORDER BY random_order
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
            return randomPapers.rows;
        }

        const res = await pool.query(`
            WITH user_liked_papers AS (
                SELECT p.paper_id, p.category, p.published
                FROM user_likes ul
                JOIN arxiv_papers p ON ul.paper_id = p.paper_id
                WHERE ul.user_id = $1
                ORDER BY p.published DESC
                LIMIT 10
            ),
            user_categories AS (
                SELECT category, COUNT(*) as category_count
                FROM user_liked_papers
                GROUP BY category
                ORDER BY category_count DESC
                LIMIT 3
            )
            SELECT 
                p.*,
                i.summary,
                i.keywords,
                i.organizations,
                COALESCE(l.like_count, 0) as like_count,
                COALESCE(s.save_count, 0) as save_count,
                md5(p.paper_id) as random_order
            FROM arxiv_papers p
            LEFT JOIN paper_inference i ON p.paper_id = i.paper_id
            LEFT JOIN (
                SELECT paper_id, COUNT(*) as like_count 
                FROM user_likes 
                GROUP BY paper_id
            ) l ON p.paper_id = l.paper_id
            LEFT JOIN (
                SELECT paper_id, COUNT(*) as save_count 
                FROM user_saves 
                GROUP BY paper_id
            ) s ON p.paper_id = s.paper_id
            WHERE p.category IN (SELECT category FROM user_categories)
            AND p.paper_id NOT IN (SELECT paper_id FROM user_liked_papers)
            ORDER BY random_order
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return res.rows;
    } else {
        const sql = getNeonClient();
        // First check if user has any likes
        const userLikesCheck = await sql`
            SELECT COUNT(*) FROM user_likes WHERE user_id = ${userId}
        `;
        
        if (userLikesCheck[0].count === 0) {
            // If no likes, return papers ordered by md5 hash for deterministic randomization
            const randomPapers = await sql`
                SELECT 
                    p.*,
                    i.summary,
                    i.keywords,
                    i.organizations,
                    COALESCE(l.like_count, 0) as like_count,
                    COALESCE(s.save_count, 0) as save_count,
                    md5(p.paper_id) as random_order
                FROM arxiv_papers p
                LEFT JOIN paper_inference i ON p.paper_id = i.paper_id
                LEFT JOIN (
                    SELECT paper_id, COUNT(*) as like_count 
                    FROM user_likes 
                    GROUP BY paper_id
                ) l ON p.paper_id = l.paper_id
                LEFT JOIN (
                    SELECT paper_id, COUNT(*) as save_count 
                    FROM user_saves 
                    GROUP BY paper_id
                ) s ON p.paper_id = s.paper_id
                ORDER BY random_order
                LIMIT ${limit} OFFSET ${offset}
            `;
            console.log(randomPapers);
            return randomPapers;
        }

        const res = await sql`
            WITH user_liked_papers AS (
                SELECT p.paper_id, p.category, p.published
                FROM user_likes ul
                JOIN arxiv_papers p ON ul.paper_id = p.paper_id
                WHERE ul.user_id = ${userId}
                ORDER BY p.published DESC
                LIMIT 10
            ),
            user_categories AS (
                SELECT category, COUNT(*) as category_count
                FROM user_liked_papers
                GROUP BY category
                ORDER BY category_count DESC
                LIMIT 3
            )
            SELECT 
                p.*,
                i.summary,
                i.keywords,
                i.organizations,
                COALESCE(l.like_count, 0) as like_count,
                COALESCE(s.save_count, 0) as save_count,
                md5(p.paper_id) as random_order
            FROM arxiv_papers p
            LEFT JOIN paper_inference i ON p.paper_id = i.paper_id
            LEFT JOIN (
                SELECT paper_id, COUNT(*) as like_count 
                FROM user_likes 
                GROUP BY paper_id
            ) l ON p.paper_id = l.paper_id
            LEFT JOIN (
                SELECT paper_id, COUNT(*) as save_count 
                FROM user_saves 
                GROUP BY paper_id
            ) s ON p.paper_id = s.paper_id
            WHERE p.category IN (SELECT category FROM user_categories)
            AND p.paper_id NOT IN (SELECT paper_id FROM user_liked_papers)
            ORDER BY random_order
            LIMIT ${limit} OFFSET ${offset}
        `;
        console.log(res);
        return res;
    }
}