import { dbIsLocal, getLocalPool, getNeonClient } from "./db";

/**
 * This function is used to insert a user into the database
 * @param name - The name of the user
 * @param email - The email of the user
 * @param clerkId - The clerk id of the user
 * @returns The user object
 */
export async function insertUser({ clerkId, name, email }: { clerkId: string; name: string; email: string }) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query(
      "INSERT INTO users (clerk_id, name, email) VALUES ($1, $2, $3) RETURNING *",
      [clerkId, name, email]
    );
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`
      INSERT INTO users (clerk_id, name, email)
      VALUES (${clerkId}, ${name}, ${email})
      RETURNING *;
    `;
    return res[0];
  }
}


/**
 * This function is used to get all users from the database
 * @returns The users object
 */
export async function getUsers() {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM users");
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM users`;
    return res;
  }
}


/**
 * This function is used to get a user by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The user object with their categories, likes, and saves
 */
export async function getUserByClerkId(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query(
      `
      SELECT
        u.*,
        COALESCE(
          (
            SELECT json_agg(DISTINCT p.category)
            FROM user_likes ul
            JOIN arxiv_papers p ON ul.paper_id = p.paper_id
            WHERE ul.user_id = $1
          ),
          '[]'
        ) AS categories,
        COALESCE(
          (
            SELECT json_agg(row_to_json(like_row))
            FROM (
              SELECT
                p.paper_id,
                p.title,
                p.authors,
                p.category,
                p.published
              FROM user_likes ul
              JOIN arxiv_papers p ON ul.paper_id = p.paper_id
              WHERE ul.user_id = $1
              ORDER BY p.published DESC
            ) AS like_row
          ),
          '[]'
        ) AS likes,
        COALESCE(
          (
            SELECT json_agg(row_to_json(save_row))
            FROM (
              SELECT
                p.paper_id,
                p.title,
                p.authors,
                p.category,
                p.published
              FROM user_saves us
              JOIN arxiv_papers p ON us.paper_id = p.paper_id
              WHERE us.user_id = $1
              ORDER BY p.published DESC
            ) AS save_row
          ),
          '[]'
        ) AS saves
      FROM users u
      WHERE u.clerk_id = $1
      `,
      [clerkId]
    );
    console.log(res.rows[0]);
    return res.rows[0] ?? null;
  } else {
    const sql = getNeonClient();
    const rows = await sql`
      SELECT
        u.*,
        COALESCE(
          (
            SELECT json_agg(DISTINCT p.category)
            FROM user_likes ul
            JOIN arxiv_papers p ON ul.paper_id = p.paper_id
            WHERE ul.user_id = ${clerkId}
          ),
          '[]'
        ) AS categories,
        COALESCE(
          (
            SELECT json_agg(row_to_json(like_row))
            FROM (
              SELECT
                p.paper_id,
                p.title,
                p.authors,
                p.category,
                p.published
              FROM user_likes ul
              JOIN arxiv_papers p ON ul.paper_id = p.paper_id
              WHERE ul.user_id = ${clerkId}
              ORDER BY p.published DESC
            ) AS like_row
          ),
          '[]'
        ) AS likes,
        COALESCE(
          (
            SELECT json_agg(row_to_json(save_row))
            FROM (
              SELECT
                p.paper_id,
                p.title,
                p.authors,
                p.category,
                p.published
              FROM user_saves us
              JOIN arxiv_papers p ON us.paper_id = p.paper_id
              WHERE us.user_id = ${clerkId}
              ORDER BY p.published DESC
            ) AS save_row
          ),
          '[]'
        ) AS saves
      FROM users u
      WHERE u.clerk_id = ${clerkId}
    `;
    console.log(rows[0]);
    return rows[0] ?? null;
  }
}

/**
 * This function is used to update a user by their clerk id
 * @param clerkId - The clerk id of the user
 * @param affiliations - The affiliations of the user
 * @param interests - The interests of the user
 * @param role - The role of the user
 * @param profileImage - The profile image of the user
 * @returns The user object
 */
export async function updateUser(clerkId: string, affiliations: string[], interests: string[], role: string, profile_image_url: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    console.log("Updating user in database");
    console.log("clerkId", clerkId);
    console.log("affiliations", affiliations);
    console.log("interests", interests);
    console.log("role", role);
    console.log("profile_image_url", profile_image_url);
    const res = await pool.query("UPDATE users SET affiliations = $1, interests = $2, role = $3, profile_image_url = $4 WHERE clerk_id = $5", [affiliations, interests, role, profile_image_url, clerkId]);
    console.log("Updated user in database");
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    console.log("Updating user in database");
    console.log("clerkId", clerkId);
    console.log("affiliations", affiliations);
    console.log("interests", interests);
    console.log("role", role);
    console.log("profile_image_url", profile_image_url);
    const res = await sql`UPDATE users SET affiliations = ${affiliations}, interests = ${interests}, role = ${role}, profile_image_url = ${profile_image_url} WHERE clerk_id = ${clerkId}`;
    return res[0];
  }
}


/**
 * This function is used to delete a user by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The user object
 */
export async function deleteUser(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM users WHERE clerk_id = $1", [clerkId]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM users WHERE clerk_id = ${clerkId}`;
    return res[0];
  }
}

