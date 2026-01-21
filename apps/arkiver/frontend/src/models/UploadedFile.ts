export interface UploadedFile {
  id: string;
  name: string;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string;
