import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  FileCog,
  FileType,
  Braces,
  Hash,
  Database,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconSpec = { Icon: typeof FileText; className: string };

export function fileIcon(name: string): IconSpec {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ts":
    case "tsx":
      return { Icon: FileCode, className: "text-sky-400" };
    case "js":
    case "jsx":
    case "mjs":
      return { Icon: FileCode, className: "text-yellow-400" };
    case "py":
      return { Icon: FileCode, className: "text-emerald-400" };
    case "json":
      return { Icon: FileJson, className: "text-amber-400" };
    case "css":
      return { Icon: Hash, className: "text-blue-400" };
    case "md":
      return { Icon: FileText, className: "text-muted-foreground" };
    case "yaml":
    case "yml":
      return { Icon: FileCog, className: "text-rose-400" };
    case "tf":
    case "hcl":
      return { Icon: Braces, className: "text-violet-400" };
    case "parquet":
    case "db":
    case "sqlite":
      return { Icon: Database, className: "text-orange-400" };
    case "png":
    case "jpg":
    case "svg":
      return { Icon: ImageIcon, className: "text-pink-400" };
    case "gitignore":
    case "lock":
      return { Icon: FileType, className: "text-muted-foreground" };
    default:
      return { Icon: FileText, className: "text-muted-foreground" };
  }
}

export function FileIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { Icon, className: color } = fileIcon(name);
  return <Icon className={cn("size-4 shrink-0", color, className)} />;
}

export function FolderIcon({
  open = false,
  className,
}: {
  open?: boolean;
  className?: string;
}) {
  const Icon = open ? FolderOpen : Folder;
  return (
    <Icon
      className={cn("size-4 shrink-0 fill-sky-500/20 text-sky-500", className)}
    />
  );
}
