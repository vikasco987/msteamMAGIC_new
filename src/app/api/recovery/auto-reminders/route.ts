import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(req: NextRequest) {
    return handleAutoReminders(req);
}

export async function POST(req: NextRequest) {
    return handleAutoReminders(req);
}

async function handleAutoReminders(req: NextRequest) {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Task-centric query to safely avoid orphan PaymentRemark relation errors
        const tasksWithDueReminders = await prisma.task.findMany({
            where: {
                amount: { gt: 0 },
                OR: [
                    {
                        paymentRemarks: {
                            some: {
                                nextFollowUpDate: { lte: today }
                            }
                        }
                    },
                    {
                        dueDate: { lte: today }
                    }
                ]
            },
            include: {
                paymentRemarks: {
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        const results: Array<{
            taskId: string;
            shopName: string;
            customerName: string;
            phone: string;
            pendingAmount: number;
            paymentLink: string;
            status: string;
            whatsappUrl: string;
        }> = [];

        for (const task of tasksWithDueReminders) {
            const total = task.amount || 0;
            const received = task.received || 0;
            const pendingAmount = Math.max(0, total - received);

            if (pendingAmount <= 0) continue;

            const latestRemark = task.paymentRemarks[0];

            // Avoid duplicate sending on the same day if link was already sent today
            if (latestRemark?.autoReminderSentAt) {
                const sentDate = new Date(latestRemark.autoReminderSentAt);
                if (sentDate >= startOfToday) {
                    continue; // Skip already sent today
                }
            }

            const customerName = task.customerName || task.shopName || "Valued Customer";
            const phone = task.phone || (task.customFields as any)?.phone || "";
            const email = task.email || (task.customFields as any)?.email || "";
            const cleanPhone = phone.replace(/[^0-9]/g, "");

            let paymentLink = "";

            // 1. Try Razorpay Payment Link API if configured
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
            const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

            if (razorpayKeyId && razorpayKeySecret) {
                try {
                    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
                    const rzpResponse = await axios.post(
                        "https://api.razorpay.com/v1/payment_links",
                        {
                            amount: Math.round(pendingAmount * 100), // amount in paise
                            currency: "INR",
                            accept_partial: false,
                            description: `Pending Balance Recovery for ${task.shopName || task.title}`,
                            customer: {
                                name: customerName,
                                contact: cleanPhone ? `+91${cleanPhone}` : undefined,
                                email: email || undefined
                            },
                            notify: {
                                sms: true,
                                email: true
                            },
                            reminder_enable: true
                        },
                        {
                            headers: {
                                Authorization: `Basic ${authHeader}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (rzpResponse.data && rzpResponse.data.short_url) {
                        paymentLink = rzpResponse.data.short_url;
                    }
                } catch (rzpErr) {
                    console.warn("Razorpay API auto-link creation fallback:", rzpErr);
                }
            }

            // 2. Fallback to Cashfree API if Razorpay link was not generated
            if (!paymentLink) {
                try {
                    const cfResponse = await axios.post("https://magicscale.in/api/cashfree/create-link", {
                        name: customerName,
                        email: email || "billing@magicscale.in",
                        phone: cleanPhone || "9999999999",
                        amount: pendingAmount,
                        totalServicePrice: total,
                        purpose: `Balance Recovery - ${task.shopName || task.title}`,
                        createdBy: "Auto Recovery Engine"
                    });
                    if (cfResponse.data && cfResponse.data.link_url) {
                        paymentLink = cfResponse.data.link_url;
                    }
                } catch (cfErr) {
                    console.warn("Cashfree API fallback:", cfErr);
                }
            }

            // 3. Ultimate Fallback to internal Payment Portal URL
            if (!paymentLink) {
                paymentLink = `https://msteam.magicscale.in/payment-portal?taskId=${task.id}&amount=${pendingAmount}`;
            }

            // Update or create PaymentRemark for status & store auto payment link
            if (latestRemark) {
                await prisma.paymentRemark.update({
                    where: { id: latestRemark.id },
                    data: {
                        autoPaymentLink: paymentLink,
                        autoLinkGeneratedAt: new Date(),
                        autoReminderSentAt: new Date(),
                        autoReminderStatus: "SENT",
                        reminderSent: true
                    }
                });
            } else {
                await prisma.paymentRemark.create({
                    data: {
                        taskId: task.id,
                        remark: "🤖 Automated payment reminder scheduled",
                        contactOutcome: "promised",
                        autoPaymentLink: paymentLink,
                        autoLinkGeneratedAt: new Date(),
                        autoReminderSentAt: new Date(),
                        autoReminderStatus: "SENT",
                        reminderSent: true
                    }
                });
            }

            // Log activity on the Task
            await prisma.activity.create({
                data: {
                    taskId: task.id,
                    type: "PAYMENT_ADDED",
                    content: `🤖 Automated Recovery System generated Payment Link (₹${pendingAmount}): ${paymentLink}`,
                    author: "Auto Recovery Engine",
                    authorId: "system_recovery_engine"
                }
            });

            // Construct WhatsApp Message URL
            const whatsappMsg = encodeURIComponent(
                `Hello ${customerName},\n\nThis is an automated reminder regarding your pending balance of ₹${pendingAmount.toLocaleString()} for ${task.shopName || task.title}.\n\nPlease complete your payment securely using this link:\n${paymentLink}\n\nThank you!\nMagic Scale Team`
            );
            const whatsappUrl = cleanPhone ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${whatsappMsg}` : "";

            results.push({
                taskId: task.id,
                shopName: task.shopName || task.title,
                customerName,
                phone,
                pendingAmount,
                paymentLink,
                status: "SENT",
                whatsappUrl
            });
        }

        return NextResponse.json({
            success: true,
            processedCount: results.length,
            reminders: results
        });
    } catch (error: any) {
        console.error("Auto recovery reminders error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process auto reminders" },
            { status: 500 }
        );
    }
}
