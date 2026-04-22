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
  workingHours: string;
  services: string[];
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

              <p style={{ marginTop: "12px" }}>
                <strong>Darbo laikas:</strong> {selectedBuilding.workingHours}
              </p>

              <h3 style={{ marginTop: "16px" }}>Paslaugos</h3>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {selectedBuilding.services.map((service, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#eef2ff",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedBuilding.position[0]},${selectedBuilding.position[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "10px 14px",
                  background: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "8px",
                }}
              >
                Atidaryti „Maps“
              </a>
            </>
          ) : (
            <>
              <h2>Pasirinkite pastatą</h2>
              <p>Paspauskite ant vietos nuorodų, kad matytumėte informaciją.</p>
            </>
          )}
        </div>
      }
      rightMain={<Map onSelectBuilding={setSelectedBuilding} />}
      footer={<Footer />}
    />
  );
}