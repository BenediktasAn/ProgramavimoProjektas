import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface Building {
  id: number;
  name: string;
  description: string;
  position: [number, number];
}

interface MapProps {
  onSelectBuilding: (building: Building) => void;
}

// Building names and descriptions
const buildings: Building[] = [
  {
    id: 1,
    name: "KTU 1 rūmai",
    description: "Socialinių, humanitarinių mokslų ir menų fakultetas. Šiuose rūmuose vyksta pagrindinės socialinių, humanitarinių mokslų ir menų fakulteto paskaitos, seminarai bei studentų veiklos. Pastatas turi auditorijas, seminarų sales, administracines patalpas ir erdves kūrybiniams projektams. Čia studijuojama psichologija, sociologija, komunikacija ir menų kryptys. Rūmai taip pat atlieka kultūros ir renginių centrų funkcijas.",
    position: [54.89902014942021, 23.917163524252686],
  },
  {
    id: 2,
    name: "KTU 2 rūmai",
    description: "Ekonomikos ir verslo fakultetas. Šiuose rūmuose įsikūręs Ekonomikos ir verslo fakultetas, vyksta paskaitos, seminarai ir studentų projektų pristatymai. Pastate yra auditorijos, konferencijų salės ir administraciniai kabinetai. Fakultetas rengia įvairias verslo, vadybos, finansų ir rinkodaros studijų programas, taip pat organizuoja karjeros ir praktikos renginius studentams.",
    position: [54.899015, 23.922272],
  },
  {
    id: 3,
    name: "KTU 4 rūmai",
    description: "Cheminės technologijos fakultetas. Šiuose rūmuose veikia Cheminės technologijos fakultetas, vykdomos laboratorinės praktikos, paskaitos ir tyrimai maisto, chemijos bei technologijų srityse. Pastatas turi modernias laboratorijas, auditorijas, biurus mokslininkams ir studentams. Tai pagrindinė vieta, kur vyksta moksliniai projektai, eksperimentai ir pramonės bendradarbiavimo iniciatyvos.",
    position: [54.905103067316574, 23.951561150283638],
  },
  {
    id: 5,
    name: "KTU 9 rūmai",
    description: "Statybos ir architektūros fakultetas. Šiuose rūmuose įsikūręs Statybos ir architektūros fakultetas, vykdomos paskaitos, seminarai ir projektų darbai. Pastatas turi projektavimo studijas, auditorijas, laboratorijas statybos technologijoms, taip pat administracines patalpas. Fakultetas rengia studentus architektūros, statybos inžinerijos, urbanistikos ir projektų valdymo srityse.",
    position: [54.90585315053022, 23.956139971843],
  },
  {
    id: 6,
    name: "KTU 10 rūmai",
    description: "Elektros ir elektronikos inžinerijos fakultetas. Šiuose rūmuose veikia Elektros ir elektronikos inžinerijos fakultetas, vykdomos laboratorinės praktikos, paskaitos ir projektai. Pastate yra modernios laboratorijos elektronikos, automatizavimo ir elektros inžinerijos tyrimams, auditorijos ir seminarų salės. Fakultetas rengia specialistus tiek teorinėms, tiek praktinėms technologijų disciplinoms.",
    position: [54.90475028329401, 23.956727484865812],
  },
  {
    id: 7,
    name: "KTU 11 rūmai",
    description: "Informatikos fakulteto ir Matematikos bei gamtos mokslų fakultetas. Šiuose rūmuose įsikūręs Informatikos fakultetas ir Matematikos bei gamtos mokslų fakultetas. Čia vyksta paskaitos, laboratorinės praktikos, projektai informatikos, matematikos, fizikos ir biologijos srityse. Pastatas turi modernias auditorijas, kompiuterių sales, laboratorijas ir administracines patalpas, skirtas studentų kūrybai ir moksliniams tyrimams.",
    position: [54.90392444510232, 23.95780545724072],
  },
  {
    id: 8,
    name: "KTU 12 rūmai",
    description: "Mechanikos inžinerijos ir dizaino fakultetas. Šiuose rūmuose veikia Mechanikos inžinerijos ir dizaino fakultetas, vykdomos praktinės užduotys, paskaitos ir projektai. Pastatas turi modernias dirbtuves, laboratorijas, auditorijas ir kūrybines erdves. Fakultetas rengia specialistus mechanikos, inžinerijos, automatikos, transporto ir dizaino srityse, taip pat vykdo mokslinius ir taikomuosius tyrimus.",
    position: [54.900992245794654, 23.96044377066373],
  },
];

// Map center position
const position: [number, number] = [54.89822660028058, 23.932811862054045];

//Function to disable scrolling through the map and changing the ability to zoom in or out
function DisableMapInteractions() {
  const map = useMap();

  useEffect(() => {
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
  }, [map]);

  return null;
}

// Main map export function
export default function Map({ onSelectBuilding }: MapProps) {
  return (
    <MapContainer
      center={position}
      zoom={14}
      zoomControl={false}
      style={{ height: "500px", width: "100%" }}
    >
      <DisableMapInteractions />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={building.position}
          eventHandlers={{
            click: () => onSelectBuilding(building),
          }}
        />
      ))}
    </MapContainer>
  );
}