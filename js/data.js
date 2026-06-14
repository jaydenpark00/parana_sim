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
