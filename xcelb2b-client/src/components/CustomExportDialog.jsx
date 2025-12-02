import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

const EXPORT_FIELDS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "subject", label: "Subject" },
  { id: "message", label: "Message" },
  { id: "type", label: "Status" },
  { id: "created_at", label: "Created At" },
  { id: "updated_at", label: "Updated At" },
  { id: "comments", label: "Comments" },
];

const MIN_EXPORT_LIMIT = 5;

export function CustomExportDialog({ isOpen, onClose, leads }) {
  const [selectedFields, setSelectedFields] = useState([]);
  const [exportLimit, setExportLimit] = useState("all");
  const [customLimit, setCustomLimit] = useState(MIN_EXPORT_LIMIT.toString());
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (
      exportLimit === "custom" &&
      parseInt(customLimit, 10) < MIN_EXPORT_LIMIT
    ) {
      setErrorMessage(
        `Please enter a number greater than or equal to ${MIN_EXPORT_LIMIT}`
      );
    } else {
      setErrorMessage("");
    }
  }, [exportLimit, customLimit]);

  const handleFieldToggle = (fieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to export.");
      return;
    }

    const limitedLeads =
      exportLimit === "all"
        ? leads
        : leads.slice(0, Math.max(parseInt(customLimit, 10), MIN_EXPORT_LIMIT));

    const excelData = limitedLeads.map((lead) =>
      selectedFields.reduce((acc, field) => {
        if (field === "created_at" || field === "updated_at") {
          acc[EXPORT_FIELDS.find((f) => f.id === field).label] = new Date(
            lead[field]
          ).toLocaleDateString();
        } else if (field === "comments") {
          acc[EXPORT_FIELDS.find((f) => f.id === field).label] = lead.comments
            .map(
              (comment) =>
                `${comment.name}: ${comment.message} (${new Date(
                  comment.created_at
                ).toLocaleString()})`
            )
            .join("\n");
        } else {
          acc[EXPORT_FIELDS.find((f) => f.id === field).label] =
            lead[field] || "N/A";
        }
        return acc;
      }, {})
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "leads_export.xlsx");

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Export Leads
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-900">
              Select fields to export:
            </h3>
            <ScrollArea className="h-[260px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {EXPORT_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => handleFieldToggle(field.id)}
                    />
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-900">
              Export limit:
            </h3>
            <RadioGroup
              value={exportLimit}
              onValueChange={setExportLimit}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All leads ({leads.length})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom number</Label>
              </div>
            </RadioGroup>
            {exportLimit === "custom" && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder={`Enter number of leads (min ${MIN_EXPORT_LIMIT})`}
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  className="w-full"
                  min={MIN_EXPORT_LIMIT}
                />
                {errorMessage && (
                  <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              selectedFields.length === 0 ||
              (exportLimit === "custom" &&
                (!customLimit || parseInt(customLimit, 10) < MIN_EXPORT_LIMIT))
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
