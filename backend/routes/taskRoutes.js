import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [tasks] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.user_id]
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title } = req.body;

    await db.query(
      "INSERT INTO tasks (user_id, title) VALUES (?, ?)",
      [req.user.user_id, title]
    );

    res.status(201).json({ message: "Task created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { completed } = req.body;

    await db.query(
      "UPDATE tasks SET completed = ? WHERE task_id = ? AND user_id = ?",
      [completed, req.params.id, req.user.user_id]
    );

    res.json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM tasks WHERE task_id = ? AND user_id = ?",
      [req.params.id, req.user.user_id]
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
});

export default router;