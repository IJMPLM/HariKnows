import CsvUploadHistoryPanel from "../../components/CsvUploadHistoryPanel";

export default function Page() {
  return (
    <CsvUploadHistoryPanel
      title="College of Technology"
      subtitle="Upload placeholders were removed. This tab now shows actual CSV upload history from the registrar ETL pipeline."
      categoryFilter={["students", "grades", "curriculums", "syllabi", "thesis"]}
      collegeCodeFilter={["CT"]}
      programCodeFilter={["BSCS", "BSIT"]}
    />
  );
}
