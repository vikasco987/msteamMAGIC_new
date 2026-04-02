// export async function uploadToCloudinary(
//   file: File,
//   setUploadStatus?: (msg: string) => void
// ): Promise<string> {
//   try {
//     setUploadStatus?.(`Uploading ${file.name}...`);

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", "magic_upload");

//     const isPdf = file.name.toLowerCase().endsWith(".pdf");

//     const res = await fetch(
//       isPdf
//         ? "https://api.cloudinary.com/v1_1/dp2ta7xca/raw/upload"
//         : "https://api.cloudinary.com/v1_1/dp2ta7xca/auto/upload",
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error(`❌ Cloudinary Error (${file.name}):`, errorText);
//       setUploadStatus?.(`❌ Failed to upload ${file.name}`);
//       throw new Error(`Upload failed for ${file.name}: ${errorText}`);
//     }

//     const data = await res.json(); // only if response is ok
//     setUploadStatus?.(`✅ Uploaded ${file.name}`);
//     return data.secure_url;
//   } catch (error) {
//     console.error(`❌ Error uploading "${file.name}":`, error);
//     throw new Error(`Failed to upload ${file.name}`);
//   }
// }



// export async function uploadToCloudinary(
//   file: File,
//   setUploadStatus?: (msg: string) => void
// ): Promise<string> {
//   try {
//     setUploadStatus?.(`Uploading ${file.name}...`);

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", "magic_upload"); // 🔁 Make sure this is configured in Cloudinary

//     const fileType = file.type;
//     const isPdf = fileType === "application/pdf";
//     const isImage = fileType.startsWith("image/");

//     const uploadUrl = isPdf
//       ? "https://api.cloudinary.com/v1_1/dp2ta7xca/raw/upload"
//       : isImage
//       ? "https://api.cloudinary.com/v1_1/dp2ta7xca/image/upload"
//       : "https://api.cloudinary.com/v1_1/dp2ta7xca/auto/upload";

//     const res = await fetch(uploadUrl, {
//       method: "POST",
//       body: formData,
//     });

//     const contentType = res.headers.get("content-type") || "";
//     if (!res.ok || !contentType.includes("application/json")) {
//       const errorText = await res.text(); // fallback to text if not JSON
//       throw new Error(`Cloudinary upload failed:\n${errorText}`);
//     }

//     type CloudinaryResponse = {
//       secure_url: string;
//     };

//     const data: CloudinaryResponse = await res.json();

//     setUploadStatus?.(`✅ Uploaded ${file.name}`);
//     return data.secure_url;
//   } catch (err) {
//     const error = err instanceof Error ? err.message : "Unknown error";
//     setUploadStatus?.(`❌ Failed to upload ${file.name}`);
//     console.error(`Failed upload: "${file.name}"`, err);
//     throw new Error(`Failed to upload ${file.name}: ${error}`);
//   }
// }








// // ✅ Works perfectly for hosted websites
// export async function uploadToCloudinary(
//   file: File,
//   setUploadStatus?: (msg: string) => void
// ): Promise<string> {
//   setUploadStatus?.(`Uploading ${file.name}...`);

//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("upload_preset", "magic_upload");

//   const isPdf = file.name.toLowerCase().endsWith(".pdf");

//   const res = await fetch(
//     isPdf
//       ? "https://api.cloudinary.com/v1_1/dp2ta7xca/raw/upload"
//       : "https://api.cloudinary.com/v1_1/dp2ta7xca/auto/upload",
//     {
//       method: "POST",
//       body: formData,
//     }
//   );

//   if (!res.ok) {
//     setUploadStatus?.(`❌ Failed to upload ${file.name}`);
//     throw new Error("Cloudinary upload failed");
//   }

//   const data = await res.json();
//   setUploadStatus?.(`✅ Uploaded ${file.name}`);
//   return data.secure_url;
// }


export async function uploadToCloudinary(
  file: File,
  setUploadStatus?: (msg: string) => void
): Promise<string> {
  setUploadStatus?.(`Uploading ${file.name}...`);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "magic_upload");

  // Decide based on file extension
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isRaw = ["pdf", "doc", "docx", "txt", "xls"].includes(ext);

  const uploadUrl = isRaw
    ? "https://api.cloudinary.com/v1_1/dp2ta7xca/raw/upload"
    : "https://api.cloudinary.com/v1_1/dp2ta7xca/auto/upload";

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok || !contentType.includes("application/json")) {
    const errText = await res.text();
    console.error("❌ Upload failed for", file.name, errText);
    setUploadStatus?.(`❌ Failed to upload ${file.name}`);
    throw new Error(`❌ Failed to upload ${file.name}: ${errText}`);
  }

  const data = await res.json();
  setUploadStatus?.(`✅ Uploaded ${file.name}`);
  return data.secure_url;
}
