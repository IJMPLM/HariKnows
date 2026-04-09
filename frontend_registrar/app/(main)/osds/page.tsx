import CsvUploadHistoryPanel from "../../components/CsvUploadHistoryPanel";

export default function Page() {
  return (
    <CsvUploadHistoryPanel
      title="Office of Student Discipline"
      subtitle="Upload placeholders were removed. This tab now shows actual CSV upload history from the registrar ETL pipeline."
      categoryFilter={["discipline"]}
    />
  );
}
