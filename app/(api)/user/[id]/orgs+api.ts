import { addFollowOrganization, getFollowedOrganizations, removeFollowOrganization } from "@/lib/users";
import "dotenv/config";

/**
 * This endpoint is used to get all followed organizations by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/orgs+api.ts GET`);
    const orgs = await getFollowedOrganizations(userId);
    return Response.json({ data: orgs }, { status: 200 });
}

/**
 * This endpoint is used to add a followed organization by their clerk id and organization name
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/orgs+api.ts POST`);
    const { organization } = await request.json();
    const org = await addFollowOrganization(userId, organization);
    return Response.json({ data: org }, { status: 200 });
}

/**
 * This endpoint is used to remove a followed organization by their clerk id and organization name
 * @param request - The request object
 * @returns The response object
 */
export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    console.log(`Called : /user/${userId}/orgs+api.ts DELETE`);
    const { organization } = await request.json();
    const org = await removeFollowOrganization(userId, organization);
    return Response.json({ data: org }, { status: 200 });
}