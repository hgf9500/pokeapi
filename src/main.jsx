import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'; 

// Redux Toolkit 관련 함수
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
// 찜 목록 Slice (이전에 정의한 파일)
import favoritesReducer from './store/favoritesSlice.js'; 
// import index.css (필요하다면 추가)
// import './index.css'; 

// --- Redux Store 설정 ---
const store = configureStore({
  reducer: {
    favorites: favoritesReducer,
  },
});

// --- React 렌더링 ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* 🟢 2. BrowserRouter로 App을 감싸서 라우팅 초기화 */}
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);