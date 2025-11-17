import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { useSelector, useDispatch } from 'react-redux';
import { toggleFavorite } from '../store/favoritesSlice'; 
import { fetchPokemonDetail } from '../api/pokeapi.js';

// 🟢 포켓몬 타입 한국어 매핑 추가
const typeKoreanMap = {
    'normal': '노말',
    'fighting': '격투',
    'flying': '비행',
    'poison': '독',
    'ground': '땅',
    'rock': '바위',
    'bug': '벌레',
    'ghost': '고스트',
    'steel': '강철',
    'fire': '불꽃',
    'water': '물',
    'grass': '풀',
    'electric': '전기',
    'psychic': '에스퍼',
    'ice': '얼음',
    'dragon': '드래곤',
    'dark': '악',
    'fairy': '페어리',
};

function Detail() {
// ... (나머지 코드 - useState, useEffect 등은 이전과 동일) ...
    const { id: idString } = useParams();
    const id = Number(idString); 

    const dispatch = useDispatch();
    const favoriteIds = useSelector(state => state.favorites.ids);
    
    const [pokemon, setPokemon] = useState(null);
    const [evolutionChain, setEvolutionChain] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    const isFavorite = favoriteIds.includes(id);

    useEffect(() => {
    // ... (useEffect 내용 동일) ...
        if (!id) return; 

        setLoading(true);
        setError(null); 

        const fetchKoreanName = async (url) => {
            if (!url) return null; 
            try {
                const response = await fetch(url);
                if (!response.ok) return '정보 없음'; 
                
                const data = await response.json();
                const koreanEntry = data.names?.find(name => name.language.name === 'ko');
                return koreanEntry ? koreanEntry.name : data.name;
            } catch (error) {
                console.error("한국어 이름 fetching 에러:", error);
                return '정보 없음';
            }
        };


        const processEvolutionChain = async (chainNode, currentPokemonId) => {
            if (!chainNode.species) return null;

            try {
                const evoSpeciesResponse = await fetch(chainNode.species.url);
                const evoSpeciesData = await evoSpeciesResponse.json();
                const evoKoreanEntry = evoSpeciesData.names.find(name => name.language.name === 'ko');
                const evoId = evoSpeciesData.id;
                const evoName = evoKoreanEntry ? evoKoreanEntry.name : evoSpeciesData.name;
                
                let evolutionDetails = [];
                if (chainNode.evolution_details && chainNode.evolution_details.length > 0) {
                    evolutionDetails = await Promise.all(chainNode.evolution_details.map(async (detail) => {
                        const itemKorean = await fetchKoreanName(detail.item?.url);
                        const locationKorean = await fetchKoreanName(detail.location?.url);
                        
                        return {
                            trigger: detail.trigger.name,
                            minLevel: detail.min_level,
                            item: itemKorean, 
                            timeOfDay: detail.time_of_day,
                            minHappiness: detail.min_happiness, 
                            location: locationKorean,
                        };
                    }));
                }
                
                const nextEvolutions = await Promise.all(
                    chainNode.evolves_to.map(nextChain => processEvolutionChain(nextChain, currentPokemonId))
                );

                return {
                    id: evoId,
                    name: evoName,
                    details: evolutionDetails, 
                    isCurrent: evoId === currentPokemonId,
                    evolves_to: nextEvolutions.filter(n => n !== null),
                };
            } catch (e) {
                console.error(`진화 체인 처리 중 오류 발생 (${chainNode.species.name}):`, e);
                return null; 
            }
        };


        const loadPokemonData = async () => {
            try {
                const detailData = await fetchPokemonDetail(id); 
                const speciesResponse = await fetch(detailData.species.url);
                const speciesData = await speciesResponse.json();
                
                const koreanEntry = speciesData.names.find(name => name.language.name === 'ko');
                const koreanName = koreanEntry ? koreanEntry.name : detailData.name;

                const specialForms = [];
                const uniqueFormUrls = new Set();
                
                speciesData.varieties.forEach(v => {
                    // 🟢 리전 폼 제외 및 큐레무 포함 로직 (변동 없음)
                    if (v.is_default === false && 
                        !v.pokemon.name.includes('-galar') && 
                        !v.pokemon.name.includes('-alola') && 
                        (v.pokemon.name.includes('-mega') || 
                         v.pokemon.name.includes('-primal') || 
                         v.pokemon.name.includes('-origin') ||
                         v.pokemon.name.includes('-form') ||
                         v.pokemon.name.includes('-alternate') ||
                         v.pokemon.name.includes('-black') ||
                         v.pokemon.name.includes('-white')    
                         )) 
                    {
                        if (!uniqueFormUrls.has(v.pokemon.url)) {
                            uniqueFormUrls.add(v.pokemon.url);
                            specialForms.push(v.pokemon.url);
                        }
                    }
                });
                
                const specialFormPromises = specialForms.map(url => fetch(url).then(res => res.json()));
                const specialFormsData = await Promise.all(specialFormPromises);
                
                const chainUrl = speciesData.evolution_chain.url;
                const chainResponse = await fetch(chainUrl);
                const chainData = await chainResponse.json();
                
                const hierarchicalChain = await processEvolutionChain(chainData.chain, detailData.id);
                
                setPokemon({
                    ...detailData,
                    korean_name: koreanName,    
                    special_forms: specialFormsData, 
                });
                setEvolutionChain(hierarchicalChain); 

            } catch (err) {
                console.error("포켓몬 정보 로딩 오류:", err);
                setError("포켓몬 상세 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        
        loadPokemonData();
    }, [id]);

    // 🟢 진화 조건을 텍스트로 변환하는 유틸리티 함수 (로직 개선됨)
    const getEvolutionConditionText = (details) => {
        if (details.length === 0) return '';
        
        const detail = details[0]; 
        let parts = [];
        
        // 1. 트리거 조건 (가장 중요)
        if (detail.trigger === 'trade') {
            const item = detail.item && detail.item !== '정보 없음' ? detail.item : '';
            parts.push(item ? `${item} 장착 후 교환` : '통신 교환');
        } else if (detail.trigger === 'use-item' && detail.item && detail.item !== '정보 없음') {
            parts.push(`${detail.item} 사용`);
        } else if (detail.trigger === 'level-up') {
            if (!detail.minLevel && !detail.minHappiness) {
                parts.push('레벨 업'); // 레벨이나 친밀도 조건이 없으면 일반 레벨업
            }
        }
        
        // 2. 레벨 조건
        if (detail.minLevel) {
            parts.push(`Lv. ${detail.minLevel}`);
        }
        
        // 3. 친밀도 조건
        if (detail.minHappiness) { 
            parts.push(`친밀도 ${detail.minHappiness} 이상`);
        }


        // 4. 추가 조건 (시간, 장소 등)
        if (detail.timeOfDay) {
            const timeText = detail.timeOfDay === 'day' ? '낮' : '밤';
            // 시간 조건은 항상 마지막에 추가하여 복잡도 줄임
            parts.push(`(${timeText})`);
        }
        if (detail.location && detail.location !== '정보 없음') {
            parts.push(`${detail.location}에서`);
        }
        
        // 중복 제거 및 최종 문자열 생성
        const uniqueParts = [...new Set(parts)].filter(p => p.trim() !== '');
        const conditionText = uniqueParts.join(' + ');

        return conditionText.trim() === '' ? '특정 조건' : conditionText;
    };


    // 🟢 폼 이름을 분류하여 표시하는 유틸리티 함수 (변동 없음)
    const getFormDisplayName = (formName, baseName) => {
        let displayName = formName.toUpperCase();
        
        if (displayName.includes('-MEGA')) return '메가 진화';
        if (displayName.includes('-PRIMAL')) return '원시 회귀';
        if (displayName.includes('-BLACK')) return '블랙 큐레무'; 
        if (displayName.includes('-WHITE')) return '화이트 큐레무'; 
        if (displayName.includes('-FORM') || displayName.includes('-ALTERNATE')) return '폼 체인지';

        const base = baseName.toUpperCase();
        if (displayName.startsWith(base)) {
            displayName = displayName.substring(base.length);
        }
        return displayName.replace(/-/g, ' ').trim() || '특수 폼';
    };

    // 찜 목록 핸들러
    const handleToggleFavorite = () => {
        dispatch(toggleFavorite(id)); 
    };

    if (loading) return <div style={{ textAlign: 'center' }}>로딩 중...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red' }}>에러: {error}</div>;
    if (!pokemon) return <div style={{ textAlign: 'center' }}>포켓몬 정보를 찾을 수 없습니다.</div>;

    // 🟢 진화 체인 렌더링 함수 (index 제거, 변동 없음)
    const renderEvolution = (evoNode) => {
    // ... (renderEvolution 함수 내용 동일) ...
        if (!evoNode) return null;

        const isCurrent = evoNode.id === pokemon.id;
        const isBranch = evoNode.evolves_to.length > 1;

        return (
            <div key={evoNode.id} style={{ display: 'flex', flexDirection: isBranch ? 'column' : 'row', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', margin: '0 10px' }}>
                    <Link to={`/pokemon/${evoNode.id}`} style={{ textDecoration: 'none', color: '#333' }}>
                        <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evoNode.id}.png`}
                            alt={evoNode.name}
                            style={{ width: '96px', height: '96px', border: isCurrent ? '3px solid #007bff' : '1px solid #ddd', borderRadius: '50%' }}
                        />
                        <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>{evoNode.name}</p>
                    </Link>
                </div>

                {evoNode.evolves_to.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: isBranch ? 'column' : 'row', alignItems: 'center', marginLeft: isBranch ? 0 : '10px' }}>
                        {evoNode.evolves_to.map((nextEvo) => (
                            <div key={nextEvo.id} style={{ display: 'flex', alignItems: 'center', margin: isBranch ? '10px 0' : '0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: isBranch ? '0 10px' : '0 15px' }}>
                                    <span style={{ fontSize: '24px', color: '#555' }}>{isBranch ? '⬇️' : '➡️'}</span>
                                    {nextEvo.details.length > 0 && (
                                        <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0 0', whiteSpace: 'nowrap' }}>
                                            ({getEvolutionConditionText(nextEvo.details)})
                                        </p>
                                    )}
                                </div>
                                
                                {renderEvolution(nextEvo)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // 🟢 타입 렌더링 부분 수정
    const renderTypes = (types) => {
        return types.map(t => {
            const typeName = t.type.name;
            return typeKoreanMap[typeName] || typeName.toUpperCase(); // 매핑된 한국어 이름 또는 대문자 영어 이름 사용
        }).join(' / ');
    };


    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          
            {/* 기본 정보 */}
            <h2>#{pokemon.id} {pokemon.korean_name || pokemon.name.toUpperCase()}</h2> 
            
            <p>
                **타입:** {renderTypes(pokemon.types)} {/* 🟢 renderTypes 함수 호출로 변경 */}
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
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {evolutionChain && renderEvolution(evolutionChain)}
                </div>
            </div>
          
            {/* --- 특별 폼 (메가/원시/폼체인지) --- */}
            {pokemon.special_forms && pokemon.special_forms.length > 0 && (
                <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
                    <h3>✨ 특별 폼</h3>
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
                                    **타입:** {renderTypes(form.types)} {/* 🟢 특별 폼 타입도 한국어 적용 */}
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