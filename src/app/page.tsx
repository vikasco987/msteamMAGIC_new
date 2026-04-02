// export default function Home() {
//   return (
//     <h1 className="text-3xl font-bold underline text-center mt-10">
//       Hello world!
//     </h1>
//   );
// }


// export default function HomePage() {
//   return (
//     <div>
//       <h2 className="text-3xl font-bold mb-2">Welcome to your Dashboard 👋</h2>
//       <p className="text-gray-600">
//         Here you can manage your tasks, view updates, and collaborate with your team.
//       </p>
//     </div>
//   );
// }








// src/app/page.tsx
// This file is a Server Component by default, so it can export metadata.

export const metadata = {
  title: "Home", // Or "Dashboard", if this is indeed your main dashboard landing page
  description: "Welcome to MagicScale - Your team and task management solution.",
};

export default function HomePage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Welcome to your Dashboard 👋</h2>
      <p className="text-gray-600">
        Here you can manage your tasks, view updates, and collaborate with your team.
      </p>
    </div>
  );
}