import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPokemonList } from '../api/pokeapi';


function Main() {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchPokemonList(721) 
      .then(data => {
        setPokemons(data);
      })
      .catch(err => {
        setError("포켓몬 리스트를 불러오는데 실패했습니다.");
        console.error("API 호출 오류:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center' }}>✨ 포켓몬 리스트를 로딩 중입니다...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>🔴 에러 발생: {error}</div>;

  return (
    <div>
      <h2>🏠 전체 포켓몬 리스트</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {pokemons.map(pokemon => (
          <Link 
            key={pokemon.id} 
            to={`/pokemon/${pokemon.id}`} 
            style={{ textDecoration: 'none', color: '#333', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}
          >
            {/* 🟢 포켓몬 이미지 추가: ID를 사용하여 이미지 URL 생성 */}
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
              alt={pokemon.name}
              style={{ width: '96px', height: '96px', margin: '0 auto' }}
            />
            {/* 포켓몬 이름 표시 (첫 글자 대문자) */}
            <p style={{ margin: '0', fontWeight: 'bold', marginTop: '10px' }}>
              #{pokemon.id} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Main;