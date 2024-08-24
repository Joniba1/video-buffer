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
const bucketName = "soi_raw";
const videoName = "soi_experiments/Julis_22052024/scene4/MAX_0044.MP4";

// const bucketName = "test_bucket_joniba";
// const videoName = "videos/record_28_02_2024_01_23.mp4";
// const videoName = "videos/record_05_03_2024_04_45.mp4";
const mbToBytes = (bytes: number) => bytes * (1024 * 1024);

// router.get("/data/video", async (ctx) => {
//   try {
//     const videoFile = gcs.bucket(bucketName).file(videoName);
//     const [exists] = await videoFile.exists();

//     if (!exists) {
//       ctx.status = 404;
//       ctx.body = "File not found";
//       return;
//     }

//     const [metadata] = await videoFile.getMetadata();
//     const videoSize = parseInt(metadata.size, 10);
//     const range = ctx.request.headers.range;

//     if (!range) {
//       ctx.status = 400;
//       ctx.body = "Range header is required";
//       return;
//     }

//     const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(startStr, 10);
//     const end = Math.min(start + 100000000 - 1, videoSize - 1); // Adjust end based on size

//     const contentLength = end - start + 1;

//     ctx.set({
//       "Content-Range": `bytes ${start}-${end}/${videoSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Length": contentLength.toString(),
//       "Content-Type": "video/mp4",
//     });

//     ctx.status = 206;

//     const bufferSize = 50 * 1024 * 1024; // 50 MB in bytes
//     let buffer = Buffer.alloc(0);

//     // Create a readable stream from the video file
//     const videoStream = videoFile.createReadStream({ start, end });

//     videoStream.on("data", (chunk) => {
//       buffer = Buffer.concat([buffer, chunk]);

//       if (buffer.length >= bufferSize) {
//         // Once we have buffered enough data, send it to the client
//         ctx.body = buffer;
//         videoStream.destroy(); // Stop the stream
//       }
//     });

//     // Handle stream errors
//     videoStream.on("error", (err) => {
//       console.error("Stream error:", err);
//       ctx.status = 500;
//       ctx.body = "Internal Server Error";
//     });

//     // Handle end of the stream
//     videoStream.on("end", () => {
//       if (buffer.length < bufferSize) {
//         // If not enough data was buffered, send whatever we have
//         ctx.body = buffer;
//       }
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     ctx.status = 500;
//     ctx.body = "Internal Server Error";
//   }
// });

router.get("/data/video", async (ctx) => {
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

    if (!range) {
      ctx.status = 400;
      ctx.body = "Range header is required";
      return;
    }

    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    console.log(start);
    const end = Math.min(start + 100000000 - 1, videoSize - 1);

    const contentLength = end - start + 10;

    ctx.set({
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength.toString(),
      "Content-Type": "video/mp4",
    });

    ctx.status = 206;

    const videoStream = videoFile.createReadStream({ start, end });

    // Handle stream errors
    videoStream.on("error", (err) => {
      console.error("Stream error:", err);
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    });

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
