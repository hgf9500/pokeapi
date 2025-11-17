const BASE_URL = 'https://pokeapi.co/api/v2';

// 🟢 새로운 함수: 포켓몬 종 정보에서 한국어 이름만 추출
// 이 함수는 'fetchPokemonList' 내부에서 사용되어 한국어 이름을 가져옵니다.
const fetchKoreanName = async (id) => {
    try {
        const speciesResponse = await fetch(`${BASE_URL}/pokemon-species/${id}`);
        const speciesData = await speciesResponse.json();
        
        // 종 정보의 names 배열에서 'ko' (한국어) 엔트리를 찾습니다.
        const koreanEntry = speciesData.names.find(name => name.language.name === 'ko');
        
        // 한국어 이름이 있으면 반환하고, 없으면 영어 이름을 반환합니다.
        // 종 데이터는 포켓몬 리스트의 기본 이름과 다를 수 있으므로 'Unknown' 대신 영어 기본 이름 사용을 고려합니다.
        return koreanEntry ? koreanEntry.name : speciesData.name; 
    } catch (error) {
        console.error(`Error fetching Korean name for ID ${id}:`, error);
        return 'Unknown';
    }
}


// 6세대 (721번) 포켓몬까지 가져오도록 limit을 설정
export const fetchPokemonList = async (limit = 721) => { 
  const response = await await fetch(`${BASE_URL}/pokemon?limit=${limit}`);
  const data = await response.json();
  
  // 리스트의 각 항목에 ID와 한국어 이름을 비동기적으로 추가하여 반환합니다.
  const resultsWithId = await Promise.all(data.results.map(async (pokemon, index) => {
    const id = index + 1;
    const koreanName = await fetchKoreanName(id); // 🟢 한국어 이름 가져오기
    return {
      ...pokemon,
      id: id,
      korean_name: koreanName, // 🟢 한국어 이름 필드 추가
    };
  }));
  return resultsWithId;
};

// 포켓몬 상세 정보 (이미지, 타입, 능력치 등)
// 🟢 이제 이 함수는 Detail.jsx에서 호출되어 메가 진화 로직을 처리할 때 사용됩니다.
export const fetchPokemonDetail = async (idOrName) => {
  const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
  if (!response.ok) {
    throw new Error('Pokemon not found');
  }
  const data = await response.json();
  return data;
};