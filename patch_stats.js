const fs = require('fs');
const path = './src/app/api/seller/stats/route.ts';
let code = fs.readFileSync(path, 'utf8');

const targetCalculationLogic = `
    // Fetch Seller Target
    const monthInt = parseInt(month.split("-")[1], 10);
    const yearInt = parseInt(month.split("-")[0], 10);
    const targetSellerId = userIds.length === 1 ? userIds[0] : null;

    let target = 0;
    if (targetSellerId) {
      const sellerTarget = await prisma.sellerTarget.findUnique({
        where: {
          sellerId_month_year: {
            sellerId: targetSellerId,
            month: monthInt,
            year: yearInt
          }
        }
      });
      if (sellerTarget) {
        target = sellerTarget.target;
      }
    }

    // Target calculations
    const achieved = totalRevenue;
    const achievementPercentage = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
    const remaining = Math.max(target - achieved, 0);

    // Days remaining logic
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === monthInt && today.getFullYear() === yearInt;
    
    let daysRemaining = 0;
    if (isCurrentMonth) {
      const endOfMonth = new Date(yearInt, monthInt, 0);
      daysRemaining = endOfMonth.getDate() - today.getDate();
    } else if (today < new Date(yearInt, monthInt - 1, 1)) {
      // Future month
      daysRemaining = new Date(yearInt, monthInt, 0).getDate();
    } // Else past month (daysRemaining = 0)

    let requiredDaily = 0;
    if (daysRemaining > 0 && remaining > 0) {
      requiredDaily = remaining / daysRemaining;
    } else if (daysRemaining === 0 && remaining > 0) {
      requiredDaily = remaining; // Requires all remaining today!
    }

    let status = "NO_TARGET";
    if (target > 0) {
      if (achieved >= target) {
        status = "ACHIEVED";
      } else {
        const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
        const monthProgress = isCurrentMonth ? (today.getDate() / daysInMonth) * 100 : (daysRemaining === 0 ? 100 : 0);
        const expectedAchievement = target * (monthProgress / 100);
        
        if (achieved >= expectedAchievement * 0.9) { // 10% tolerance
          status = "ON_TRACK";
        } else {
          status = "BEHIND";
        }
      }
    }
`;

// Inject target logic before returning NextResponse
code = code.replace(
  /return NextResponse\.json\(\s*\{/, 
  targetCalculationLogic + '\n    return NextResponse.json({\n        target,\n        achievementPercentage,\n        remaining,\n        daysRemaining,\n        requiredDaily,\n        status,'
);

fs.writeFileSync(path, code);
console.log("Stats API patched successfully");
