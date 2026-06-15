// ── Data ──────────────────────────────────────────────────────────────────
const SPECIES_NAMES = [
  'Acestrorhyncus lacustris','Astyanax altiparanae','Auchenipterus nuchalis','Benthos',
  'Brycon orbignyanus','Cyphocharax modestus','Hemisorubin platyrhynchos','Hoplias malabaricus',
  'Hoplosternum littorale','Hypophthalmus edentatus','Hypostomus sp','Iheringichthys labrosus',
  'Insects','Leporinus friderici','Leporinus obtusidens','Loricariichthys platymetopon',
  'Other benthos feeders','Other insectivores','Other omnivores','Other piscivores',
  'Parauchenipterus galeatus','Pimelodus maculatus','Plagioscion squamosissimus','Prochilodus lineatus',
  'Pseudoplatystoma corruscans','Pterodoras granulosus','Rhaphiodon vulpinus','Salminus brasiliensis',
  'Schizodon altoparanae','Schizodon borellii','Serrasalmus marginatus','Serrasalmus spilopleura',
  'Steindachnerina insculpta','Trachydoras paraguayensis','Zooplankton','Aquatic macrophytes',
  'Periphyton','Phytoplankton','Detritus','Other detritus feeders'
];

const RAW_EDGES = [[0,7,0.1],[0,26,0.1],[1,0,0.2],[1,4,0.1],[1,6,0.15],[1,13,0.1],[1,14,0.1],[1,17,0.1],[1,19,0.2],[1,21,0.1],[1,22,0.15],[1,24,0.2],[1,26,0.2],[1,27,0.1],[1,30,0.1],[1,31,0.1],[2,0,0.1],[2,24,0.1],[2,31,0.1],[3,5,0.1],[3,8,0.2],[3,11,0.35],[3,13,0.05],[3,14,0.05],[3,15,0.1],[3,16,0.35],[3,18,0.15],[3,21,0.25],[3,23,0.15],[3,25,0.1],[3,32,0.1],[3,39,0.1],[4,6,0.1],[4,26,0.1],[5,0,0.1],[6,24,0.1],[7,27,0.2],[8,24,0.3],[9,19,0.1],[9,30,0.1],[9,31,0.1],[10,27,0.2],[11,0,0.2],[12,1,0.3],[12,2,0.7],[12,4,0.55],[12,8,0.2],[12,11,0.2],[12,13,0.2],[12,14,0.2],[12,15,0.2],[12,16,0.1],[12,17,0.6],[12,18,0.3],[12,20,0.6],[12,21,0.1],[12,25,0.1],[12,33,0.15],[12,39,0.1],[13,21,0.05],[13,22,0.1],[14,1,0.1],[14,7,0.2],[14,24,0.1],[15,27,0.15],[16,2,0.1],[16,26,0.1],[16,30,0.1],[16,31,0.1],[17,0,0.1],[17,4,0.05],[17,6,0.1],[17,7,0.1],[17,21,0.05],[17,22,0.1],[17,30,0.1],[18,0,0.1],[18,1,0.1],[18,13,0.1],[18,14,0.1],[18,19,0.2],[18,27,0.1],[18,30,0.05],[18,31,0.1],[19,24,0.1],[20,22,0.15],[20,26,0.2],[21,6,0.25],[22,30,0.1],[22,31,0.2],[23,7,0.2],[23,19,0.2],[23,22,0.3],[23,26,0.2],[23,27,0.15],[23,30,0.1],[23,31,0.1],[24,19,0.05],[24,30,0.05],[25,7,0.2],[25,30,0.1],[25,31,0.1],[27,19,0.05],[28,27,0.1],[29,0,0.1],[29,19,0.1],[30,6,0.1],[30,21,0.05],[30,22,0.1],[30,24,0.1],[31,22,0.1],[32,6,0.2],[33,21,0.1],[34,1,0.1],[34,2,0.2],[34,8,0.2],[34,9,0.7],[34,11,0.1],[34,16,0.1],[34,17,0.1],[34,18,0.1],[34,21,0.1],[34,25,0.1],[34,33,0.3],[35,1,0.2],[35,4,0.3],[35,8,0.1],[35,12,0.3],[35,13,0.3],[35,14,0.3],[35,16,0.1],[35,17,0.2],[35,18,0.15],[35,20,0.4],[35,21,0.05],[35,25,0.5],[35,28,0.7],[35,29,0.7],[36,3,0.5],[36,11,0.1],[36,18,0.1],[37,1,0.1],[37,5,0.35],[37,9,0.3],[37,10,0.2],[37,13,0.05],[37,14,0.05],[37,15,0.1],[37,16,0.05],[37,18,0.1],[37,21,0.05],[37,23,0.15],[37,25,0.1],[37,28,0.3],[37,29,0.3],[37,32,0.35],[37,34,0.5],[37,39,0.1],[38,1,0.1],[38,3,0.5],[38,5,0.55],[38,8,0.3],[38,10,0.8],[38,11,0.25],[38,12,0.7],[38,13,0.2],[38,14,0.2],[38,15,0.6],[38,16,0.3],[38,18,0.1],[38,21,0.1],[38,23,0.7],[38,25,0.1],[38,32,0.55],[38,33,0.55],[38,34,0.5],[38,39,0.7],[39,0,0.1],[39,6,0.1],[39,30,0.1],[39,31,0.1]];

