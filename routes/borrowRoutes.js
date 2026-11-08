const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// POST /borrows - Borrow a book
router.post("/", verifyToken, async (req, res) => {
  const db = getDB();

  try {
    const { bookId } = req.body;

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const books = db.collection("books");
    const borrows = db.collection("borrows");

    const id = new ObjectId(bookId);

    const book = await books.findOne({ _id: id });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const existingBorrow = await borrows.findOne({
      bookId: id,
      userEmail: req.user.email,
    });

    if (existingBorrow) {
      return res.status(409).json({
        message: "You have already borrowed this book",
      });
    }

    const updateResult = await books.updateOne(
      {
        _id: id,
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return res.status(409).json({
        message: "This book is currently not available",
      });
    }

    const borrowDate = new Date();
    const returnDate = new Date(borrowDate);

    returnDate.setDate(returnDate.getDate() + 14);

    const borrow = {
      bookId: id,
      bookTitle: book.title,
      bookImage: book.image,
      userEmail: req.user.email,
      userName: req.user.name,
      borrowDate,
      returnDate,
    };

    try {
      const result = await borrows.insertOne(borrow);

      res.status(201).json({
        success: true,
        message: "Book borrowed successfully",
        data: { ...borrow, _id: result.insertedId },
      });
    } catch (error) {
      await books.updateOne(
        { _id: id },
        { $inc: { availableCopies: 1 } }
      );

      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to borrow book" });
  }
});

// GET /borrows - Get logged-in user's borrowed books
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();

    const borrows = await db
      .collection("borrows")
      .find({ userEmail: req.user.email })
      .sort({ borrowDate: -1 })
      .toArray();

    res.json({
      success: true,
      data: borrows,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load borrowed books" });
  }
});

// DELETE /borrows/:id - Return a book
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid borrow ID" });
    }

    const db = getDB();
    const borrowId = new ObjectId(req.params.id);

    const borrows = db.collection("borrows");
    const books = db.collection("books");

    const borrow = await borrows.findOne({
      _id: borrowId,
      userEmail: req.user.email,
    });

    if (!borrow) {
      return res.status(404).json({
        message: "Borrow record not found",
      });
    }

    const deleteResult = await borrows.deleteOne({
      _id: borrowId,
      userEmail: req.user.email,
    });

    if (deleteResult.deletedCount !== 1) {
      return res.status(409).json({
        message: "Borrow record has already been returned",
      });
    }

    await books.updateOne(
      { _id: borrow.bookId },
      { $inc: { availableCopies: 1 } }
    );

    res.json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to return book" });
  }
});

module.exports = router;