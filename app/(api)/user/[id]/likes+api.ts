import { addLikedPaper, getLikedPapers, removeLikedPaper } from "@/lib/users";
import "dotenv/config";

/**
 * This endpoint is used to get all liked papers by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/likes+api.ts GET`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const likedPapers = await getLikedPapers(clerkId);
    return Response.json({ data: likedPapers }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * This endpoint is used to add a liked paper by their clerk id and paper id
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/likes+api.ts POST`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const { paperId } = await request.json();
    const likedPaper = await addLikedPaper(clerkId, paperId);
    return Response.json({ data: likedPaper }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/likes+api.ts DELETE`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const { paperId } = await request.json();
    const likedPaper = await removeLikedPaper(clerkId, paperId);
    return Response.json({ data: likedPaper }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}   