/**
 * This function is used to add a liked paper by their clerk id and paper id
 * @param clerkId - The clerk id of the user
 * @param paperId - The paper id of the paper
 * @returns The user object
 */
export async function addLikedPaper(clerkId: string, paperId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    console.log("clerkId", clerkId);
    console.log("paperId", paperId);
    const res = await pool.query("INSERT INTO user_likes (user_id, paper_id) VALUES ($1, $2)", [clerkId, paperId]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`INSERT INTO user_likes (user_id, paper_id) VALUES (${clerkId}, ${paperId})`;
    return res[0];
  }
}

/**
 * This function is used to remove a liked paper by their clerk id and paper id
 * @param clerkId - The clerk id of the user
 * @param paperId - The paper id of the paper
 * @returns The user object
 */
export async function removeLikedPaper(clerkId: string, paperId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM user_likes WHERE user_id = $1 AND paper_id = $2", [clerkId, paperId]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM user_likes WHERE user_id = ${clerkId} AND paper_id = ${paperId}`;
    return res[0];
  }
}

/**
 * This function is used to get all liked papers by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The liked papers object
 */
export async function getLikedPapers(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM user_likes WHERE user_id = $1", [clerkId]);
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM user_likes WHERE user_id = ${clerkId}`;
    return res;
  }
}

/**
 * This function is used to add a saved paper by their clerk id and paper id
 * @param clerkId - The clerk id of the user
 * @param paperId - The paper id of the paper
 * @returns The user object
 */
export async function addSavePaper(clerkId: string, paperId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("INSERT INTO user_saves (user_id, paper_id) VALUES ($1, $2)", [clerkId, paperId]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`INSERT INTO user_saves (user_id, paper_id) VALUES (${clerkId}, ${paperId})`;
    return res[0];
  }
}

/**
 * This function is used to remove a saved paper by their clerk id and paper id
 * @param clerkId - The clerk id of the user
 * @param paperId - The paper id of the paper
 * @returns The user object
 */
export async function removeSavePaper(clerkId: string, paperId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM user_saves WHERE user_id = $1 AND paper_id = $2", [clerkId, paperId]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM user_saves WHERE user_id = ${clerkId} AND paper_id = ${paperId}`;
    return res[0];
  }
}

/**
 * This function is used to get all saved papers by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The saved papers object
 */
export async function getSavePaper(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM user_saves WHERE user_id = $1", [clerkId]);
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM user_saves WHERE user_id = ${clerkId}`;
    return res;
  }
}


/**
 * This function is used to get all followed authors by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The followed authors object
 */
export async function getFollowedAuthors(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM user_follow_authors WHERE user_id = $1", [clerkId]);
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM user_follow_authors WHERE user_id = ${clerkId}`;
    return res;
  }
}

