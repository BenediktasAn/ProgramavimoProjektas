import { useState } from "react";
import MapLayout from "../../components/layout/PageLayout/MapLayout";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import Map from "../../components/map/Map";
import logoSrc from "../../assets/logo.png";
import PopularBuildings from "../../components/map/PopularBuildings";
import { buildings } from "../../components/Document/buildings";
import type { Building } from "../../components/Document/buildings";
import { useLocale } from "../../i18n/LocaleContext";

export interface MapPageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function MapPage({ theme, onToggleTheme }: MapPageProps) {
  const { t } = useLocale();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

const popularBuildings: Building[] = [
  buildings.find((b) => b.name === "KTU Biblioteka"),
  buildings.find((b) => b.name === "KTU Santakos Slėnis"),
  buildings.find((b) => b.name === "KTU Sporto Centras"),
  buildings.find((b) => b.name === "KTU 11 rūmai"),
].filter((building): building is Building => Boolean(building));

  return (
    <>
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
                <strong>{t("map.workingHours")}:</strong> {selectedBuilding.workingHours}
              </p>

              <h3 style={{ marginTop: "16px" }}>{t("map.services")}</h3>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {selectedBuilding.services.map((service, index) => (
                  <span key={index} className="map-service-tag">
                    {service}
                  </span>
                ))}
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedBuilding.position[0]},${selectedBuilding.position[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-open-link"
              >
                {t("map.openMaps")}
              </a>
            </>
          ) : (
            <>
              <h2>{t("map.pickBuilding")}</h2>
              <p>{t("map.pickBuildingHint")}</p>
            </>
          )}
        </div>
      }
      rightMain={<Map onSelectBuilding={setSelectedBuilding} />}
    />
      <main className="container" style={{ paddingBottom: 40 }}>
      <PopularBuildings
        buildings={popularBuildings}
        onSelectBuilding={setSelectedBuilding}
    />
    </main>
    <Footer />
    </>
  );
}