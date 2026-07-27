import { getAmount, getDurationLabel } from "@/constants/agreement";

export function generateAgreementHtml(company, client, agreement, payment) {
  const durationLabel = getDurationLabel(agreement.duration);
  const targetText = agreement.isFixedTarget 
    ? ` of ${getAmount(agreement.targetLowerBound)} to ${getAmount(agreement.targetUpperBound)}` 
    : "";

  let paymentHtml = "";
  if (payment?.term === "partial") {
    paymentHtml = `
      <ul>
        <li><span style="color: #1b1cfe; font-weight: bold;">${payment.firstHalf || "0"}%</span> advance payment upon signing of this <strong>Agreement</strong>.</li>
        <li><span style="color: #1b1cfe; font-weight: bold;">${payment.secondHalf || "0"}%</span> upon completion of the service term or achievement of the <strong>growth target</strong>.</li>
        <li><strong>Note:</strong> If the customer <strong>fails to meet payment</strong> for the second half, the <span style="color: #1b1cfe; font-weight: bold;">service may be put on hold</span> until the client completes the payment.</li>
      </ul>
    `;
  } else {
    paymentHtml = `
      <ul>
        <li><strong>Note:</strong> The full advance amount will be collected by the <strong>Consultant</strong> at the time of accepting the agreement by client.</li>
      </ul>
    `;
  }

  return `
    <p>This Agreement is made and entered into on this between <span style="color: #1b1cfe; font-weight: bold;">${agreement.start} – ${agreement.end}</span></p>
    <p><span style="color: #1b1cfe; font-weight: bold;">${company.name}</span>, a Proprietorship having its registered office at <strong>${company.address}</strong> hereinafter referred to as <strong>“Consultant”</strong>, represented by ${company.representative} as ${company.designation}.</p>
    <p style="margin-top: 10px;">AND</p>
    <p><span style="color: #1b1cfe; font-weight: bold;">${(client.name || "").toUpperCase()}</span>, a Proprietorship having its <strong>${client.address}</strong> hereinafter referred to as <strong>“Client”</strong>, represented by <strong>${client.representative}</strong>.</p>
    
    <h3>WHEREAS:</h3>
    <ul>
      <li>The Client operates a restaurant known as ${client.name}.</li>
      <li>The Client desires to improve its business performance and has engaged the Consultant to provide consulting services.</li>
      <li>The Consultant has agreed to provide such services on the terms and conditions set forth herein.</li>
    </ul>

    <p>NOW, Therefore, in consideration of the mutual covenants and promises contained herein, the parties agree as follows:</p>

    <h3>1. Scope of Services</h3>
    <p>The <strong>Consultant</strong> shall provide professional <span style="color: #1b1cfe; font-weight: bold;">consultancy and management services</span> to improve the <strong>Client’s business performance</strong>, including but not limited to:</p>
    <ul>
      <li>Restaurant onboarding and account setup on Zomato and Swiggy.</li>
      <li>Menu analysis, optimization, and pricing strategy.</li>
      <li>Marketing and promotional strategy implementation.</li>
      <li>Weekly performance tracking and reporting.</li>
    </ul>
    <p>The Consultant’s services aim to achieve a <span style="color: #1b1cfe; font-weight: bold;">${durationLabel} sales growth${targetText}</span>, compared to the previous month’s performance.</p>
    <p><strong>Note :- </strong><span style="color: red; font-weight: bold;">If the food quality or a rating above 3.8 is not maintained by the client, then we are not responsible for achieving the target.</span></p>

    <h3>2. Term and Termination</h3>
    <p>This Agreement shall be valid for a period of <span style="color: #1b1cfe; font-weight: bold;">${agreement.duration} ${agreement.duration === "1" ? "month" : "months"}</span>, commencing on <span style="color: #1b1cfe; font-weight: bold;">${agreement.start}</span> and expiring on <span style="color: #1b1cfe; font-weight: bold;">${agreement.end}</span>.</p>
    <p>Either party may terminate this Agreement with <span style="color: #1b1cfe; font-weight: bold;">15 days’ written notice</span>. If the growth target is not achieved, Consultant may extend the service period at no additional cost.</p>

    <h3>3. Fees and Payment Terms</h3>
    <p>The Client agrees to pay the Consultant a <span style="color: #1b1cfe; font-weight: bold;">total service fee of ${getAmount(agreement.fee)}.</span></p>
    <p>A <span style="color: #1b1cfe; font-weight: bold;">weekly</span> advertising budget of <span style="color: #1b1cfe; font-weight: bold;">₹1500</span> for Zomato promotions will be borne by the client.</p>
    <p><strong>Payment Terms:</strong></p>
    ${paymentHtml}
    <ul>
      <li>All payments shall be made via <span style="color: #1b1cfe; font-weight: bold;">bank transfer or UPI</span> to the <strong>Consultant’s designated account</strong>.</li>
    </ul>

    <h3>4. Responsibilities of the Parties</h3>
    <p><strong>Consultant Responsibilities:</strong></p>
    <ul>
      <li>Provide <span style="color: #1b1cfe; font-weight: bold;">consultancy and management services</span> professionally and efficiently.</li>
      <li>Maintain <strong>confidentiality</strong> and provide <span style="color: #1b1cfe; font-weight: bold;">regular performance updates</span>.</li>
      <li>Ensure <span style="color: #1b1cfe; font-weight: bold;">transparent communication</span> and <strong>strategy alignment</strong>.</li>
    </ul>
    <p><strong>Client Responsibilities:</strong></p>
    <ul>
      <li>Provide necessary access to <span style="color: #1b1cfe; font-weight: bold;">Zomato</span>/ <span style="color: #1b1cfe; font-weight: bold;">Swiggy</span> accounts, sales data, and required information.</li>
      <li>Maintain consistent <strong>food quality</strong> and <span style="color: #1b1cfe; font-weight: bold;">customer service</span>.</li>
      <li>Make <span style="color: #1b1cfe; font-weight: bold;">timely payments</span> as agreed.</li>
    </ul>

    <h3>5. Confidentiality</h3>
    <p>Both parties agree to keep <strong>confidential</strong> all <span style="color: #1b1cfe; font-weight: bold;">information, data, and trade secrets</span> shared during the term of this <strong>Agreement</strong>.</p>

    <h3>6. Limitation of Liability</h3>
    <p>The <strong>Consultant</strong> shall not be liable for any <span style="color: #1b1cfe; font-weight: bold;">indirect, incidental, or consequential damages</span> arising from the services provided.</p>
    <p><strong>Liability</strong>, if any, shall be limited to the <span style="color: #1b1cfe; font-weight: bold;">total amount paid</span> under this <strong>Agreement</strong>.</p>

    <h3>7. Intellectual Property</h3>
    <p>All <span style="color: #1b1cfe; font-weight: bold;">reports, marketing materials, and strategic recommendations</span> prepared by the <strong>Consultant</strong> shall remain the <strong>Consultant’s intellectual property</strong> unless otherwise agreed in <span style="color: #1b1cfe; font-weight: bold;">writing</span>.</p>

    <h3>8. Entire Agreement</h3>
    <p>This <strong>Agreement</strong> constitutes the <span style="color: #1b1cfe; font-weight: bold;">entire understanding</span> between the parties and <strong>supersedes</strong> all prior <span style="color: #1b1cfe; font-weight: bold;">discussions, negotiations, or agreements</span>, whether written or oral.</p>
  `;
}
