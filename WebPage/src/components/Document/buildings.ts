export type BuildingType =
  | "faculty"
  | "library"
  | "dorm"
  | "research"
  | "administration"
  | "sports"
  | "school";

export interface Building {
  id: number;
  name: string;
  description: string;
  workingHours: string;
  services: string[];
  type: BuildingType;
  position: [number, number];
}

export const buildings: Building[] = [
  {
    id: 1,
    name: "KTU 1 rūmai",
    description:
      "Socialinių, humanitarinių mokslų ir menų fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Paskaitos",
      "Seminarai",
      "Kūrybiniai projektai",
      "Renginiai",
      "Konsultacijos",
    ],
    type: "faculty",
    position: [54.89902014942021, 23.917163524252686],
  },

  {
    id: 2,
    name: "KTU 2 rūmai",
    description:
      "Ekonomikos ir verslo fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Paskaitos",
      "Projektai",
      "Karjeros renginiai",
      "Verslo konsultacijos",
    ],
    type: "faculty",
    position: [54.899015, 23.922272],
  },

  {
    id: 3,
    name: "KTU 4 rūmai",
    description:
      "Cheminės technologijos fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Laboratoriniai darbai",
      "Tyrimai",
      "Eksperimentai",
      "Praktikos",
    ],
    type: "faculty",
    position: [54.905103067316574, 23.951561150283638],
  },

  {
    id: 4,
    name: "KTU 9 rūmai",
    description:
      "Statybos ir architektūros fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Projektavimas",
      "Architektūros studijos",
      "Statybos laboratorijos",
      "Seminarai",
    ],
    type: "faculty",
    position: [54.90585315053022, 23.956139971843],
  },

  {
    id: 5,
    name: "KTU 10 rūmai",
    description:
      "Elektros ir elektronikos inžinerijos fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Elektronikos laboratorijos",
      "Automatikos projektai",
      "Praktikos",
      "Paskaitos",
    ],
    type: "faculty",
    position: [54.90475028329401, 23.956727484865812],
  },

  {
    id: 6,
    name: "KTU 11 rūmai",
    description:
      "Informatikos fakulteto ir Matematikos bei gamtos mokslų fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Programavimas",
      "Kompiuterių klasės",
      "Laboratorijos",
      "Projektai",
    ],
    type: "faculty",
    position: [54.90392444510232, 23.95780545724072],
  },

  {
    id: 7,
    name: "KTU 12 rūmai",
    description:
      "Mechanikos inžinerijos ir dizaino fakultetas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Dirbtuvės",
      "Mechanikos laboratorijos",
      "Dizaino projektai",
      "Prototipavimas",
    ],
    type: "faculty",
    position: [54.900992245794654, 23.96044377066373],
  },

  {
    id: 8,
    name: "KTU Biblioteka",
    description:
      "KTU biblioteka studentams ir dėstytojams.",
    workingHours: "I–V 08:00–20:00",
    services: [
      "Knygų skolinimas",
      "Skaityklos",
      "Kompiuteriai",
    ],
    type: "library",
    position: [54.906308410619495, 23.955807996294812],
  },

  {
    id: 9,
    name: "KTU Bendrabutis Nr. 2",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.903162942636165, 23.960363901906437],
  },

  {
    id: 10,
    name: "KTU Bendrabutis Nr. 3",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90246588816126, 23.960846718762514],
  },

  {
    id: 11,
    name: "KTU Bendrabutis Nr. 4",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90173178980109, 23.96136168037695],
  },

  {
    id: 12,
    name: "KTU Bendrabutis Nr. 5",
    description: "Tarptautinis KTU bendrabutis.",
    workingHours: "24/7",
    services: [
      "Apgyvendinimas",
      "Tarptautiniai studentai",
      "Wi-Fi",
      "Virtuvė",
    ],
    type: "dorm",
    position: [54.90494467510175, 23.964509587709852],
  },

  {
    id: 13,
    name: "KTU Bendrabutis Nr. 7",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90584135551443, 23.963286802083296],
  },

  {
    id: 14,
    name: "KTU Bendrabutis Nr. 8",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.905854159000505, 23.96411467318418],
  },

  {
    id: 15,
    name: "KTU Bendrabutis Nr. 10",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: [
      "Apgyvendinimas",
      "Tarptautiniai studentai",
      "Wi-Fi",
    ],
    type: "dorm",
    position: [54.9052680656913, 23.966646625731883],
  },

  {
    id: 16,
    name: "KTU Bendrabutis Nr. 11",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90574920929575, 23.96626002621657],
  },

  {
    id: 17,
    name: "KTU Bendrabutis Nr. 13",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90279545872152, 23.938923506174913],
  },

  {
    id: 18,
    name: "KTU Bendrabutis Nr. 14",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90225261704347, 23.938408509929282],
  },

  {
    id: 19,
    name: "KTU Bendrabutis Nr. 15",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.9026535502008, 23.940489908539508],
  },

  {
    id: 20,
    name: "KTU Bendrabutis Nr. 16",
    description: "KTU studentų bendrabutis.",
    workingHours: "24/7",
    services: ["Apgyvendinimas", "Virtuvė", "Wi-Fi"],
    type: "dorm",
    position: [54.90624881759846, 23.96528239963706],
  },

  {
    id: 21,
    name: "KTU Santakos Slėnis",
    description:
      "KTU mokslo, studijų ir verslo centras.",
    workingHours: "I–V 08:00–20:00",
    services: [
      "Tyrimai",
      "Laboratorijos",
      "Inovacijos",
      "Startuoliai",
      "Renginiai",
    ],
    type: "research",
    position: [54.89975208438403, 23.961729271450363],
  },

  {
    id: 22,
    name: "KTU M-Lab",
    description:
      "KTU modernių technologijų ir prototipavimo laboratorija.",
    workingHours: "I–V 09:00–18:00",
    services: [
      "3D spausdinimas",
      "Prototipavimas",
      "Elektronika",
      "Tyrimai",
    ],
    type: "research",
    position: [54.90443513504641, 23.95896019716377],
  },

  {
    id: 23,
    name: "KTU Centriniai Rūmai",
    description:
      "Pagrindinis KTU administracijos pastatas.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Administracija",
      "Studentų aptarnavimas",
      "Tarptautiniai ryšiai",
    ],
    type: "administration",
    position: [54.898943431032336, 23.912507650526546],
  },

  {
    id: 24,
    name: "KTU Studentų Infocentras",
    description:
      "Studentų informacijos ir administravimo centras.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Pažymos",
      "Studijų informacija",
      "Pagalba studentams",
    ],
    type: "administration",
    position: [54.90441751577204, 23.95714019325985],
  },

  {
    id: 25,
    name: "KTU ACTIVATed Gym",
    description:
      "KTU sporto ir aktyvaus laisvalaikio centras.",
    workingHours: "I–VII 08:00–22:00",
    services: [
      "Sporto salė",
      "Krepšinis",
      "Fitness",
      "Treniruotės",
    ],
    type: "sports",
    position: [54.905865864050774, 23.963533912382115],
  },

  {
    id: 26,
    name: "KTU Stadionas",
    description:
      "KTU stadionas ir lauko sporto infrastruktūra.",
    workingHours: "I–VII 07:00–22:00",
    services: [
      "Futbolas",
      "Bėgimo takai",
      "Sporto renginiai",
    ],
    type: "sports",
    position: [54.90541281324482, 23.9538946241478],
  },

  {
    id: 27,
    name: "KTU Gimnazija",
    description:
      "KTU universitetinė gimnazija gabiems mokiniams.",
    workingHours: "I–V 08:00–17:00",
    services: [
      "Vidurinis ugdymas",
      "STEM veiklos",
      "Laboratorijos",
    ],
    type: "school",
    position: [54.903963182635685, 23.959488629166124],
  },
];