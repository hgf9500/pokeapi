import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPokemonList } from '@api/pokeapi.js';

 


function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allPokemons, setAllPokemons] = useState([]); 
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 전체 포켓몬 리스트 불러오기 (6세대까지)
  useEffect(() => {
    setLoading(true);
    fetchPokemonList(721) 
      .then(data => {
        setAllPokemons(data);
        setSearchResults(data); 
      })
      .catch(err => {
        console.error("API 호출 오류:", err); 
        setError("포켓몬 리스트를 불러오는데 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); 

  // 2. 검색어 변경 시 필터링 실행
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(allPokemons);
      return;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filtered = allPokemons.filter(pokemon => {
        // 🟢 한국어 이름(korean_name) 또는 영어 이름(name)으로 검색
        const koreanMatch = pokemon.korean_name && pokemon.korean_name.toLowerCase().includes(lowerCaseSearchTerm);
        const englishMatch = pokemon.name && pokemon.name.toLowerCase().includes(lowerCaseSearchTerm);
        return koreanMatch || englishMatch;
    });
    
    setSearchResults(filtered);
  }, [searchTerm, allPokemons]); // 검색어와 전체 목록이 변경될 때마다 실행

  if (loading) return <div style={{ textAlign: 'center' }}>🔍 포켓몬 데이터를 로딩 중입니다...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>🔴 에러 발생: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔍 포켓몬 검색</h2>
      <input
        type="text"
        placeholder="포켓몬 이름 (예: 리자몽, charmander)을 입력하세요"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '10px', width: '80%', maxWidth: '500px', marginBottom: '20px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
      />
      
      <h3>검색 결과 ({searchResults.length} 마리)</h3>
      
      {searchResults.length === 0 && searchTerm.trim() !== '' ? (
        <p style={{ color: '#888' }}>"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', maxWidth: '1200px', margin: '0 auto' }}>
          {searchResults.map(pokemon => (
            <Link 
              key={pokemon.id} 
              to={`/pokemon/${pokemon.id}`} 
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', textAlign: 'center', textDecoration: 'none', color: '#333', boxShadow: '1px 1px 3px rgba(0,0,0,0.1)' }}
            >
              {/* 포켓몬 이미지 */}
              <img 
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                alt={pokemon.korean_name || pokemon.name}
                style={{ width: '96px', height: '96px', margin: '0 auto' }}
              />
              {/* 🟢 한국어 이름 표시 */}
              <p style={{ margin: '0', fontWeight: 'bold', marginTop: '10px' }}>
                #{pokemon.id} {pokemon.korean_name || pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Search;