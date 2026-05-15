import type { Building } from "../Document/buildings";

interface PopularBuildingsProps {
  buildings: Building[];
  onSelectBuilding: (building: Building) => void;
}

export default function PopularBuildings({
  buildings,
  onSelectBuilding,
}: PopularBuildingsProps) {
  return (
    <section className="popular-buildings">
      <h2 className="popular-buildings-heading">
        Populiariausios vietos
      </h2>

      <div className="popular-buildings-grid">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="popular-building-card"
            onClick={() => onSelectBuilding(building)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectBuilding(building);
              }
            }}
          >
            <h3 className="popular-building-card-title">
              {building.name}
            </h3>

            <p className="popular-building-card-desc">
              {building.description.slice(0, 120)}...
            </p>

            <div className="popular-building-card-tags">
              {building.services.slice(0, 3).map((service, index) => (
                <span key={index} className="map-service-tag">
                  {service}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
