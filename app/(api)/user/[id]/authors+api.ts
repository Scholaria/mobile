import { addFollowAuthor, getFollowedAuthors, removeFollowAuthor } from "@/lib/users";
import "dotenv/config";

/**
 * This endpoint is used to get all followed authors by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/authors+api.ts GET`);
    const authors = await getFollowedAuthors(userId);
    return Response.json({ data: authors }, { status: 200 });
}

/**
 * This endpoint is used to add a followed author by their clerk id and author name
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/authors+api.ts POST`);
    const { author: authorName } = await request.json();
    const followedAuthor = await addFollowAuthor(userId, authorName);
    return Response.json({ data: followedAuthor }, { status: 200 });
}

/**
 * This endpoint is used to remove a followed author by their clerk id and author name
 * @param request - The request object
 * @returns The response object
 */
export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/authors+api.ts DELETE`);
    const { author: authorName } = await request.json();
    const followedAuthor = await removeFollowAuthor(userId, authorName);
    return Response.json({ data: followedAuthor }, { status: 200 });
}