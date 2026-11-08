const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// GET /books - Get all books
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const books = await db
      .collection("books")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load books" });
  }
});

// GET /books/:id - Get one book
router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = getDB();

    const book = await db.collection("books").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ message: "Failed to load book" });
  }
});

// POST /books - Add a book
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      !image ||
      !description ||
      !Number.isInteger(totalCopies) ||
      totalCopies < 1
    ) {
      return res.status(400).json({
        message: "Please provide valid book information",
      });
    }

    const db = getDB();

    const book = {
      title: title.trim(),
      author: author.trim(),
      category,
      image,
      description,
      totalCopies,
      availableCopies: totalCopies,
      addedBy: {
        name: req.user.name,
        email: req.user.email,
      },
      createdAt: new Date(),
    };

    const result = await db.collection("books").insertOne(book);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: { ...book, _id: result.insertedId },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add book" });
  }
});

// PATCH /books/:id - Update a book
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = getDB();
    const bookId = new ObjectId(req.params.id);

    const allowedFields = [
      "title",
      "author",
      "category",
      "image",
      "description",
      "totalCopies",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid updates provided" });
    }

    const existing = await db.collection("books").findOne({
      _id: bookId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (existing.addedBy.email !== req.user.email) {
      return res.status(403).json({ message: "You cannot edit this book" });
    }

    if (updates.totalCopies !== undefined) {
      if (
        !Number.isInteger(updates.totalCopies) ||
        updates.totalCopies < existing.totalCopies - existing.availableCopies
      ) {
        return res.status(400).json({
          message: "Total copies cannot be less than currently borrowed copies",
        });
      }

      updates.availableCopies =
        updates.totalCopies -
        (existing.totalCopies - existing.availableCopies);
    }

    await db.collection("books").updateOne(
      { _id: bookId },
      { $set: updates }
    );

    const updatedBook = await db.collection("books").findOne({
      _id: bookId,
    });

    res.json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE /books/:id - Delete a book
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const db = getDB();
    const bookId = new ObjectId(req.params.id);

    const book = await db.collection("books").findOne({
      _id: bookId,
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.addedBy.email !== req.user.email) {
      return res.status(403).json({ message: "You cannot delete this book" });
    }

    if (book.availableCopies !== book.totalCopies) {
      return res.status(409).json({
        message: "Return all borrowed copies before deleting this book",
      });
    }

    await db.collection("books").deleteOne({ _id: bookId });

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete book" });
  }
});

module.exports = router;