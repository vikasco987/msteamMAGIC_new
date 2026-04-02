// src/app/sign-up/[[...rest]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp path="/sign-up" routing="path" />
    </div>
  );
}
