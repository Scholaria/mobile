import { dbIsLocal, getLocalPool, getNeonClient } from "./db";

/**
 * This function is used to get a paper by its paper id
 * @param paperId - The paper id
 * @returns The paper object
 */
export async function getPaper(paperId: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            WHERE a.paper_id = $1
            LIMIT 1
        `, [paperId]);
        return res.rows[0];
    } else {
        const sql = getNeonClient();
        const res = await sql`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            WHERE a.paper_id = ${paperId}
            LIMIT 1
        `;
        return res[0];
    }
}

/**
 * This function is used to search for papers by title
 * @param query - The query string
 * @returns The papers object
 */
export async function searchPapers(query: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const queryString = `%${query}%`;
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            WHERE a.title ILIKE $1
            ORDER BY a.id DESC
            LIMIT 3
        `, [queryString]);
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
            WHERE a.title ILIKE ${`%${query}%`}
            ORDER BY a.id DESC
            LIMIT 3
        `;
        return res;
    }
}

/**
 * This function is used to search for papers by author, organization and category
 * @param author - The author name
 * @param organization - The organization name
 * @param category - The category name
 * @returns The papers object
 */
export async function deepSearchPapers(author: string, organization: string, category: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            WHERE (a.author ILIKE $1 OR a.organization ILIKE $2 OR a.category ILIKE $3)
            ORDER BY a.id DESC
            LIMIT 10
        `, [`%${author}%`, `%${organization}%`, `%${category}%`]);
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
            WHERE (a.author ILIKE ${`%${author}%`} OR a.organization ILIKE ${`%${organization}%`} OR a.category ILIKE ${`%${category}%`})
            ORDER BY a.id DESC
            LIMIT 10
        `;
        return res;
    }
}

/**
 * This function is used to get all papers
 * @returns The papers object
 */
export async function papers() {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*, 
                   i.summary, 
                   i.keywords, 
                   i.organizations
            FROM arxiv_papers a
            LEFT JOIN paper_inference i ON a.paper_id = i.paper_id
            ORDER BY a.id DESC 
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
            ORDER BY a.id DESC 
            LIMIT 10
        `;
        return res;
    }
}

/**
 * This function is used to get all papers liked by a user
 * @param paperId - The paper id
 * @returns The papers object
 */
export async function likedBy(paperId: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*
            FROM arxiv_papers a
            INNER JOIN user_likes l ON a.paper_id = l.paper_id
            WHERE l.paper_id = $1
            ORDER BY l.created_at DESC
        `, [paperId]);
        return res.rows;
    } else {
        const sql = getNeonClient();
        const res = await sql`
            SELECT a.*
            FROM arxiv_papers a
            INNER JOIN user_likes l ON a.paper_id = l.paper_id
            WHERE l.paper_id = ${paperId}
            ORDER BY l.created_at DESC
        `;
        return res;
    }
}

/**
 * This function is used to get all papers saved by a user
 * @param paperId - The paper id
 * @returns The papers object
 */
export async function savedBy(paperId: string) {
    if (dbIsLocal) {
        const pool = getLocalPool();
        const res = await pool.query(`
            SELECT a.*
            FROM arxiv_papers a
            INNER JOIN user_saves s ON a.paper_id = s.paper_id
            WHERE s.paper_id = $1
            ORDER BY s.created_at DESC
        `, [paperId]);
        return res.rows;
    } else {
        const sql = getNeonClient();
        const res = await sql`
            SELECT a.*
            FROM arxiv_papers a
            INNER JOIN user_saves s ON a.paper_id = s.paper_id
            WHERE s.paper_id = ${paperId}
            ORDER BY s.created_at DESC
        `;
        return res;
    }
}
