import { useLocale } from "../../../i18n/LocaleContext";

export default function Footer() {
  const { t } = useLocale();
  return (
    <div className="cluster" style={{ justifyContent: "space-between" }}>
      <small>
        © {new Date().getFullYear()} {t("footer.appName")}
      </small>
      <span className="pill">v1.0</span>
    </div>
  );
}