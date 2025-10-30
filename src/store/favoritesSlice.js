import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // 찜한 포켓몬의 ID만 저장
  ids: JSON.parse(localStorage.getItem('favoritePokemonIds')) || [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // 찜 목록에 추가/제거를 토글
    toggleFavorite: (state, action) => {
      const id = action.payload; // 포켓몬 ID
      
      if (state.ids.includes(id)) {
        // 이미 찜한 경우: 제거
        state.ids = state.ids.filter(pokeId => pokeId !== id);
      } else {
        // 찜하지 않은 경우: 추가
        state.ids.push(id);
      }
      
      // 로컬 스토리지에 저장하여 새로고침해도 유지되도록 함
      localStorage.setItem('favoritePokemonIds', JSON.stringify(state.ids));
    },
  },
});

export const { toggleFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;