import { useState } from "react";
import MapLayout from "../../components/layout/PageLayout/MapLayout";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import Map from "../../components/map/Map";
import logoSrc from "../../assets/logo.png";

export interface MapPageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export interface Building {
  id: number;
  name: string;
  description: string;
  position: [number, number];
}

export default function MapPage({ theme, onToggleTheme }: MapPageProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  return (
    <MapLayout
      header={
        <Header
          logo={{ src: logoSrc, alt: "askKTU logo" }}
          onToggleTheme={onToggleTheme}
          theme={theme}
        />
      }
      topNav={<TopNav />}
      leftColumn={
        <div>
          {selectedBuilding ? (
            <>
              <h2>{selectedBuilding.name}</h2>
              <p>{selectedBuilding.description}</p>
            </>
          ) : (
            <>
              <h2>Pasirinkite pastatą</h2>
              <p>Paspauskite ant vietos nuorodų, kad matytumėte informacija.</p>
            </>
          )}
        </div>
      }
      rightMain={<Map onSelectBuilding={setSelectedBuilding} />}
      footer={<Footer />}
    />
  );
}