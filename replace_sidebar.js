const fs = require('fs');
const filePath = '/Users/vikas/msteamMAGIC_new/src/app/components/Sidebar.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(
  "{ label: 'Payment Portal', icon: CreditCard, href: '/payment-portal', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },",
  `{ label: 'Payment Links (Gateway 1)', icon: CreditCard, href: '/payment-portal', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },
      { label: 'Payment Links (Gateway 2)', icon: CreditCard, href: '/payment-portal?gateway=razorpay', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },`
);
fs.writeFileSync(filePath, content);
console.log('Replaced successfully');
