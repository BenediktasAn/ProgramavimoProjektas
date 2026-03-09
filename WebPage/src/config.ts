export const EXTERNAL_LINKS = {
  ais: import.meta.env.VITE_AIS_URL ?? "https://ais.ktu.edu",
  moodle: import.meta.env.VITE_MOODLE_URL ?? "https://moodle.ktu.edu",
} as const;

