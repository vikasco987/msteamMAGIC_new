import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const PaymentRedirect = () => {
  const { shortId } = useParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveLink = async () => {
      try {
        // 🔥 UPDATED: Calling the correct CRM Domain
        const response = await fetch(`https://team.magicscale.in/api/cashfree/redirect-handler?shortId=${shortId}`);
        const data = await response.json();

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          setError(data.message || "Link not found or expired.");
        }
      } catch (err) {
        console.error("Redirect failed:", err);
        setError("Failed to resolve payment link.");
      }
    };

    if (shortId) {
      resolveLink();
    }
  }, [shortId]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#fff1f2', color: '#e11d48', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: '900' }}>
            !
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Invalid Link</h1>
          <p style={{ color: '#64748b', fontWeight: '700', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '80px', height: '80px', border: '4px solid #e0e7ff', borderRadius: '50%' }} />
        <div style={{ width: '80px', height: '80px', borderTop: '4px solid #4f46e5', borderRadius: '50%', position: 'absolute', top: 0, animation: 'spin 1s linear infinite' }} />
      </div>
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>Securing Connection...</h2>
        <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '8px' }}>Redirecting to Cashfree Node</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentRedirect;
