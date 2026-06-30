import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [taskTitle, setTaskTitle] = useState("");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`, authHeaders);
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const register = async () => {
    await axios.post(`${API_URL}/api/auth/register`, form);
    alert("Registered successfully. Please login.");
    setPage("login");
  };

  const login = async () => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email: form.email,
      password: form.password,
    });

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return;

    await axios.post(
      `${API_URL}/api/tasks`,
      { title: taskTitle },
      authHeaders
    );

    setTaskTitle("");
    fetchTasks();
  };

  const toggleTask = async (task) => {
    await axios.put(
      `${API_URL}/api/tasks/${task.task_id}`,
      { completed: !task.completed },
      authHeaders
    );

    fetchTasks();
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API_URL}/api/tasks/${id}`, authHeaders);
    fetchTasks();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setTasks([]);
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>TaskFlow</h1>
          <h2>{page === "login" ? "Login" : "Register"}</h2>

          {page === "register" && (
            <input
              style={styles.input}
              placeholder="Name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}

          <input
            style={styles.input}
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button style={styles.button} onClick={page === "login" ? login : register}>
            {page === "login" ? "Login" : "Register"}
          </button>

          <p>
            {page === "login" ? "No account?" : "Already have an account?"}{" "}
            <button style={styles.linkButton} onClick={() => setPage(page === "login" ? "register" : "login")}>
              {page === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>TaskFlow Dashboard</h1>
        <p>Welcome {user?.name || "User"}</p>

        <button style={styles.logout} onClick={logout}>
          Logout
        </button>

        <div style={styles.taskInputArea}>
          <input
            style={styles.input}
            placeholder="Enter task"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <button style={styles.button} onClick={createTask}>
            Add Task
          </button>
        </div>

        <h3>Total Tasks: {tasks.length}</h3>
        <h3>Completed: {tasks.filter((task) => task.completed).length}</h3>

        {tasks.map((task) => (
          <div key={task.task_id} style={styles.task}>
            <span
              onClick={() => toggleTask(task)}
              style={{
                textDecoration: task.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {task.title}
            </span>

            <button style={styles.delete} onClick={() => deleteTask(task.task_id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "400px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
  },
  logout: {
    padding: "8px 12px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    marginBottom: "15px",
    cursor: "pointer",
  },
  taskInputArea: {
    marginTop: "20px",
  },
  task: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #eee",
  },
  delete: {
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "5px 8px",
    cursor: "pointer",
  },
};

export default App;