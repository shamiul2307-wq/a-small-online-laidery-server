
require("dotenv").config();

const { connectDB, getDB } = require("../config/db");

const books = [
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
    description: "A young shepherd travels in search of his personal legend.",
    totalCopies: 5,
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self Development",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
    description: "A practical guide to building good habits and breaking bad ones.",
    totalCopies: 6,
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    category: "Finance",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
    description: "A book about financial education and money management.",
    totalCopies: 4,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classic",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600",
    description: "A classic novel about wealth, love, and the American dream.",
    totalCopies: 3,
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600",
    description: "A guide to writing clean, readable, and maintainable code.",
    totalCopies: 5,
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Finance",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600",
    description: "Timeless lessons about wealth, greed, and happiness.",
    totalCopies: 4,
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600",
    description: "A comprehensive introduction to computer algorithms.",
    totalCopies: 3,
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    category: "Self Development",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600",
    description: "A classic book about personal achievement and success.",
    totalCopies: 5,
  },
];

async function seedBooks() {
  try {
    await connectDB();

    const db = getDB();
    const collection = db.collection("books");

    const operations = books.map((book) => ({
      updateOne: {
        filter: {
          title: book.title,
          author: book.author,
        },
        update: {
          $setOnInsert: {
            ...book,
            availableCopies: book.totalCopies,
            addedBy: {
              name: "BookNook Admin",
              email: "admin@booknook.local",
            },
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations);

    console.log("Books seeded successfully!");
    console.log("New books added:", result.upsertedCount);
    console.log("Already existing books skipped:", result.matchedCount);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

seedBooks();
