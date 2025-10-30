import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Main from './pages/Main';
import Detail from './pages/Detail';
import Favorite from './pages/Favorite';
import Search from './pages/Search';

// 간단한 네비게이션 컴포넌트
const NavBar = () => (
  <nav style={{ padding: '10px', background: '#eee' }}>
    <Link to="/" style={{ margin: '0 10px' }}>🏠 Main</Link>
    <Link to="/favorites" style={{ margin: '0 10px' }}>💖 Favorites</Link>
    <Link to="/search" style={{ margin: '0 10px' }}>🔍 Search</Link>
  </nav>
);

function App() {
  return (
    <>
      <NavBar />
      <div className="App" style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Main />} />
          {/* 포켓몬 ID를 파라미터로 받음 */}
          <Route path="/pokemon/:id" element={<Detail />} /> 
          <Route path="/favorites" element={<Favorite />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
    </>
  );
}

export default App;