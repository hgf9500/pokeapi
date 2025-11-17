import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPokemonDetail } from '@api/pokeapi.js';




// 이 예시에서는 찜한 포켓몬마다 상세 정보를 다시 불러옵니다.
// 최적화를 위해 메인 페이지에서 모든 데이터를 미리 가져오는 방식도 가능합니다.

function Favorite() {
  const favoriteIds = useSelector(state => state.favorites.ids);
  const [favoritePokemons, setFavoritePokemons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // 찜한 포켓몬 ID들을 병렬로 상세 정보 요청
    const fetchFavorites = async () => {
      if (favoriteIds.length === 0) {
        setFavoritePokemons([]);
        setLoading(false);
        return;
      }
      
      // Promise.all로 모든 요청을 동시에 처리
      const promises = favoriteIds.map(id => fetchPokemonDetail(id));
      
      try {
        const details = await Promise.all(promises);
        setFavoritePokemons(details);
      } catch (error) {
        console.error("찜 목록 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteIds]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      ## ⭐ 찜 목록 리스트 ({favoritePokemons.length} 마리)
      
      {favoriteIds.length === 0 ? (
        <p>🤍 아직 찜한 포켓몬이 없어요! Main 페이지에서 포켓몬을 찜해보세요.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {favoritePokemons.map(pokemon => (
            <Link 
              key={pokemon.id} 
              to={`/pokemon/${pokemon.id}`} 
              style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #ccc', padding: '10px', width: '150px', textAlign: 'center' }}
            >
              <img 
                src={pokemon.sprites.front_default} 
                alt={pokemon.name} 
                style={{ width: '80px' }} 
              />
              <p>#{pokemon.id} {pokemon.name.toUpperCase()}</p>
              <span style={{ color: 'red' }}>💖</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorite;