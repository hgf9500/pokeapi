import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleFavorite } from '../store/favoritesSlice';
import { fetchPokemonDetail } from '../api/pokeapi';


function Detail() {
  const { id: idString } = useParams();
  const id = Number(idString); 

  const dispatch = useDispatch();
  const favoriteIds = useSelector(state => state.favorites.ids);
  
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFavorite = favoriteIds.includes(id);

  // 1. API 호출 및 특별 폼(메가, 원시) 로직 통합
  useEffect(() => {
    if (!id) return; 

    setLoading(true);

    const loadPokemonData = async () => {
      try {
        // 1. 기본 상세 정보 가져오기
        const detailData = await fetchPokemonDetail(id); 

        // 2. 종(Species) 정보 가져오기 (한국어 이름 및 진화 형태 확인)
        const speciesResponse = await fetch(detailData.species.url);
        const speciesData = await speciesResponse.json();
        
        // 3. 한국어 이름 추출
        const koreanEntry = speciesData.names.find(name => name.language.name === 'ko');
        const koreanName = koreanEntry ? koreanEntry.name : detailData.name;

        // 4. 🟢 모든 특별 폼 URL 추출 (is_default가 아니면서 이름에 특정 키워드가 포함된 형태)
        const specialFormUrls = speciesData.varieties
          .filter(v => 
            v.is_default === false && 
            (v.pokemon.name.includes('-mega') || 
             v.pokemon.name.includes('-primal') ||
             v.pokemon.name.includes('-rayquaza') || // 메가 레쿠쟈는 이름이 rayquaza-mega가 아닌 경우도 있음 (v.pokemon.name에 이미 -mega 포함되어 있지만 안전장치)
             v.pokemon.name.includes('-origin'))
          )
          .map(v => v.pokemon.url);
        
        // 중복 제거 (메가 레쿠쟈는 두 번째 조건에 걸릴 수 있으므로, URL 중복 방지)
        const uniqueSpecialFormUrls = [...new Set(specialFormUrls)];

        // 5. 모든 특별 폼 데이터를 병렬로 가져오기
        const specialFormPromises = uniqueSpecialFormUrls.map(url => fetch(url).then(res => res.json()));
        const specialFormsData = await Promise.all(specialFormPromises);
        
        // 6. 최종 상태 업데이트
        setPokemon({
          ...detailData,
          korean_name: koreanName,      // 한국어 이름 추가
          special_forms: specialFormsData, // 특별 폼 배열 추가
        });

      } catch (err) {
        console.error("포켓몬 정보 로딩 오류:", err);
        setError("포켓몬 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    loadPokemonData();
  }, [id]);

  // 2. 찜 목록 토글 핸들러
  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(id)); 
  };

  if (loading) return <div style={{ textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>에러: {error}</div>;
  if (!pokemon) return <div style={{ textAlign: 'center' }}>포켓몬 정보를 찾을 수 없습니다.</div>;

  // 폼 이름 표시를 위한 유틸리티 함수
  const getFormDisplayName = (formName, baseName) => {
    const base = baseName.toUpperCase();
    let displayName = formName.toUpperCase();
    
    // 기본 이름 부분을 제거하고 공백으로 치환
    if (displayName.startsWith(base)) {
      displayName = displayName.substring(base.length);
    }
    
    // 남은 이름에서 하이픈(-)을 공백으로 바꾸고, "mega", "primal" 등을 식별하기 쉽게 만듦
    displayName = displayName.replace(/-/g, ' ').trim();
    
    // 이름이 빈 경우 (예외 처리)
    if (!displayName) {
        // 예: 리자몽의 경우, 'charizard-mega-x'에서 'charizard'를 제거하면 '-mega-x'가 남고 trim하면 'mega-x'
        if (formName.includes('-mega')) return "MEGA";
        if (formName.includes('-primal')) return "PRIMAL";
        return "SPECIAL FORM";
    }

    return displayName;
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {/* 한국어 이름 표시 */}
      <h2>#{pokemon.id} {pokemon.korean_name || pokemon.name.toUpperCase()}</h2> 
      
      {/* 일반 폼 */}
      <img 
        src={pokemon.sprites.other['official-artwork']?.front_default || pokemon.sprites.front_default} 
        alt={pokemon.korean_name || pokemon.name} 
        style={{ width: '200px', margin: '20px 0' }} 
      />
      
      {/* 찜 버튼 */}
      <button 
        onClick={handleToggleFavorite}
        style={{ padding: '10px 30px', fontSize: '16px', cursor: 'pointer', backgroundColor: isFavorite ? '#ff5252' : '#333', color: 'white', border: 'none', borderRadius: '5px', display: 'block', margin: '0 auto 20px' }}
      >
        {isFavorite ? '💖 찜 해제' : '🤍 찜 하기'}
      </button>

      {/* 🟢 메가/원시 폼 렌더링 */}
      {pokemon.special_forms && pokemon.special_forms.length > 0 && (
        <div style={{ marginTop: '40px', borderTop: '2px solid #333', paddingTop: '20px' }}>
          <h3>✨ 특별 폼 (메가 진화/원시 회귀)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
            {pokemon.special_forms.map(form => (
              <div key={form.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
                
                {/* 폼 이름 표시 (예: MEGA X, PRIMAL) */}
                <p style={{ fontWeight: 'bold' }}>
                  {getFormDisplayName(form.name, pokemon.name)}
                </p>

                <img 
                  src={form.sprites.other['official-artwork']?.front_default || form.sprites.front_default} 
                  alt={form.name} 
                  style={{ width: '150px', height: '150px' }} 
                />
                <p style={{ fontSize: '14px', margin: '5px 0' }}>
                  **타입:** {form.types.map(t => t.type.name).join(' / ')} 
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 능력치 정보 */}
      <div style={{ marginTop: '20px' }}>
        <h3>능력치</h3>
        <ul style={{ padding: '0', listStyleType: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {pokemon.stats.map(stat => (
            <li key={stat.stat.name} style={{ width: '150px', margin: '5px', textAlign: 'left', border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
              **{stat.stat.name.toUpperCase()}**: {stat.base_stat}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Detail;