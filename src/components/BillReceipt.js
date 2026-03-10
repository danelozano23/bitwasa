// src/components/BillReceipt.js
import React from "react";

// Half A4 = 210mm × 148mm (landscape) or 105mm × 148mm (portrait half)
// We use 148mm × 105mm portrait half-A4 slip

const BillReceipt = ({ bill, consumer, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const dueDate = bill?.dueDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 20);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  })();

  const issueDate = bill?.issueDate || new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric"
  });

  const prevReading = bill?.prevReading ?? 0;
  const currReading = bill?.reading ?? 0;
  const consumption = currReading - prevReading;

  const basicCharge = 50.00;
  const ratePerCubic = 18.00;
  const systemLoss = (consumption * ratePerCubic * 0.03);
  const environmentalFee = 10.00;
  const subtotal = basicCharge + (consumption * ratePerCubic) + systemLoss + environmentalFee;
  const arrears = bill?.arrears ?? 0;
  const total = subtotal + arrears;
  const penaltyRate = 0.10;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bitwasa-receipt, #bitwasa-receipt * { visibility: visible !important; }
          #bitwasa-receipt {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 148mm !important;
            min-height: 105mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          .no-print { display: none !important; }
        }

        #bitwasa-receipt {
          width: 148mm;
          min-height: 105mm;
          background: #fff;
          font-family: 'Arial Narrow', Arial, sans-serif;
          font-size: 7.5pt;
          color: #111;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .receipt-header {
          background: linear-gradient(135deg, #003d7a 0%, #005bbf 100%);
          color: #fff;
          padding: 6px 10px 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .receipt-logo {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .receipt-org h1 {
          margin: 0;
          font-size: 10pt;
          font-weight: 900;
          letter-spacing: 0.5px;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .receipt-org p {
          margin: 0;
          font-size: 6.5pt;
          opacity: 0.85;
          line-height: 1.3;
        }
        .receipt-bill-label {
          margin-left: auto;
          text-align: right;
        }
        .receipt-bill-label .bill-title {
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.9;
        }
        .receipt-bill-label .bill-no {
          font-size: 10pt;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .receipt-body {
          padding: 6px 10px;
        }

        .consumer-row {
          display: flex;
          gap: 6px;
          margin-bottom: 5px;
          border-bottom: 1.5px solid #003d7a;
          padding-bottom: 5px;
        }

        .consumer-left { flex: 1; }
        .consumer-right { text-align: right; }

        .field-label {
          font-size: 6pt;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1px;
        }
        .field-value {
          font-size: 8pt;
          font-weight: 700;
          color: #003d7a;
          line-height: 1.2;
        }
        .field-value-sm {
          font-size: 7.5pt;
          font-weight: 600;
          color: #111;
        }

        .readings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 5px;
          background: #f0f6ff;
          border: 1px solid #cce0ff;
          border-radius: 3px;
          padding: 4px 6px;
        }
        .reading-cell .field-label { color: #0050a0; }
        .reading-cell .field-value { color: #003d7a; font-size: 9pt; }

        .charges-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        .charges-table td {
          font-size: 7pt;
          padding: 1.5px 2px;
          line-height: 1.3;
        }
        .charges-table .charge-label { color: #333; }
        .charges-table .charge-amount {
          text-align: right;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
        }
        .charges-table .subtotal-row td {
          border-top: 1px dashed #999;
          padding-top: 3px;
          font-weight: 700;
        }
        .charges-table .total-row td {
          border-top: 2px solid #003d7a;
          padding-top: 3px;
          font-size: 9pt;
          font-weight: 900;
          color: #003d7a;
        }

        .due-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #003d7a;
          color: #fff;
          border-radius: 3px;
          padding: 4px 8px;
          margin-bottom: 5px;
        }
        .due-section .due-label {
          font-size: 6.5pt;
          opacity: 0.85;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .due-section .due-amount {
          font-size: 13pt;
          font-weight: 900;
          letter-spacing: -0.5px;
        }
        .due-section .due-date-info {
          text-align: right;
        }
        .due-section .due-date-label {
          font-size: 6pt;
          opacity: 0.7;
          display: block;
        }
        .due-section .due-date {
          font-size: 7.5pt;
          font-weight: 700;
        }

        .footer-row {
          display: flex;
          gap: 6px;
          justify-content: space-between;
          align-items: flex-end;
        }

        .penalty-note {
          font-size: 6pt;
          color: #c00;
          font-style: italic;
          flex: 1;
        }

        .paid-stamp {
          font-size: 20pt;
          font-weight: 900;
          color: #22a060;
          border: 3px solid #22a060;
          padding: 1px 8px;
          border-radius: 4px;
          opacity: 0.7;
          transform: rotate(-12deg);
          display: inline-block;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }

        .barcode-placeholder {
          font-size: 5.5pt;
          color: #aaa;
          letter-spacing: 2px;
          font-family: monospace;
        }

        .receipt-divider {
          border: none;
          border-top: 1.5px dashed #ccc;
          margin: 5px 0;
        }

        .disconnection-notice {
          font-size: 6pt;
          color: #b00;
          text-align: center;
          font-weight: 700;
        }
      `}</style>

      {/* Print Controls - no-print */}
      <div className="no-print" style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9000,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 20, backdropFilter: "blur(4px)"
      }}>
        <div id="bitwasa-receipt">
          <ReceiptContent
            consumer={consumer} bill={bill}
            dueDate={dueDate} issueDate={issueDate}
            prevReading={prevReading} currReading={currReading}
            consumption={consumption} basicCharge={basicCharge}
            ratePerCubic={ratePerCubic} systemLoss={systemLoss}
            environmentalFee={environmentalFee} subtotal={subtotal}
            arrears={arrears} total={total} penaltyRate={penaltyRate}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handlePrint} style={{
            padding: "12px 32px", background: "linear-gradient(135deg, #22d3a0, #0891b2)",
            color: "#0a1628", border: "none", borderRadius: 10, fontWeight: 800,
            fontSize: 15, cursor: "pointer"
          }}>🖨️ Print Receipt</button>
          <button onClick={onClose} style={{
            padding: "12px 24px", background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10,
            fontWeight: 600, fontSize: 14, cursor: "pointer"
          }}>✕ Close</button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          Half A4 (148mm × 105mm) — prints on A4 landscape
        </p>
      </div>

      {/* Hidden receipt for print */}
      <div id="bitwasa-receipt" style={{ position: "absolute", left: -9999, top: -9999 }}>
        <ReceiptContent
          consumer={consumer} bill={bill}
          dueDate={dueDate} issueDate={issueDate}
          prevReading={prevReading} currReading={currReading}
          consumption={consumption} basicCharge={basicCharge}
          ratePerCubic={ratePerCubic} systemLoss={systemLoss}
          environmentalFee={environmentalFee} subtotal={subtotal}
          arrears={arrears} total={total} penaltyRate={penaltyRate}
        />
      </div>
    </>
  );
};

const ReceiptContent = ({
  consumer, bill, dueDate, issueDate,
  prevReading, currReading, consumption,
  basicCharge, ratePerCubic, systemLoss,
  environmentalFee, subtotal, arrears, total, penaltyRate
}) => {
  const billNo = bill?.billNo || `BIT-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  const penaltyAmount = total * penaltyRate;

  return (
    <div id="bitwasa-receipt">
      {/* HEADER */}
      <div className="receipt-header">
        <div className="receipt-logo">💧</div>
        <div className="receipt-org">
          <h1>BITWASA</h1>
          <p>Bitoon Water & Sanitation Association</p>
          <p>Brgy. Bitoon, Del Carmen, Surigao del Norte</p>
        </div>
        <div className="receipt-bill-label">
          <div className="bill-title">Water Bill</div>
          <div className="bill-no">{billNo}</div>
          <div style={{ fontSize: "6pt", opacity: 0.7, marginTop: 1 }}>
            Issued: {issueDate}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="receipt-body">

        {/* Consumer Info */}
        <div className="consumer-row">
          <div className="consumer-left">
            <div className="field-label">Consumer Name</div>
            <div className="field-value">{consumer?.name || "—"}</div>
            <div style={{ marginTop: 3 }}>
              <span className="field-label">Address: </span>
              <span className="field-value-sm">{consumer?.address || "—"}</span>
            </div>
          </div>
          <div className="consumer-right">
            <div className="field-label">Account No.</div>
            <div className="field-value">{consumer?.accountNo || "—"}</div>
            <div style={{ marginTop: 3 }}>
              <div className="field-label">Meter No.</div>
              <div className="field-value-sm">{consumer?.meterNo || "—"}</div>
            </div>
          </div>
          <div className="consumer-right" style={{ marginLeft: 8 }}>
            <div className="field-label">Billing Period</div>
            <div className="field-value-sm">{bill?.month || "—"} {bill?.year || new Date().getFullYear()}</div>
            <div style={{ marginTop: 3 }}>
              <div className="field-label">Read Date</div>
              <div className="field-value-sm">{bill?.readDate || issueDate}</div>
            </div>
          </div>
        </div>

        {/* Meter Readings */}
        <div className="readings-grid">
          <div className="reading-cell">
            <div className="field-label">Prev. Reading</div>
            <div className="field-value">{prevReading.toLocaleString()} m³</div>
          </div>
          <div className="reading-cell" style={{ textAlign: "center" }}>
            <div className="field-label">Curr. Reading</div>
            <div className="field-value">{currReading.toLocaleString()} m³</div>
          </div>
          <div className="reading-cell" style={{ textAlign: "right" }}>
            <div className="field-label">Consumption</div>
            <div className="field-value" style={{ color: "#c00" }}>{consumption} m³</div>
          </div>
        </div>

        {/* Charges */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <table className="charges-table">
              <tbody>
                <tr>
                  <td className="charge-label">Minimum Charge (0–5 m³)</td>
                  <td className="charge-amount">₱{basicCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="charge-label">Consumption ({consumption} m³ × ₱{ratePerCubic.toFixed(2)})</td>
                  <td className="charge-amount">₱{(consumption * ratePerCubic).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="charge-label">System Loss (3%)</td>
                  <td className="charge-amount">₱{systemLoss.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="charge-label">Environmental Fee</td>
                  <td className="charge-amount">₱{environmentalFee.toFixed(2)}</td>
                </tr>
                <tr className="subtotal-row">
                  <td className="charge-label">Current Charges</td>
                  <td className="charge-amount">₱{subtotal.toFixed(2)}</td>
                </tr>
                {arrears > 0 && (
                  <tr>
                    <td className="charge-label" style={{ color: "#c00" }}>Prior Balance / Arrears</td>
                    <td className="charge-amount" style={{ color: "#c00" }}>₱{arrears.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td>AMOUNT DUE</td>
                  <td className="charge-amount">₱{total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {bill?.paid && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 4 }}>
              <div className="paid-stamp">PAID</div>
            </div>
          )}
        </div>

        {/* Due Section */}
        <div className="due-section">
          <div>
            <div className="due-label">Total Amount Due</div>
            <div className="due-amount">₱{total.toFixed(2)}</div>
          </div>
          <div className="due-date-info">
            <span className="due-date-label">Due Date</span>
            <div className="due-date">{dueDate}</div>
            <div style={{ fontSize: "6pt", opacity: 0.7, marginTop: 2 }}>
              After due: ₱{(total + penaltyAmount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-row">
          <div className="penalty-note">
            * A {(penaltyRate * 100).toFixed(0)}% surcharge applies for late payment.<br />
            Non-payment may result in disconnection without notice.
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "6pt", color: "#666", marginBottom: 2 }}>
              Authorized Collector
            </div>
            <div style={{ borderTop: "1px solid #999", paddingTop: 2, width: 80, fontSize: "6pt", color: "#666", textAlign: "center" }}>
              Signature over Printed Name
            </div>
          </div>
        </div>

        <hr className="receipt-divider" />
        <div className="disconnection-notice">
          PLEASE PRESENT THIS BILL WHEN PAYING · KEEP THIS AS YOUR OFFICIAL RECEIPT
        </div>
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <div className="barcode-placeholder">| | | ||| || | ||| | | || ||| | | || | ||| |</div>
          <div style={{ fontSize: "5.5pt", color: "#aaa" }}>{consumer?.accountNo}-{bill?.month?.toUpperCase()}-{bill?.year}</div>
        </div>
      </div>
    </div>
  );
};

export default BillReceipt;
