import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { buildings, type Building } from "../Document/buildings";

import markerHouse from "../../assets/house.png";
import markerFaculty from "../../assets/faculty.png";
import markerLibrary from "../../assets/library.png";
import markerResearch from "../../assets/research.png";
import markerAdministration from "../../assets/administration.png";
import markerSports from "../../assets/sports.png";
import markerSchool from "../../assets/school.png";

interface MapProps {
  onSelectBuilding: (building: Building) => void;
}

const houseIcon = L.icon({
  iconUrl: markerHouse,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const facultyIcon = L.icon({
  iconUrl: markerFaculty,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const libraryIcon = L.icon({
  iconUrl: markerLibrary,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const researchIcon = L.icon({
  iconUrl: markerResearch,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const administrationIcon = L.icon({
  iconUrl: markerAdministration,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const sportsIcon = L.icon({
  iconUrl: markerSports,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

const schoolIcon = L.icon({
  iconUrl: markerSchool,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  className: "custom-marker",
});

function getIcon(type: Building["type"]) {
  switch (type) {
    case "faculty":
      return facultyIcon;

    case "library":
      return libraryIcon;

    case "dorm":
      return houseIcon;

    case "research":
      return researchIcon;

    case "administration":
      return administrationIcon;

    case "sports":
      return sportsIcon;

    case "school":
      return schoolIcon;

    default:
      return facultyIcon;
  }
}

const position: [number, number] = [
  54.89822660028058,
  23.932811862054045,
];

const categories: Building["type"][] = [
  "faculty",
  "library",
  "dorm",
  "research",
  "administration",
  "sports",
  "school",
];

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

export default function Map({ onSelectBuilding }: MapProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<Building["type"] | "all">("all");

  const filteredBuildings =
    selectedCategory === "all"
      ? buildings
      : buildings.filter(
          (building) => building.type === selectedCategory
        );

  return (
    <>
      <div className="map-filter-bar">
        <button
          className="map-filter-btn"
          onClick={() => setSelectedCategory("all")}
        >
          Visi
        </button>

        {categories.map((category) => (
          <button
            key={category}
            className="map-filter-btn"
            onClick={() => setSelectedCategory(category)}
          >
            {category === "faculty" && "Fakultetai"}
            {category === "library" && "Bibliotekos"}
            {category === "dorm" && "Bendrabučiai"}
            {category === "research" && "Tyrimai"}
            {category === "administration" && "Administracija"}
            {category === "sports" && "Sportas"}
            {category === "school" && "Mokykla"}
          </button>
        ))}
      </div>

      <MapContainer
        key={selectedCategory}
        center={position}
        zoom={13}
        zoomControl={false}
        style={{
          height: "500px",
          width: "100%",
          zIndex: 1,
        }}
      >
        <DisableMapInteractions />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredBuildings.map((building) => (
          <Marker
            key={building.id}
            position={building.position}
            icon={getIcon(building.type)}
            eventHandlers={{
              click: () => onSelectBuilding(building),
            }}
          />
        ))}
      </MapContainer>
    </>
  );
}