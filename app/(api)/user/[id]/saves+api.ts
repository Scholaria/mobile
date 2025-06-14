import { addSavePaper, getSavePaper, removeSavePaper } from "@/lib/users";
import "dotenv/config";

/**
 * This endpoint is used to get all saved papers by their clerk id
 * @param request - The request object
 * @returns The response object
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/saves+api.ts GET`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const savedPapers = await getSavePaper(clerkId);
    return Response.json({ data: savedPapers }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
} 

/**
 * This endpoint is used to add a saved paper by their clerk id and paper id
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/saves+api.ts POST`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const { paperId } = await request.json();
    const savedPaper = await addSavePaper(clerkId, paperId);
    return Response.json({ data: savedPaper }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * This endpoint is used to remove a saved paper by their clerk id and paper id
 * @param request - The request object
 * @returns The response object
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const clerkId = url.pathname.split("/")[3];
    console.log(`Called : /user/${clerkId}/saves+api.ts DELETE`);
    if (!clerkId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const { paperId } = await request.json();
    const savedPaper = await removeSavePaper(clerkId, paperId);
    return Response.json({ data: savedPaper }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}