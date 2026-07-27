import { getAmount } from "@/constants/agreement";

export function generateSetupAgreementHtml(company, client, agreement) {
  return `
    <h3>Zomato & Swiggy Growth Service Package Agreement</h3>
    <p>This Setup Agreement is made and entered into between <span style="color: #1b1cfe; font-weight: bold;">${company.name}</span>, a Proprietorship hereinafter referred to as <strong>“Consultant”</strong>, and <span style="color: #1b1cfe; font-weight: bold;">${(client.name || "").toUpperCase()}</span>, a Proprietorship hereinafter referred to as <strong>“Client”</strong>, represented by <strong>${client.representative}</strong>.</p>

    <h3>1. Scope of Services</h3>
    <p>The <strong>Consultant</strong> shall provide a comprehensive <span style="color: #1b1cfe; font-weight: bold;">Zomato & Swiggy Growth Service Package</span> which includes the following professional services:</p>

    <p><strong>1.1 Onboarding Support:</strong></p>
    <ul>
      <li>Assistance with Zomato Onboarding (Fee: ₹1299 paid by Client to Zomato).</li>
      <li>Assistance with Swiggy Onboarding (Fee: ₹943 paid by Client to Swiggy).</li>
    </ul>

    <p><strong>1.2 Account Setup & Profile Creation:</strong></p>
    <ul>
      <li>Complete restaurant profile setup, verification, and listing activation.</li>
    </ul>

    <p><strong>1.3 Menu Setup & Optimization:</strong></p>
    <ul>
      <li>Full menu creation with optimized pricing, categories, and layout management.</li>
    </ul>

    <p><strong>1.4 Product Enhancement:</strong></p>
    <ul>
      <li>Food photo management, attractive descriptions, and add-ons/combo creation.</li>
    </ul>

    <p><strong>1.5 Platform Training & Guidance:</strong></p>
    <ul>
      <li>Comprehensive training on dashboard usage and daily order operations.</li>
    </ul>

    <p><strong>1.6 1-Month Handling Support:</strong></p>
    <ul>
      <li>Strategic discount setup, ads campaign management, and rating improvement support.</li>
    </ul>

    <h3>2. Fees and Payment Terms</h3>
    <p>The Client agrees to pay the Consultant a <span style="color: #1b1cfe; font-weight: bold;">total service charge of ${getAmount(agreement.fee || 8499)}</span> for the setup package.</p>
    <ul>
      <li>Platform onboarding fees are paid directly to Zomato/Swiggy by the Client.</li>
      <li>Full payment for the service package is due upon signing of this Agreement.</li>
    </ul>

    <h3>3. Client Responsibilities</h3>
    <ul>
      <li>Provide all necessary documents and access for platform onboarding.</li>
      <li>Maintain consistent food quality and service standards.</li>
      <li>Timely payment of platform fees and service charges.</li>
    </ul>

    <h3>4. Confidentiality</h3>
    <p>Both parties agree to keep <strong>confidential</strong> all <span style="color: #1b1cfe; font-weight: bold;">information, data, and trade secrets</span> shared during the term of this <strong>Agreement</strong>.</p>

    <h3>5. Limitation of Liability</h3>
    <p>The <strong>Consultant</strong> shall not be liable for any <span style="color: #1b1cfe; font-weight: bold;">indirect, incidental, or consequential damages</span> arising from the services provided. Liability is limited to the <span style="color: #1b1cfe; font-weight: bold;">total amount paid</span> under this Agreement.</p>

    <h3>6. Intellectual Property</h3>
    <p>All <span style="color: #1b1cfe; font-weight: bold;">strategic recommendations and materials</span> prepared by the Consultant remain their <strong>intellectual property</strong> unless otherwise agreed in writing.</p>

    <h3>7. Entire Agreement</h3>
    <p>This <strong>Agreement</strong> constitutes the <span style="color: #1b1cfe; font-weight: bold;">entire understanding</span> between the parties and <strong>supersedes</strong> all prior discussions or agreements.</p>
  `;
}