// ── Korean descriptions fallback (index matches SPECIES_NAMES) ───────────
const SPECIES_DESC_KO = [
  /* 0  Acestrorhyncus lacustris    */ "파라나 강에 서식하는 소형 육식성 어류로, 날카로운 송곳니로 작은 물고기를 사냥합니다. '강의 파이크'라 불리며 먹이그물의 중간 포식자 역할을 합니다.",
  /* 1  Astyanax altiparanae        */ "파라나 강 상류에 분포하는 소형 잡식성 어류로, 개체수가 풍부해 생태계 에너지 순환의 핵심 연결고리 역할을 합니다.",
  /* 2  Auchenipterus nuchalis      */ "야행성 메기류로, 수서곤충과 소형 물고기를 먹습니다. 낮에는 은신하고 밤에 활발히 활동하는 특성이 있습니다.",
  /* 3  Benthos                     */ "수저 퇴적층에 서식하는 저서생물 군집입니다. 유기물 분해를 통해 영양염류를 순환시키며 많은 어류의 먹이원이 됩니다.",
  /* 4  Brycon orbignyanus          */ "파라나 강의 멸종위기 대형 어류(최대 80cm)로, 과일·씨앗·수초를 먹는 잡식성입니다. 씨앗 산포자 역할을 하며 강 생태계 복원의 지표종입니다.",
  /* 5  Cyphocharax modestus        */ "저서 유기물(데트리투스)을 긁어 먹는 소형 어류입니다. 파라나 강에 풍부하게 서식하며 물질 순환에 기여합니다.",
  /* 6  Hemisorubim platyrhynchos   */ "납작한 머리가 특징인 대형 메기류 포식자입니다. 주로 소형 어류를 먹으며 파라나 강의 주요 상업 어종 중 하나입니다.",
  /* 7  Hoplias malabaricus         */ "강력한 이빨을 가진 최상위 포식자로, '트라이라'라 불립니다. 영역성이 강하며 소형~중형 어류를 주로 사냥합니다.",
  /* 8  Hoplosternum littorale      */ "공기 호흡이 가능한 갑옷 메기류입니다. 저산소 환경에서도 생존할 수 있어 건기 웅덩이에서도 살아남습니다.",
  /* 9  Hypophthalmus edentatus     */ "아래를 향한 눈이 특징인 대형 메기로, 아가미로 동물플랑크톤을 여과 섭취합니다. 상업적으로 중요한 어종입니다.",
  /* 10 Hypostomus sp               */ "돌과 유목 표면에 붙어 조류를 긁어 먹는 갑옷 메기류입니다. 흡반 모양의 입으로 강한 유속에서도 고정할 수 있습니다.",
  /* 11 Iheringichthys labrosus     */ "두꺼운 입술이 특징인 소형 메기류로, 저서동물과 유기물을 먹습니다. 파라나 강 저층 먹이그물의 구성원입니다.",
  /* 12 Insects                     */ "수서곤충(하루살이·날도래·잠자리 유충 등)은 파라나 강 어류의 핵심 먹이원입니다. 육상~수중 에너지 통로 역할을 합니다.",
  /* 13 Leporinus friderici         */ "과일·수초·저서동물을 모두 먹는 잡식성 어류입니다. 이빨이 발달해 딱딱한 먹이도 처리할 수 있습니다.",
  /* 14 Leporinus obtusidens        */ "뭉툭한 이빨로 수초와 수변 과일을 주로 먹는 초식성 어류입니다. 수위 변화에 따라 계절적으로 이동합니다.",
  /* 15 Loricariichthys platymetopon*/ "납작한 머리를 가진 갑옷 메기류로, 저서 유기물을 긁어 먹습니다. 수컷이 알을 입에서 보호하는 구강 포란 행동이 알려져 있습니다.",
  /* 16 Other benthos feeders       */ "저서동물(저서무척추동물·유기물 등)을 주로 먹이원으로 하는 기타 어류 그룹입니다.",
  /* 17 Other insectivores          */ "수서곤충과 육상 곤충을 주요 먹이로 하는 기타 어류 그룹입니다.",
  /* 18 Other omnivores             */ "식물성·동물성 먹이를 모두 섭취하는 기타 잡식성 어류 그룹입니다.",
  /* 19 Other piscivores            */ "소형 어류를 주요 먹이원으로 하는 기타 육식성 어류 그룹입니다.",
  /* 20 Parauchenipterus galeatus   */ "투구 모양의 머리뼈가 특징인 야행성 메기류입니다. 갑각류와 수서곤충을 먹으며 수컷이 수정 후 암컷 체내에서 새끼를 보호합니다.",
  /* 21 Pimelodus maculatus         */ "파라나 강에 가장 풍부한 중형 메기 중 하나입니다. 잡식성으로 곤충·소형 어류·유기물 등 다양한 먹이를 섭취합니다.",
  /* 22 Plagioscion squamosissimus  */ "아마존 원산의 농어류로 파라나 강에 도입된 외래종입니다. 소형 어류와 새우를 포식하며 토착 어류와 경쟁합니다.",
  /* 23 Prochilodus lineatus        */ "파라나 강 생태계의 핵심 어종으로, 수백 킬로미터를 이동하는 부식식자입니다. 바닥 유기물을 교란해 영양 순환을 촉진합니다.",
  /* 24 Pseudoplatystoma corruscans */ "파라나 강 최대 포식자 중 하나인 대형 메기(최대 150cm)입니다. 긴 수염과 얼룩무늬가 특징이며 최상위 포식자로 개체수 조절 역할을 합니다.",
  /* 25 Pterodoras granulosus       */ "과일과 씨앗을 즐겨 먹는 대형 갑옷 메기류입니다. 씨앗을 소화하지 않고 배출해 강 유역 식물 씨앗 산포에 기여합니다.",
  /* 26 Rhaphiodon vulpinus         */ "긴 몸과 날카로운 송곳니를 가진 소형 어류 포식자입니다. '늑대 물고기'라 불리며 수면 근처에서 물고기를 사냥합니다.",
  /* 27 Salminus brasiliensis       */ "파라나 강의 최상위 포식자이자 대표 어종인 '황금 도라도'입니다. 강력한 유영력과 황금빛 체색이 특징이며 낚시 대상어로도 유명합니다.",
  /* 28 Schizodon altoparanae       */ "파라나 강 상류에 고유한 초식성 어류로, 수초의 줄기와 잎을 주로 먹습니다.",
  /* 29 Schizodon borellii          */ "수초와 수변 식물을 먹는 초식성 어류입니다. 홍수기에 범람원으로 이동해 수변 식생을 이용합니다.",
  /* 30 Serrasalmus marginatus      */ "파라나 강 서식 피라냐류로, 주로 다른 물고기의 지느러미나 비늘을 먹는 lepidophage 행동이 관찰됩니다.",
  /* 31 Serrasalmus spilopleura     */ "얼룩 무늬 피라냐류로, 소형 어류와 지느러미를 먹습니다. 군집 행동보다는 단독 사냥을 선호합니다.",
  /* 32 Steindachnerina insculpta   */ "저서 유기물과 조류를 긁어 먹는 소형 어류입니다. 파라나 강 저층 물질 순환에 기여하는 풍부종입니다.",
  /* 33 Trachydoras paraguayensis   */ "거친 피부 돌기가 특징인 메기류로, 저서 유기물과 수서곤충 유충을 먹습니다.",
  /* 34 Zooplankton                 */ "수중 동물성 플랑크톤(요각류·물벼룩 등)으로, 식물플랑크톤을 먹고 어류 유어의 주요 먹이원이 됩니다. 수중 먹이사슬의 핵심 연결고리입니다.",
  /* 35 Aquatic macrophytes         */ "수중 및 수변에 자라는 대형 수초류입니다. 산소 생산·서식처 제공·수질 정화 역할을 하며 홍수기 범람원 생산성의 기반입니다.",
  /* 36 Periphyton                  */ "수중 구조물(돌·식물·유목) 표면에 부착하는 조류·박테리아·균류의 혼합 군집입니다. 저서 먹이그물의 1차 생산자입니다.",
  /* 37 Phytoplankton               */ "광합성을 하는 수중 미세조류로, 수생태계 1차 생산의 핵심입니다. 수질 투명도와 영양염류 수준에 따라 개체수가 크게 변합니다.",
  /* 38 Detritus                    */ "분해 중인 동식물 유기물 잔해입니다. 저서 먹이그물의 에너지 기반으로, 많은 어류와 무척추동물이 이를 직접 섭취합니다.",
  /* 39 Other detritus feeders      */ "분해 유기물(데트리투스)을 주요 먹이원으로 하는 기타 어류 및 무척추동물 그룹입니다.",
];

