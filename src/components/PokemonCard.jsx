import React from 'react';
import { Link } from 'react-router-dom';

function PokemonCard({ pokemon }) {
  // pokemon 객체가 없을 경우를 대비한 방어 코드
  if (!pokemon) return null;

  // Detail 페이지로 이동하는 Link 컴포넌트로 카드를 감쌉니다.
  return (
    <Link 
      to={`/pokemon/${pokemon.id}`} 
      style={{ 
        textDecoration: 'none', 
        color: '#333', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        padding: '15px', 
        textAlign: 'center',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        display: 'block' // Link가 블록 요소처럼 동작하도록 설정
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: '30px', marginBottom: '5px' }}>
          <span role="img" aria-label="pokeball">🔴</span>
      </div> 
      <p style={{ margin: '0', fontWeight: 'bold' }}>
        #{pokemon.id} {pokemon.name.toUpperCase()}
      </p>
      {/* 참고: 이 컴포넌트는 단순히 UI를 표시하며,
        API 호출(fetchPokemonDetail 등)은 부모 컴포넌트나 Detail.jsx에서 담당합니다.
      */}
    </Link>
  );
}

export default PokemonCard;