/**
 * This function is used to add a followed author by their clerk id and author name
 * @param clerkId - The clerk id of the user
 * @param author - The author name to follow
 * @returns The followed author object
 */
export async function addFollowAuthor(clerkId: string, author: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("INSERT INTO user_follow_authors (user_id, author) VALUES ($1, $2)", [clerkId, author]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`INSERT INTO user_follow_authors (user_id, author) VALUES (${clerkId}, ${author})`;
    return res[0];
  }
}

/**
 * This function is used to remove a followed author by their clerk id and author name
 * @param clerkId - The clerk id of the user
 * @param author - The author name to unfollow
 * @returns The followed author object
 */
export async function removeFollowAuthor(clerkId: string, author: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM user_follow_authors WHERE user_id = $1 AND author = $2", [clerkId, author]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM user_follow_authors WHERE user_id = ${clerkId} AND author = ${author}`;
    return res[0];
  }
}

/**
 * This function is used to get all followed categories by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The followed categories object
 */
export async function getFollowedCategories(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM user_follow_categories WHERE user_id = $1", [clerkId]);
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM user_follow_categories WHERE user_id = ${clerkId}`;
    return res;
  }
}

/**
 * This function is used to add a followed category by their clerk id and category name
 * @param clerkId - The clerk id of the user
 * @param category - The category name to follow
 * @returns The followed category object
 */
export async function addFollowCategory(clerkId: string, category: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("INSERT INTO user_follow_categories (user_id, category) VALUES ($1, $2)", [clerkId, category]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`INSERT INTO user_follow_categories (user_id, category) VALUES (${clerkId}, ${category})`;
    return res[0];
  }
}

/**
 * This function is used to remove a followed category by their clerk id and category name
 * @param clerkId - The clerk id of the user
 * @param category - The category name to unfollow
 * @returns The followed category object
 */
export async function removeFollowCategory(clerkId: string, category: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM user_follow_categories WHERE user_id = $1 AND category = $2", [clerkId, category]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM user_follow_categories WHERE user_id = ${clerkId} AND category = ${category}`;
    return res[0];
  }
}

/**
 * This function is used to get all followed organizations by their clerk id
 * @param clerkId - The clerk id of the user
 * @returns The followed organizations object
 */
export async function getFollowedOrganizations(clerkId: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("SELECT * FROM user_follow_organizations WHERE user_id = $1", [clerkId]);
    return res.rows;
  } else {
    const sql = getNeonClient();
    const res = await sql`SELECT * FROM user_follow_organizations WHERE user_id = ${clerkId}`;
    return res;
  }
}

/**
 * This function is used to add a followed organization by their clerk id and organization name
 * @param clerkId - The clerk id of the user
 * @param organization - The organization name to follow
 * @returns The followed organization object
 */
export async function addFollowOrganization(clerkId: string, organization: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("INSERT INTO user_follow_organizations (user_id, organization) VALUES ($1, $2)", [clerkId, organization]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`INSERT INTO user_follow_organizations (user_id, organization) VALUES (${clerkId}, ${organization})`;
    return res[0];
  }
}

/**
 * This function is used to remove a followed organization by their clerk id and organization name
 * @param clerkId - The clerk id of the user
 * @param organization - The organization name to unfollow
 * @returns The followed organization object
 */
export async function removeFollowOrganization(clerkId: string, organization: string) {
  if (dbIsLocal) {
    const pool = getLocalPool();
    const res = await pool.query("DELETE FROM user_follow_organizations WHERE user_id = $1 AND organization = $2", [clerkId, organization]);
    return res.rows[0];
  } else {
    const sql = getNeonClient();
    const res = await sql`DELETE FROM user_follow_organizations WHERE user_id = ${clerkId} AND organization = ${organization}`;
    return res[0];
  }
}