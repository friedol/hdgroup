import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BranchSmsConfigForm from "@/components/BranchSmsConfigForm";

interface SmsSettingsProps {
  branches: any[];
}

export default function SmsSettings({ branches }: SmsSettingsProps) {
  const [selectedSmsConfigBranch, setSelectedSmsConfigBranch] = useState<number | null>(
    branches.length > 0 ? branches[0].id : null
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-none mb-6">
        <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <div>
              <CardTitle className="text-sm font-semibold">SMS Gateway Configuration</CardTitle>
              <CardDescription className="text-xs">Manage SMS configuration for each branch independently</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="branch-select" className="text-xs font-bold text-slate-500 uppercase">
              Select Branch
            </Label>
            <Select 
              value={String(selectedSmsConfigBranch)} 
              onValueChange={(val) => setSelectedSmsConfigBranch(parseInt(val))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.system_name || branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSmsConfigBranch && (
        <BranchSmsConfigForm 
          branchId={selectedSmsConfigBranch}
          branchName={branches.find(b => b.id === selectedSmsConfigBranch)?.system_name || branches.find(b => b.id === selectedSmsConfigBranch)?.name || ''}
          onSuccess={() => {
            // Optionally refresh or show success message
          }}
        />
      )}
    </div>
  );
}
