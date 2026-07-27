"use client";

import * as React from "react";
import { format, addMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { clientFields, durationOptions, serviceOptions, paymentTerms } from "@/constants/agreement";
import { Switch } from "@/components/ui/switch";

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

function SelectField({ label, value, onValueChange, options, className }) {
  return (
    <div className={cn("mt-6 flex flex-col space-y-1.5", className)}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AgreementSheet({ initialClient, initialAgreement, initialPayment, onSubmit }) {
  const [open, setOpen] = React.useState(false);

  const defaultClient = {
    name: "Yadav Hotel",
    address: "A-11 NILOTHI MOR SHIVRAM PARK NANGLI NAJAFGARH NEW DELHI 110041, NAJAFGARH, South West, Delhi-110041",
    representative: "Shri Chand Yadav",
  };

  const defaultAgreement = {
    date: new Date(),
    start: new Date(),
    end: addMonths(new Date(), 1),
    isFixedTarget: false,
    targetLowerBound: 40000,
    targetUpperBound: 50000,
    duration: "1",
    services: "both",
    fee: 7000,
  };

  const defaultPayment = {
    term: "advance",
    firstHalf: "50",
    secondHalf: "50",
    secondHalfDueDate: new Date(),
  };

  const [client, setClient] = React.useState(initialClient || defaultClient);
  const [agreement, setAgreement] = React.useState(initialAgreement || defaultAgreement);
  const [payment, setPayment] = React.useState(initialPayment || defaultPayment);

  // Sync state when sheet opens or initial props change
  React.useEffect(() => {
    if (open) {
      setClient(initialClient || defaultClient);
      setAgreement(initialAgreement || defaultAgreement);
      setPayment(initialPayment || defaultPayment);
    }
  }, [open, initialClient, initialAgreement, initialPayment]);

  const extendEndDate = (months) => setAgreement({ ...agreement, end: addMonths(agreement.start, months) });

  const handleSave = () => {
    if (payment.term === "partial" && Number(payment.firstHalf) + Number(payment.secondHalf) !== 100) {
      alert("Partial payments must total 100%");
      return;
    }

    onSubmit?.({ client, agreement, payment });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-[#1b1cfe] hover:bg-[#1516d9] text-white">Edit Agreement Details</Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full px-4 pb-20">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agreement Details</SheetTitle>
          <SheetDescription>Configure the client and agreement duration below.</SheetDescription>
        </SheetHeader>

        <Separator className="mb-5" />

        <div className="flex-1 overflow-y-auto pr-1 space-y-8">
          {/* Client Section */}
          <ClientFieldsSection client={client} setClient={setClient} />

          {/* Agreement Section */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Agreement Details</h3>

            <DateSelector label="Agreement Date" date={agreement.date} onChange={(date) => setAgreement({ ...agreement, date })} />

            {/* Fee Field */}
            <div className="mt-4 flex flex-col space-y-1.5">
              <Label>Fee (₹)</Label>
              <Input type="number" value={agreement.fee} placeholder="Enter fee amount" onChange={(e) => setAgreement({ ...agreement, fee: Number(e.target.value) })} />
            </div>

            {/* Duration Range */}
            <div className="mt-4 flex flex-col space-y-1.5">
              <Label>Duration Range</Label>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <DateSelector date={agreement.start} onChange={(date) => setAgreement({ ...agreement, start: date })} />

                <span className="text-sm text-muted-foreground mt-2">End Date</span>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {[1, 2, 3].map((m) => (
                    <Button key={m} variant="secondary" className="flex-1" onClick={() => extendEndDate(m)}>
                      +{m} Month{m > 1 && "s"}
                    </Button>
                  ))}
                  <DateSelector date={agreement.end} onChange={(date) => setAgreement({ ...agreement, end: date })} />
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Current end date: <span className="font-medium text-foreground">{format(agreement.end, "PPP")}</span>
                </p>
              </div>
            </div>

            {/* Target Range Toggle */}
            <div className="mt-6 flex items-center justify-between">
              <Label htmlFor="fixed-target" className="text-sm font-medium">Fixed Target Range</Label>
              <Switch
                id="fixed-target"
                checked={agreement.isFixedTarget}
                onCheckedChange={(checked) => setAgreement({ ...agreement, isFixedTarget: checked })}
              />
            </div>

            {/* Target Range */}
            {agreement.isFixedTarget && (
              <div className="mt-4 flex flex-col space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label>Target Range (₹)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={agreement.targetLowerBound}
                    placeholder="Lower bound"
                    onChange={(e) =>
                      setAgreement({
                        ...agreement,
                        targetLowerBound: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    type="number"
                    value={agreement.targetUpperBound}
                    placeholder="Upper bound"
                    onChange={(e) =>
                      setAgreement({
                        ...agreement,
                        targetUpperBound: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <SelectField label="Duration Label" value={agreement.duration} onValueChange={(value) => setAgreement({ ...agreement, duration: value })} options={durationOptions} className="sm:w-1/2" />
              <SelectField label="Services" value={agreement.services} onValueChange={(value) => setAgreement({ ...agreement, services: value })} options={serviceOptions} className="sm:w-1/2" />
            </div>

            {/* Payment Terms */}
            <SelectField
              label="Payment Terms"
              value={payment.term}
              onValueChange={(value) => setPayment({ ...payment, term: value })}
              options={paymentTerms}
            />

            {payment.term === "partial" && (
              <div className="space-y-4">
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label>First Half (%)</Label>
                    <Input type="number" value={payment.firstHalf} placeholder="e.g. 50" onChange={(e) => setPayment({ ...payment, firstHalf: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <Label>Second Half (%)</Label>
                    <Input type="number" value={payment.secondHalf} placeholder="e.g. 50" onChange={(e) => setPayment({ ...payment, secondHalf: e.target.value })} />
                  </div>
                </div>
                <DateSelector
                  label="Second Half Due Date"
                  date={payment.secondHalfDueDate}
                  onChange={(date) => setPayment({ ...payment, secondHalfDueDate: date })}
                />
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed italic">
                  <span className="font-bold text-foreground not-italic underline">Note:</span> If the customer <span className="font-bold text-foreground not-italic">fails to meet payment</span> for the second half, the <span className="font-bold text-[#1b1cfe] not-italic">service may be put on hold</span> until the client completes the payment.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
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
