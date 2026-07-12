const express = require("express");
const multer = require("multer");
const { db } = require("../services/firebase");
const drive = require("../services/googleDrive");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per PDF
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  }
});

// PUBLIC — list notes, optionally filtered by ?categoryId=
router.get("/", async (req, res) => {
  try {
    let query = db.collection("notes").orderBy("uploadedAt", "desc");
    if (req.query.categoryId) {
      query = db
        .collection("notes")
        .where("categoryId", "==", req.query.categoryId)
        .orderBy("uploadedAt", "desc");
    }
    const snap = await query.get();
    const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Could not load notes." });
  }
});

// ADMIN — upload a new PDF note
router.post("/", adminAuth, upload.single("file"), async (req, res) => {
  const { title, description, categoryId, categoryName } = req.body;

  if (!req.file) return res.status(400).json({ error: "Attach a PDF file." });
  if (!title || !categoryId || !categoryName) {
    return res.status(400).json({ error: "Title and category are required." });
  }

  try {
    const folderId = await drive.getOrCreateCategoryFolder(categoryName);
    const uploaded = await drive.uploadPdf(req.file.buffer, req.file.originalname, folderId);

    const ref = await db.collection("notes").add({
      title: title.trim(),
      description: (description || "").trim(),
      categoryId,
      categoryName,
      driveFileId: uploaded.fileId,
      viewLink: uploaded.viewLink,
      downloadLink: uploaded.downloadLink,
      uploadedAt: Date.now()
    });

    res.json({ id: ref.id, ...uploaded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ADMIN — edit note metadata (title/description/category)
router.put("/:id", adminAuth, async (req, res) => {
  const { title, description, categoryId, categoryName } = req.body;
  try {
    const update = {};
    if (title) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (categoryId) update.categoryId = categoryId;
    if (categoryName) update.categoryName = categoryName;
    await db.collection("notes").doc(req.params.id).update(update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update note." });
  }
});

// ADMIN — delete a note (removes file from Drive too)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const docRef = db.collection("notes").doc(req.params.id);
    const doc = await docRef.get();
    if (doc.exists) {
      const { driveFileId } = doc.data();
      if (driveFileId) await drive.deleteFile(driveFileId);
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete note." });
  }
});

module.exports = router;
