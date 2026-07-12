const { google } = require("googleapis");
const { Readable } = require("stream");

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"]
});

const drive = google.drive({ version: "v3", auth });

// Create (or reuse) a subfolder for a category inside the root folder
async function getOrCreateCategoryFolder(categoryName) {
  const rootId = process.env.GDRIVE_ROOT_FOLDER_ID;

  const existing = await drive.files.list({
    q: `'${rootId}' in parents and name='${categoryName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)"
  });

  if (existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: categoryName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootId]
    },
    fields: "id"
  });

  return folder.data.id;
}

// Upload a PDF buffer to a given folder and make it publicly viewable
async function uploadPdf(buffer, filename, folderId) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId]
    },
    media: {
      mimeType: "application/pdf",
      body: stream
    },
    fields: "id, webViewLink, webContentLink"
  });

  const fileId = file.data.id;

  // Make the file readable by anyone with the link (view-only)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone"
    }
  });

  const meta = await drive.files.get({
    fileId,
    fields: "id, webViewLink, webContentLink"
  });

  return {
    fileId: meta.data.id,
    viewLink: meta.data.webViewLink,
    downloadLink: `https://drive.google.com/uc?export=download&id=${meta.data.id}`
  };
}

async function deleteFile(fileId) {
  try {
    await drive.files.delete({ fileId });
  } catch (err) {
    // If it's already gone, ignore
    if (err.code !== 404) throw err;
  }
}

module.exports = { getOrCreateCategoryFolder, uploadPdf, deleteFile };
