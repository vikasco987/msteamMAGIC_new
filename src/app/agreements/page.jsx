"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { AgreementSheet } from "@/components/global/agreement-sheet";
import { formatDate } from "@/lib/agreement-utils";

const PDFPreviewer = dynamic(
  () => import("@/components/global/pdf-previewer"),
  { ssr: false }
);

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
    start: new Date(new Date().setDate(new Date().getDate() + 3)),
    end: new Date(
      new Date(new Date().setDate(new Date().getDate() + 3)).setMonth(
        new Date().getMonth() + 1
      )
    ),
    targetLowerBound: 60000,
    targetUpperBound: 80000,
    isFixedTarget: false,
    duration: "1",
    services: "zomato",
    fee: 7000,
  },
  payment: {
    term: "partial",
    firstHalf: "50",
    secondHalf: "50",
    secondHalfDueDate: new Date(),
  },
};

export default function AgreementPreviewPage() {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const handleAgreementSubmit = (data) => {
    setFormData(data);
  };

  const formattedAgreement = useMemo(() => ({
    ...formData.agreement,
    date: format(formData.agreement.date, "dd MMM yyyy").toUpperCase(),
    start: formatDate(formData.agreement.start),
    end: formatDate(formData.agreement.end),
  }), [formData.agreement]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      {/* Header Section */}
      <div className="flex w-full max-w-6xl justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
          Account Handling Agreement Preview
        </h1>

        <AgreementSheet
          initialClient={formData.client}
          initialAgreement={formData.agreement}
          initialPayment={formData.payment}
          onSubmit={handleAgreementSubmit}
        />
      </div>

      <div className="w-full max-w-6xl h-[85vh] border border-zinc-300 dark:border-zinc-800 rounded-lg overflow-hidden shadow-lg">
        <PDFPreviewer
          company={COMPANY}
          client={formData.client}
          agreement={formattedAgreement}
          payment={formData.payment}
        />
      </div>
    </div>
  );
}
