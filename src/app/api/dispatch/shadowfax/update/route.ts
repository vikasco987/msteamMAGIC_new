import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const SHADOWFAX_API_TOKEN =
      process.env.SHADOWFAX_API_TOKEN || "50b54c53d49eea0930d97763c8f57fe5a3d6357d";

    const body = await req.json();
    const {
      awb,
      taskId,
      customerContact,
      customerAddress,
      customerPincode,
      customerCity,
      customerState,
      returnContact,
      returnAddress,
      returnPincode,
      paymentMode,
      orderAmount,
      codAmount,
    } = body;

    const trimmedAwb = awb ? String(awb).trim() : "";

    if (!trimmedAwb && !taskId) {
      return NextResponse.json({ error: "AWB number or Task ID is required" }, { status: 400 });
    }

    // 1. Prepare Shadowfax API payload if AWB is present
    let sfxSuccess = false;
    let sfxResponseData = null;

    if (trimmedAwb && SHADOWFAX_API_TOKEN) {
      try {
        const sfxPayload: any = {
          awb_number: trimmedAwb,
        };

        // Customer Delivery Details
        if (customerContact || customerAddress || customerPincode) {
          sfxPayload.delivery_details = {};
          if (customerContact) {
            sfxPayload.delivery_details.contact = String(customerContact).replace(/\D/g, "").slice(-10);
          }
          if (customerAddress) {
            sfxPayload.delivery_details.address_line_1 = String(customerAddress).trim();
          }
          if (customerPincode) {
            sfxPayload.delivery_details.pincode = String(customerPincode).trim();
          }
          if (customerCity) {
            sfxPayload.delivery_details.city = String(customerCity).trim();
          }
          if (customerState) {
            sfxPayload.delivery_details.state = String(customerState).trim();
          }
        }

        // Return Details if provided
        if (returnContact || returnAddress || returnPincode) {
          sfxPayload.return_details = {
            return_type: "origin",
            name: "Kravy Software Development",
            contact: returnContact ? String(returnContact).replace(/\D/g, "").slice(-10) : "9289507882",
            address_line_1: returnAddress ? String(returnAddress).trim() : "3rd floor PLOT IN MUSTATIL. NO 14, KILLA NO 12/2, 19/1, 20/ FIRST FLOOR VILL. SAMALKA",
            city: "NEW DELHI",
            state: "DELHI",
            pincode: returnPincode ? String(returnPincode).trim() : "110037",
          };
        }

        // Order & Payment Details
        if (paymentMode || orderAmount !== undefined || codAmount !== undefined) {
          sfxPayload.order_details = {};
          if (paymentMode) {
            sfxPayload.order_details.payment_mode = paymentMode.toLowerCase() === "cod" ? "cod" : "prepaid";
          }
          if (orderAmount !== undefined) {
            sfxPayload.order_details.order_value = Number(orderAmount) || 0;
            sfxPayload.order_details.product_value = Number(orderAmount) || 0;
          }
          if (paymentMode?.toLowerCase() === "cod") {
            sfxPayload.order_details.cod_amount = Number(codAmount) || Number(orderAmount) || 0;
          } else {
            sfxPayload.order_details.cod_amount = 0;
          }
        }

        console.log("Calling Shadowfax order_update API with payload:", JSON.stringify(sfxPayload));

        const sfxRes = await fetch("https://dale.shadowfax.in/api/v3/clients/order_update/", {
          method: "POST",
          headers: {
            "Authorization": `Token ${SHADOWFAX_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sfxPayload),
        });

        sfxResponseData = await sfxRes.json();
        console.log("Shadowfax order_update response:", JSON.stringify(sfxResponseData));
        if (sfxRes.ok || sfxResponseData.message === "Success") {
          sfxSuccess = true;
        }
      } catch (sfxErr: any) {
        console.error("Shadowfax update API call error (falling back to CRM DB update):", sfxErr);
      }
    }

    // 2. Locate and Update in Database (Prisma Task & DispatchLog)
    let foundTaskId = taskId;
    if (!foundTaskId && trimmedAwb) {
      // Find Task by customFields.awbNumber or DispatchLog
      const dispatchLog = await prisma.dispatchLog.findFirst({
        where: { awbNumber: trimmedAwb },
      });
      if (dispatchLog) {
        foundTaskId = dispatchLog.taskId;
      } else {
        const rawTask = await prisma.task.findFirst({
          where: {
            OR: [
              { customFields: { path: ["awbNumber"], equals: trimmedAwb } },
              { customFields: { path: ["awb"], equals: trimmedAwb } },
            ],
          },
        });
        if (rawTask) {
          foundTaskId = rawTask.id;
        }
      }
    }

    if (foundTaskId) {
      // Check if primary task or external
      if (!foundTaskId.startsWith("ext_sec_") && !foundTaskId.startsWith("ext_trd_")) {
        const existingTask = await prisma.task.findUnique({ where: { id: foundTaskId } });
        if (existingTask) {
          const cf = (existingTask.customFields as any) || {};

          // Update customer fields
          if (customerContact) {
            existingTask.phone = String(customerContact).trim();
            cf.phone = String(customerContact).trim();
          }
          if (customerAddress) {
            cf.fullAddress = String(customerAddress).trim();
            existingTask.location = String(customerAddress).trim();
          }
          if (customerPincode) cf.pincode = String(customerPincode).trim();
          if (customerCity) cf.city = String(customerCity).trim();
          if (customerState) cf.state = String(customerState).trim();

          // Update return details
          if (returnContact) cf.returnContact = String(returnContact).trim();
          if (returnAddress) cf.returnAddress = String(returnAddress).trim();
          if (returnPincode) cf.returnPincode = String(returnPincode).trim();

          // Update payment details
          if (paymentMode) cf.paymentMode = paymentMode.toUpperCase();
          if (orderAmount !== undefined) {
            cf.packageAmount = Number(orderAmount);
            cf.orderAmount = Number(orderAmount);
          }
          if (codAmount !== undefined) cf.codAmount = Number(codAmount);

          // Save to Task
          await prisma.task.update({
            where: { id: foundTaskId },
            data: {
              phone: existingTask.phone,
              location: existingTask.location,
              packageAmount: cf.packageAmount ? Number(cf.packageAmount) : existingTask.packageAmount,
              customFields: cf,
            },
          });

          // Log in DispatchLog history if available
          const log = await prisma.dispatchLog.findUnique({ where: { taskId: foundTaskId } });
          if (log) {
            const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || "Staff";
            await prisma.dispatchLog.update({
              where: { id: log.id },
              data: {
                history: {
                  push: {
                    status: "Order Details Updated",
                    changedBy: userName,
                    changedAt: new Date().toISOString(),
                  },
                },
              },
            });
          }
        }
      } else {
        // Multi-DB Secondary / Third client
        const isSecondary = foundTaskId.startsWith("ext_sec_");
        const rawId = foundTaskId.replace(/^ext_(sec|trd)_/, "");
        const { ObjectId } = await import("mongodb");
        const { getSecondaryClient, getThirdClient } = await import("@/lib/multiDbTasks");
        const client = isSecondary ? await getSecondaryClient() : await getThirdClient();

        if (client) {
          const db = client.db();
          const updateDoc: any = { updatedAt: new Date() };

          if (customerContact) {
            updateDoc["phone"] = String(customerContact).trim();
            updateDoc["customFields.phone"] = String(customerContact).trim();
          }
          if (customerAddress) {
            updateDoc["location"] = String(customerAddress).trim();
            updateDoc["customFields.fullAddress"] = String(customerAddress).trim();
          }
          if (customerPincode) updateDoc["customFields.pincode"] = String(customerPincode).trim();
          if (returnContact) updateDoc["customFields.returnContact"] = String(returnContact).trim();
          if (returnAddress) updateDoc["customFields.returnAddress"] = String(returnAddress).trim();
          if (returnPincode) updateDoc["customFields.returnPincode"] = String(returnPincode).trim();
          if (paymentMode) updateDoc["customFields.paymentMode"] = paymentMode.toUpperCase();
          if (orderAmount !== undefined) {
            updateDoc["customFields.packageAmount"] = Number(orderAmount);
            updateDoc["packageAmount"] = Number(orderAmount);
          }
          if (codAmount !== undefined) updateDoc["customFields.codAmount"] = Number(codAmount);

          await db.collection("Task").updateOne({ _id: new ObjectId(rawId) }, { $set: updateDoc });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order details updated successfully",
      sfxSynced: sfxSuccess,
      sfxResponse: sfxResponseData,
    });
  } catch (error: any) {
    console.error("Update Order Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
