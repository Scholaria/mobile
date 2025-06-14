import { addFollowCategory, getFollowedCategories, removeFollowCategory } from "@/lib/users";
import "dotenv/config";

/**
 * This endpoint is used to get all followed categories by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {  
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/categories+api.ts GET`);
    const categories = await getFollowedCategories(userId);
    return Response.json({ data: categories }, { status: 200 });
}

/**
 * This endpoint is used to add a followed category by their clerk id and category name
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/categories+api.ts POST`);
    const { category } = await request.json();
    const followedCategory = await addFollowCategory(userId, category);
    return Response.json({ data: followedCategory }, { status: 200 });
}

/**
 * This endpoint is used to remove a followed category by their clerk id and category name
 * @param request - The request object
 * @returns The response object
 */
export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/categories+api.ts DELETE`);
    const { category } = await request.json();
    const followedCategory = await removeFollowCategory(userId, category);
    return Response.json({ data: followedCategory }, { status: 200 });
}