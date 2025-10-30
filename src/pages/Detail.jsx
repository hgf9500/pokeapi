import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Link 추가
import { useSelector, useDispatch } from 'react-redux';
import { toggleFavorite } from '../store/favoritesSlice';
import { fetchPokemonDetail } from '../api/pokeapi';


function Detail() {
  const { id: idString } = useParams();
  const id = Number(idString); 

  const dispatch = useDispatch();
  const favoriteIds = useSelector(state => state.favorites.ids);
  
  const [pokemon, setPokemon] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]); // 진화 정보 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFavorite = favoriteIds.includes(id);

  // 1. API 호출 및 모든 정보(한국어, 특별폼, 진화) 통합 로직
  useEffect(() => {
    if (!id) return; 

    setLoading(true);

    const loadPokemonData = async () => {
      try {
        // 1. 기본 상세 정보 가져오기
        const detailData = await fetchPokemonDetail(id); 

        // 2. 종(Species) 정보 가져오기
        const speciesResponse = await fetch(detailData.species.url);
        const speciesData = await speciesResponse.json();
        
        // 3. 한국어 이름 추출
        const koreanEntry = speciesData.names.find(name => name.language.name === 'ko');
        const koreanName = koreanEntry ? koreanEntry.name : detailData.name;

        // 4. 특별 폼 URL 추출 및 데이터 병렬 로드 (메가/원시/오리진)
        const specialFormUrls = speciesData.varieties
          .filter(v => 
            v.is_default === false && 
            (v.pokemon.name.includes('-mega') || v.pokemon.name.includes('-primal') || v.pokemon.name.includes('-origin'))
          )
          .map(v => v.pokemon.url);
        
        const uniqueSpecialFormUrls = [...new Set(specialFormUrls)];
        const specialFormPromises = uniqueSpecialFormUrls.map(url => fetch(url).then(res => res.json()));
        const specialFormsData = await Promise.all(specialFormPromises);
        
        // 5. 🟢 진화 체인 정보 가져오기
        const chainUrl = speciesData.evolution_chain.url;
        const chainResponse = await fetch(chainUrl);
        const chainData = await chainResponse.json();
        
        const flatChain = extractEvolutionChain(chainData.chain); // 진화 정보를 평탄화
        
        // 6. 평탄화된 진화 체인의 한국어 이름 및 ID 로드
        const evolutionPromises = flatChain.map(async (evo) => {
            const evoSpeciesResponse = await fetch(evo.speciesUrl);
            const evoSpeciesData = await evoSpeciesResponse.json();
            const evoKoreanEntry = evoSpeciesData.names.find(name => name.language.name === 'ko');
            const evoId = evoSpeciesData.id;
            
            return {
                id: evoId,
                name: evoKoreanEntry ? evoKoreanEntry.name : evoSpeciesData.name,
            };
        });
        const fullEvolutionChain = await Promise.all(evolutionPromises);


        // 7. 최종 상태 업데이트
        setPokemon({
          ...detailData,
          korean_name: koreanName,    
          special_forms: specialFormsData, 
        });
        setEvolutionChain(fullEvolutionChain); // 진화 정보 상태 저장

      } catch (err) {
        console.error("포켓몬 정보 로딩 오류:", err);
        setError("포켓몬 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    loadPokemonData();
  }, [id]);

  // 🟢 재귀 함수: 진화 체인을 평탄화하여 이름과 URL만 추출
  const extractEvolutionChain = (chain) => {
    let evolutions = [];
    if (chain.species) {
        // ID와 이름을 얻기 위해 species URL을 저장
        evolutions.push({
            name: chain.species.name, 
            speciesUrl: chain.species.url,
        });
    }

    if (chain.evolves_to && chain.evolves_to.length > 0) {
        chain.evolves_to.forEach(nextChain => {
            evolutions = evolutions.concat(extractEvolutionChain(nextChain));
        });
    }
    return evolutions;
  };


  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(id)); 
  };

  const getFormDisplayName = (formName, baseName) => {
    const base = baseName.toUpperCase();
    let displayName = formName.toUpperCase();
    
    if (displayName.startsWith(base)) {
      displayName = displayName.substring(base.length);
    }
    
    displayName = displayName.replace(/-/g, ' ').trim();
    
    if (!displayName) {
        if (formName.includes('-mega')) return "MEGA";
        if (formName.includes('-primal')) return "PRIMAL";
        return "SPECIAL FORM";
    }

    return displayName;
  };

  if (loading) return <div style={{ textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>에러: {error}</div>;
  if (!pokemon) return <div style={{ textAlign: 'center' }}>포켓몬 정보를 찾을 수 없습니다.</div>;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      
      {/* 기본 정보 */}
      <h2>#{pokemon.id} {pokemon.korean_name || pokemon.name.toUpperCase()}</h2> 
      
      <p>
        **타입:** {pokemon.types.map(t => t.type.name.toUpperCase()).join(' / ')} 
      </p>

      <img 
        src={pokemon.sprites.other['official-artwork']?.front_default || pokemon.sprites.front_default} 
        alt={pokemon.korean_name || pokemon.name} 
        style={{ width: '200px', margin: '10px 0' }} 
      />
      
      {/* 찜 버튼 */}
      <button 
        onClick={handleToggleFavorite}
        style={{ padding: '10px 30px', fontSize: '16px', cursor: 'pointer', backgroundColor: isFavorite ? '#ff5252' : '#333', color: 'white', border: 'none', borderRadius: '5px', display: 'block', margin: '0 auto 20px' }}
      >
        {isFavorite ? '💖 찜 해제' : '🤍 찜 하기'}
      </button>

      {/* --- 진화 정보 --- */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
          <h3>🧬 진화 체인</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {evolutionChain.map((evo, index) => (
                <React.Fragment key={evo.id}>
                    <Link to={`/pokemon/${evo.id}`} style={{ textDecoration: 'none', color: '#333', textAlign: 'center' }}>
                        <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                            alt={evo.name}
                            style={{ width: '96px', height: '96px', border: evo.id === pokemon.id ? '3px solid #007bff' : 'none', borderRadius: '50%' }}
                        />
                        <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>{evo.name}</p>
                    </Link>
                    {/* 다음 진화 단계가 있다면 화살표 표시 */}
                    {index < evolutionChain.length - 1 && (
                        <span style={{ fontSize: '24px', color: '#555' }}>➡️</span>
                    )}
                </React.Fragment>
            ))}
          </div>
      </div>
      
      {/* --- 특별 폼 (메가/원시) --- */}
      {pokemon.special_forms && pokemon.special_forms.length > 0 && (
        <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
          <h3>🌟 특별 폼 (메가 진화/원시 회귀)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
            {pokemon.special_forms.map(form => (
              <div key={form.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
                
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
      
      {/* --- 능력치 정보 --- */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
        <h3>📊 능력치</h3>
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