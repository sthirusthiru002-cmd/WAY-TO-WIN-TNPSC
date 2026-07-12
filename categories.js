const express = require("express");
const { db } = require("../services/firebase");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

const slugify = (name) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// PUBLIC — list all categories
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("categories").orderBy("name").get();
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Could not load categories." });
  }
});

// ADMIN — create category
router.post("/", adminAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }
  try {
    const slug = slugify(name);
    const ref = await db.collection("categories").add({
      name: name.trim(),
      slug,
      createdAt: Date.now()
    });
    res.json({ id: ref.id, name: name.trim(), slug });
  } catch (err) {
    res.status(500).json({ error: "Could not create category." });
  }
});

// ADMIN — rename category
router.put("/:id", adminAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }
  try {
    await db.collection("categories").doc(req.params.id).update({
      name: name.trim(),
      slug: slugify(name)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update category." });
  }
});

// ADMIN — delete category (does not delete notes already filed under it)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await db.collection("categories").doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete category." });
  }
});

module.exports = router;
