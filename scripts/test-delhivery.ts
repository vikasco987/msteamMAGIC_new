import 'dotenv/config';

const token = process.env.DELHIVERY_API_TOKEN;

async function testAWB(awb: string) {
  if (!token) {
    console.error("❌ DELHIVERY_API_TOKEN is not set in .env");
    return;
  }
  
  if (!awb) {
    console.error("❌ Please provide an AWB number. Usage: npx tsx scripts/test-delhivery.ts <AWB_NUMBER>");
    return;
  }

  console.log(`🔍 Checking status for AWB: ${awb}...`);

  try {
    const url = `https://track.delhivery.com/api/v1/packages/json/?token=${token}&waybill=${awb}`;
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();

    console.log("\n📦 API Response:");
    console.log(JSON.stringify(data, null, 2));

    if (data?.ShipmentData?.[0]?.Shipment) {
      const status = data.ShipmentData[0].Shipment.Status?.Status;
      const instruction = data.ShipmentData[0].Shipment.Status?.Instructions;
      console.log(`\n✅ Status parsed: ${status}`);
      console.log(`📝 Instructions: ${instruction}`);
    } else if (data?.Error) {
      console.log(`\n❌ Error from Delhivery: ${data.Error}`);
    } else {
      console.log("\n⚠️ Could not parse shipment status from the response.");
    }
  } catch (error) {
    console.error("\n❌ Failed to fetch from Delhivery API:", error);
  }
}

const awbNumber = process.argv[2];
testAWB(awbNumber);
