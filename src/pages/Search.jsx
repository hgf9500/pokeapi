import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPokemonList } from '../api/pokeapi';



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
        console.error("API 호출 오류:", err); // 🟢 경고 해결: err 사용
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

    const filtered = allPokemons.filter(pokemon => 
      pokemon.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    
    setSearchResults(filtered);
  }, [searchTerm, allPokemons]);

  if (loading) return <div style={{ textAlign: 'center' }}>🔍 포켓몬 데이터를 로딩 중입니다...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>🔴 에러 발생: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔍 포켓몬 검색</h2>
      <input
        type="text"
        placeholder="포켓몬 이름을 입력하세요..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '20px', fontSize: '16px' }}
      />
      
      <h3>검색 결과 ({searchResults.length} 마리)</h3>
      
      {searchResults.length === 0 && searchTerm.trim() !== '' ? (
        <p style={{ color: '#888' }}>"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {searchResults.map(pokemon => (
            <Link 
              key={pokemon.id} 
              to={`/pokemon/${pokemon.id}`} 
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', textAlign: 'center', textDecoration: 'none', color: '#333' }}
            >
              <p style={{ margin: '0', fontWeight: 'bold' }}>#{pokemon.id} {pokemon.name.toUpperCase()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Search;