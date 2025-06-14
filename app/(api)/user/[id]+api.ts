import { deleteUser, getUserByClerkId, updateUser } from "@/lib/users";

/**
 * This endpoint is used to get a user by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const clerkId = url.pathname.split('/').pop();
        console.log(`Called : /user/${clerkId}+api.ts GET`);
        if (!clerkId) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }

        const user = await getUserByClerkId(clerkId);
        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }
        return Response.json({ data: user }, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * This endpoint is used to update a user by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function PATCH(request: Request) {
    try {
      const url = new URL(request.url);
      const clerkId = url.pathname.split("/").pop();
      console.log(`Called : /user/${clerkId}+api.ts PATCH`);
      if (!clerkId) {
        return Response.json({ error: "User ID is required" }, { status: 400 });
      }
  
      // Expecting JSON: { affiliations: string[], interests: string[], role: string, profileImage: string }
      const { affiliations, interests, role, profile_image_url } = await request.json();
  
      const updatedUser = await updateUser(
        clerkId,
        affiliations,
        interests,
        role, 
        profile_image_url
      );
      return Response.json({ data: updatedUser }, { status: 200 });
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * This endpoint is used to delete a user by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/").pop();
    console.log(`Called : /user/${clerkId}+api.ts DELETE`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const deletedUser = await deleteUser(clerkId);
    return Response.json({ data: deletedUser }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}