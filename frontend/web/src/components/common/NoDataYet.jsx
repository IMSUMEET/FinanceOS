import { Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

function NoDataYet({
  title = "No data yet",
  description = "Import bank statements to see spending here. Parsed data is stored on this device only — nothing is sent to our servers.",
}) {
  return (
    <EmptyState
      icon={UploadCloud}
      title={title}
      description={description}
      action={
        <Link to="/upload">
          <Button variant="primary" icon={UploadCloud}>
            Import statements
          </Button>
        </Link>
      }
    />
  );
}

export default NoDataYet;
