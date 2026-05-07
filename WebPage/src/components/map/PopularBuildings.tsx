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
    <section style={{ marginTop: "32px" }}>
      <h2
        style={{
          marginBottom: "16px",
          fontSize: "28px",
          fontWeight: 700,
        }}
      >
        Populiariausios vietos
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {buildings.map((building) => (
          <div
            key={building.id}
            onClick={() => onSelectBuilding(building)}
            style={{
              border: "1px solid #ddd",
              borderRadius: "16px",
              padding: "18px",
              cursor: "pointer",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: "10px",
                fontSize: "20px",
              }}
            >
              {building.name}
            </h3>

            <p
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {building.description.slice(0, 120)}...
            </p>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {building.services.slice(0, 3).map((service, index) => (
                <span
                  key={index}
                  style={{
                    background: "#eef2ff",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
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