import Koa from "koa";
import Router from "koa-router";
import { Storage } from "@google-cloud/storage";
import send from "koa-send";
import cors from "@koa/cors";

const app = new Koa();
const router = new Router();
app.use(
  cors({
    origin: "*",
    allowMethods: ["GET", "POST"],
    credentials: true,
  })
);

const gcs = new Storage();
const bucketName = "test_bucket_joniba";
const videoName = "videos/record_05_03_2024_12_36.mp4";

router.get("/", async (ctx) => {
  await send(ctx, "public/index.html", { root: __dirname });
});

router.get("/video", async (ctx) => {
  try {
    const videoFile = gcs.bucket(bucketName).file(videoName);
    const [exists] = await videoFile.exists();

    if (!exists) {
      ctx.status = 404;
      ctx.body = "File not found";
      return;
    }

    const [metadata] = await videoFile.getMetadata();
    const videoSize = parseInt(metadata.size, 10);

    const range = ctx.request.headers.range;
    console.log(range);
    if (!range) {
      ctx.status = 400;
      ctx.body = "Range header is required";
      return;
    }

    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr
      ? parseInt(endStr, 10)
      : Math.min(start + 10 ** 6 - 1, videoSize - 1);

    const contentLength = end - start + 1;

    ctx.set({
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength.toString(),
      "Content-Type": "video/mp4",
    });

    ctx.status = 206;

    const videoStream = videoFile.createReadStream({ start, end });
    ctx.body = videoStream;
  } catch (error) {
    console.error("Error:", error);
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
});

app.use(router.routes()).use(router.allowedMethods());

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
