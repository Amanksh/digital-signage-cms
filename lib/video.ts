export async function generateVideoThumbnail(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      // Seek to 1 second to get a good thumbnail
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);

      // Clean up
      URL.revokeObjectURL(video.src);
      resolve(thumbnailUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Error loading video"));
    };
  });
}
