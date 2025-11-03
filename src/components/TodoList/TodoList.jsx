import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './TodoList.css';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/v1/todos');
      setTodos(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch todos');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post('/api/v1/todos', {
        todo: { content: newTodo }
      });

      setTodos([response.data, ...todos]); // Add new todo to the top
      setNewTodo(''); // Clear input
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create todo');
      console.error('Error creating todo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await api.put(`/api/v1/todos/${id}`, {
        todo: { completed: !completed }
      });

      setTodos(todos.map(todo => todo.id === id ? response.data : todo));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update todo');
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/api/v1/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete todo');
      console.error('Error deleting todo:', err);
    }
  };

  if (loading) {
    return (
      <div className="todo-container">
        <h2>Notes</h2>
        <p className="loading-text">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="todo-container">
      <h2>Notes</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={createTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new note..."
          className="todo-input"
          disabled={submitting}
        />
        <button 
          type="submit" 
          className="todo-add-btn"
          disabled={submitting || !newTodo.trim()}
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="empty-state">No notes yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="todo-checkbox"
                />
                <span className="todo-text">{todo.content}</span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="todo-delete-btn"
                title="Delete todo"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="todo-stats">
          <span>{todos.filter(t => !t.completed).length} active</span>
          <span>•</span>
          <span>{todos.filter(t => t.completed).length} completed</span>
        </div>
      )}
    </div>
  );
};

export default TodoList;
