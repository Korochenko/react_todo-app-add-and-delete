/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { useLocalStorage } from './LocalStorage';

export const App: React.FC = () => {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todo', []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>('');
  const [filterByStatus, setFilterByStatus] = React.useState<
    'all' | 'active' | 'completed'
  >('all');
  const [code, setCode] = React.useState('');
  const [showNotification, setShowNotification] = React.useState(false);

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  React.useEffect(() => {
    if (todos.length === 0) {
      setLoading(true);
      setShowNotification(false);

      setTimeout(() => {
        todoService
          .getTodos()
          .then(setTodos)
          .catch(() => {
            setError('Unable to load todos');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          })

          .finally(() => setLoading(false));
      }, 100);
    }
  }, []);

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim() === '') {
      return;
    }

    const newTodo: Todo = {
      userId: todoService.USER_ID,
      id: todos.length ? Math.max(...todos.map(todo => todo.id)) + 1 : 1,
      title: code.trim(),
      completed: false,
    };

    setTodos(prev => [...prev, newTodo]);
    setCode('');
  };

  function clearTodos() {
    setTodos(prev => prev.filter(todo => !todo.completed));
  }

  function filteredTodos() {
    if (filterByStatus === 'active') {
      return todos.filter(todo => !todo.completed);
    }

    if (filterByStatus === 'completed') {
      return todos.filter(todo => todo.completed);
    }

    return todos;
  }

  function closeNotification() {
    setShowNotification(false);
  }

  function deleteTodo(todoId: number) {
    todoService.deleteTodo(todoId);
    setTodos(prev => prev.filter(todo => todo.id !== todoId));
  }

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  function toggleTodo(todoId: number) {
    setTodos(prev =>
      prev.map(todo => {
        if (todo.id === todoId) {
          return { ...todo, completed: !todo.completed };
        }

        return todo;
      }),
    );
  }

  function toggleAllTodos() {
    const shouldComplete = activeTodosCount > 0;

    setTodos(prev =>
      prev.map(todo => ({ ...todo, completed: shouldComplete })),
    );
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      {loading && <Loader />}

      {!loading && (
        <div className="todoapp__content">
          <Header
            code={code}
            handleCodeChange={handleCodeChange}
            handleSubmit={handleSubmit}
            todos={todos}
            activeTodosCount={activeTodosCount}
            toggleAllTodos={toggleAllTodos}
          />

          <TodoList
            todos={filteredTodos()}
            filterByStatus={filterByStatus}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
          />

          {todos.length > 0 && (
            <Footer
              activeTodosCount={activeTodosCount}
              filterByStatus={filterByStatus}
              setFilterByStatus={setFilterByStatus}
              clearTodos={clearTodos}
            />
          )}
        </div>
      )}

      <ErrorNotification
        message={error}
        isVisible={showNotification}
        onClose={closeNotification}
      />
    </div>
  );
};
