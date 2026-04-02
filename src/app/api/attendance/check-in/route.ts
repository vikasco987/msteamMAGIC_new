import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs';
// import { auth, currentUser } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";


import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const latestAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null,
      },
      orderBy: {
        checkIn: 'desc',
      },
    });

    if (!latestAttendance) {
      return NextResponse.json({ message: 'No active check-in found' }, { status: 400 });
    }

    const updated = await prisma.attendance.update({
      where: { id: latestAttendance.id },
      data: {
        checkOut: new Date(),
      },
    });

    return NextResponse.json({ message: 'Checked out successfully', attendance: updated }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Check-out error:', error);
    return NextResponse.json({ message: 'Server error during check-out', error: error.message }, { status: 500 });
  }
}
