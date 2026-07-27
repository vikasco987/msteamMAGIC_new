"use client";

import * as React from "react";
import MagicScaleAgreementPDF from "@/components/document";
import SetupAgreementPDF from "@/components/document/setup-agreement";

// Simple error boundary to prevent PDF rendering errors from crashing the app
class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PDF Rendering Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 p-4 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Unable to render PDF preview</p>
          <p className="text-red-500 dark:text-red-500/80 text-xs mt-1">This usually happens due to invalid data. Try adjusting the agreement details.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Retry Preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function PDFPreviewer({ type = "standard", company, client, agreement, payment }) {
  const [isClient, setIsClient] = React.useState(false);
  const [Viewer, setViewer] = React.useState(null);

  React.useEffect(() => {
    setIsClient(true);
    // Dynamically load PDFViewer only on the client
    import("@react-pdf/renderer").then((mod) => {
      setViewer(() => mod.PDFViewer);
    });
  }, []);

  if (!isClient || !Viewer) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 animate-pulse">
        <p className="text-muted-foreground text-sm">Loading Preview...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <PDFErrorBoundary key={JSON.stringify({ type, payment, agreement: { isFixedTarget: agreement?.isFixedTarget, fee: agreement?.fee } })}>
        <Viewer width="100%" height="100%" style={{ border: "none" }}>
          {type === "setup" ? (
            <SetupAgreementPDF 
              company={company} 
              client={client} 
              agreement={agreement} 
            />
          ) : (
            <MagicScaleAgreementPDF 
              company={company} 
              client={client} 
              agreement={agreement} 
              payment={payment} 
            />
          )}
        </Viewer>
      </PDFErrorBoundary>
    </div>
  );
}