// ── Wikipedia titles (index matches SPECIES_NAMES) ────────────────────────
const WIKI_TITLES = [
  'Acestrorhynchus_lacustris','Astyanax_altiparanae','Auchenipterus_nuchalis',
  'Benthos','Brycon_orbignyanus','Cyphocharax_modestus','Hemisorubim_platyrhynchos',
  'Hoplias_malabaricus','Hoplosternum_littorale','Hypophthalmus_edentatus',
  'Hypostomus','Iheringichthys_labrosus','Insect','Leporinus_friderici',
  'Leporinus_obtusidens','Loricariichthys_platymetopon','Benthos','Insectivore',
  'Omnivore','Piscivore','Parauchenipterus_galeatus','Pimelodus_maculatus',
  'Plagioscion_squamosissimus','Prochilodus_lineatus','Pseudoplatystoma_corruscans',
  'Pterodoras_granulosus','Rhaphiodon_vulpinus','Salminus_brasiliensis',
  'Schizodon_altoparanae','Schizodon_borellii','Serrasalmus_marginatus',
  'Serrasalmus_spilopleura','Steindachnerina_insculpta','Trachydoras_paraguayensis',
  'Zooplankton','Aquatic_plant','Periphyton','Phytoplankton','Detritus','Detritivore'
];
