"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { clientFields } from "@/constants/agreement";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function DateSelector({ label, date, onChange }) {
  return (
    <div className="flex flex-col space-y-1.5">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Calendar mode="single" selected={date} onSelect={(d) => d && onChange(d)} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ClientFieldsSection({ client, setClient }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Client Information</h3>
      <div className="space-y-4">
        {clientFields.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={client[key]}
              placeholder={placeholder}
              onChange={(e) =>
                setClient({
                  ...client,
                  [key]: e.target.value,
                })
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SetupAgreementSheet({ initialClient, initialAgreement, onSubmit }) {
  const [open, setOpen] = React.useState(false);

  const [client, setClient] = React.useState(initialClient);
  const [agreement, setAgreement] = React.useState(initialAgreement);

  React.useEffect(() => {
    if (open) {
      setClient(initialClient);
      setAgreement(initialAgreement);
    }
  }, [open, initialClient, initialAgreement]);

  const handleSave = () => {
    onSubmit?.({ client, agreement });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-[#1b1cfe] hover:bg-[#1516d9] text-white">Edit Setup Details</Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full px-4 pb-20">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Setup Details</SheetTitle>
          <SheetDescription>Configure the client and service details below.</SheetDescription>
        </SheetHeader>

        <Separator className="mb-5" />

        <div className="flex-1 overflow-y-auto pr-1 space-y-8">
          <ClientFieldsSection client={client} setClient={setClient} />

          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Service Details</h3>
            
            <div className="space-y-4">
              <DateSelector label="Agreement Date" date={agreement.date} onChange={(date) => setAgreement({ ...agreement, date })} />

              <div className="flex flex-col space-y-1.5">
                <Label>Service Fee (₹)</Label>
                <Input 
                  type="number" 
                  value={agreement.fee} 
                  onChange={(e) => setAgreement({ ...agreement, fee: Number(e.target.value) })} 
                />
              </div>
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t bg-background px-4 py-3 flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-1/2">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-1/2 bg-[#1b1cfe] hover:bg-[#1516d9] text-white">
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
