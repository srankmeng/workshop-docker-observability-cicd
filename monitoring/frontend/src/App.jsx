import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [users, setUsers] = useState([]);

  function getUsers() {
    fetch('/api/v1/users')
      .then(response => {
        return response.json();
      })
      .then(data => {
        setUsers(data);
      });
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <table className='table'>
        <thead>
          <th>ID</th>
          <th>Name</th>
        </thead>
        <tbody>
          {
            users.length ? users.map((user) => (
              <tr>
                <td>{user.id}</td>
                <td>{user.name}</td>
              </tr>
            )) : 'Loading ...'
          }
        </tbody>
        
      </table>
    </>
  )
}

export default App
