"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { SetupAgreementSheet } from "@/components/global/agreement-sheet/setup-agreement-sheet";

const PDFPreviewer = dynamic(
  () => import("@/components/global/pdf-previewer"),
  { ssr: false }
);

// We need to pass a different PDF component to the previewer
// Since PDFPreviewer is hardcoded to use MagicScaleAgreementPDF currently, 
// I should probably update PDFPreviewer to accept the PDF component as a prop
// OR create a specialized SetupPDFPreviewer.
// Let's check PDFPreviewer again.

const COMPANY = {
  name: "Magicscale Restaurant Consultancy Services",
  logo: "/assets/logo.png",
  address: "Near Air Force Camp, Rajokari, 110038",
  phone: "+91 8826073117",
  website: "https://magicscale.in",
  representative: "Akash Verma",
  designation: "Sales Manager",
  signature: "/assets/signature.png",
};

const INITIAL_STATE = {
  client: {
    name: "__________",
    address: "_____________________",
    representative: "_______________",
  },
  agreement: {
    date: new Date(),
    fee: 8499,
  },
};

export default function SetupAgreementPage() {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const handleAgreementSubmit = (data) => {
    setFormData(data);
  };

  const formattedAgreement = useMemo(() => ({
    ...formData.agreement,
    date: format(formData.agreement.date, "dd MMM yyyy").toUpperCase(),
  }), [formData.agreement]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="flex w-full max-w-6xl justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
          Setup Agreement Preview
        </h1>

        <SetupAgreementSheet
          initialClient={formData.client}
          initialAgreement={formData.agreement}
          onSubmit={handleAgreementSubmit}
        />
      </div>

      <div className="w-full max-w-6xl h-[85vh] border border-zinc-300 dark:border-zinc-800 rounded-lg overflow-hidden shadow-lg">
        {/* We need to tell PDFPreviewer to use SetupAgreementPDF */}
        <PDFPreviewer
          type="setup"
          company={COMPANY}
          client={formData.client}
          agreement={formattedAgreement}
        />
      </div>
    </div>
  );
}
